import { prisma } from "@/lib/db";
import type { Apartment } from "@/data/types";

export type ApartmentRecord = {
  id: string;
  slug: string;
  label: string;
  content: Apartment;
};

/** Busca um apartamento ativo pelo slug (subdomínio). */
export async function getApartmentBySlug(
  slug: string,
): Promise<ApartmentRecord | null> {
  const row = await prisma.apartment.findFirst({
    where: { slug, active: true },
  });
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    content: row.content as unknown as Apartment,
  };
}

export type ActiveStay = {
  id: string;
  guestName: string | null;
  doorCode: string | null;
  checkInAt: Date;
  checkOutAt: Date;
};

/** Estadia vigente (agora dentro da janela e não cancelada), se houver. */
export async function getActiveStay(
  apartmentId: string,
  now: Date = new Date(),
): Promise<ActiveStay | null> {
  const stay = await prisma.stay.findFirst({
    where: {
      apartmentId,
      status: { not: "CANCELED" },
      checkInAt: { lte: now },
      checkOutAt: { gte: now },
    },
    orderBy: { checkInAt: "desc" },
    select: {
      id: true,
      guestName: true,
      doorCode: true,
      checkInAt: true,
      checkOutAt: true,
    },
  });
  return stay;
}
