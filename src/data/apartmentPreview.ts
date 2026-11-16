import type { Apartment } from "@/data/types";
import {
  buildApartmentContent,
  buildOverrides,
  guideContentFromStored,
  type ApartmentFormInput,
} from "@/data/buildApartmentContent";
import { findBuilding, type BuildingTemplate } from "@/data/buildingModel";
import { newBuildingTemplate } from "@/data/starter";

/** Um prédio da lista do cadastro de apartamento: o modelo com o nome dele. */
export type NamedBuilding = BuildingTemplate & { name: string };

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
): { building: BuildingTemplate | null; guide: Apartment } {
  const building = form.building.trim()
    ? (findBuilding(form.building, buildings) ?? newBuildingTemplate())
    : null;
  const content = buildApartmentContent(form, hostName, existingContent, building);
  return { building, guide: guideContentFromStored(content, building, buildOverrides(form, building)) };
}
