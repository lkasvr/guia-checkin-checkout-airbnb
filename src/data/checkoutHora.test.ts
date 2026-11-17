import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Apartment, ApartmentVars, L } from "@/data/types";
import {
  buildApartmentContent,
  buildOverrides,
  guideContentFromStored,
  type BuildingTemplate,
} from "@/data/buildApartmentContent";
import { legacyToPatches } from "@/data/patches";
import { legacyCheckinCopy, legacyCheckoutCopy } from "@/data/checkinTemplate";
import { BLANK_HOME, BLANK_RULES } from "@/data/buildingModel";
import { emptyL } from "@/data/sectionContent";
import { starterContent } from "@/data/starter";
import { abrirEditor, formularioNoPredio } from "@/data/testFixtures";

const vazio = emptyL();

/**
 * Prédio cujo passo de saída usa o marcador {{CHECKOUT_HORA}}, como o modelo
 * dos prédios de produção: o espanhol não está gravado e vem do dicionário.
 */
const predio: BuildingTemplate = {
  rules: BLANK_RULES,
  home: BLANK_HOME,
  amenities: { sub: vazio, items: [] },
  tourism: { sub: vazio, items: [] },
  dining: { sub: vazio, items: [] },
  checkinTemplate: { sub: vazio, cards: [] },
  checkoutTemplate: {
    sub: vazio,
    steps: [
      {
        n: "1",
        body: {
          pt: "O <strong>horário limite de saída é {{CHECKOUT_HORA}}</strong>. Precisa de late checkout? Fale com a anfitriã.",
          en: "The <strong>check-out time is {{CHECKOUT_HORA}}</strong>. Need a late check-out? Talk to the host.",
        },
      },
    ],
  },
  location: null,
};

/** Os marcadores gravados de um apartamento do prédio, com o horário de saída como foi digitado. */
function varsGravadas(checkoutHora: string): ApartmentVars {
  return { TORRE: "Torre A", ANDAR: "22º andar", UNIDADE: "2202", VAGA: "", CHECKOUT_HORA: checkoutHora };
}

/** Conteúdo gravado de um apartamento do prédio, com o horário de saída como foi digitado. */
function apartamentoGravado(checkoutHora: string): Apartment {
  return {
    ...starterContent("Apartamento", "2202", "Residencial DF Plaza"),
    vars: varsGravadas(checkoutHora),
  };
}

/** O guia de um apartamento gravado, no modo atual (com ajustes, nenhum editado), como o `getGuide` monta. */
function guiaGravado(checkoutHora: string): Apartment {
  return guideContentFromStored(apartamentoGravado(checkoutHora), predio, { patches: {} });
}

/** O passo de saída com o horário, como o guia mostra. */
function passoDeSaida(guia: Apartment): L {
  const passo = guia.checkout?.steps[0];
  assert.ok(passo, "o guia não tem o passo de saída");
  return passo.body;
}

/** O texto esperado do passo de saída, em português, com o horário dado. */
function saidaAs(horario: string): string {
  return `O <strong>horário limite de saída é ${horario}</strong>. Precisa de late checkout? Fale com a anfitriã.`;
}

describe("Montagem do guia: marcador {{CHECKOUT_HORA}}", () => {
  it("\"Até às 11h\" gravado: o passo de saída mostra só o horário, \"11am\" em inglês", () => {
    assert.deepEqual(passoDeSaida(guiaGravado("Até às 11h")), {
      pt: "O <strong>horário limite de saída é 11h</strong>. Precisa de late checkout? Fale com a anfitriã.",
      en: "The <strong>check-out time is 11am</strong>. Need a late check-out? Talk to the host.",
      es: "La <strong>hora límite de salida es a las 11h</strong>. ¿Necesitas late check-out? Habla con la anfitriona.",
    });
  });

  const casos: [gravado: string, mostrado: string][] = [
    ["Até às 12h", "12h"],
    ["até as 11h", "11h"],
    ["ate as 11h", "11h"],
    ["ATÉ ÀS 11h", "11h"],
    ["Até 11h", "11h"],
    ["às 11h", "11h"],
    ["as 11h", "11h"],
    // Só o prefixo, sem horário: não sobra nada, e fica como digitado.
    ["Até às", "Até às"],
    ["Até", "Até"],
    // Horário já limpo sai igual; vazio continua virando o padrão de hoje.
    ["11h", "11h"],
    ["11:30", "11:30"],
    ["", "11h"],
  ];
  for (const [gravado, mostrado] of casos) {
    it(`horário gravado "${gravado}" aparece como "${mostrado}"`, () => {
      assert.equal(passoDeSaida(guiaGravado(gravado)).pt, saidaAs(mostrado));
    });
  }

  it("conteúdo antigo, sem marcadores gravados: o horário vem do quadradinho \"Check-out\" da Capa e sai limpo", () => {
    const gravado = apartamentoGravado("Até às 11h");
    const antigo: Apartment = {
      ...gravado,
      vars: undefined,
      hero: { ...gravado.hero, facts: [{ k: { pt: "Até às 11h", en: "Até às 11h" }, v: { pt: "Check-out", en: "Check-out" } }] },
    };
    const guia = guideContentFromStored(antigo, predio, { patches: {} });
    assert.equal(passoDeSaida(guia).pt, saidaAs("11h"));
  });
});

