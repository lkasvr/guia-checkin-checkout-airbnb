import type { Apartment, Alert, CheckinCard, L, MapLocation, Rule, Step } from "@/data/types";
import { starterContent } from "@/data/starter";
import { isPrerequisiteCard, withPrerequisiteCard } from "@/data/prerequisiteCard";
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

const t = (pt: string, en?: string): L => ({ pt, en: en ?? pt });

/** Conteúdo de prédio relevante pra montar um apartamento (`Building`, ver schema.prisma). */
export type BuildingTemplate = {
  rules: Apartment["rules"];
  home: Apartment["home"];
  amenities: Apartment["amenities"];
  tourism: Apartment["tourism"];
  dining: Apartment["dining"];
  checkinTemplate: Apartment["checkin"];
  checkoutTemplate: NonNullable<Apartment["checkout"]>;
  location: MapLocation | null;
};

/**
 * `true` numa seção = este apartamento usa o `content` próprio dela em vez
 * de herdar ao vivo do prédio (`Apartment.overrides`, ver schema.prisma).
 * Ausente/false = herda, comportamento padrão.
 */
export type ApartmentOverrides = {
  rules?: boolean;
  home?: boolean;
  amenities?: boolean;
  tourism?: boolean;
  dining?: boolean;
};

/** Troca `{{TOKEN}}` pelo valor correspondente — usado no template de check-in/check-out do prédio. */
function fillTokens(text: string, tokens: Record<string, string>): string {
  return Object.entries(tokens).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    text,
  );
}
function fillL(l: L, tokens: Record<string, string>): L {
  return { pt: fillTokens(l.pt, tokens), en: fillTokens(l.en, tokens) };
}
function fillSteps(steps: Step[], tokens: Record<string, string>): Step[] {
  return steps.map((s) => ({ ...s, body: fillL(s.body, tokens) }));
}
function fillAlerts(alerts: Alert[] | undefined, tokens: Record<string, string>) {
  return alerts?.map((a) => ({ ...a, body: fillL(a.body, tokens) }));
}
function fillCard(card: CheckinCard, tokens: Record<string, string>): CheckinCard {
  return {
    ...card,
    title: fillL(card.title, tokens),
    tag: card.tag && fillL(card.tag, tokens),
    steps: fillSteps(card.steps, tokens),
    alerts: fillAlerts(card.alerts, tokens),
    video: card.video && { ...card.video, label: fillL(card.video.label, tokens) },
  };
}

/**
 * Aplica os valores da unidade (torre, andar, número, vaga, horário de
 * saída) no template de check-in/check-out do prédio — o resultado é gravado
 * como conteúdo próprio do apartamento (não fica "ao vivo" ligado ao prédio,
 * diferente de amenities/tourism/dining).
 */
function applyBuildingTemplate(
  building: BuildingTemplate,
  input: Pick<ApartmentFormInput, "tower" | "floor" | "unit" | "parking" | "checkoutTime">,
): { checkin: Apartment["checkin"]; checkout: NonNullable<Apartment["checkout"]> } {
  const tokens: Record<string, string> = {
    TORRE: input.tower,
    ANDAR: input.floor,
    UNIDADE: input.unit,
    VAGA: input.parking,
    CHECKOUT_HORA: input.checkoutTime || "11h",
  };
  const { checkinTemplate: ci, checkoutTemplate: co } = building;
  return {
    checkin: {
      sub: fillL(ci.sub, tokens),
      cards: ci.cards.map((c) => fillCard(c, tokens)),
    },
    checkout: {
      sub: fillL(co.sub, tokens),
      steps: fillSteps(co.steps, tokens),
    },
  };
}

/**
 * Tenta recuperar torre/andar/vaga/nº de hóspedes/horários a partir de
 * `hero.facts` — só funciona quando os facts têm o formato que esta mesma
 * função gera (`v.pt` bate com uma das legendas fixas abaixo); facts
 * escritos à mão (ex.: o 1305C original) não batem e ficam em branco, o que
 * é o comportamento seguro já esperado hoje.
 */
