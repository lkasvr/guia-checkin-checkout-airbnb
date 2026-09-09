import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ApartmentWizard } from "@/app/admin/apartments/wizard";
import {
  parseHeroFacts,
  toBuildingTemplate,
  type ApartmentOverrides,
} from "@/data/buildApartmentContent";
import {
  amenitiesFromContent,
  homeFromContent,
  placesFromContent,
  rulesFromContent,
} from "@/data/sectionContent";
import type { Apartment } from "@/data/types";

export const dynamic = "force-dynamic";

export default async function EditApartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [apt, buildings] = await Promise.all([
    prisma.apartment.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        label: true,
        content: true,
        internalNotes: true,
        overrides: true,
        hostId: true,
        host: { select: { name: true, email: true } },
      },
    }),
    prisma.building.findMany({
      select: {
        id: true,
        name: true,
        rules: true,
        home: true,
        amenities: true,
        tourism: true,
        dining: true,
        checkinTemplate: true,
        checkoutTemplate: true,
        defaultHeroImg: true,
        defaultFooterImg: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!apt) notFound();
  // `footer.img` não existia antes desta versão — apartamento criado antes
  // dela não tem a chave gravada; sem isso o editor/prévia quebraria.
  const rawContent = apt.content as unknown as Apartment;
  const content: Apartment = {
    ...rawContent,
    footer: { ...rawContent.footer, img: rawContent.footer.img ?? "/media/mesa.webp" },
  };
  const hostName = apt.host.name ?? apt.host.email;
  const overrides = (apt.overrides as ApartmentOverrides | null) ?? {};

  // Torre/andar/vaga/hóspedes/horários só voltam quando os facts batem com o
  // formato que este formulário gera (ver `parseHeroFacts`) — em conteúdo
  // escrito à mão ficam em branco, coberto pelo aviso abaixo. Regras,
  // contatos e passo a passo de check-in usam HTML rico hoje — não são
  // recuperáveis pro formulário simplificado, ficam em branco também.
  const facts = parseHeroFacts(content.hero.facts);
  const initial = {
    building: content.building,
    unit: content.unit,
    heroImg: content.hero.img,
    footerImg: content.footer.img,
    tower: facts.tower,
    floor: facts.floor,
    parking: facts.parking,
    maxGuests: facts.maxGuests,
    checkinTime: facts.checkinTime,
    checkoutTime: facts.checkoutTime,
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
    overrides,
    // Só faz sentido pré-preencher o editor de uma seção personalizada — as
    // demais continuam herdando do prédio, sem conteúdo próprio pra reler.
    overrideRules: overrides.rules ? rulesFromContent(content.rules) : undefined,
    overrideHome: overrides.home ? homeFromContent(content.home) : undefined,
    overrideAmenities: overrides.amenities ? amenitiesFromContent(content.amenities) : undefined,
    overrideTourism: overrides.tourism ? placesFromContent(content.tourism) : undefined,
    overrideDining: overrides.dining ? placesFromContent(content.dining) : undefined,
  };

  const hasRichContent =
    content.checkin.cards.length > 0 ||
    content.contacts.items.length > 0 ||
    (!overrides.rules && content.rules.items.length > 0);

  return (
    <>
      {hasRichContent && (
        <p className="mb-4 rounded-xl border border-[rgb(168_69_46/0.35)] bg-terra-soft p-3 text-[14px] text-terra">
          Este apartamento já tem conteúdo que este formulário simplificado não
          consegue reler nos campos (contatos e passo a passo de check-in
          ficam em branco abaixo, mesmo já existindo no guia). Um campo
          deixado em branco aqui vira versão simples no guia ao salvar —
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
        buildings={buildings.map((b) => ({
          id: b.id,
          name: b.name,
          defaultHeroImg: b.defaultHeroImg,
          defaultFooterImg: b.defaultFooterImg,
          ...toBuildingTemplate(b),
        }))}
      />
    </>
  );
}
