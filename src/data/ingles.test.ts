import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Apartment, ApartmentVars, CheckinCard, L } from "@/data/types";
import { guideContentFromStored, type BuildingTemplate } from "@/data/buildApartmentContent";
import { BLANK_HOME } from "@/data/buildingModel";
import { textoNoIdioma, type Lang } from "@/data/idioma";
import { emptyL, toL } from "@/data/sectionContent";
import { starterContent } from "@/data/starter";

const vazio = emptyL();

/** Um texto sem inglês, como o editor grava com "Inglês (opcional)" em branco: o `en` vira a cópia do português. */
const semIngles = (pt: string): L => toL(emptyL(pt));

/**
 * O modelo do Residencial DF Plaza de produção, nos itens da tabela do #44:
 * as regras, o cartão "Chegou de carro?" e o check-out com textos sem inglês,
 * ao lado de textos que têm inglês de verdade.
 */
const dfPlaza: BuildingTemplate = {
  rules: {
    sub: semIngles("Combinações simples para a boa convivência no prédio."),
    items: [
      {
        id: "t:lei-do-silencio-22h-as-08h",
        icon: "🤫",
        title: semIngles("Lei do silêncio · 22h às 08h"),
        text: semIngles("Respeite o sossego dos vizinhos."),
      },
      {
        id: "t:passe-roupa-so-na-tabua",
        icon: "👕",
        title: semIngles("Passe roupa só na tábua"),
        text: semIngles("Nunca sobre a cama ou os móveis."),
      },
      {
        id: "t:somente-hospedes-registrados",
        icon: "👥",
        title: semIngles("Somente hóspedes registrados"),
        text: semIngles("Sobre convidados, consulte a anfitriã antes."),
      },
    ],
  },
  home: BLANK_HOME,
  amenities: {
    sub: vazio,
    items: [
      {
        id: "t:coworking",
        img: "/media/cowork.webp",
        title: semIngles("Coworking"),
        text: semIngles("Reserve a sala pelo aplicativo do condomínio."),
      },
    ],
  },
  tourism: { sub: vazio, items: [] },
  dining: { sub: vazio, items: [] },
  checkinTemplate: {
    sub: { pt: "Da portaria até a porta do apartamento.", en: "From the lobby to your apartment door." },
    cards: [
      {
        id: "t:entrando-no-predio",
        title: { pt: "Entrando no prédio", en: "Entering the building" },
        steps: [
          {
            n: "3",
            body: {
              pt: "Suba ao <strong>{{ANDAR}}</strong>, apartamento <strong>{{UNIDADE}}</strong>.",
              en: "Go up to the <strong>{{ANDAR}}</strong>, apartment <strong>{{UNIDADE}}</strong>.",
            },
          },
        ],
      },
      {
        id: "t:chegou-de-carro",
        title: semIngles("Chegou de carro?"),
        steps: [],
        video: {
          src: "/media/como-estacionar.mp4",
          label: semIngles("▶ Tutorial em vídeo · como chegar e estacionar"),
        },
      },
    ],
  },
  checkoutTemplate: {
    sub: semIngles("Alguns passos rápidos antes de você sair. Boa viagem!"),
    steps: [
      {
        n: "1",
        body: semIngles(
          "O <strong>horário limite de saída é {{CHECKOUT_HORA}}</strong>. Precisa de late checkout? Fale com a anfitriã.",
        ),
      },
      {
        n: "2",
        body: {
          pt: "Deixe o <strong>Cartão Branco</strong> de garagem sobre a mesa de jantar (em caso de não devolução, o condomínio cobra R$ 300 pela reposição).",
          en: "Leave the <strong>White garage Card</strong> on the dining table (if it isn't returned, the building charges R$ 300 for a replacement).",
        },
      },
      {
        n: "4",
        body: semIngles(
          "Feche as janelas, desligue o ar-condicionado e confira se não esqueceu nada. É só fechar a porta ao sair.",
        ),
      },
    ],
  },
  location: null,
};

