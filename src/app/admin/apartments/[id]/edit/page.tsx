import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ApartmentWizard } from "@/app/admin/apartments/wizard";
import {
  doorCodeFromInput,
  parseHeroFacts,
  toBuildingTemplate,
  varsFromInput,
  type ApartmentOverrides,
} from "@/data/buildApartmentContent";
import {
  amenitiesFromContent,
  homeFromContent,
  placesFromContent,
  rulesFromContent,
} from "@/data/sectionContent";
import type { Apartment, ItemPatches } from "@/data/types";
import { isEmptyPatch } from "@/data/itemMerge";
import { editorValues, legacyToPatches } from "@/data/patches";
import { contactInfoFromContent, lookupIntercom, reusableContacts } from "@/data/contacts";

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
        buildingId: true,
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
        location: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!apt) notFound();
  const siblings = await prisma.apartment.findMany({
    where: { hostId: apt.hostId, id: { not: apt.id } },
    select: { label: true, content: true },
    orderBy: { label: "asc" },
  });
  // `footer.img` não existia antes desta versão — apartamento criado antes
  // dela não tem a chave gravada; sem isso o editor/prévia quebraria.
  const rawContent = apt.content as unknown as Apartment;
  let content: Apartment = {
    ...rawContent,
    footer: { ...rawContent.footer, img: rawContent.footer.img ?? "/media/mesa.webp" },
  };
  const hostName = apt.host.name ?? apt.host.email;
  const overrides = (apt.overrides as ApartmentOverrides | null) ?? {};

  const buildingRow = buildings.find(
    (b) => b.name.trim().toLowerCase() === content.building.trim().toLowerCase(),
  );
  const building = buildingRow ? toBuildingTemplate(buildingRow) : null;

  // Torre/andar/vaga/hóspedes/horários só voltam quando os facts batem com o
  // formato que este formulário gera (ver `parseHeroFacts`) — em conteúdo
  // escrito à mão ficam em branco.
  const facts = parseHeroFacts(content.hero.facts);
  const contacts = contactInfoFromContent(content);

  // Ao salvar, o apartamento com prédio passa a guardar só os ajustes item por
  // item. Conteúdo do modelo antigo (cópia/seção própria) é convertido aqui, sem
  // mudar nada do que o hóspede vê.
  let patches: ItemPatches | undefined;
  if (building) {
    if (overrides.patches) {
      patches = overrides.patches;
    } else {
      const converted = legacyToPatches(content, building, overrides, !!apt.buildingId);
      patches = converted.patches;
      content = { ...content, rules: { ...content.rules, items: converted.ownRules } };
    }
  }

  const base = {
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
  };
  const inheritedCode = building ? lookupIntercom(building.location?.intercom, base.tower) : "";

  const initial = {
    ...base,
    doorCodeMode:
      content.checkin.doorCode?.mode === "fixed" ? ("fixed" as const) : ("per_stay" as const),
    doorCode: content.checkin.doorCode?.mode === "fixed" ? content.checkin.doorCode.code : "",
    wifiNetwork: content.wifi.network,
    wifiPassword: content.wifi.password,
    // Regras/fumo/animais só são regerados se a pessoa mexer nesses campos.
    rulesText: "",
    smoking: "no" as const,
    pets: "no" as const,
    regenerateRules: false,
    hostWhatsapp: contacts.hostWhatsapp,
    coHostName: contacts.coHostName,
    coHostWhatsapp: contacts.coHostWhatsapp,
    portariaPhone: content.portaria?.phone ?? "",
    intercomCode: content.portaria?.code ?? inheritedCode,
    internalNotes: apt.internalNotes ?? "",
    locationAddress: content.location?.address ?? "",
    locationMapsUrl: content.location?.mapsUrl ?? "",
    homeVideo: content.homeVideo ?? "",
    slug: apt.slug,
    label: apt.label,
  };

  let editors: {
    overrides: ApartmentOverrides;
    overrideRules?: ReturnType<typeof rulesFromContent>;
    overrideHome?: ReturnType<typeof homeFromContent>;
    overrideAmenities?: ReturnType<typeof amenitiesFromContent>;
    overrideTourism?: ReturnType<typeof placesFromContent>;
    overrideDining?: ReturnType<typeof placesFromContent>;
    checkinOverride?: ReturnType<typeof editorValues>["checkin"];
    checkoutOverride?: ReturnType<typeof editorValues>["checkout"];
  };
  if (building && patches) {
    // Editor só abre pré-preenchido pra seção que este apartamento já ajustou.
    const ev = editorValues(building, patches, varsFromInput(base), doorCodeFromInput(initial));
    const flags: ApartmentOverrides = {
      rules: !isEmptyPatch(patches.rules),
      home: !isEmptyPatch(patches.slides) || !isEmptyPatch(patches.accordions),
      amenities: !isEmptyPatch(patches.amenities),
      tourism: !isEmptyPatch(patches.tourism),
      dining: !isEmptyPatch(patches.dining),
    };
    editors = {
      overrides: flags,
      overrideRules: flags.rules ? ev.rules : undefined,
      overrideHome: flags.home ? ev.home : undefined,
      overrideAmenities: flags.amenities ? ev.amenities : undefined,
      overrideTourism: flags.tourism ? ev.tourism : undefined,
      overrideDining: flags.dining ? ev.dining : undefined,
      checkinOverride: !isEmptyPatch(patches.checkin) ? ev.checkin : undefined,
      checkoutOverride: !isEmptyPatch(patches.checkout) ? ev.checkout : undefined,
    };
  } else {
    editors = {
      overrides,
      overrideRules: overrides.rules ? rulesFromContent(content.rules) : undefined,
      overrideHome: overrides.home ? homeFromContent(content.home) : undefined,
      overrideAmenities: overrides.amenities ? amenitiesFromContent(content.amenities) : undefined,
      overrideTourism: overrides.tourism ? placesFromContent(content.tourism) : undefined,
      overrideDining: overrides.dining ? placesFromContent(content.dining) : undefined,
    };
  }

  const hasRichContent = !building && content.checkin.cards.length > 0;

  return (
    <>
      {hasRichContent && (
        <p className="mb-4 rounded-xl border border-[rgb(168_69_46/0.35)] bg-terra-soft p-3 text-[14px] text-terra">
          Este apartamento não está ligado a um prédio cadastrado e tem um passo a
          passo de check-in escrito à mão, que este formulário não consegue reler
          (fica em branco abaixo, mesmo já existindo no guia). Confira a{" "}
          <b>prévia</b> com atenção antes de confirmar.
        </p>
      )}
      <ApartmentWizard
        mode="edit"
        hostId={apt.hostId}
        hostName={hostName}
        apartmentId={apt.id}
        initial={{ ...initial, ...editors, previousPatches: patches }}
        existingContent={content}
        otherContacts={reusableContacts(siblings)}
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
