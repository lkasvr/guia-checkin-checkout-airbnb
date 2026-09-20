import type {
  Apartment,
  ApartmentVars,
  Accordion,
  Amenity,
  CheckinCard,
  ItemPatch,
  ItemPatches,
  Place,
  Rule,
  Slide,
  Step,
} from "@/data/types";
import type { ApartmentOverrides, BuildingTemplate } from "@/data/buildingModel";
import { filledCheckin, filledCheckout, deriveVars } from "@/data/checkinTemplate";
import {
  accordionId,
  amenityId,
  cardId,
  deepEqual,
  diffItems,
  mergeItems,
  newId,
  placeId,
  ruleId,
  slideId,
  stepId,
  uniqueIds,
} from "@/data/itemMerge";
import {
  accordionFromContent,
  accordionToContent,
  amenityFromContent,
  amenityToContent,
  cardFromContent,
  cardToContent,
  checkinFromContent,
  checkoutFromContent,
  homeFromContent,
  placeFromContent,
  placeToContent,
  placesFromContent,
  amenitiesFromContent,
  rulesFromContent,
  ruleFromContent,
  ruleToContent,
  slideFromContent,
  slideToContent,
  stepToContent,
  type AmenitiesValue,
  type CheckinValue,
  type CheckoutValue,
  type HomeValue,
  type PlacesValue,
  type RulesValue,
  type StepInput,
} from "@/data/sectionContent";

/** O que o formulário do apartamento entrega pra virar ajustes sobre o modelo. */
export type PatchSource = {
  overrides: ApartmentOverrides;
  overrideRules?: RulesValue;
  overrideHome?: HomeValue;
  overrideAmenities?: AmenitiesValue;
  overrideTourism?: PlacesValue;
  overrideDining?: PlacesValue;
  checkinOverride?: CheckinValue;
  checkoutOverride?: CheckoutValue;
};

const stepFromContent = (s: Step, id?: string): StepInput => ({ id: id ?? stepId(s), n: s.n, body: s.body.pt });

/* ------------------------------------------------------------------ */
/* Guia: modelo + ajustes                                              */
/* ------------------------------------------------------------------ */

/**
 * Seções do guia de um apartamento ligado a um prédio: a lista do modelo (ao
 * vivo) com os ajustes deste apartamento por cima. Regras somam as próprias do
 * apartamento (as que o formulário gera) depois das do prédio.
 */
export function overlayWithPatches(
  content: Apartment,
  building: BuildingTemplate,
  patches: ItemPatches,
): Apartment {
  const vars = deriveVars(content);
  const ci = filledCheckin(building, vars);
  const co = filledCheckout(building, vars);
  return {
    ...content,
    rules: {
      sub: building.rules.sub,
      items: [...mergeItems(building.rules.items, patches.rules, ruleId), ...content.rules.items],
    },
    home: {
      ...building.home,
      slides: mergeItems(building.home.slides, patches.slides, slideId),
      accordions: mergeItems(building.home.accordions, patches.accordions, accordionId),
    },
    amenities: {
      sub: building.amenities.sub,
      items: mergeItems(building.amenities.items, patches.amenities, amenityId),
    },
    tourism: {
      sub: building.tourism.sub,
      items: mergeItems(building.tourism.items, patches.tourism, placeId),
    },
    dining: {
      sub: building.dining.sub,
      items: mergeItems(building.dining.items, patches.dining, placeId),
    },
    checkin: {
      sub: ci.sub,
      cards: mergeItems(ci.cards, patches.checkin, cardId),
      ...(content.checkin.doorCode ? { doorCode: content.checkin.doorCode } : {}),
    },
    checkout: { sub: co.sub, steps: mergeItems(co.steps, patches.checkout, stepId) },
  };
}

/* ------------------------------------------------------------------ */
/* Formulário: valores dos editores e o caminho de volta               */
/* ------------------------------------------------------------------ */