export function parseHeroFacts(facts: Apartment["hero"]["facts"]): {
  tower: string;
  floor: string;
  parking: string;
  maxGuests: string;
  checkinTime: string;
  checkoutTime: string;
} {
  const FIXED_CAPTIONS = ["Garagem", "Capacidade máxima", "Check-in", "Check-out"];
  const find = (caption: string) => facts.find((f) => f.v.pt === caption);
  // A legenda do fact de torre/andar não é fixa (é o próprio andar) — é
  // reconhecido por eliminação: o único fact cuja legenda não é uma das fixas.
  const towerFact = facts.find((f) => !FIXED_CAPTIONS.includes(f.v.pt));
  const guests = find("Capacidade máxima");
  return {
    tower: towerFact?.k.pt ?? "",
    floor: towerFact && towerFact.v.pt !== "—" ? towerFact.v.pt : "",
    parking: find("Garagem")?.k.pt ?? "",
    maxGuests: guests ? guests.k.pt.replace(/\s*hóspedes$/, "") : "",
    checkinTime: find("Check-in")?.k.pt ?? "",
    checkoutTime: find("Check-out")?.k.pt ?? "",
  };
}

const BLANK_RULES: Apartment["rules"] = { sub: t(""), items: [] };
const BLANK_HOME: Apartment["home"] = { sub: t(""), slides: [], accordions: [] };

/** Converte as colunas JSON cruas do Prisma (`Building`) pro formato tipado. */
export function toBuildingTemplate(row: {
  rules: unknown;
  home: unknown;
  amenities: unknown;
  tourism: unknown;
  dining: unknown;
  checkinTemplate: unknown;
  checkoutTemplate: unknown;
  location?: unknown;
}): BuildingTemplate {
  return {
    location: (row.location as MapLocation | null | undefined) ?? null,
    rules: (row.rules as Apartment["rules"] | null) ?? BLANK_RULES,
    home: (row.home as Apartment["home"] | null) ?? BLANK_HOME,
    amenities: row.amenities as Apartment["amenities"],
    tourism: row.tourism as Apartment["tourism"],
    dining: row.dining as Apartment["dining"],
    checkinTemplate: row.checkinTemplate as Apartment["checkin"],
    checkoutTemplate: row.checkoutTemplate as NonNullable<Apartment["checkout"]>,
  };
}

/**
 * Sobrepõe o conteúdo compartilhado do prédio no conteúdo do apartamento —
 * usado tanto no carregamento do guia público (`src/lib/apartments.ts`)
 * quanto na prévia do formulário, pra garantir que os dois mostrem a mesma
 * coisa. Por seção, `overrides.<secao>` decide: `true` = usa o `content`
 * próprio do apartamento (personalizado); ausente/false = herda ao vivo do
 * prédio. Regras nunca-personalizadas continuam somadas (genéricas do
 * prédio + específicas do apartamento) em vez de substituídas.
 */
export function overlayBuildingLiveContent(
  content: Apartment,
  building: Pick<BuildingTemplate, "rules" | "home" | "amenities" | "tourism" | "dining"> & {
    location?: MapLocation | null;
  },
  overrides: ApartmentOverrides = {},
): Apartment {
  // Endereço/link próprio do apartamento vale no lugar do do prédio; sem
  // nenhum dos dois o guia fica como sempre foi (sem cartão de mapa).
  const own = content.location;
  const location = own && (own.address?.trim() || own.mapsUrl?.trim()) ? own : building.location;
  const overlaid: Apartment = {
    ...content,
    rules: overrides.rules
      ? content.rules
      : { sub: building.rules.sub, items: [...building.rules.items, ...content.rules.items] },
    home: overrides.home ? content.home : building.home,
    amenities: overrides.amenities ? content.amenities : building.amenities,
    tourism: overrides.tourism ? content.tourism : building.tourism,
    dining: overrides.dining ? content.dining : building.dining,
  };
  if (location) overlaid.location = location;
  else delete overlaid.location;
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
  smoking: "yes" | "no";
  pets: "yes" | "no";
  hostWhatsapp: string;
  coHostName: string;
  coHostWhatsapp: string;
  internalNotes: string;
  /** Endereço/link do Maps só deste apartamento; em branco herda do prédio. */
  locationAddress: string;
  locationMapsUrl: string;
  /** Tour em vídeo só deste apartamento (topo de A Casa); em branco usa o do prédio, se houver. */
  homeVideo: string;
  /** Quais seções este apartamento personalizou (em vez de herdar do prédio). */
  overrides: ApartmentOverrides;
  overrideRules?: RulesValue;
  overrideHome?: HomeValue;
  overrideAmenities?: AmenitiesValue;
  overrideTourism?: PlacesValue;
  overrideDining?: PlacesValue;
  /** Edição manual do check-in/check-out depois da substituição automática do template. */
  checkinOverride?: CheckinValue;
  checkoutOverride?: CheckoutValue;
};

