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
  sameContent,
  withOrder,
  diffItems,
  isEmptyPatch,
  mergeItems,
  newId,
  placeId,
  ruleId,
  slideId,
  stepId,
  uniqueIds,
} from "@/data/itemMerge";
import {
  accordionToContent,
  amenityToContent,
  cardToContent,
  checkinFromContent,
  checkoutFromContent,
  homeFromContent,
  placeToContent,
  placesFromContent,
  amenitiesFromContent,
  rulesFromContent,
  ruleToContent,
  slideToContent,
  stepToContent,
  type AmenitiesValue,
  type CheckinValue,
  type CheckoutValue,
  type HomeValue,
  type PlacesValue,
  type RulesValue,
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
  /** Ajustes já gravados neste apartamento (pra não perder traduções ao salvar). */
  previousPatches?: ItemPatches;
  /** Como a senha da fechadura chega neste apartamento — muda o texto do passo a passo. */
  doorCodeSetting?: Apartment["checkin"]["doorCode"];
};

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
  const ci = filledCheckin(building, vars, content.checkin.doorCode);
  const co = filledCheckout(building, vars);
  return {
    ...content,
    rules: {
      sub: building.rules.sub,
      items: mergeItems(building.rules.items, patches.rules, ruleId, content.rules.items),
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
  doorCode?: Apartment["checkin"]["doorCode"],
) {
  const p = patches ?? {};
  const ci = filledCheckin(building, vars, doorCode);
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
      src.previousPatches?.rules,
    );
  }
  if (o.home && src.overrideHome) {
    const m = homeFromContent(building.home);
    const prev = src.previousPatches;
    patches.slides = diffItems(m.slides, src.overrideHome.slides, slideToContent, prev?.slides);
    patches.accordions = diffItems(
      m.accordions,
      src.overrideHome.accordions,
      accordionToContent,
      prev?.accordions,
    );
  }
  if (o.amenities && src.overrideAmenities) {
    patches.amenities = diffItems(
      amenitiesFromContent(building.amenities).items,
      src.overrideAmenities.items,
      amenityToContent,
      src.previousPatches?.amenities,
    );
  }
  if (o.tourism && src.overrideTourism) {
    patches.tourism = diffItems(
      placesFromContent(building.tourism).items,
      src.overrideTourism.items,
      placeToContent,
      src.previousPatches?.tourism,
    );
  }
  if (o.dining && src.overrideDining) {
    patches.dining = diffItems(
      placesFromContent(building.dining).items,
      src.overrideDining.items,
      placeToContent,
      src.previousPatches?.dining,
    );
  }
  if (src.checkinOverride) {
    patches.checkin = diffItems(
      checkinFromContent(filledCheckin(building, vars, src.doorCodeSetting)).cards,
      src.checkinOverride.cards,
      cardToContent,
      src.previousPatches?.checkin,
    );
  }
  if (src.checkoutOverride) {
    patches.checkout = diffItems(
      checkoutFromContent(filledCheckout(building, vars)).steps,
      src.checkoutOverride.steps,
      stepToContent,
      src.previousPatches?.checkout,
    );
  }
  return compact(patches);
}

/* ------------------------------------------------------------------ */
/* Conteúdo antigo → ajustes                                           */
/* ------------------------------------------------------------------ */

/**
 * Liga cada item do apartamento ao do modelo (pelo id; em conteúdo antigo, o
 * título): igual ao modelo (texto e traduções) = segue o modelo; diferente =
 * ajuste "editado"; sem par = só deste apartamento.
 *
 * Item do modelo que o apartamento não tem: se a lista era dele por inteiro
 * (`markRemoved`), foi ele quem tirou — vira "removido". Nas cópias de
 * check-in/check-out não dá pra saber (o modelo pode ter ganhado o item depois),
 * então o item continua aparecendo.
 *
 * Guarda também a ordem em que o apartamento mostrava os itens, quando ela
 * difere da natural (modelo primeiro, depois os próprios).
 */