/** Valores (formato de formulário) que cada editor mostra: o modelo já com os ajustes aplicados. */
export function editorValues(
  building: BuildingTemplate,
  patches: ItemPatches | undefined,
  vars: ApartmentVars,
) {
  const p = patches ?? {};
  const ci = filledCheckin(building, vars);
  const co = filledCheckout(building, vars);
  return {
    rules: rulesFromContent({
      sub: building.rules.sub,
      items: mergeItems(building.rules.items, p.rules, ruleId),
    }),
    home: homeFromContent({
      ...building.home,
      slides: mergeItems(building.home.slides, p.slides, slideId),
      accordions: mergeItems(building.home.accordions, p.accordions, accordionId),
    }),
    amenities: amenitiesFromContent({
      sub: building.amenities.sub,
      items: mergeItems(building.amenities.items, p.amenities, amenityId),
    }),
    tourism: placesFromContent({
      sub: building.tourism.sub,
      items: mergeItems(building.tourism.items, p.tourism, placeId),
    }),
    dining: placesFromContent({
      sub: building.dining.sub,
      items: mergeItems(building.dining.items, p.dining, placeId),
    }),
    checkin: checkinFromContent({
      sub: ci.sub,
      cards: mergeItems(ci.cards, p.checkin, cardId),
    }),
    checkout: checkoutFromContent({
      sub: co.sub,
      steps: mergeItems(co.steps, p.checkout, stepId),
    }),
  };
}

const compact = (p: ItemPatches): ItemPatches =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)) as ItemPatches;

/**
 * Compara o que a pessoa deixou em cada editor com o modelo e guarda só o que
 * mudou. Editor que não foi aberto (ou que voltou a "herdar do prédio") não
 * gera ajuste nenhum: o item segue o modelo.
 */
export function buildItemPatches(
  src: PatchSource,
  building: BuildingTemplate,
  vars: ApartmentVars,
): ItemPatches {
  const o = src.overrides;
  const patches: ItemPatches = {};

  if (o.rules && src.overrideRules) {
    patches.rules = diffItems(
      rulesFromContent(building.rules).items,
      src.overrideRules.items,
      ruleToContent,
    );
  }
  if (o.home && src.overrideHome) {
    const m = homeFromContent(building.home);
    patches.slides = diffItems(m.slides, src.overrideHome.slides, slideToContent);
    patches.accordions = diffItems(m.accordions, src.overrideHome.accordions, accordionToContent);
  }
  if (o.amenities && src.overrideAmenities) {
    patches.amenities = diffItems(
      amenitiesFromContent(building.amenities).items,
      src.overrideAmenities.items,
      amenityToContent,
    );
  }
  if (o.tourism && src.overrideTourism) {
    patches.tourism = diffItems(
      placesFromContent(building.tourism).items,
      src.overrideTourism.items,
      placeToContent,
    );
  }
  if (o.dining && src.overrideDining) {
    patches.dining = diffItems(
      placesFromContent(building.dining).items,
      src.overrideDining.items,
      placeToContent,
    );
  }
  if (src.checkinOverride) {
    patches.checkin = diffItems(
      checkinFromContent(filledCheckin(building, vars)).cards,
      src.checkinOverride.cards,
      cardToContent,
    );
  }
  if (src.checkoutOverride) {
    patches.checkout = diffItems(
      checkoutFromContent(filledCheckout(building, vars)).steps,
      src.checkoutOverride.steps,
      stepToContent,
    );
  }
  return compact(patches);
}

/* ------------------------------------------------------------------ */
/* Conteúdo antigo → ajustes                                           */
/* ------------------------------------------------------------------ */

/**
 * Liga cada item do apartamento ao do modelo (pelo id; em conteúdo antigo, o
 * título): igual ao modelo = segue o modelo; diferente = ajuste "editado";
 * sem par = só deste apartamento.
 *
 * Item do modelo que o apartamento não tem: se a lista era dele por inteiro
 * (`markRemoved`), foi ele quem tirou — vira "removido". Nas cópias de
 * check-in/check-out não dá pra saber (o modelo pode ter ganhado o item depois),
 * então o item continua aparecendo.
 */
