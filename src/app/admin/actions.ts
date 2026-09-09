"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { starterContent } from "@/data/starter";
import {
  buildApartmentContent,
  toBuildingTemplate,
  type ApartmentFormInput,
  type BuildingTemplate,
} from "@/data/buildApartmentContent";
import { slugify } from "@/lib/slug";
import type { Apartment } from "@/data/types";

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Senha nunca passa por trim: `src/auth.ts:25` compara o valor cru que o
 * navegador envia, então aparar aqui gravaria o hash de uma string diferente
 * da que o anfitrião vai digitar — e um espaço colado junto o trancaria fora.
 */
function rawStr(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

/** Só o superadmin (role ADMIN, via env) passa. */
export async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Acesso restrito");
}

/**
 * Acha o prédio pelo nome (sem diferenciar maiúsculas/espaço nas pontas) ou
 * cria um novo em branco. Nome vazio = apartamento sem prédio (`null`),
 * comportamento igual ao de antes desse recurso existir.
 */
async function resolveBuilding(
  name: string,
): Promise<({ id: string } & BuildingTemplate) | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const blank = starterContent("_", "_", "_");
  const building = await prisma.building.upsert({
    where: { name: trimmed },
    update: {},
    create: {
      name: trimmed,
      rules: blank.rules as object,
      home: blank.home as object,
      amenities: blank.amenities as object,
      tourism: blank.tourism as object,
      dining: blank.dining as object,
      checkinTemplate: blank.checkin as object,
      checkoutTemplate: blank.checkout as object,
    },
  });
  return { id: building.id, ...toBuildingTemplate(building) };
}

export async function createHost(formData: FormData) {
  await requireAdmin();

  const name = str(formData.get("name"));
  const email = str(formData.get("email")).toLowerCase();
  const password = rawStr(formData.get("password"));
  if (!name || !email || !password) {
    throw new Error("Nome, e-mail e senha são obrigatórios");
  }
  if (password.length < 8) throw new Error("A senha deve ter ao menos 8 caracteres");

  const exists = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (exists) throw new Error("Já existe uma conta com esse e-mail");

  const slug = str(formData.get("slug")).toLowerCase();
  const label = str(formData.get("label"));
  // Rótulo efetivo: o informado ou um padrão a partir do slug. Usado tanto na
  // coluna `label` quanto no `building` do conteúdo inicial (mantém o guia
  // coerente quando o admin deixa o rótulo em branco).
  const finalLabel = label || (slug ? `Ap ${slug.toUpperCase()}` : "");
  if (slug) {
    const taken = await prisma.apartment.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (taken) throw new Error(`O slug "${slug}" já está em uso`);
  }

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash(password, 10),
        role: "HOST",
        ...(slug
          ? {
              apartments: {
                create: {
                  slug,
                  label: finalLabel,
                  active: true,
                  content: starterContent(
                    "Apartamento",
                    slug.toUpperCase(),
                    finalLabel,
                  ) as object,
                },
              },
            }
          : {}),
      },
    });
  } catch (e) {
    // Corrida entre as checagens acima e o insert: o índice único do banco
    // ainda protege; traduz o P2002 do Prisma na mesma mensagem amigável.
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      const target = String(
        (e as { meta?: { target?: unknown } }).meta?.target ?? "",
      );
      throw new Error(
        target.includes("slug")
          ? `O slug "${slug}" já está em uso`
          : "Já existe uma conta com esse e-mail",
      );
    }
    throw e;
  }
  revalidatePath("/admin");
}

export type ApartmentWizardPayload = ApartmentFormInput & { slug: string; label: string };

/** Traduz o P2002 (índice único) do Prisma numa mensagem amigável de slug em uso. */
function throwIfSlugTaken(e: unknown, slug: string): never {
  if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
    throw new Error(`O slug "${slug}" já está em uso`);
  }
  throw e as Error;
}

