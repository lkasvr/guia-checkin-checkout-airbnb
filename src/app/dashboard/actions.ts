"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseLocalBR } from "@/lib/tz";
import type { Apartment } from "@/data/types";
import { StayStatus } from "@/generated/prisma/client";

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Lê e valida a janela da estadia (datas em hora de Brasília → Date UTC). */
function readStayWindow(formData: FormData): { checkInAt: Date; checkOutAt: Date } {
  const checkIn = str(formData.get("checkInAt"));
  const checkOut = str(formData.get("checkOutAt"));
  if (!checkIn || !checkOut) throw new Error("Datas obrigatórias");
  const checkInAt = parseLocalBR(checkIn);
  const checkOutAt = parseLocalBR(checkOut);
  if (checkOutAt <= checkInAt) {
    throw new Error("Check-out deve ser após o check-in");
  }
  return { checkInAt, checkOutAt };
}

/** Id do anfitrião logado (ou lança). Base do isolamento por tenant. */
async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Não autenticado");
  return session.user.id;
}

/** Garante que o apartamento pertence ao anfitrião logado. */
async function requireApartment(apartmentId: string): Promise<void> {
  const hostId = await requireUserId();
  const apt = await prisma.apartment.findFirst({
    where: { id: apartmentId, hostId },
    select: { id: true },
  });
  if (!apt) throw new Error("Apartamento não encontrado");
}

/** Confirma que a estadia pertence a um apartamento do anfitrião logado. */
async function requireStay(stayId: string) {
  const hostId = await requireUserId();
  const stay = await prisma.stay.findFirst({
    where: { id: stayId, apartment: { hostId } },
    select: { id: true, apartmentId: true },
  });
  if (!stay) throw new Error("Estadia não encontrada");
  return stay;
}

export async function setApartmentActive(apartmentId: string, active: boolean) {
  await requireApartment(apartmentId);
  await prisma.apartment.update({ where: { id: apartmentId }, data: { active } });
  revalidatePath(`/dashboard/apartments/${apartmentId}`);
  revalidatePath("/dashboard");
}

export async function createStay(apartmentId: string, formData: FormData) {
  await requireApartment(apartmentId);
  const { checkInAt, checkOutAt } = readStayWindow(formData);

  await prisma.stay.create({
    data: {
      apartmentId,
      guestName: str(formData.get("guestName")) || null,
      checkInAt,
      checkOutAt,
      doorCode: str(formData.get("doorCode")) || null,
      accessCode: randomBytes(16).toString("base64url"),
      status: StayStatus.SCHEDULED,
    },
  });
  revalidatePath(`/dashboard/apartments/${apartmentId}`);
  revalidatePath("/dashboard");
}

export async function updateStay(stayId: string, formData: FormData) {
  const stay = await requireStay(stayId);
  const { checkInAt, checkOutAt } = readStayWindow(formData);
  const status = str(formData.get("status")) as StayStatus;
  if (!Object.values(StayStatus).includes(status)) {
    throw new Error("Status inválido");
  }
  await prisma.stay.update({
    where: { id: stayId },
    data: {
      guestName: str(formData.get("guestName")) || null,
      checkInAt,
      checkOutAt,
      doorCode: str(formData.get("doorCode")) || null,
      status,
    },
  });
  revalidatePath(`/dashboard/apartments/${stay.apartmentId}`);
}

export async function deleteStay(stayId: string) {
  const stay = await requireStay(stayId);
  await prisma.stay.delete({ where: { id: stayId } });
  revalidatePath(`/dashboard/apartments/${stay.apartmentId}`);
  revalidatePath("/dashboard");
}

/**
 * Edição pelo anfitrião da identidade + textos do guia — campos que alimentam
 * o cabeçalho e o metadata (título/OG). O restante do conteúdo é preservado.
 */
export async function updateApartmentContent(
  apartmentId: string,
  formData: FormData,
) {
  await requireApartment(apartmentId);
  const apt = await prisma.apartment.findUnique({
    where: { id: apartmentId },
    select: { content: true },
  });
  if (!apt) throw new Error("Apartamento não encontrado");
  const content = apt.content as unknown as Apartment;

  const namePt = str(formData.get("name_pt"));
  const unit = str(formData.get("unit"));
  if (!namePt || !unit) throw new Error("Nome e unidade são obrigatórios");

  const next: Apartment = {
    ...content,
    name: { pt: namePt, en: str(formData.get("name_en")) || namePt },
    unit,
    building: str(formData.get("building")),
    eyebrow: {
      pt: str(formData.get("eyebrow_pt")) || content.eyebrow.pt,
      en: str(formData.get("eyebrow_en")) || content.eyebrow.en,
    },
    hero: {
      ...content.hero,
      sub: {
        pt: str(formData.get("hero_sub_pt")),
        en: str(formData.get("hero_sub_en")),
      },
    },
  };

  await prisma.apartment.update({
    where: { id: apartmentId },
    data: { content: next as object },
  });
  revalidatePath(`/dashboard/apartments/${apartmentId}`);
  revalidatePath(`/dashboard/apartments/${apartmentId}/edit`);
}
