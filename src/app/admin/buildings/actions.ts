"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/app/admin/actions";
import {
  amenitiesToContent,
  checkinToContent,
  checkoutToContent,
  homeToContent,
  placesToContent,
  rulesToContent,
  type AmenitiesValue,
  type CheckinValue,
  type CheckoutValue,
  type HomeValue,
  type PlacesValue,
  type RulesValue,
} from "@/data/sectionContent";

export type BuildingEditPayload = {
  rules: RulesValue;
  home: HomeValue;
  checkin: CheckinValue;
  checkout: CheckoutValue;
  amenities: AmenitiesValue;
  tourism: PlacesValue;
  dining: PlacesValue;
  /** Sugestão de capa/despedida pro "Copiar de" ao criar apartamento — não é ao vivo. */
  defaultHeroImg: string;
  defaultFooterImg: string;
  /** Endereço, link do Maps e portaria (telefone + código do interfone de cada torre), ao vivo em todos os apartamentos. */
  location: {
    address: string;
    mapsUrl: string;
    portariaPhone: string;
    intercom: { tower: string; code: string }[];
  };
};

function buildData(payload: BuildingEditPayload) {
  const address = payload.location.address.trim();
  const mapsUrl = payload.location.mapsUrl.trim();
  const portariaPhone = payload.location.portariaPhone.trim();
  const intercom = payload.location.intercom
    .map((i) => ({ tower: i.tower.trim(), code: i.code.trim() }))
    .filter((i) => i.tower && i.code);
  const hasInfo = address || mapsUrl || portariaPhone || intercom.length > 0;
  return {
    location: hasInfo
      ? ({
          address,
          mapsUrl,
          ...(portariaPhone ? { portariaPhone } : {}),
          ...(intercom.length ? { intercom } : {}),
        } as object)
      : Prisma.DbNull,
    rules: rulesToContent(payload.rules) as object,
    home: homeToContent(payload.home) as object,
    checkinTemplate: checkinToContent(payload.checkin) as object,
    checkoutTemplate: checkoutToContent(payload.checkout) as object,
    amenities: amenitiesToContent(payload.amenities) as object,
    tourism: placesToContent(payload.tourism) as object,
    dining: placesToContent(payload.dining) as object,
    defaultHeroImg: payload.defaultHeroImg || null,
    defaultFooterImg: payload.defaultFooterImg || null,
  };
}

/**
 * Cria um prédio do zero (ou a partir de seções copiadas de outro, já
 * aplicadas no formulário antes de salvar). Nome precisa ser único — ao
 * contrário do `resolveBuilding` implícito (que reaproveita em silêncio
 * quando o nome já existe), aqui é uma criação explícita: colisão é erro.
 */
export async function createBuilding(
  name: string,
  payload: BuildingEditPayload,
): Promise<{ id: string }> {
  await requireAdmin();

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Informe o nome do prédio");

  const taken = await prisma.building.findUnique({ where: { name: trimmed }, select: { id: true } });
  if (taken) throw new Error(`Já existe um prédio chamado "${trimmed}"`);

  const building = await prisma.building.create({
    data: { name: trimmed, ...buildData(payload) },
  });
  revalidatePath("/admin");
  return { id: building.id };
}

/**
 * Grava o conteúdo compartilhado de um prédio — ao vivo: todo apartamento
 * ligado a este prédio reflete a mudança na próxima vez que o guia carregar
 * (exceto o item que o apartamento tenha editado à mão, `Apartment.overrides.patches`).
 * Check-in/check-out também: o template tem marcadores da unidade, preenchidos
 * em cada guia na hora de exibir.
 *
 * `expectedUpdatedAt`: quando veio (a página sempre manda), recusa gravar se o
 * prédio tiver sido salvo por outra aba/sessão depois que esta página abriu —
 * senão essa gravação sobrescreveria mudanças mais novas sem ninguém perceber
 * (ex.: duas abas abertas no mesmo prédio, uma delas esquecida com dado velho).
 */
export async function updateBuilding(
  buildingId: string,
  payload: BuildingEditPayload,
  expectedUpdatedAt?: string,
) {
  await requireAdmin();

  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { id: true, updatedAt: true },
  });
  if (!building) throw new Error("Prédio não encontrado");
  if (expectedUpdatedAt && building.updatedAt.toISOString() !== expectedUpdatedAt) {
    throw new Error(
      "Este prédio foi alterado em outra aba ou sessão depois que esta página abriu — recarregue a página e refaça a edição, pra não sobrescrever a mudança mais recente.",
    );
  }

  await prisma.building.update({
    where: { id: buildingId },
    data: buildData(payload),
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/buildings/${buildingId}/edit`);
}
