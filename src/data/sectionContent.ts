import type { Accordion, Alert, Amenity, Apartment, CheckinCard, L, Place, Rule, Slide, Step } from "@/data/types";
import {
  accordionId,
  amenityId,
  cardId,
  newId,
  placeId,
  ruleId,
  slideId,
  stepId,
  uniqueIds,
} from "@/data/itemMerge";

const t = (s: string): L => ({ pt: s, en: s });

/**
 * Formas de formulário (texto simples, um idioma só) pras seções que viram
 * editáveis tanto no prédio quanto no apartamento — e as conversões de/para
 * o formato real do guia (`Apartment`/`Building`, bilíngue). `diagram` e
 * `img` de itens já existentes são preservados como valor oculto (sem campo
 * de edição) pra nunca se perder ao salvar uma seção que não mexeu neles.
 *
 * Cada item de lista carrega um `id` que não muda quando o texto muda: é ele
 * que liga o item do apartamento ao do modelo (ver `itemMerge.ts`).
 */

export type StepInput = { id?: string; n: string; body: string };
export type AlertInput = { icon: string; body: string };
export type RuleInput = { id?: string; icon: string; title: string; text: string; hot: boolean };
export type AmenityInput = { id?: string; img: string; title: string; text: string; wide: boolean };
export type PlaceInput = {
  id?: string;
  img: string;
  title: string;
  text: string;
  meta: string;
  site: string;
  maps: string;
};
export type SlideInput = { id?: string; img: string; title: string; text: string };
export type AccordionInput = {
  id?: string;
  icon: string;
  title: string;
  steps: StepInput[];
  /** Foto ou vídeo do equipamento. */
  media?: string;
  diagram?: Accordion["diagram"];
};
export type CheckinCardInput = {
  id?: string;
  title: string;
  tag: string;
  banner: string;
  steps: StepInput[];
  alerts: AlertInput[];
  /** Legenda do botão sempre em texto simples — vira PT/EN iguais ao salvar (mesma regra dos outros campos desta seção). */
  video?: { src: string; label: string };
};

export type RulesValue = { sub: string; items: RuleInput[] };
export type AmenitiesValue = { sub: string; items: AmenityInput[] };
export type PlacesValue = { sub: string; items: PlaceInput[] };
export type HomeValue = {
  sub: string;
  slides: SlideInput[];
  accordions: AccordionInput[];
  /** Tour em vídeo (URL do arquivo enviado) — vem antes dos destaques em A Casa. */
  video?: string;
};
export type CheckinValue = { sub: string; cards: CheckinCardInput[] };
export type CheckoutValue = { sub: string; steps: StepInput[] };

export const AMENITY_PLACEHOLDER_IMG = "/media/predio.webp";

