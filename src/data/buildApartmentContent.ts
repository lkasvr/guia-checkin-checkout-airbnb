import type {
  Apartment,
  ApartmentVars,
  ItemPatches,
  L,
  PortariaOverride,
  Rule,
} from "@/data/types";
import { starterContent } from "@/data/starter";
import { withPrerequisiteCard } from "@/data/prerequisiteCard";
import {
  checkinToContent,
  checkoutToContent,
  homeToContent,
  placesToContent,
  amenitiesToContent,
  rulesToContent,
  type AmenitiesValue,
  type CheckinValue,
  type CheckoutValue,
  type HomeValue,
  type PlacesValue,
  type RulesValue,
} from "@/data/sectionContent";
import type { ApartmentOverrides, BuildingTemplate } from "@/data/buildingModel";
import { buildItemPatches, overlayWithPatches } from "@/data/patches";
import { lookupIntercom, portariaContact, toTel, withPortaria } from "@/data/contacts";

// Quem já importava daqui continua importando daqui.
export { toBuildingTemplate } from "@/data/buildingModel";
export type { ApartmentOverrides, BuildingTemplate } from "@/data/buildingModel";
export { parseHeroFacts } from "@/data/checkinTemplate";

const t = (pt: string, en?: string): L => ({ pt, en: en ?? pt });

/**
 * Sobrepõe o conteúdo compartilhado do prédio no conteúdo do apartamento —
 * usado tanto no carregamento do guia público (`src/lib/apartments.ts`)
 * quanto na prévia do formulário, pra garantir que os dois mostrem a mesma
 * coisa.
 *
 * Com `overrides.patches` (modo atual) cada seção é a lista do prédio, ao vivo,
 * com só os itens que este apartamento editou/removeu/acrescentou trocados —
 * mudar o modelo atualiza todo guia, menos o item que ele mexeu à mão. Sem
 * `patches` vale o modo antigo: `overrides.<secao>` = a seção inteira é do
 * apartamento; senão herda do prédio. Regras do prédio somam com as do
 * apartamento em vez de substituí-las.
 */
export function overlayBuildingLiveContent(
  content: Apartment,
  building: BuildingTemplate | null,
  overrides: ApartmentOverrides = {},
): Apartment {
  let overlaid: Apartment;
  if (!building) {
    overlaid = { ...content };
  } else if (overrides.patches) {
    overlaid = overlayWithPatches(content, building, overrides.patches);
  } else {
    overlaid = {
      ...content,
      rules: overrides.rules
        ? content.rules
        : { sub: building.rules.sub, items: [...building.rules.items, ...content.rules.items] },
      home: overrides.home ? content.home : building.home,
      amenities: overrides.amenities ? content.amenities : building.amenities,
      tourism: overrides.tourism ? content.tourism : building.tourism,
      dining: overrides.dining ? content.dining : building.dining,
    };
  }

  // Endereço/link próprio do apartamento vale no lugar do do prédio; sem
  // nenhum dos dois o guia fica como sempre foi (sem cartão de mapa).
  const own = content.location;
  const info = building?.location ?? null;
  if (own && (own.address?.trim() || own.mapsUrl?.trim())) {
    overlaid.location = own;
  } else if (info && (info.address?.trim() || info.mapsUrl?.trim())) {
    overlaid.location = { address: info.address ?? "", mapsUrl: info.mapsUrl ?? "" };
  } else {
    delete overlaid.location;
  }

  // Portaria: telefone + código do interfone da torre (vale o do apartamento, se houver).
  overlaid.contacts = {
    ...overlaid.contacts,
    items: withPortaria(overlaid.contacts.items, portariaContact(content, info)),
  };
  return overlaid;
}

export type ApartmentFormInput = {
  building: string;
  unit: string;
  /** Capa e despedida são sempre próprias do apartamento (nunca herdadas do prédio). */
  heroImg: string;
  footerImg: string;
  tower: string;
  floor: string;
  parking: string;
  maxGuests: string;
  checkinTime: string;
  checkoutTime: string;
  doorCodeMode: "fixed" | "per_stay";
  doorCode: string;
  wifiNetwork: string;
  wifiPassword: string;
  rulesText: string;
  smoking: "yes" | "no" | "balcony";
  pets: "yes" | "no";
  /**
   * Regenera as regras do apartamento (texto + fumo + animais) a partir do
   * formulário. Na edição só quando a pessoa mexeu nesses campos — senão
   * mantém as que já existem em vez de trocá-las pelos valores em branco.
   */
  regenerateRules?: boolean;
  hostWhatsapp: string;
  coHostName: string;
  coHostWhatsapp: string;
  /** Portaria deste apartamento; igual ao do prédio/da torre = herda (nada é gravado). */
  portariaPhone: string;
  intercomCode: string;
  internalNotes: string;
  /** Endereço/link do Maps só deste apartamento; em branco herda do prédio. */
  locationAddress: string;
  locationMapsUrl: string;
  /** Tour em vídeo só deste apartamento (topo de A Casa); em branco usa o do prédio, se houver. */
  homeVideo: string;
  /** Quais seções este apartamento personalizou (em vez de seguir o prédio). */
  overrides: ApartmentOverrides;
  overrideRules?: RulesValue;
  overrideHome?: HomeValue;
  overrideAmenities?: AmenitiesValue;
  overrideTourism?: PlacesValue;
  overrideDining?: PlacesValue;
  /** Edição manual do check-in/check-out. */
  checkinOverride?: CheckinValue;
  checkoutOverride?: CheckoutValue;
  /** Ajustes já gravados (edição): mantêm as traduções de item cujo português não mudou. */
  previousPatches?: ItemPatches;
};

