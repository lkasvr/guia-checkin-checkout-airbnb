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

/**
 * Formas de formulário pras seções que viram editáveis tanto no prédio quanto
 * no apartamento — e as conversões de/para o formato real do guia
 * (`Apartment`/`Building`, bilíngue/trilingue). `diagram` e `img` de itens já
 * existentes são preservados como valor oculto (sem campo de edição) pra
 * nunca se perder ao salvar uma seção que não mexeu neles.
 *
 * Todo campo de texto traduzível usa `LInput` (português + inglês/espanhol
 * opcionais, digitados à mão): sem inglês, cai no português; sem espanhol,
 * o guia tenta traduzir sozinho pelo dicionário (`@/data/es`) na hora de
 * exibir. Isso é diferente de deixar tudo em branco.
 *
 * Cada item de lista carrega um `id` que não muda quando o texto muda: é ele
 * que liga o item do apartamento ao do modelo (ver `itemMerge.ts`).
 */

export type LInput = { pt: string; en: string; es: string };
export const emptyL = (pt = ""): LInput => ({ pt, en: "", es: "" });
/** `LInput` → `L` real do guia: inglês vazio cai no português; espanhol vazio fica indefinido (deixa o dicionário decidir). */
export const toL = (v: LInput): L => {
  const pt = v.pt.trim();
  const en = v.en.trim();
  const es = v.es.trim();
  return { pt, en: en || pt, ...(es ? { es } : {}) };
};
/** `L` → `LInput`: mostra o inglês só se for diferente do português (senão pareceria "já traduzido" sem ser). */
export const fromL = (l: L): LInput => ({ pt: l.pt, en: l.en === l.pt ? "" : l.en, es: l.es ?? "" });

export type StepInput = { id?: string; n: string; body: LInput };
export type AlertInput = { icon: string; body: LInput };
export type RuleInput = { id?: string; icon: string; title: LInput; text: LInput; hot: boolean };
export type AmenityInput = { id?: string; img: string; title: LInput; text: LInput; wide: boolean };
export type PlaceInput = {
  id?: string;
  img: string;
  /** Nome próprio (ex.: "Catedral Metropolitana") — não é traduzido. */
  title: string;
  text: LInput;
  /** Categoria/etiqueta — não é traduzida. */
  meta: string;
  site: string;
  maps: string;
};
export type SlideInput = { id?: string; img: string; title: LInput; text: LInput };
export type AccordionInput = {
  id?: string;
  icon: string;
  title: LInput;
  steps: StepInput[];
  /** Foto ou vídeo do equipamento. */
  media?: string;
  diagram?: Accordion["diagram"];
};
export type CheckinCardInput = {
  id?: string;
  title: LInput;
  tag: LInput;
  banner: string;
  steps: StepInput[];
  alerts: AlertInput[];
  video?: { src: string; label: LInput };
};

export type RulesValue = { sub: LInput; items: RuleInput[] };
export type AmenitiesValue = { sub: LInput; items: AmenityInput[] };
export type PlacesValue = { sub: LInput; items: PlaceInput[] };
export type HomeValue = {
  sub: LInput;
  slides: SlideInput[];
  accordions: AccordionInput[];
  /** Tour em vídeo (URL do arquivo enviado) — vem antes dos destaques em A Casa. */
  video?: string;
};
export type CheckinValue = { sub: LInput; cards: CheckinCardInput[] };
export type CheckoutValue = { sub: LInput; steps: StepInput[] };

export const AMENITY_PLACEHOLDER_IMG = "/media/predio.webp";

export const emptyStep = (): StepInput => ({ n: "1", body: emptyL() });
export const emptyAlert = (): AlertInput => ({ icon: "📍", body: emptyL() });
export const emptyRule = (): RuleInput => ({ id: newId(), icon: "📌", title: emptyL(), text: emptyL(), hot: false });
export const emptyAmenity = (): AmenityInput => ({
  id: newId(),
  img: AMENITY_PLACEHOLDER_IMG,
  title: emptyL(),
  text: emptyL(),
  wide: false,
});
export const emptyPlace = (): PlaceInput => ({
  id: newId(),
  img: "",
  title: "",
  text: emptyL(),
  meta: "",
  site: "",
  maps: "",
});
export const emptySlide = (): SlideInput => ({
  id: newId(),
  img: AMENITY_PLACEHOLDER_IMG,
  title: emptyL(),
  text: emptyL(),
});
/** Foto do equipamento com itens numerados (ex.: partes da cafeteira), pronta pra preencher. */
export const emptyDiagram = (): NonNullable<Accordion["diagram"]> => ({
  img: "",
  alt: "",
  legend: [{ n: "1", label: { pt: "", en: "" } }],
});
/** Todo equipamento novo já vem com passo enumerado e foto com itens numerados (dá pra remover). */
export const emptyAccordion = (): AccordionInput => ({
  id: newId(),
  icon: "🔧",
  title: emptyL(),
  steps: [{ n: "1", body: emptyL() }],
  diagram: emptyDiagram(),
});
export const emptyCard = (): CheckinCardInput => ({
  id: newId(),
  title: emptyL(),
  tag: emptyL(),
  banner: "",
  steps: [],
  alerts: [],
});