function matchPatch<T extends { id?: string }>(
  model: T[],
  own: T[],
  getId: (item: T) => string,
  markRemoved = false,
): { edited?: Record<string, T>; removed?: string[]; unmatched: T[]; ownFinal: T[] } {
  const modelIds = uniqueIds(model, getId);
  const byId = new Map(model.map((m, i) => [modelIds[i], m]));
  const ownIds = uniqueIds(own, getId);
  const seen = new Set<string>();
  const edited: Record<string, T> = {};
  const unmatched: T[] = [];
  const ownFinal: T[] = [];
  own.forEach((item, i) => {
    const id = ownIds[i];
    const m = byId.get(id);
    if (m && !seen.has(id)) {
      seen.add(id);
      if (sameContent(m, item)) {
        ownFinal.push(m);
      } else {
        const e = { ...item, id };
        edited[id] = e;
        ownFinal.push(e);
      }
    } else {
      const withId = item.id ? item : { ...item, id: newId() };
      unmatched.push(withId);
      ownFinal.push(withId);
    }
  });
  const removed = markRemoved ? modelIds.filter((id) => !seen.has(id)) : [];
  return {
    edited: Object.keys(edited).length ? edited : undefined,
    removed: removed.length ? removed : undefined,
    unmatched,
    ownFinal,
  };
}

/**
 * Ajuste a partir do que foi encontrado. \`addUnmatched\`: o que não tem par vira
 * "acrescentado"; senão fica fora do ajuste (regras próprias, guardadas no conteúdo).
 */
function toPatch<T extends { id?: string }>(
  model: T[],
  m: { edited?: Record<string, T>; removed?: string[]; unmatched: T[]; ownFinal: T[] },
  getId: (item: T) => string,
  addUnmatched: boolean,
): ItemPatch<T> | undefined {
  const p: ItemPatch<T> = {
    ...(m.edited ? { edited: m.edited } : {}),
    ...(m.removed ? { removed: m.removed } : {}),
    ...(addUnmatched && m.unmatched.length ? { added: m.unmatched } : {}),
  };
  const natural = uniqueIds(mergeItems(model, p, getId, addUnmatched ? [] : m.unmatched), getId);
  withOrder(p, uniqueIds(m.ownFinal, getId), natural);
  return isEmptyPatch(p) ? undefined : p;
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
    const m = matchPatch<Rule>(building.rules.items, content.rules.items, ruleId, true);
    patches.rules = toPatch(building.rules.items, m, ruleId, false);
    ownRules = m.unmatched;
  }
  if (isOwn("home")) {
    patches.slides = toPatch(
      building.home.slides,
      matchPatch<Slide>(building.home.slides, content.home.slides, slideId, true),
      slideId,
      true,
    );
    patches.accordions = toPatch(
      building.home.accordions,
      matchPatch<Accordion>(building.home.accordions, content.home.accordions, accordionId, true),
      accordionId,
      true,
    );
  }
  if (isOwn("amenities")) {
    patches.amenities = toPatch(
      building.amenities.items,
      matchPatch<Amenity>(building.amenities.items, content.amenities.items, amenityId, true),
      amenityId,
      true,
    );
  }
  for (const key of ["tourism", "dining"] as const) {
    if (!isOwn(key)) continue;
    patches[key] = toPatch(
      building[key].items,
      matchPatch<Place>(building[key].items, content[key].items, placeId, true),
      placeId,
      true,
    );
  }
  // Check-in/check-out sempre foram cópias do modelo (nunca ao vivo).
  const ciModel = filledCheckin(building, vars).cards;
  patches.checkin = toPatch(
    ciModel,
    matchPatch<CheckinCard>(ciModel, content.checkin.cards, cardId),
    cardId,
    true,
  );
  const coModel = filledCheckout(building, vars).steps;
  patches.checkout = toPatch(
    coModel,
    matchPatch<Step>(coModel, content.checkout?.steps ?? [], stepId),
    stepId,
    true,
  );

  return { patches: compact(patches), ownRules, vars };
}