/** Valores que preenchem os marcadores {{TORRE}}, {{ANDAR}}… do check-in/check-out do prédio. */
export const varsFromInput = (
  input: Pick<ApartmentFormInput, "tower" | "floor" | "unit" | "parking" | "checkoutTime">,
): ApartmentVars => ({
  TORRE: input.tower,
  ANDAR: input.floor,
  UNIDADE: input.unit,
  VAGA: input.parking,
  CHECKOUT_HORA: input.checkoutTime || "11h",
});

export const doorCodeFromInput = (
  input: Pick<ApartmentFormInput, "doorCodeMode" | "doorCode">,
): Apartment["checkin"]["doorCode"] =>
  input.doorCodeMode === "fixed" && input.doorCode
    ? { mode: "fixed", code: input.doorCode }
    : { mode: "per_stay" };

/**
 * O que vai em `Apartment.overrides`. Com prédio: só os ajustes item por item
 * (`patches`); sem prédio não há modelo pra seguir e valem os booleanos antigos.
 */
export function buildOverrides(
  input: ApartmentFormInput,
  building: BuildingTemplate | null | undefined,
): ApartmentOverrides {
  if (!building) return input.overrides;
  return {
    patches: buildItemPatches(
      { ...input, doorCodeSetting: doorCodeFromInput(input) },
      building,
      varsFromInput(input),
    ),
  };
}

const EMERGENCY_CONTACTS: Apartment["contacts"]["items"] = [
  {
    icon: "🚑",
    name: "SAMU",
    role: t("Emergência médica", "Medical emergency"),
    phone: "192",
    tel: "192",
    sos: true,
  },
  {
    icon: "🚒",
    name: "",
    role: t("Incêndio e resgate", "Fire and rescue"),
    phone: "193",
    tel: "193",
    sos: true,
  },
];

/**
 * Monta o `Apartment.content` completo a partir dos campos essenciais
 * preenchidos no painel do superadmin, usando `starterContent` como base
 * para as seções ainda não cobertas pelo formulário.
 *
 * `base` é o conteúdo já existente do apartamento, passado na edição — assim
 * o que o formulário não cobre é preservado em vez de voltar a ficar em
 * branco. Na criação, `base` fica de fora e usa-se o `starterContent`.
 *
 * Com prédio, Regras/A Casa/Lazer/Guia/Onde comer/Check-in/Check-out NÃO são
 * gravados aqui: vêm do modelo ao vivo, e o que o apartamento muda vai em
 * `overrides.patches` (ver `buildOverrides`).
 */