/** Os marcadores gravados de um apartamento do DF Plaza. */
const vars: ApartmentVars = { TORRE: "Torre D", ANDAR: "22º andar", UNIDADE: "2202", VAGA: "", CHECKOUT_HORA: "11h" };

/**
 * O guia de um apartamento do prédio, no modo atual (com ajustes, nenhum
 * editado), como o `getGuide` monta. `marcadores` troca algum dos gravados.
 */
function guiaNoPredio(predio: BuildingTemplate, marcadores: Partial<ApartmentVars> = {}): Apartment {
  const gravado: Apartment = {
    ...starterContent("Apartamento", "2202", "Residencial DF Plaza"),
    vars: { ...vars, ...marcadores },
  };
  return guideContentFromStored(gravado, predio, { patches: {} });
}

/** Um Cartão de check-in do guia, pelo id. */
function cartao(guia: Apartment, id: string): CheckinCard {
  const achado = guia.checkin.cards.find((c) => c.id === id);
  assert.ok(achado, `não há o Cartão de check-in ${id}`);
  return achado;
}

/** Cada texto, lido num idioma. */
const lidos = (textos: L[], idioma: Lang): string[] => textos.map((l) => textoNoIdioma(l, idioma));

/** O subtítulo de "Regras da Casa" e o título e o texto de cada regra, na ordem do guia. */
function textosDasRegras(guia: Apartment): L[] {
  return [guia.rules.sub, ...guia.rules.items.flatMap((r) => [r.title, r.text])];
}

/** O subtítulo do check-out e os passos 1 e 3 visíveis (os sem inglês no DF Plaza). */
function textosDaSaida(guia: Apartment): L[] {
  const saida = guia.checkout;
  assert.ok(saida, "o guia não tem check-out");
  return [saida.sub, saida.steps[0].body, saida.steps[2].body];
}

describe("Guia em inglês: texto sem inglês sai pelo dicionário", () => {
  it("o subtítulo e as três regras do DF Plaza saem no inglês do dicionário", () => {
    const regras = textosDasRegras(guiaNoPredio(dfPlaza));
    assert.deepEqual(lidos(regras, "en"), [
      "Simple ground rules for getting along in the building.",
      "Quiet hours · 10pm to 8am",
      "Please respect the neighbors' rest.",
      "Iron only on the board",
      "Never on the bed or furniture.",
      "Registered guests only",
      "For visitors, please check with the host first.",
    ]);
  });

  it("o subtítulo do check-out e o passo 3 saem no inglês do dicionário", () => {
    const [sub, , passo3] = textosDaSaida(guiaNoPredio(dfPlaza));
    assert.deepEqual(lidos([sub, passo3], "en"), [
      "A few quick steps before you go. Safe travels!",
      "Close the windows, turn off the A/C and double-check for forgotten items. Just shut the door on your way out.",
    ]);
  });

  it("nenhum desses textos sai em inglês igual ao português", () => {
    const guia = guiaNoPredio(dfPlaza);
    for (const l of [...textosDasRegras(guia), ...textosDaSaida(guia)]) {
      assert.notEqual(textoNoIdioma(l, "en"), l.pt);
    }
  });
});

describe("Cartão de check-in \"Chegou de carro?\"", () => {
  it("o título e o rótulo do vídeo saem no inglês do dicionário", () => {
    const carro = cartao(guiaNoPredio(dfPlaza), "t:chegou-de-carro");
    assert.deepEqual(lidos([carro.title, carro.video!.label], "en"), [
      "Arriving by car?",
      "▶ Video tutorial · arriving & parking",
    ]);
  });
});

