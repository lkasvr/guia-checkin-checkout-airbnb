import { prisma } from "@/lib/db";
import type { Apartment } from "@/data/types";

export type ApartmentRecord = {
  id: string;
  slug: string;
  label: string;
  content: Apartment;
};

/** Apartamento ativo pelo slug (subdomínio) — usado no guia público. */
export async function getApartmentBySlug(
  slug: string,
): Promise<ApartmentRecord | null> {
  const row = await prisma.apartment.findFirst({
    where: { slug, active: true },
    select: { id: true, slug: true, label: true, content: true },
  });
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    content: row.content as unknown as Apartment,
  };
}

/** Dados da estadia vigente entregues às páginas de check-in/checkout. */
export type StayInfo = {
  guestName: string | null;
  doorCode: string | null;
  checkInISO: string;
  checkOutISO: string;
};

export type ArrivalData = { content: Apartment; stay: StayInfo | null };

/**
 * Carrega o conteúdo do apartamento + a estadia vigente (agora dentro da janela,
 * não cancelada) numa ÚNICA consulta — para as páginas time-gated de check-in
 * e checkout. Retorna null se o apartamento não existe ou está inativo.
 */
export async function getArrival(
  slug: string,
  now: Date = new Date(),
): Promise<ArrivalData | null> {
  const row = await prisma.apartment.findFirst({
    where: { slug, active: true },
    select: {
      content: true,
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
  return {
    content: row.content as unknown as Apartment,
    stay: s
      ? {
          guestName: s.guestName,
          doorCode: s.doorCode,
          checkInISO: s.checkInAt.toISOString(),
          checkOutISO: s.checkOutAt.toISOString(),
        }
      : null,
  };
}