/** O quadradinho "Check-out" da Capa, como foi gravado. */
function quadradinhoCheckout(conteudo: Apartment): string | undefined {
  return conteudo.hero.facts.find((f) => f.v.pt === "Check-out")?.k.pt;
}

describe("Gravação do cadastro: horário de saída digitado com \"Até às\"", () => {
  it("\"Até às 11h\" grava a variável CHECKOUT_HORA como \"11h\"", () => {
    const gravado = buildApartmentContent(formularioNoPredio({ checkoutTime: "Até às 11h" }), "Anfitriã", undefined, predio);
    assert.equal(gravado.vars?.CHECKOUT_HORA, "11h");
  });

  it("o quadradinho \"Check-out\" da Capa continua como foi digitado", () => {
    const gravado = buildApartmentContent(formularioNoPredio({ checkoutTime: "Até às 11h" }), "Anfitriã", undefined, predio);
    assert.equal(quadradinhoCheckout(gravado), "Até às 11h");
  });
});

describe("Gravação do cadastro: ajustes no check-out", () => {
  it("o editor aberto mostra o horário como o guia mostra", () => {
    const form = abrirEditor(formularioNoPredio({ checkoutTime: "Até às 11h" }), predio, "checkout");
    assert.equal(form.checkoutOverride?.steps[0].body.pt, saidaAs("11h"));
  });

  it("editor aberto e sem edição: salvar não gera ajuste no check-out", () => {
    const form = abrirEditor(formularioNoPredio({ checkoutTime: "Até às 11h" }), predio, "checkout");
    assert.equal(buildOverrides(form, predio).patches?.checkout, undefined);
  });

  it("campo vazio: o editor mostra o padrão \"11h\", e salvar não gera ajuste", () => {
    const form = abrirEditor(formularioNoPredio({ checkoutTime: "" }), predio, "checkout");
    assert.equal(form.checkoutOverride?.steps[0].body.pt, saidaAs("11h"));
    assert.equal(buildOverrides(form, predio).patches?.checkout, undefined);
  });
});

/**
 * Apartamento do modo antigo (prédio ligado e sem ajustes): o check-in e o
 * check-out ficaram gravados já preenchidos pelo modelo do prédio, com o
 * horário de saída como foi digitado.
 */
function apartamentoModoAntigo(checkoutHora: string): Apartment {
  return {
    ...apartamentoGravado(checkoutHora),
    checkin: legacyCheckinCopy(predio, varsGravadas(checkoutHora)),
    checkout: legacyCheckoutCopy(predio, varsGravadas(checkoutHora)),
  };
}

describe("Conversão do modo antigo para ajustes", () => {
  it("o check-out gravado tem mesmo o texto \"é Até às 11h\"", () => {
    assert.equal(passoDeSaida(apartamentoModoAntigo("Até às 11h")).pt, saidaAs("Até às 11h"));
  });

  it("check-out gravado com \"é Até às 11h\" não vira ajuste no passo", () => {
    const { patches } = legacyToPatches(apartamentoModoAntigo("Até às 11h"), predio, {}, true);
    assert.equal(patches.checkout, undefined);
  });

  it("depois de convertido, o guia mostra \"11h\"", () => {
    const conteudo = apartamentoModoAntigo("Até às 11h");
    const { patches } = legacyToPatches(conteudo, predio, {}, true);
    const guia = guideContentFromStored(conteudo, predio, { patches });
    assert.equal(passoDeSaida(guia).pt, saidaAs("11h"));
  });
});
