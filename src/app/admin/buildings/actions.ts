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
  /** Endereço + link do Google Maps, ao vivo em todos os apartamentos do prédio. */
  location: { address: string; mapsUrl: string };
};

function buildData(payload: BuildingEditPayload) {
  const address = payload.location.address.trim();
  const mapsUrl = payload.location.mapsUrl.trim();
  return {
    location: address || mapsUrl ? ({ address, mapsUrl } as object) : Prisma.DbNull,
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
 * (exceto seções que o apartamento tenha personalizado, `Apartment.overrides`).
 * Check-in/check-out são template (marcadores da unidade), copiados pro
 * apartamento na criação/edição — editar aqui não muda quem já foi criado.
 */
export async function updateBuilding(buildingId: string, payload: BuildingEditPayload) {
  await requireAdmin();

  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { id: true },
  });
  if (!building) throw new Error("Prédio não encontrado");

  await prisma.building.update({
    where: { id: buildingId },
    data: buildData(payload),
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/buildings/${buildingId}/edit`);
}