/**
 * Cria um apartamento adicional para um anfitrião já cadastrado, com o
 * conteúdo do guia já preenchido a partir do formulário detalhado do
 * superadmin (Wi-Fi, regras, contatos, fechadura etc.) — ver
 * `buildApartmentContent`. Fotos e estilo continuam com o padrão genérico
 * nesta etapa.
 */
export async function createApartmentDetailed(
  hostId: string,
  payload: ApartmentWizardPayload,
) {
  await requireAdmin();

  const host = await prisma.user.findUnique({
    where: { id: hostId },
    select: { name: true, email: true, role: true },
  });
  if (!host || host.role !== "HOST") throw new Error("Anfitrião não encontrado");

  const slug = slugify(payload.slug);
  if (!slug) throw new Error("Informe o slug do apartamento");
  const label = payload.label.trim() || `Ap ${payload.unit.toUpperCase()}`;

  const taken = await prisma.apartment.findUnique({ where: { slug }, select: { id: true } });
  if (taken) throw new Error(`O slug "${slug}" já está em uso`);

  const building = await resolveBuilding(payload.building);
  const content = buildApartmentContent(payload, host.name ?? host.email, undefined, building);

  try {
    await prisma.apartment.create({
      data: {
        hostId,
        slug,
        label,
        active: true,
        content: content as object,
        internalNotes: payload.internalNotes || null,
        buildingId: building?.id ?? null,
        overrides: payload.overrides as object,
      },
    });
  } catch (e) {
    throwIfSlugTaken(e, slug);
  }
  revalidatePath("/admin");
}

/**
 * Atualiza um apartamento existente com os mesmos campos do formulário
 * detalhado — preserva as seções que o formulário não cobre (home,
 * amenities, tourism, dining) em vez de zerá-las.
 */
