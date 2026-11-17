import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Apartment, ApartmentVars, L } from "@/data/types";
import {
  buildApartmentContent,
  buildOverrides,
  guideContentFromStored,
  type BuildingTemplate,
} from "@/data/buildApartmentContent";
import { apartmentPreview } from "@/data/apartmentPreview";
import { BLANK_HOME, BLANK_RULES } from "@/data/buildingModel";
import { legacyCheckinCopy, legacyCheckoutCopy } from "@/data/checkinTemplate";
import { emptyL } from "@/data/sectionContent";
import { starterContent } from "@/data/starter";
import { abrirEditor, formularioNoPredio } from "@/data/testFixtures";
import { legacyToPatches } from "@/data/patches";

const l = (pt: string, en: string, es: string): L => ({ pt, en, es });
const vazio = emptyL();

/** Prédio cujo Cartão de check-in "Entrando no prédio" usa o marcador {{UNIDADE}}. */
const predio: BuildingTemplate = {
  rules: BLANK_RULES,
  home: BLANK_HOME,
  amenities: { sub: vazio, items: [] },
  tourism: { sub: vazio, items: [] },
  dining: { sub: vazio, items: [] },
  checkinTemplate: {
    sub: l("Da portaria até a porta.", "From the lobby to your door.", "De la portería a la puerta."),
    cards: [
      {
        id: "entrando",
        title: l("Entrando no prédio", "Entering the building", "Entrando al edificio"),
        steps: [
          {
            n: "1",
            body: l(
              "Suba ao {{ANDAR}}, apartamento {{UNIDADE}}.",
              "Go up to the {{ANDAR}}, apartment {{UNIDADE}}.",
              "Sube al {{ANDAR}}, apartamento {{UNIDADE}}.",
            ),
          },
        ],
      },
    ],
  },
  checkoutTemplate: {
    sub: vazio,
    steps: [
      {
        n: "1",
        body: l(
          "Deixe a chave na portaria, no envelope do apartamento {{UNIDADE}}.",
          "Leave the key at the front desk, in the envelope for apartment {{UNIDADE}}.",
          "Deja la llave en la portería, en el sobre del apartamento {{UNIDADE}}.",
        ),
      },
    ],
  },
  location: null,
};

/** Os marcadores gravados de um apartamento do prédio, com a unidade como foi digitada. */
function varsGravadas(unidade: string): ApartmentVars {
  return { TORRE: "Torre A", ANDAR: "22º andar", UNIDADE: unidade, VAGA: "", CHECKOUT_HORA: "11h" };
}

/** Conteúdo gravado de um apartamento do prédio, com a unidade como foi digitada. */
function apartamentoGravado(unidade: string): Apartment {
  return {
    ...starterContent("Apartamento", unidade, "Residencial DF Plaza"),
    vars: varsGravadas(unidade),
  };
}

/** O guia de um apartamento gravado, no modo atual (com ajustes, nenhum editado), como o `getGuide` monta. */
function guiaGravado(unidade: string): Apartment {
  return guideContentFromStored(apartamentoGravado(unidade), predio, { patches: {} });
}

/** O Cartão de check-in "Entrando no prédio", no guia ou no editor. */
function cartaoEntrando<C extends { title: { pt: string } }>(cards: C[]): C {
  const cartao = cards.find((c) => c.title.pt === predio.checkinTemplate.cards[0].title.pt);
  assert.ok(cartao, "não há o Cartão de check-in \"Entrando no prédio\"");
  return cartao;
}

/** O passo "Suba ao…" do Cartão "Entrando no prédio", como o guia mostra. */
function passoEntrando(guia: Apartment): L {
  return cartaoEntrando(guia.checkin.cards).steps[0].body;
}

/** O texto esperado do passo "Suba ao…", em português, com a unidade dada. */
function subaAoApartamento(unidade: string): string {
  return `Suba ao 22º andar, apartamento ${unidade}.`;
}