export const emptyStep = (): StepInput => ({ n: "1", body: "" });
export const emptyAlert = (): AlertInput => ({ icon: "📍", body: "" });
export const emptyRule = (): RuleInput => ({ id: newId(), icon: "📌", title: "", text: "", hot: false });
export const emptyAmenity = (): AmenityInput => ({
  id: newId(),
  img: AMENITY_PLACEHOLDER_IMG,
  title: "",
  text: "",
  wide: false,
});
export const emptyPlace = (): PlaceInput => ({
  id: newId(),
  img: "",
  title: "",
  text: "",
  meta: "",
  site: "",
  maps: "",
});
export const emptySlide = (): SlideInput => ({
  id: newId(),
  img: AMENITY_PLACEHOLDER_IMG,
  title: "",
  text: "",
});
export const emptyAccordion = (): AccordionInput => ({
  id: newId(),
  icon: "🔧",
  title: "",
  steps: [],
});
export const emptyCard = (): CheckinCardInput => ({
  id: newId(),
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

const withId = (id: string | undefined): { id?: string } => (id ? { id } : {});

/* ------------------------------ Regras ------------------------------ */

export function ruleToContent(r: RuleInput): Rule | null {
  if (!r.title.trim()) return null;
  return {
    ...withId(r.id),
    icon: r.icon.trim() || "📌",
    title: t(r.title.trim()),
    text: t(r.text.trim()),
    ...(r.hot ? { hot: true } : {}),
  };
}
export function ruleFromContent(r: Rule, id?: string): RuleInput {
  return { id: id ?? ruleId(r), icon: r.icon, title: r.title.pt, text: r.text.pt, hot: !!r.hot };
}
export function rulesToContent(v: RulesValue): Apartment["rules"] {
  return {
    sub: t(v.sub),
    items: v.items.map(ruleToContent).filter((r): r is Rule => r !== null),
  };
}
export function rulesFromContent(c: Apartment["rules"]): RulesValue {
  const ids = uniqueIds(c.items, ruleId);
  return { sub: c.sub.pt, items: c.items.map((r, i) => ruleFromContent(r, ids[i])) };
}

/* ------------------------------ Lazer ------------------------------- */

export function amenityToContent(a: AmenityInput): Amenity | null {
  if (!a.title.trim()) return null;
  return {
    ...withId(a.id),
    img: a.img || AMENITY_PLACEHOLDER_IMG,
    title: t(a.title.trim()),
    text: t(a.text.trim()),
    wide: a.wide,
  };
}
export function amenityFromContent(a: Amenity, id?: string): AmenityInput {
  return { id: id ?? amenityId(a), img: a.img, title: a.title.pt, text: a.text.pt, wide: !!a.wide };
}
export function amenitiesToContent(v: AmenitiesValue): Apartment["amenities"] {
  return {
    sub: t(v.sub),
    items: v.items.map(amenityToContent).filter((a): a is Amenity => a !== null),
  };
}
export function amenitiesFromContent(c: Apartment["amenities"]): AmenitiesValue {
  const ids = uniqueIds(c.items, amenityId);
  return { sub: c.sub.pt, items: c.items.map((a, i) => amenityFromContent(a, ids[i])) };
}

/* ------------------------- Brasília / Onde comer -------------------- */

export function placeToContent(p: PlaceInput): Place | null {
  if (!p.title.trim()) return null;
  return {
    ...withId(p.id),
    ...(p.img.trim() ? { img: p.img.trim() } : {}),
    title: p.title.trim(),
    text: t(p.text.trim()),
    meta: p.meta.trim(),
    ...(p.site.trim() ? { site: p.site.trim() } : {}),
    ...(p.maps.trim() ? { maps: p.maps.trim() } : {}),
  };
}
export function placeFromContent(p: Place, id?: string): PlaceInput {
  return {
    id: id ?? placeId(p),
    img: p.img ?? "",
    title: p.title,
    text: p.text.pt,
    meta: p.meta,
    site: p.site ?? "",
    maps: p.maps ?? "",
  };
}
export function placesToContent(v: PlacesValue): { sub: L; items: Apartment["tourism"]["items"] } {
  return {
    sub: t(v.sub),
    items: v.items.map(placeToContent).filter((p): p is Place => p !== null),
  };
}
export function placesFromContent(c: {
  sub: L;
  items: Apartment["tourism"]["items"];
}): PlacesValue {
  const ids = uniqueIds(c.items, placeId);
  return { sub: c.sub.pt, items: c.items.map((p, i) => placeFromContent(p, ids[i])) };
}

/* ------------------------------ A Casa ------------------------------ */

export function slideToContent(s: SlideInput): Slide | null {
  if (!s.title.trim()) return null;
  return {
    ...withId(s.id),
    img: s.img || AMENITY_PLACEHOLDER_IMG,
    title: t(s.title.trim()),
    text: t(s.text.trim()),
  };
}
export function slideFromContent(s: Slide, id?: string): SlideInput {
  return { id: id ?? slideId(s), img: s.img, title: s.title.pt, text: s.text.pt };
}

export function accordionToContent(a: AccordionInput): Accordion | null {
  if (!a.title.trim()) return null;
  return {
    ...withId(a.id),
    icon: a.icon.trim() || "🔧",
    title: t(a.title.trim()),
    steps: stepsToContent(a.steps),
    ...(a.media?.trim() ? { media: a.media.trim() } : {}),
    // Item da legenda sem texto (recém-adicionado e não preenchido) não vai pro guia.
    ...(a.diagram
      ? {
          diagram: {
            ...a.diagram,
            legend: a.diagram.legend.filter((it) => it.label.pt.trim()),
          },
        }
      : {}),
  };
}
export function accordionFromContent(a: Accordion, id?: string): AccordionInput {
  return {
    id: id ?? accordionId(a),
    icon: a.icon,
    title: a.title.pt,
    steps: stepsFromContent(a.steps),
    media: a.media ?? "",
    diagram: a.diagram,
  };
}

export function homeToContent(v: HomeValue): Apartment["home"] {
  return {
    sub: t(v.sub),
    ...(v.video?.trim() ? { video: v.video.trim() } : {}),
    slides: v.slides.map(slideToContent).filter((s): s is Slide => s !== null),
    accordions: v.accordions.map(accordionToContent).filter((a): a is Accordion => a !== null),
  };
}
export function homeFromContent(c: Apartment["home"]): HomeValue {
  const slideIds = uniqueIds(c.slides, slideId);
  const accIds = uniqueIds(c.accordions, accordionId);
  return {
    sub: c.sub.pt,
    video: c.video ?? "",
    slides: c.slides.map((s, i) => slideFromContent(s, slideIds[i])),
    accordions: c.accordions.map((a, i) => accordionFromContent(a, accIds[i])),
  };
}

/* ----------------------- Check-in / Check-out ----------------------- */

export function cardToContent(c: CheckinCardInput): CheckinCard | null {
  if (!c.title.trim()) return null;
  return {
    ...withId(c.id),
    title: t(c.title.trim()),
    ...(c.tag.trim() ? { tag: t(c.tag.trim()) } : {}),
    ...(c.banner.trim() ? { banner: c.banner.trim() } : {}),
    steps: stepsToContent(c.steps),
    ...(c.alerts.length
      ? {
          alerts: c.alerts
            .filter((a) => a.body.trim())
            .map((a): Alert => ({ icon: a.icon.trim() || "📍", body: t(a.body.trim()) })),
        }
      : {}),
    ...(c.video?.src.trim()
      ? { video: { src: c.video.src.trim(), label: t(c.video.label.trim() || "▶ Vídeo") } }
      : {}),
  };
}
export function cardFromContent(card: CheckinCard, id?: string): CheckinCardInput {
  return {
    id: id ?? cardId(card),
    title: card.title.pt,
    tag: card.tag?.pt ?? "",
    banner: card.banner ?? "",
    steps: stepsFromContent(card.steps),
    alerts: (card.alerts ?? []).map((a) => ({ icon: a.icon, body: a.body.pt })),
    video: card.video ? { src: card.video.src, label: card.video.label.pt } : undefined,
  };
}

/**
 * Não inclui `doorCode` — quem chama sempre define isso à parte (a senha
 * fixa/por hóspede é um campo próprio do formulário, não desta seção).
 */
export function checkinToContent(v: CheckinValue): { sub: L; cards: Apartment["checkin"]["cards"] } {
  return {
    sub: t(v.sub),
    cards: v.cards.map(cardToContent).filter((c): c is CheckinCard => c !== null),
  };
}
export function checkinFromContent(c: Apartment["checkin"]): CheckinValue {
  const ids = uniqueIds(c.cards, cardId);
  return { sub: c.sub.pt, cards: c.cards.map((card, i) => cardFromContent(card, ids[i])) };
}

export function stepToContent(s: StepInput): Step | null {
  if (!s.body.trim()) return null;
  return { ...withId(s.id), n: s.n || "1", body: t(s.body.trim()) };
}
export function checkoutToContent(v: CheckoutValue): NonNullable<Apartment["checkout"]> {
  return {
    sub: t(v.sub),
    steps: v.steps.map(stepToContent).filter((s): s is Step => s !== null),
  };
}
export function checkoutFromContent(c: NonNullable<Apartment["checkout"]>): CheckoutValue {
  const ids = uniqueIds(c.steps, stepId);
  return {
    sub: c.sub.pt,
    steps: c.steps.map((s, i) => ({ id: ids[i], n: s.n, body: s.body.pt })),
  };
}