export function buildApartmentContent(
  input: ApartmentFormInput,
  hostName: string,
  base: Apartment = starterContent("Apartamento", input.unit, input.building),
  building?: BuildingTemplate | null,
): Apartment {
  const locationAddress = input.locationAddress.trim();
  const locationMapsUrl = input.locationMapsUrl.trim();

  const facts: Apartment["hero"]["facts"] = [];
  if (input.tower) facts.push({ k: t(input.tower), v: t(input.floor || "—") });
  if (input.parking) facts.push({ k: t(input.parking), v: t("Garagem", "Parking") });
  if (input.maxGuests) {
    facts.push({
      k: t(`${input.maxGuests} hóspedes`, `${input.maxGuests} guests`),
      v: t("Capacidade máxima", "Max capacity"),
    });
  }
  if (input.checkinTime) facts.push({ k: t(input.checkinTime), v: t("Check-in") });
  if (input.checkoutTime) facts.push({ k: t(input.checkoutTime), v: t("Check-out") });

  const generatedRules: Rule[] = input.rulesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ icon: "📌", title: t(line), text: t("") }));

  if (input.smoking === "no") {
    generatedRules.push({
      icon: "🚭",
      hot: true,
      title: t("Proibido fumar", "No smoking"),
      text: t("Em todo o apartamento.", "Anywhere in the apartment."),
    });
  } else if (input.smoking === "balcony") {
    generatedRules.push({
      icon: "🚬",
      hot: true,
      title: t("Fumo permitido somente na varanda", "Smoking allowed on the balcony only"),
      text: t(
        "Dentro do apartamento é proibido fumar.",
        "Smoking is not allowed inside the apartment.",
      ),
    });
  } else {
    generatedRules.push({ icon: "🚬", title: t("Fumo permitido", "Smoking allowed"), text: t("") });
  }
  generatedRules.push(
    input.pets === "no"
      ? {
          icon: "🚫",
          hot: true,
          title: t("Não são permitidos animais", "No pets allowed"),
          text: t(""),
        }
      : { icon: "🐾", title: t("Animais são bem-vindos", "Pets are welcome"), text: t("") },
  );
  const ownRules = input.regenerateRules === false ? base.rules.items : generatedRules;

  const contacts: Apartment["contacts"]["items"] = [];
  if (input.hostWhatsapp) {
    contacts.push({
      icon: "💬",
      name: hostName,
      role: t("Anfitrião · WhatsApp", "Host · WhatsApp"),
      phone: input.hostWhatsapp,
      tel: toTel(input.hostWhatsapp),
    });
  }
  if (input.coHostName && input.coHostWhatsapp) {
    contacts.push({
      icon: "💬",
      name: input.coHostName,
      role: t("Coanfitrião/gestor · WhatsApp", "Co-host/manager · WhatsApp"),
      phone: input.coHostWhatsapp,
      tel: toTel(input.coHostWhatsapp),
    });
  }
  contacts.push(...EMERGENCY_CONTACTS);

  const phones = [input.hostWhatsapp, input.coHostWhatsapp].filter(Boolean).join(" · ");

  // Portaria própria só quando difere do que o prédio/a torre já dão (senão herda ao vivo).
  const inherited = {
    phone: building?.location?.portariaPhone?.trim() ?? "",
    code: building ? lookupIntercom(building.location?.intercom, input.tower) : "",
  };
  const portaria: PortariaOverride = {};
  if (input.portariaPhone.trim() && input.portariaPhone.trim() !== inherited.phone) {
    portaria.phone = input.portariaPhone.trim();
  }
  if (input.intercomCode.trim() && input.intercomCode.trim() !== inherited.code) {
    portaria.code = input.intercomCode.trim();
  }

  const content: Apartment = {
    ...base,
    unit: input.unit,
    building: input.building,
    vars: varsFromInput(input),
    contactInfo: {
      hostWhatsapp: input.hostWhatsapp,
      coHostName: input.coHostName,
      coHostWhatsapp: input.coHostWhatsapp,
    },
    hero: { ...base.hero, facts, img: input.heroImg || base.hero.img },
    checkin: {
      ...(building
        ? { sub: t(""), cards: [] }
        : input.checkinOverride
          ? checkinToContent(input.checkinOverride)
          : { ...base.checkin, cards: withPrerequisiteCard(base.checkin.cards) }),
      doorCode: doorCodeFromInput(input),
    },
    checkout: building
      ? { sub: t(""), steps: [] }
      : input.checkoutOverride
        ? checkoutToContent(input.checkoutOverride)
        : base.checkout,
    wifi: {
      network: input.wifiNetwork,
      password: input.wifiPassword,
      speed: base.wifi.speed,
    },
    rules:
      !building && input.overrides.rules && input.overrideRules
        ? rulesToContent(input.overrideRules)
        : { ...base.rules, items: ownRules },
    contacts: { ...base.contacts, items: contacts },
    footer: {
      ...base.footer,
      whoName: hostName,
      phones,
      img: input.footerImg || base.footer.img,
    },
    // Seções inteiras próprias só existem sem prédio; com prédio elas são ajustes por item.
    ...(!building && input.overrides.home && input.overrideHome
      ? { home: homeToContent(input.overrideHome) }
      : {}),
    ...(!building && input.overrides.amenities && input.overrideAmenities
      ? { amenities: amenitiesToContent(input.overrideAmenities) }
      : {}),
    ...(!building && input.overrides.tourism && input.overrideTourism
      ? { tourism: placesToContent(input.overrideTourism) }
      : {}),
    ...(!building && input.overrides.dining && input.overrideDining
      ? { dining: placesToContent(input.overrideDining) }
      : {}),
  };
  if (locationAddress || locationMapsUrl) {
    content.location = { address: locationAddress, mapsUrl: locationMapsUrl };
  } else {
    delete content.location;
  }
  if (input.homeVideo.trim()) content.homeVideo = input.homeVideo.trim();
  else delete content.homeVideo;
  if (portaria.phone || portaria.code) content.portaria = portaria;
  else delete content.portaria;
  return content;
}
