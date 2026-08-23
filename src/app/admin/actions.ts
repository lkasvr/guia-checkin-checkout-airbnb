"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { starterContent } from "@/data/starter";

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
async function requireAdmin(): Promise<void> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Acesso restrito");
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
