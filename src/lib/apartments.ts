import { cache } from "react";
import { prisma } from "@/lib/db";
import { isSameDayBR } from "@/lib/tz";
import type { Apartment } from "@/data/types";
import {
  overlayBuildingLiveContent,
  type ApartmentOverrides,
} from "@/data/buildApartmentContent";

/** Estadia vigente, entregue ao guia. Só existe dentro da janela da hospedagem. */
export type StayInfo = {
  guestName: string | null;
  doorCode: string | null;
  checkInISO: string;
  checkOutISO: string;
  /** hoje é o dia-calendário do check-out (Brasília) — reordena o guia */
  isCheckoutDay: boolean;
};

export type GuideData = {
  id: string;
  slug: string;
  label: string;
  content: Apartment;
  /** null quando não há hospedagem em curso: é o guia "limpo" da prospecção */
  stay: StayInfo | null;
};

const BLANK_L = { pt: "", en: "" };

/**
 * Carrega o apartamento ativo pelo slug + a estadia vigente (agora dentro da
 * janela, não cancelada) numa ÚNICA consulta. Retorna null se o apartamento não
 * existe ou está inativo; `stay` é null quando não há hospedagem em curso.
 * cache() dedup: generateMetadata + a página compartilham a mesma consulta.
 */
export const getGuide = cache(
  async (slug: string, now: Date = new Date()): Promise<GuideData | null> => {
    const row = await prisma.apartment.findFirst({
      // `host.active: true` some com o guia junto quando o anfitrião é
      // inativado — sem precisar mexer no `active` de cada apartamento dele.
      where: { slug, active: true, host: { active: true } },
      select: {
        id: true,
        slug: true,
        label: true,
        content: true,
        overrides: true,
        building: {
          select: { rules: true, home: true, amenities: true, tourism: true, dining: true },
        },
        stays: {
          where: {
            status: { not: "CANCELED" },
            checkInAt: { lte: now },
            checkOutAt: { gte: now },
          },
          orderBy: { checkInAt: "desc" },
          take: 1,
          select: {
            guestName: true,
            doorCode: true,
            checkInAt: true,
            checkOutAt: true,
          },
        },
      },
    });
    if (!row) return null;

    const s = row.stays[0];
    // `footer.img` não existia antes desta versão — content já gravado no
    // banco não tem a chave; sem isso o guia quebraria ao tentar mostrar a
    // foto de despedida.
    const dbContent = row.content as unknown as Apartment;
    const rawContent: Apartment = {
      ...dbContent,
      footer: { ...dbContent.footer, img: dbContent.footer.img ?? "/media/mesa.webp" },
    };
    const overrides = (row.overrides as ApartmentOverrides | null) ?? {};
    const content = row.building
      ? overlayBuildingLiveContent(
          rawContent,
          {
            rules: (row.building.rules as unknown as Apartment["rules"] | null) ?? {
              sub: BLANK_L,
              items: [],
            },
            home: (row.building.home as unknown as Apartment["home"] | null) ?? {
              sub: BLANK_L,
              slides: [],
              accordions: [],
            },
            amenities: row.building.amenities as unknown as Apartment["amenities"],
            tourism: row.building.tourism as unknown as Apartment["tourism"],
            dining: row.building.dining as unknown as Apartment["dining"],
          },
          overrides,
        )
      : rawContent;
    return {
      id: row.id,
      slug: row.slug,
      label: row.label,
      content,
      stay: s
        ? {
            guestName: s.guestName,
            doorCode: s.doorCode,
            checkInISO: s.checkInAt.toISOString(),
            checkOutISO: s.checkOutAt.toISOString(),
            isCheckoutDay: isSameDayBR(now, s.checkOutAt),
          }
        : null,
    };
  },
);
