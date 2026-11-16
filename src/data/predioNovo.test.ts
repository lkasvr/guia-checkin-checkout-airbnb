import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Apartment, Rule } from "@/data/types";
import {
  buildApartmentContent,
  buildOverrides,
  guideContentFromStored,
  varsFromInput,
  type ApartmentFormInput,
  type BuildingTemplate,
} from "@/data/buildApartmentContent";
import { editorValues } from "@/data/patches";
import { BLANK_HOME, newBuildingTemplate } from "@/data/buildingModel";
import { apartmentPreview } from "@/data/apartmentPreview";
import { ruleId } from "@/data/itemMerge";
import { emptyL } from "@/data/sectionContent";
import { formularioNoPredio } from "@/data/testFixtures";

const vazio = emptyL();

/** Um prédio já cadastrado, com duas regras próprias, como a lista do cadastro de apartamento o traz. */
const residencialDfPlaza: BuildingTemplate & { name: string } = {
  name: "Residencial DF Plaza",
  rules: {
    sub: { pt: "Combinações do condomínio.", en: "Building agreements." },
    items: [
      {
        id: "silencio",
        icon: "🤫",
        title: { pt: "Silêncio depois das 22h", en: "Quiet after 10pm" },
        text: { pt: "Vale para todo o prédio.", en: "Applies to the whole building." },
      },
      {
        id: "garagem",
        icon: "🚗",
        title: { pt: "Garagem só na vaga do apartamento", en: "Park only in the apartment's spot" },
        text: { pt: "A vaga está na Capa.", en: "The spot is on the cover." },
      },
    ],
  },
  home: BLANK_HOME,
  amenities: { sub: vazio, items: [] },
  tourism: { sub: vazio, items: [] },
  dining: { sub: vazio, items: [] },
  checkinTemplate: { sub: vazio, cards: [] },
  checkoutTemplate: { sub: vazio, steps: [] },
  location: null,
};

/** Os prédios que o cadastro de apartamento conhece. */
const cadastrados = [residencialDfPlaza];

/** As regras de um guia como o hóspede as vê, cada uma com o id que liga ela ao ajuste. */
function regras(guia: Apartment): { id: string; title: Rule["title"]; text: Rule["text"] }[] {
  return guia.rules.items.map((r) => ({ id: ruleId(r), title: r.title, text: r.text }));
}

/** O título em português de cada regra do guia, na ordem em que aparecem. */
function titulos(guia: Apartment): string[] {
  return guia.rules.items.map((r) => r.title.pt);
}

/** As duas regras que o formulário gera com fumo e animais "Proibido" / "Não permitido". */
const REGRAS_DO_APARTAMENTO = ["Proibido fumar", "Não são permitidos animais"];

/** As 6 regras de convivência padrão, na ordem em que o prédio novo nasce com elas. */
const REGRAS_PADRAO = [
  "Respeito aos vizinhos",
  "Trajes nas áreas comuns",
  "Áreas comuns livres de fumo",
  "Uso dos elevadores",
  "Delivery e entregas",
  "Janelas e sacadas",
];

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

describe("Prévia do cadastro: prédio da prévia", () => {
  it("nome fora da lista: as 8 regras do guia que o servidor grava, com os mesmos ids e textos", () => {
    const form = formularioNoPredio({ building: "Edifício Recém-Chegado" });
    const { guide } = apartmentPreview(form, "Anfitriã", undefined, cadastrados);
    assert.deepEqual(titulos(guide), [...REGRAS_PADRAO, ...REGRAS_DO_APARTAMENTO]);
    assert.deepEqual(regras(guide), regras(guiaNoPredioNovo(form)));
  });

  it("nome de um prédio da lista, com maiúsculas e espaços nas pontas diferentes: as regras dele somadas às do apartamento", () => {
    const form = formularioNoPredio({ building: "  residencial DF PLAZA " });
    const { guide } = apartmentPreview(form, "Anfitriã", undefined, cadastrados);
    assert.deepEqual(titulos(guide), [
      "Silêncio depois das 22h",
      "Garagem só na vaga do apartamento",
      ...REGRAS_DO_APARTAMENTO,
    ]);
  });

  it("nome vazio: só as 2 regras do apartamento", () => {
    const form = formularioNoPredio({ building: "" });
    const { guide } = apartmentPreview(form, "Anfitriã", undefined, cadastrados);
    assert.deepEqual(titulos(guide), REGRAS_DO_APARTAMENTO);
  });

  it("nome só com espaços: sem prédio, como o nome vazio", () => {
    const form = formularioNoPredio({ building: "   " });
    const { building, guide } = apartmentPreview(form, "Anfitriã", undefined, cadastrados);
    assert.equal(building, null);
    assert.deepEqual(titulos(guide), REGRAS_DO_APARTAMENTO);
  });
});

describe("Prévia do cadastro: \"Personalizar para este apartamento\" nas regras, com prédio novo", () => {
  /** O clique no botão: o editor de regras abre com o prédio da prévia, como o cadastro faz. */
  function abrirEditorDeRegras(form: ApartmentFormInput): ApartmentFormInput {
    const { building } = apartmentPreview(form, "Anfitriã", undefined, cadastrados);
    assert.ok(building, "a prévia ficou sem prédio");
    const valores = editorValues(building, undefined, varsFromInput(form));
    return { ...form, overrides: { ...form.overrides, rules: true }, overrideRules: valores.rules };
  }

  it("o editor abre com as 6 regras padrão", () => {
    const form = abrirEditorDeRegras(formularioNoPredio({ building: "Edifício Recém-Chegado" }));
    assert.deepEqual(form.overrideRules?.items.map((r) => r.title.pt), REGRAS_PADRAO);
  });

  it("criar sem editá-las não grava ajuste nas regras", () => {
    const form = abrirEditorDeRegras(formularioNoPredio({ building: "Edifício Recém-Chegado" }));
    assert.equal(buildOverrides(form, newBuildingTemplate()).patches?.rules, undefined);
  });
});

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