function matchPatch<T extends { id?: string }, In extends { id?: string }>(
  model: T[],
  own: T[],
  getId: (item: T) => string,
  fromContent: (item: T, id?: string) => In,
  markRemoved = false,
): { edited?: Record<string, T>; removed?: string[]; unmatched: T[] } {
  const modelIds = uniqueIds(model, getId);
  const byId = new Map(model.map((m, i) => [modelIds[i], m]));
  const ownIds = uniqueIds(own, getId);
  const seen = new Set<string>();
  const edited: Record<string, T> = {};
  const unmatched: T[] = [];
  own.forEach((item, i) => {
    const id = ownIds[i];
    const m = byId.get(id);
    if (m && !seen.has(id)) {
      seen.add(id);
      if (!deepEqual(fromContent(m, id), fromContent(item, id))) edited[id] = { ...item, id };
    } else {
      unmatched.push(item);
    }
  });
  const removed = markRemoved ? modelIds.filter((id) => !seen.has(id)) : [];
  return {
    edited: Object.keys(edited).length ? edited : undefined,
    removed: removed.length ? removed : undefined,
    unmatched,
  };
}

function toPatch<T extends { id?: string }>(
  m: { edited?: Record<string, T>; removed?: string[]; unmatched: T[] },
  addUnmatched: boolean,
): ItemPatch<T> | undefined {
  const added = addUnmatched
    ? m.unmatched.map((i) => (i.id ? i : { ...i, id: newId() }))
    : undefined;
  if (!m.edited && !m.removed && !added?.length) return undefined;
  return {
    ...(m.edited ? { edited: m.edited } : {}),
    ...(m.removed ? { removed: m.removed } : {}),
    ...(added?.length ? { added } : {}),
  };
}

/**
 * Converte um apartamento do modelo antigo (conteúdo copiado / seção inteira
 * personalizada) pro modelo de ajustes por item, sem mudar nada do que o
 * hóspede vê hoje. `wasLinked = false` (sem prédio ligado): todo o conteúdo do
 * apartamento é dele, então tudo é comparado com o modelo.
 */
export function legacyToPatches(
  content: Apartment,
  building: BuildingTemplate,
  legacy: ApartmentOverrides,
  wasLinked: boolean,
): { patches: ItemPatches; ownRules: Rule[]; vars: ApartmentVars } {
  const vars = deriveVars(content);
  const isOwn = (k: "rules" | "home" | "amenities" | "tourism" | "dining") =>
    !wasLinked || !!legacy[k];
  const patches: ItemPatches = {};
  let ownRules = content.rules.items;

  if (isOwn("rules")) {
    const m = matchPatch<Rule, ReturnType<typeof ruleFromContent>>(
      building.rules.items,
      content.rules.items,
      ruleId,
      ruleFromContent,
      true,
    );
    patches.rules = toPatch(m, false);
    ownRules = m.unmatched;
  }
  if (isOwn("home")) {
    patches.slides = toPatch(
      matchPatch<Slide, ReturnType<typeof slideFromContent>>(
        building.home.slides,
        content.home.slides,
        slideId,
        slideFromContent,
        true,
      ),
      true,
    );
    patches.accordions = toPatch(
      matchPatch<Accordion, ReturnType<typeof accordionFromContent>>(
        building.home.accordions,
        content.home.accordions,
        accordionId,
        accordionFromContent,
        true,
      ),
      true,
    );
  }
  if (isOwn("amenities")) {
    patches.amenities = toPatch(
      matchPatch<Amenity, ReturnType<typeof amenityFromContent>>(
        building.amenities.items,
        content.amenities.items,
        amenityId,
        amenityFromContent,
        true,
      ),
      true,
    );
  }
  for (const key of ["tourism", "dining"] as const) {
    if (!isOwn(key)) continue;
    patches[key] = toPatch(
      matchPatch<Place, ReturnType<typeof placeFromContent>>(
        building[key].items,
        content[key].items,
        placeId,
        placeFromContent,
        true,
      ),
      true,
    );
  }
  // Check-in/check-out sempre foram cópias do modelo (nunca ao vivo).
  patches.checkin = toPatch(
    matchPatch<CheckinCard, ReturnType<typeof cardFromContent>>(
      filledCheckin(building, vars).cards,
      content.checkin.cards,
      cardId,
      cardFromContent,
    ),
    true,
  );
  patches.checkout = toPatch(
    matchPatch<Step, StepInput>(
      filledCheckout(building, vars).steps,
      content.checkout?.steps ?? [],
      stepId,
      stepFromContent,
    ),
    true,
  );

  return { patches: compact(patches), ownRules, vars };
}