/** Só dígitos, com `+55` na frente — formato `tel:` a partir do que a pessoa digitou. */
function toTel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
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
 * para as seções ainda não cobertas pelo formulário (home/amenities/tourism/
 * dining ficam em branco, como hoje, até a fase de fotos).
 */
/**
 * `base` é o conteúdo já existente do apartamento, passado na edição — assim
 * as seções que o formulário não cobre (home/amenities/tourism/dining) são
 * preservadas em vez de voltar a ficar em branco. Na criação, `base` fica de
 * fora e usa-se o `starterContent` (tudo em branco).
 */
export function buildApartmentContent(
  input: ApartmentFormInput,
  hostName: string,
  base: Apartment = starterContent("Apartamento", input.unit, input.building),
  building?: BuildingTemplate | null,
): Apartment {
  // Só aplica o template do prédio se ele tiver check-in escrito além do cartão
  // padrão "Antes de chegar" (prédio novo nasce só com ele, aí o comportamento
  // é igual a não ter prédio nenhum).
  const templated =
    building && building.checkinTemplate.cards.some((c) => !isPrerequisiteCard(c))
      ? applyBuildingTemplate(building, input)
      : null;

  const withPrerequisite = (checkin: Apartment["checkin"]): Apartment["checkin"] => ({
    ...checkin,
    cards: withPrerequisiteCard(checkin.cards),
  });
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

  const rules: Rule[] = input.rulesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ icon: "📌", title: t(line), text: t("") }));

  rules.push(
    input.smoking === "no"
      ? {
          icon: "🚭",
          hot: true,
          title: t("Proibido fumar", "No smoking"),
          text: t("Em todo o apartamento.", "Anywhere in the apartment."),
        }
      : { icon: "🚬", title: t("Fumo permitido", "Smoking allowed"), text: t("") },
  );
  rules.push(
    input.pets === "no"
      ? {
          icon: "🚫",
          hot: true,
          title: t("Não são permitidos animais", "No pets allowed"),
          text: t(""),
        }
      : { icon: "🐾", title: t("Animais são bem-vindos", "Pets are welcome"), text: t("") },
  );

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

  const content: Apartment = {
    ...base,
    unit: input.unit,
    building: input.building,
    hero: { ...base.hero, facts, img: input.heroImg || base.hero.img },
    checkin: {
      // Edição manual do check-in é respeitada como está; template e conteúdo
      // já existente ganham o cartão "Antes de chegar" no topo quando faltar.
      ...(input.checkinOverride
        ? checkinToContent(input.checkinOverride)
        : withPrerequisite(templated ? templated.checkin : base.checkin)),
      doorCode:
        input.doorCodeMode === "fixed" && input.doorCode
          ? { mode: "fixed", code: input.doorCode }
          : { mode: "per_stay" },
    },
    checkout: input.checkoutOverride
      ? checkoutToContent(input.checkoutOverride)
      : templated
        ? templated.checkout
        : base.checkout,
    wifi: {
      network: input.wifiNetwork,
      password: input.wifiPassword,
      speed: base.wifi.speed,
    },
    rules:
      input.overrides.rules && input.overrideRules
        ? rulesToContent(input.overrideRules)
        : { ...base.rules, items: rules },
    contacts: { ...base.contacts, items: contacts },
    footer: {
      ...base.footer,
      whoName: hostName,
      phones,
      img: input.footerImg || base.footer.img,
    },
    ...(input.overrides.home && input.overrideHome
      ? { home: homeToContent(input.overrideHome) }
      : {}),
    ...(input.overrides.amenities && input.overrideAmenities
      ? { amenities: amenitiesToContent(input.overrideAmenities) }
      : {}),
    ...(input.overrides.tourism && input.overrideTourism
      ? { tourism: placesToContent(input.overrideTourism) }
      : {}),
    ...(input.overrides.dining && input.overrideDining
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
  return content;
}