const stepsToContent = (steps: StepInput[]): Step[] =>
  steps.filter((s) => s.body.pt.trim()).map((s) => ({ n: s.n || "1", body: toL(s.body) }));
const stepsFromContent = (steps: Step[]): StepInput[] =>
  steps.map((s) => ({ n: s.n, body: fromL(s.body) }));

const withId = (id: string | undefined): { id?: string } => (id ? { id } : {});

/* ------------------------------ Regras ------------------------------ */

export function ruleToContent(r: RuleInput): Rule | null {
  if (!r.title.pt.trim()) return null;
  return {
    ...withId(r.id),
    icon: r.icon.trim() || "📌",
    title: toL(r.title),
    text: toL(r.text),
    ...(r.hot ? { hot: true } : {}),
  };
}
export function ruleFromContent(r: Rule, id?: string): RuleInput {
  return { id: id ?? ruleId(r), icon: r.icon, title: fromL(r.title), text: fromL(r.text), hot: !!r.hot };
}
export function rulesToContent(v: RulesValue): Apartment["rules"] {
  return {
    sub: toL(v.sub),
    items: v.items.map(ruleToContent).filter((r): r is Rule => r !== null),
  };
}
export function rulesFromContent(c: Apartment["rules"]): RulesValue {
  const ids = uniqueIds(c.items, ruleId);
  return { sub: fromL(c.sub), items: c.items.map((r, i) => ruleFromContent(r, ids[i])) };
}

/* ------------------------------ Lazer ------------------------------- */

export function amenityToContent(a: AmenityInput): Amenity | null {
  if (!a.title.pt.trim()) return null;
  return {
    ...withId(a.id),
    img: a.img || AMENITY_PLACEHOLDER_IMG,
    title: toL(a.title),
    text: toL(a.text),
    wide: a.wide,
  };
}
export function amenityFromContent(a: Amenity, id?: string): AmenityInput {
  return { id: id ?? amenityId(a), img: a.img, title: fromL(a.title), text: fromL(a.text), wide: !!a.wide };
}
export function amenitiesToContent(v: AmenitiesValue): Apartment["amenities"] {
  return {
    sub: toL(v.sub),
    items: v.items.map(amenityToContent).filter((a): a is Amenity => a !== null),
  };
}
export function amenitiesFromContent(c: Apartment["amenities"]): AmenitiesValue {
  const ids = uniqueIds(c.items, amenityId);
  return { sub: fromL(c.sub), items: c.items.map((a, i) => amenityFromContent(a, ids[i])) };
}

/* ------------------------- Brasília / Onde comer -------------------- */

export function placeToContent(p: PlaceInput): Place | null {
  if (!p.title.trim()) return null;
  return {
    ...withId(p.id),
    ...(p.img.trim() ? { img: p.img.trim() } : {}),
    title: p.title.trim(),
    text: toL(p.text),
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
    text: fromL(p.text),
    meta: p.meta,
    site: p.site ?? "",
    maps: p.maps ?? "",
  };
}
export function placesToContent(v: PlacesValue): { sub: L; items: Apartment["tourism"]["items"] } {
  return {
    sub: toL(v.sub),
    items: v.items.map(placeToContent).filter((p): p is Place => p !== null),
  };
}
export function placesFromContent(c: {
  sub: L;
  items: Apartment["tourism"]["items"];
}): PlacesValue {
  const ids = uniqueIds(c.items, placeId);
  return { sub: fromL(c.sub), items: c.items.map((p, i) => placeFromContent(p, ids[i])) };
}

/* ------------------------------ A Casa ------------------------------ */

export function slideToContent(s: SlideInput): Slide | null {
  if (!s.title.pt.trim()) return null;
  return {
    ...withId(s.id),
    img: s.img || AMENITY_PLACEHOLDER_IMG,
    title: toL(s.title),
    text: toL(s.text),
  };
}
export function slideFromContent(s: Slide, id?: string): SlideInput {
  return { id: id ?? slideId(s), img: s.img, title: fromL(s.title), text: fromL(s.text) };
}

