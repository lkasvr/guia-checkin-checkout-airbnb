import type { Apartment } from "@/data/types";
import {
  buildApartmentContent,
  buildOverrides,
  doorCodeFromInput,
  guideContentFromStored,
  varsFromInput,
  type ApartmentFormInput,
} from "@/data/buildApartmentContent";
import { findBuilding, type BuildingTemplate } from "@/data/buildingModel";
import { editorValues } from "@/data/patches";
import {
  amenitiesFromContent,
  checkinFromContent,
  checkoutFromContent,
  homeFromContent,
  placesFromContent,
  rulesFromContent,
} from "@/data/sectionContent";
import { newBuildingTemplate } from "@/data/starter";

/** Um prédio da lista do cadastro de apartamento: o modelo com o nome dele. */
export type NamedBuilding = BuildingTemplate & { name: string };

/** O que a prévia do cadastro mostra: o guia e o prédio com que ele foi montado. */
export type ApartmentPreview = { building: BuildingTemplate | null; guide: Apartment };

/** Uma seção que "Personalizar para este apartamento" abre num editor. */
export type OverridableSection = "rules" | "home" | "amenities" | "tourism" | "dining";

/**
 * O guia que a prévia do cadastro de apartamento mostra ("Ver prévia →"), igual
 * ao que vai ser gravado, e o prédio com que ele foi montado:
 *
 * - nome de um prédio cadastrado: esse prédio;
 * - nome preenchido sem prédio cadastrado: o modelo de prédio novo, o mesmo
 *   com que `resolveBuilding` cria o prédio ao gravar;
 * - nome vazio: sem prédio.
 *
 * Os editores abertos por "Personalizar para este apartamento" usam o mesmo
 * prédio. `existingContent` é o conteúdo gravado do apartamento, na edição.
 */
export function apartmentPreview(
  form: ApartmentFormInput,
  hostName: string,
  existingContent: Apartment | undefined,
  buildings: NamedBuilding[],
): ApartmentPreview {
  const building = form.building.trim()
    ? (findBuilding(form.building, buildings) ?? newBuildingTemplate())
    : null;
  const content = buildApartmentContent(form, hostName, existingContent, building);
  return { building, guide: guideContentFromStored(content, building, buildOverrides(form, building)) };
}

/**
 * O formulário com o editor da seção aberto, como o cadastro faz em
 * "Personalizar para este apartamento" e em "Ajustar check-in manualmente" /
 * "Ajustar check-out manualmente". Com o prédio da prévia, o editor abre com a
 * lista dele, com os marcadores preenchidos pelo formulário, e só o que a
 * pessoa mudar vira ajuste. Sem prédio, abre com o que a prévia mostra.
 */
export function openEditor<F extends ApartmentFormInput>(
  form: F,
  section: OverridableSection | "checkin" | "checkout",
  { building, guide }: ApartmentPreview,
): F {
  const ev = building
    ? editorValues(building, undefined, varsFromInput(form), doorCodeFromInput(form))
    : null;
  const overrides = { ...form.overrides, [section]: true };
  switch (section) {
    case "rules":
      return { ...form, overrides, overrideRules: ev?.rules ?? rulesFromContent(guide.rules) };
    case "home":
      return { ...form, overrides, overrideHome: ev?.home ?? homeFromContent(guide.home) };
    case "amenities":
      return {
        ...form,
        overrides,
        overrideAmenities: ev?.amenities ?? amenitiesFromContent(guide.amenities),
      };
    case "tourism":
      return { ...form, overrides, overrideTourism: ev?.tourism ?? placesFromContent(guide.tourism) };
    case "dining":
      return { ...form, overrides, overrideDining: ev?.dining ?? placesFromContent(guide.dining) };
    case "checkin":
      return { ...form, checkinOverride: ev?.checkin ?? checkinFromContent(guide.checkin) };
    case "checkout": {
      if (ev) return { ...form, checkoutOverride: ev.checkout };
      return guide.checkout ? { ...form, checkoutOverride: checkoutFromContent(guide.checkout) } : form;
    }
  }
}
