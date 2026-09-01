import type { Accordion, Apartment, L, Step } from "@/data/types";

const t = (s: string): L => ({ pt: s, en: s });

/**
 * Formas de formulário (texto simples, um idioma só) pras seções que viram
 * editáveis tanto no prédio quanto no apartamento — e as conversões de/para
 * o formato real do guia (`Apartment`/`Building`, bilíngue). `diagram` e
 * `img` de itens já existentes são preservados como valor oculto (sem campo
 * de edição) pra nunca se perder ao salvar uma seção que não mexeu neles.
 */

export type StepInput = { n: string; body: string };
export type AlertInput = { icon: string; body: string };
export type RuleInput = { icon: string; title: string; text: string; hot: boolean };
export type AmenityInput = { img: string; title: string; text: string; wide: boolean };
export type PlaceInput = {
  img: string;
  title: string;
  text: string;
  meta: string;
  site: string;
  maps: string;
};
export type SlideInput = { img: string; title: string; text: string };
export type AccordionInput = {
  icon: string;
  title: string;
  steps: StepInput[];
  diagram?: Accordion["diagram"];
};
export type CheckinCardInput = {
  title: string;
  tag: string;
  banner: string;
  steps: StepInput[];
  alerts: AlertInput[];
};

export type RulesValue = { sub: string; items: RuleInput[] };
export type AmenitiesValue = { sub: string; items: AmenityInput[] };
export type PlacesValue = { sub: string; items: PlaceInput[] };
export type HomeValue = { sub: string; slides: SlideInput[]; accordions: AccordionInput[] };
export type CheckinValue = { sub: string; cards: CheckinCardInput[] };
export type CheckoutValue = { sub: string; steps: StepInput[] };

export const AMENITY_PLACEHOLDER_IMG = "/media/predio.webp";

export const emptyStep = (): StepInput => ({ n: "1", body: "" });
export const emptyAlert = (): AlertInput => ({ icon: "📍", body: "" });
export const emptyRule = (): RuleInput => ({ icon: "📌", title: "", text: "", hot: false });
export const emptyAmenity = (): AmenityInput => ({
  img: AMENITY_PLACEHOLDER_IMG,
  title: "",
  text: "",
  wide: false,
});
export const emptyPlace = (): PlaceInput => ({
  img: "",
  title: "",
  text: "",
  meta: "",
  site: "",
  maps: "",
});
export const emptySlide = (): SlideInput => ({
  img: AMENITY_PLACEHOLDER_IMG,
  title: "",
  text: "",
});
export const emptyAccordion = (): AccordionInput => ({ icon: "🔧", title: "", steps: [] });
export const emptyCard = (): CheckinCardInput => ({
  title: "",
  tag: "",
  banner: "",
  steps: [],
  alerts: [],
});

const stepsToContent = (steps: StepInput[]): Step[] =>
  steps.filter((s) => s.body.trim()).map((s) => ({ n: s.n || "1", body: t(s.body.trim()) }));
const stepsFromContent = (steps: Step[]): StepInput[] =>
  steps.map((s) => ({ n: s.n, body: s.body.pt }));

export function rulesToContent(v: RulesValue): Apartment["rules"] {
  return {
    sub: t(v.sub),
    items: v.items
      .filter((r) => r.title.trim())
      .map((r) => ({
        icon: r.icon.trim() || "📌",
        title: t(r.title.trim()),
        text: t(r.text.trim()),
        ...(r.hot ? { hot: true } : {}),
      })),
  };
}
export function rulesFromContent(c: Apartment["rules"]): RulesValue {
  return {
    sub: c.sub.pt,
    items: c.items.map((r) => ({ icon: r.icon, title: r.title.pt, text: r.text.pt, hot: !!r.hot })),
  };
}

export function amenitiesToContent(v: AmenitiesValue): Apartment["amenities"] {
  return {
    sub: t(v.sub),
    items: v.items
      .filter((a) => a.title.trim())
      .map((a) => ({
        img: a.img || AMENITY_PLACEHOLDER_IMG,
        title: t(a.title.trim()),
        text: t(a.text.trim()),
        wide: a.wide,
      })),
  };
}
export function amenitiesFromContent(c: Apartment["amenities"]): AmenitiesValue {
  return {
    sub: c.sub.pt,
    items: c.items.map((a) => ({ img: a.img, title: a.title.pt, text: a.text.pt, wide: !!a.wide })),
  };
}

