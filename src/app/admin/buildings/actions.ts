"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/app/admin/actions";
import type { L } from "@/data/types";

const t = (s: string): L => ({ pt: s, en: s });

export type BuildingAmenityInput = { title: string; text: string; wide: boolean };
export type BuildingPlaceInput = {
  title: string;
  text: string;
  meta: string;
  site: string;
  maps: string;
};

export type BuildingEditPayload = {
  amenitiesSub: string;
  amenities: BuildingAmenityInput[];
  tourismSub: string;
  tourism: BuildingPlaceInput[];
  diningSub: string;
  dining: BuildingPlaceInput[];
};

/** Imagem genérica pra item de Lazer até o upload de foto existir de verdade. */
const PLACEHOLDER_IMG = "/media/predio.webp";

/**
 * Grava o conteúdo compartilhado de um prédio (Lazer, Guia de cidade, Onde
 * Comer) — ao vivo: todo apartamento ligado a este prédio reflete a mudança
 * na próxima vez que o guia carregar. Check-in/check-out (template por
 * unidade) não são editados aqui, ver `buildApartmentContent.ts`.
 */
export async function updateBuilding(buildingId: string, payload: BuildingEditPayload) {
  await requireAdmin();

  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { id: true },
  });
  if (!building) throw new Error("Prédio não encontrado");

  const amenities = {
    sub: t(payload.amenitiesSub),
    items: payload.amenities
      .filter((a) => a.title.trim())
      .map((a) => ({
        img: PLACEHOLDER_IMG,
        title: t(a.title.trim()),
        text: t(a.text.trim()),
        wide: a.wide,
      })),
  };
  const toPlace = (p: BuildingPlaceInput) => ({
    title: p.title.trim(),
    text: t(p.text.trim()),
    meta: p.meta.trim(),
    ...(p.site.trim() ? { site: p.site.trim() } : {}),
    ...(p.maps.trim() ? { maps: p.maps.trim() } : {}),
  });
  const tourism = {
    sub: t(payload.tourismSub),
    items: payload.tourism.filter((p) => p.title.trim()).map(toPlace),
  };
  const dining = {
    sub: t(payload.diningSub),
    items: payload.dining.filter((p) => p.title.trim()).map(toPlace),
  };

  await prisma.building.update({
    where: { id: buildingId },
    data: {
      amenities: amenities as object,
      tourism: tourism as object,
      dining: dining as object,
    },
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/buildings/${buildingId}/edit`);
}