describe("Guia em inglês: inglês digitado vence o dicionário", () => {
  it("regra com inglês digitado sai no digitado, não no dicionário", () => {
    const predio: BuildingTemplate = {
      ...dfPlaza,
      rules: {
        ...dfPlaza.rules,
        items: dfPlaza.rules.items.map((r) =>
          r.id === "t:lei-do-silencio-22h-as-08h"
            ? { ...r, title: { pt: r.title.pt, en: "Silence, please · 10pm–8am" } }
            : r,
        ),
      },
    };
    const silencio = guiaNoPredio(predio).rules.items[0];
    assert.equal(textoNoIdioma(silencio.title, "en"), "Silence, please · 10pm–8am");
  });

  it("passo de saída com inglês digitado sai no digitado, com o horário preenchido", () => {
    const predio: BuildingTemplate = {
      ...dfPlaza,
      checkoutTemplate: {
        ...dfPlaza.checkoutTemplate,
        steps: dfPlaza.checkoutTemplate.steps.map((s) =>
          s.n === "1"
            ? { ...s, body: { pt: s.body.pt, en: "Please leave by <strong>{{CHECKOUT_HORA}}</strong>." } }
            : s,
        ),
      },
    };
    const [, passo1] = textosDaSaida(guiaNoPredio(predio));
    assert.equal(textoNoIdioma(passo1, "en"), "Please leave by <strong>11h</strong>.");
  });
});

describe("Prédio criado com os subtítulos do conteúdo inicial sem inglês", () => {
  /** Um prédio criado pelo cadastro de apartamento antes do #54: os subtítulos gravados com `en` igual ao `pt`. */
  const predioAntigo: BuildingTemplate = {
    ...dfPlaza,
    rules: { ...dfPlaza.rules, sub: semIngles("Regras da casa.") },
    checkinTemplate: { ...dfPlaza.checkinTemplate, sub: semIngles("Instruções de chegada.") },
    checkoutTemplate: { ...dfPlaza.checkoutTemplate, sub: semIngles("Antes de sair.") },
  };

  it("em inglês, os subtítulos de regras, check-in e check-out saem em inglês", () => {
    const guia = guiaNoPredio(predioAntigo);
    assert.deepEqual(lidos([guia.rules.sub, guia.checkin.sub, guia.checkout!.sub], "en"), [
      "House rules.",
      "Arrival instructions.",
      "Before you leave.",
    ]);
  });
});

describe("Texto sem chave no dicionário e sem inglês digitado", () => {
  it("\"Coworking\", igual nos dois idiomas, sai como está em inglês e em espanhol", () => {
    const coworking = guiaNoPredio(dfPlaza).amenities.items[0].title;
    assert.equal(textoNoIdioma(coworking, "en"), "Coworking");
    assert.equal(textoNoIdioma(coworking, "es"), "Coworking");
  });

  it("texto que o anfitrião digitou só em português sai em português em inglês e em espanhol", () => {
    const texto = guiaNoPredio(dfPlaza).amenities.items[0].text;
    assert.equal(textoNoIdioma(texto, "en"), "Reserve a sala pelo aplicativo do condomínio.");
    assert.equal(textoNoIdioma(texto, "es"), "Reserve a sala pelo aplicativo do condomínio.");
  });
});

describe("Guia em espanhol: os mesmos textos continuam como antes do dicionário inglês", () => {
  it("o subtítulo e as três regras saem no espanhol do dicionário espanhol", () => {
    assert.deepEqual(lidos(textosDasRegras(guiaNoPredio(dfPlaza)), "es"), [
      "Acuerdos sencillos para la buena convivencia en el edificio.",
      "Horario de silencio · 22 h a 8 h",
      "Respeta la tranquilidad de los vecinos.",
      "Plancha solo en la tabla",
      "Nunca sobre la cama ni los muebles.",
      "Solo huéspedes registrados",
      "Si quieres recibir visitas, consulta antes con la anfitriona.",
    ]);
  });

  it("o subtítulo do check-out e os passos 1 e 3 saem no espanhol do dicionário espanhol", () => {
    assert.deepEqual(lidos(textosDaSaida(guiaNoPredio(dfPlaza)), "es"), [
      "Unos pasos rápidos antes de irte. ¡Buen viaje!",
      "La <strong>hora límite de salida es a las 11h</strong>. ¿Necesitas late check-out? Habla con la anfitriona.",
      "Cierra las ventanas, apaga el aire acondicionado y revisa que no olvides nada. Solo cierra la puerta al salir.",
    ]);
  });
});