describe("Montagem do guia: marcador {{UNIDADE}}", () => {
  it("2202 gravado com \"Ap 2202\": o passo do check-in sai sem o \"Ap\" nos três idiomas", () => {
    const guia = guiaGravado("Ap 2202");
    assert.deepEqual(passoEntrando(guia), {
      pt: "Suba ao 22º andar, apartamento 2202.",
      en: "Go up to the 22nd floor, apartment 2202.",
      es: "Sube al 22º andar, apartamento 2202.",
    });
  });

  const casos: [gravada: string, mostrada: string][] = [
    ["AP 2202", "2202"],
    ["Apto. 301", "301"],
    ["apartamento 1305C", "1305C"],
    // Unidade já sem prefixo sai igual, inclusive "A2" (o "A" não é prefixo).
    ["2202", "2202"],
    ["1305C", "1305C"],
    ["A2", "A2"],
  ];
  for (const [gravada, mostrada] of casos) {
    it(`unidade gravada "${gravada}" aparece como "${mostrada}"`, () => {
      assert.equal(passoEntrando(guiaGravado(gravada)).pt, subaAoApartamento(mostrada));
    });
  }

  it("o marcador num passo do check-out também sai sem o \"Ap\"", () => {
    const guia = guiaGravado("Ap 2202");
    assert.deepEqual(guia.checkout?.steps[0].body, {
      pt: "Deixe a chave na portaria, no envelope do apartamento 2202.",
      en: "Leave the key at the front desk, in the envelope for apartment 2202.",
      es: "Deja la llave en la portería, en el sobre del apartamento 2202.",
    });
  });

  it("conteúdo antigo, sem marcadores gravados: a unidade vem do campo da unidade e sai sem o \"Ap\"", () => {
    const antigo: Apartment = { ...apartamentoGravado("Ap 2202"), vars: undefined };
    const guia = guideContentFromStored(antigo, predio, { patches: {} });
    assert.match(passoEntrando(guia).pt, / apartamento 2202\.$/);
  });

  it("a unidade principal (título e rodapé) continua sem o \"Ap\", como o #43 deixou", () => {
    assert.equal(guiaGravado("Ap 2202").unit, "2202");
  });
});

describe("Gravação do cadastro: unidade digitada com \"Ap\"", () => {
  it("\"Ap 2202\" grava a variável UNIDADE como \"2202\"", () => {
    const gravado = buildApartmentContent(formularioNoPredio({ unit: "Ap 2202" }), "Anfitriã", undefined, predio);
    assert.equal(gravado.vars?.UNIDADE, "2202");
  });

  it("a prévia do cadastro mostra o passo do check-in sem o \"Ap\"", () => {
    const form = formularioNoPredio({ unit: "Ap 2202" });
    const { guide: previa } = apartmentPreview(form, "Anfitriã", undefined, [
      { ...predio, name: form.building },
    ]);
    assert.equal(passoEntrando(previa).pt, subaAoApartamento("2202"));
  });
});

describe("Gravação do cadastro: ajustes no Cartão de check-in", () => {
  it("o editor aberto mostra a unidade como o guia mostra", () => {
    const form = abrirEditor(formularioNoPredio({ unit: "Ap 2202" }), predio, "checkin");
    const cartao = cartaoEntrando(form.checkinOverride!.cards);
    assert.equal(cartao.steps[0].body.pt, subaAoApartamento("2202"));
  });

  it("editor aberto e sem edição: salvar não gera ajuste no cartão", () => {
    const form = abrirEditor(formularioNoPredio({ unit: "Ap 2202" }), predio, "checkin");
    assert.equal(buildOverrides(form, predio).patches?.checkin, undefined);
  });

  it("cartão editado de propósito: o ajuste continua", () => {
    const form = abrirEditor(formularioNoPredio({ unit: "Ap 2202" }), predio, "checkin");
    const cards = form.checkinOverride!.cards.map((c) =>
      c.id === "entrando"
        ? { ...c, steps: [{ ...c.steps[0], body: { ...c.steps[0].body, pt: "Suba pelo elevador social." } }] }
        : c,
    );
    const patches = buildOverrides({ ...form, checkinOverride: { ...form.checkinOverride!, cards } }, predio).patches;
    assert.equal(patches?.checkin?.edited?.entrando?.steps[0].body.pt, "Suba pelo elevador social.");
  });
});

/**
 * Apartamento do modo antigo (prédio ligado e sem ajustes): o check-in e o
 * check-out ficaram gravados já preenchidos pelo modelo do prédio, com a
 * unidade como foi digitada.
 */
function apartamentoModoAntigo(unidade: string): Apartment {
  return {
    ...apartamentoGravado(unidade),
    checkin: legacyCheckinCopy(predio, varsGravadas(unidade)),
    checkout: legacyCheckoutCopy(predio, varsGravadas(unidade)),
  };
}

describe("Conversão do modo antigo para ajustes", () => {
  it("o check-in gravado tem mesmo o texto sujo \"apartamento Ap 2202\"", () => {
    assert.equal(passoEntrando(apartamentoModoAntigo("Ap 2202")).pt, subaAoApartamento("Ap 2202"));
  });

  it("check-in gravado com \"apartamento Ap 2202\" não vira ajuste no cartão", () => {
    const { patches } = legacyToPatches(apartamentoModoAntigo("Ap 2202"), predio, {}, true);
    assert.equal(patches.checkin, undefined);
  });

  it("check-out gravado com \"apartamento Ap 2202\" não vira ajuste no passo", () => {
    const { patches } = legacyToPatches(apartamentoModoAntigo("Ap 2202"), predio, {}, true);
    assert.equal(patches.checkout, undefined);
  });

  it("depois de convertido, o guia mostra a unidade sem o \"Ap\"", () => {
    const conteudo = apartamentoModoAntigo("Ap 2202");
    const { patches } = legacyToPatches(conteudo, predio, {}, true);
    const guia = guideContentFromStored(conteudo, predio, { patches });
    assert.equal(passoEntrando(guia).pt, subaAoApartamento("2202"));
  });
});