export function accordionToContent(a: AccordionInput): Accordion | null {
  if (!a.title.pt.trim()) return null;
  return {
    ...withId(a.id),
    icon: a.icon.trim() || "🔧",
    title: toL(a.title),
    steps: stepsToContent(a.steps),
    ...(a.media?.trim() ? { media: a.media.trim() } : {}),
    // Item da legenda sem texto (recém-adicionado e não preenchido) não vai pro guia.
    // Sem foto o diagrama não existe (é o caso de um equipamento novo em que a pessoa não usou).
    ...(a.diagram?.img.trim()
      ? {
          diagram: {
            ...a.diagram,
            alt: a.diagram.alt.trim() || a.title.pt.trim(),
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
    title: fromL(a.title),
    steps: stepsFromContent(a.steps),
    media: a.media ?? "",
    diagram: a.diagram,
  };
}

export function homeToContent(v: HomeValue): Apartment["home"] {
  return {
    sub: toL(v.sub),
    ...(v.video?.trim() ? { video: v.video.trim() } : {}),
    slides: v.slides.map(slideToContent).filter((s): s is Slide => s !== null),
    accordions: v.accordions.map(accordionToContent).filter((a): a is Accordion => a !== null),
  };
}
export function homeFromContent(c: Apartment["home"]): HomeValue {
  const slideIds = uniqueIds(c.slides, slideId);
  const accIds = uniqueIds(c.accordions, accordionId);
  return {
    sub: fromL(c.sub),
    video: c.video ?? "",
    slides: c.slides.map((s, i) => slideFromContent(s, slideIds[i])),
    accordions: c.accordions.map((a, i) => accordionFromContent(a, accIds[i])),
  };
}

/* ----------------------- Check-in / Check-out ----------------------- */

export function cardToContent(c: CheckinCardInput): CheckinCard | null {
  if (!c.title.pt.trim()) return null;
  return {
    ...withId(c.id),
    title: toL(c.title),
    ...(c.tag.pt.trim() ? { tag: toL(c.tag) } : {}),
    ...(c.banner.trim() ? { banner: c.banner.trim() } : {}),
    steps: stepsToContent(c.steps),
    ...(c.alerts.length
      ? {
          alerts: c.alerts
            .filter((a) => a.body.pt.trim())
            .map((a): Alert => ({ icon: a.icon.trim() || "📍", body: toL(a.body) })),
        }
      : {}),
    ...(c.video?.src.trim()
      ? { video: { src: c.video.src.trim(), label: toL(c.video.label.pt.trim() ? c.video.label : emptyL("▶ Vídeo")) } }
      : {}),
  };
}
export function cardFromContent(card: CheckinCard, id?: string): CheckinCardInput {
  return {
    id: id ?? cardId(card),
    title: fromL(card.title),
    tag: card.tag ? fromL(card.tag) : emptyL(),
    banner: card.banner ?? "",
    steps: stepsFromContent(card.steps),
    alerts: (card.alerts ?? []).map((a) => ({ icon: a.icon, body: fromL(a.body) })),
    video: card.video ? { src: card.video.src, label: fromL(card.video.label) } : undefined,
  };
}

/**
 * Não inclui `doorCode` — quem chama sempre define isso à parte (a senha
 * fixa/por hóspede é um campo próprio do formulário, não desta seção).
 */
export function checkinToContent(v: CheckinValue): { sub: L; cards: Apartment["checkin"]["cards"] } {
  return {
    sub: toL(v.sub),
    cards: v.cards.map(cardToContent).filter((c): c is CheckinCard => c !== null),
  };
}
export function checkinFromContent(c: Apartment["checkin"]): CheckinValue {
  const ids = uniqueIds(c.cards, cardId);
  return { sub: fromL(c.sub), cards: c.cards.map((card, i) => cardFromContent(card, ids[i])) };
}

export function stepToContent(s: StepInput): Step | null {
  if (!s.body.pt.trim()) return null;
  return { ...withId(s.id), n: s.n || "1", body: toL(s.body) };
}
export function checkoutToContent(v: CheckoutValue): NonNullable<Apartment["checkout"]> {
  return {
    sub: toL(v.sub),
    steps: v.steps.map(stepToContent).filter((s): s is Step => s !== null),
  };
}
export function checkoutFromContent(c: NonNullable<Apartment["checkout"]>): CheckoutValue {
  const ids = uniqueIds(c.steps, stepId);
  return {
    sub: fromL(c.sub),
    steps: c.steps.map((s, i) => ({ id: ids[i], n: s.n, body: fromL(s.body) })),
  };
}
