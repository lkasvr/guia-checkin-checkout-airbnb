import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ApartmentWizard } from "@/app/admin/apartments/wizard";
import type { Apartment } from "@/data/types";

export const dynamic = "force-dynamic";

export default async function EditApartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apt = await prisma.apartment.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      label: true,
      content: true,
      internalNotes: true,
      hostId: true,
      host: { select: { name: true, email: true } },
    },
  });
  if (!apt) notFound();
  const content = apt.content as unknown as Apartment;
  const hostName = apt.host.name ?? apt.host.email;

  // Só os campos abaixo dão pra reconstruir com segurança a partir do
  // conteúdo salvo (texto simples, sem HTML). Regras, contatos e passo a
  // passo de check-in usam HTML rico hoje — não são recuperáveis pro
  // formulário simplificado, então ficam em branco aqui (ver aviso abaixo).
  const initial = {
    building: content.building,
    unit: content.unit,
    tower: "",
    floor: "",
    parking: "",
    maxGuests: "",
    checkinTime: "",
    checkoutTime: "",
    doorCodeMode:
      content.checkin.doorCode?.mode === "fixed" ? ("fixed" as const) : ("per_stay" as const),
    doorCode: content.checkin.doorCode?.mode === "fixed" ? content.checkin.doorCode.code : "",
    wifiNetwork: content.wifi.network,
    wifiPassword: content.wifi.password,
    rulesText: "",
    smoking: "no" as const,
    pets: "no" as const,
    hostWhatsapp: "",
    coHostName: "",
    coHostWhatsapp: "",
    internalNotes: apt.internalNotes ?? "",
    slug: apt.slug,
    label: apt.label,
  };

  const hasRichContent =
    content.checkin.cards.length > 0 ||
    content.amenities.items.length > 0 ||
    content.home.slides.length > 0 ||
    content.rules.items.length > 0 ||
    content.contacts.items.length > 0;

  return (
    <>
      {hasRichContent && (
        <p className="mb-4 rounded-xl border border-[rgb(168_69_46/0.35)] bg-terra-soft p-3 text-[14px] text-terra">
          Este apartamento já tem conteúdo que este formulário simplificado não
          consegue reler nos campos (regras, contatos e passo a passo de
          check-in ficam em branco abaixo, mesmo já existindo no guia). Um
          campo deixado em branco aqui vira versão simples no guia ao salvar —
          confira a <b>prévia</b> com atenção antes de confirmar.
        </p>
      )}
      <ApartmentWizard
        mode="edit"
        hostId={apt.hostId}
        hostName={hostName}
        apartmentId={apt.id}
        initial={initial}
        existingContent={content}
      />
    </>
  );
}