export function placesToContent(v: PlacesValue): { sub: L; items: Apartment["tourism"]["items"] } {
  return {
    sub: t(v.sub),
    items: v.items
      .filter((p) => p.title.trim())
      .map((p) => ({
        ...(p.img.trim() ? { img: p.img.trim() } : {}),
        title: p.title.trim(),
        text: t(p.text.trim()),
        meta: p.meta.trim(),
        ...(p.site.trim() ? { site: p.site.trim() } : {}),
        ...(p.maps.trim() ? { maps: p.maps.trim() } : {}),
      })),
  };
}
export function placesFromContent(c: {
  sub: L;
  items: Apartment["tourism"]["items"];
}): PlacesValue {
  return {
    sub: c.sub.pt,
    items: c.items.map((p) => ({
      img: p.img ?? "",
      title: p.title,
      text: p.text.pt,
      meta: p.meta,
      site: p.site ?? "",
      maps: p.maps ?? "",
    })),
  };
}

export function homeToContent(v: HomeValue): Apartment["home"] {
  return {
    sub: t(v.sub),
    slides: v.slides
      .filter((s) => s.title.trim())
      .map((s) => ({
        img: s.img || AMENITY_PLACEHOLDER_IMG,
        title: t(s.title.trim()),
        text: t(s.text.trim()),
      })),
    accordions: v.accordions
      .filter((a) => a.title.trim())
      .map((a) => ({
        icon: a.icon.trim() || "🔧",
        title: t(a.title.trim()),
        steps: stepsToContent(a.steps),
        ...(a.diagram ? { diagram: a.diagram } : {}),
      })),
  };
}
export function homeFromContent(c: Apartment["home"]): HomeValue {
  return {
    sub: c.sub.pt,
    slides: c.slides.map((s) => ({ img: s.img, title: s.title.pt, text: s.text.pt })),
    accordions: c.accordions.map((a) => ({
      icon: a.icon,
      title: a.title.pt,
      steps: stepsFromContent(a.steps),
      diagram: a.diagram,
    })),
  };
}

/**
 * Não inclui `doorCode` — quem chama sempre define isso à parte (a senha
 * fixa/por hóspede é um campo próprio do formulário, não desta seção).
 */
export function checkinToContent(v: CheckinValue): { sub: L; cards: Apartment["checkin"]["cards"] } {
  return {
    sub: t(v.sub),
    cards: v.cards
      .filter((c) => c.title.trim())
      .map((c) => ({
        title: t(c.title.trim()),
        ...(c.tag.trim() ? { tag: t(c.tag.trim()) } : {}),
        ...(c.banner.trim() ? { banner: c.banner.trim() } : {}),
        steps: stepsToContent(c.steps),
        ...(c.alerts.length
          ? {
              alerts: c.alerts
                .filter((a) => a.body.trim())
                .map((a) => ({ icon: a.icon.trim() || "📍", body: t(a.body.trim()) })),
            }
          : {}),
      })),
  };
}
export function checkinFromContent(c: Apartment["checkin"]): CheckinValue {
  return {
    sub: c.sub.pt,
    cards: c.cards.map((card) => ({
      title: card.title.pt,
      tag: card.tag?.pt ?? "",
      banner: card.banner ?? "",
      steps: stepsFromContent(card.steps),
      alerts: (card.alerts ?? []).map((a) => ({ icon: a.icon, body: a.body.pt })),
    })),
  };
}

export function checkoutToContent(v: CheckoutValue): NonNullable<Apartment["checkout"]> {
  return { sub: t(v.sub), steps: stepsToContent(v.steps) };
}
export function checkoutFromContent(c: NonNullable<Apartment["checkout"]>): CheckoutValue {
  return { sub: c.sub.pt, steps: stepsFromContent(c.steps) };
}