export async function updateApartmentDetailed(
  apartmentId: string,
  payload: ApartmentWizardPayload,
) {
  await requireAdmin();

  const apt = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { content: true, hostId: true, host: { select: { name: true, email: true } } },
  });
  if (!apt) throw new Error("Apartamento não encontrado");

  const slug = slugify(payload.slug);
  if (!slug) throw new Error("Informe o slug do apartamento");
  const label = payload.label.trim() || `Ap ${payload.unit.toUpperCase()}`;

  const taken = await prisma.apartment.findFirst({
    where: { slug, NOT: { id: apartmentId } },
    select: { id: true },
  });
  if (taken) throw new Error(`O slug "${slug}" já está em uso`);

  const building = await resolveBuilding(payload.building);
  const content = buildApartmentContent(
    payload,
    apt.host.name ?? apt.host.email,
    apt.content as unknown as Apartment,
    building,
  );

  try {
    await prisma.apartment.update({
      where: { id: apartmentId },
      data: {
        slug,
        label,
        content: content as object,
        internalNotes: payload.internalNotes || null,
        buildingId: building?.id ?? null,
        overrides: payload.overrides as object,
      },
    });
  } catch (e) {
    throwIfSlugTaken(e, slug);
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/apartments/${apartmentId}/edit`);
}

/**
 * Inativa/reativa um anfitrião — bloqueia o login dele (`src/auth.ts`) e some
 * com o guia de todos os apartamentos dele (`getGuide` em `src/lib/apartments.ts`),
 * sem apagar nada. Uso típico: inadimplência, sem gastar espaço/consulta com
 * uma conta que não deve continuar no ar.
 */
export async function setHostActive(hostId: string, active: boolean) {
  await requireAdmin();
  await prisma.user.update({ where: { id: hostId }, data: { active } });
  revalidatePath("/admin");
}

/** Inativa/reativa um apartamento específico (o superadmin pode mexer em qualquer um). */
export async function setApartmentActiveAsAdmin(apartmentId: string, active: boolean) {
  await requireAdmin();
  await prisma.apartment.update({ where: { id: apartmentId }, data: { active } });
  revalidatePath("/admin");
}

/**
 * Apaga o anfitrião e, em cascata (`onDelete: Cascade` no schema), todos os
 * apartamentos/estadias/pedidos dele. Sem volta — a tela chama isto só depois
 * de um temporizador de 10s que a pessoa pode cancelar.
 */
export async function deleteHost(hostId: string) {
  await requireAdmin();
  await prisma.user.delete({ where: { id: hostId } });
  revalidatePath("/admin");
}

/** Apaga um apartamento (e o que depende dele em cascata). Sem volta. */
export async function deleteApartment(apartmentId: string) {
  await requireAdmin();
  await prisma.apartment.delete({ where: { id: apartmentId } });
  revalidatePath("/admin");
}

export type ReusableVideo = {
  key: string;
  /** Rótulo exibido no seletor (de onde esse vídeo veio). */
  source: string;
  src: string;
  buttonLabel: { pt: string; en: string };
};

/**
 * Vídeos de check-in já enviados que dá pra reaproveitar sem subir de novo —
 * o do template do prédio (se o apartamento pertencer a um) e o de cada outro
 * apartamento do mesmo anfitrião que já tenha um. Escolher uma opção só copia
 * a URL: nenhum arquivo novo entra no Blob.
 */
export async function listHostCheckinVideos(
  hostId: string,
  buildingId?: string | null,
  excludeApartmentId?: string,
): Promise<ReusableVideo[]> {
  await requireAdmin();

  const videos: ReusableVideo[] = [];

  if (buildingId) {
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: { name: true, checkinTemplate: true },
    });
    const template = building?.checkinTemplate as unknown as Apartment["checkin"] | undefined;
    const card = template?.cards.find((c) => c.video);
    if (card?.video) {
      videos.push({
        key: "building",
        source: `Modelo do prédio${building?.name ? ` (${building.name})` : ""}`,
        src: card.video.src,
        buttonLabel: card.video.label,
      });
    }
  }

  const apartments = await prisma.apartment.findMany({
    where: {
      hostId,
      ...(excludeApartmentId ? { NOT: { id: excludeApartmentId } } : {}),
    },
    select: { id: true, label: true, content: true },
  });
  for (const apt of apartments) {
    const content = apt.content as unknown as Apartment;
    const card = content.checkin?.cards?.find((c) => c.video);
    if (card?.video) {
      videos.push({
        key: `apt:${apt.id}`,
        source: `Mesmo vídeo do "${apt.label}"`,
        src: card.video.src,
        buttonLabel: card.video.label,
      });
    }
  }

  // Não repete a mesma URL de arquivo mais de uma vez na lista (comum quando
  // vários apartamentos ainda herdam o mesmo vídeo do template do prédio).
  const seen = new Set<string>();
  return videos.filter((v) => (seen.has(v.src) ? false : (seen.add(v.src), true)));
}

/** Resultado exibido no formulário; `null` é o estado inicial, antes do envio. */
export type ResetPasswordState = { ok: true } | { erro: string } | null;

/**
 * `hostId` vem por `.bind()` no servidor, não pelo formulário. Devolve o erro
 * em vez de lançar: o app não tem `error.tsx`, então uma exceção aqui trocaria
 * o painel inteiro pela tela de falha genérica do Next.
 */
export async function resetHostPassword(
  hostId: string,
  _anterior: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  await requireAdmin();

  const password = rawStr(formData.get("password"));
  if (password.length < 8) {
    return { erro: "A senha deve ter ao menos 8 caracteres." };
  }

  // `role: "HOST"` no filtro: esta tela administra anfitriões, e uma conta ADMIN
  // não deve ter a senha trocada por aqui. Como o superadmin não tem linha no
  // banco (src/auth.ts), hoje isso só fecha a porta — mas fecha antes de abrir.
  const { count } = await prisma.user.updateMany({
    where: { id: hostId, role: "HOST" },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  if (count === 0) return { erro: "Anfitrião não encontrado." };

  // A sessão é JWT (sem tabela de sessão consultada a cada request), então quem
  // já estiver logado continua logado com o token antigo até ele expirar; a
  // senha nova vale do próximo login em diante.
  revalidatePath("/admin");
  return { ok: true };
}
