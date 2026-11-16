import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Apartment } from "@/data/types";
import {
  buildApartmentContent,
  buildOverrides,
  guideContentFromStored,
  type ApartmentFormInput,
} from "@/data/buildApartmentContent";
import { newBuildingTemplate } from "@/data/buildingModel";
import { formularioNoPredio } from "@/data/testFixtures";

/**
 * O guia que o servidor grava e o guia público mostra para um apartamento
 * cadastrado num prédio que ainda não existia: `resolveBuilding` cria o prédio
 * com o modelo de prédio novo, `createApartmentDetailed` grava o conteúdo e os
 * ajustes, e `getGuide` monta o guia.
 */
function guiaNoPredioNovo(form: ApartmentFormInput): Apartment {
  const predio = newBuildingTemplate();
  const gravado = buildApartmentContent(form, "Anfitriã", undefined, predio);
  return guideContentFromStored(gravado, predio, buildOverrides(form, predio));
}

describe("Prédio novo: subtítulos em inglês", () => {
  const guia = guiaNoPredioNovo(formularioNoPredio({ building: "Edifício Recém-Chegado" }));

  it("Regras: \"House rules.\"", () => {
    assert.deepEqual(guia.rules.sub, { pt: "Regras da casa.", en: "House rules." });
  });

  it("Check-in: \"Arrival instructions.\"", () => {
    assert.equal(guia.checkin.sub.en, "Arrival instructions.");
  });

  it("Check-out: \"Before you leave.\"", () => {
    assert.equal(guia.checkout?.sub.en, "Before you leave.");
  });
});
