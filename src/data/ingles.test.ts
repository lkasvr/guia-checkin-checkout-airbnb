import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Apartment, ApartmentVars, CheckinCard, L } from "@/data/types";
import {
  buildApartmentContent,
  buildOverrides,
  guideContentFromStored,
  type BuildingTemplate,
} from "@/data/buildApartmentContent";
import { BLANK_HOME } from "@/data/buildingModel";
import { textoNoIdioma, type Lang } from "@/data/idioma";
import { legacyToPatches } from "@/data/patches";
import { PREREQUISITE_CARD } from "@/data/prerequisiteCard";
import { emptyL, toL } from "@/data/sectionContent";
import { starterContent } from "@/data/starter";
import { abrirEditor, formularioNoPredio } from "@/data/testFixtures";

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

  it("o subtítulo do check-out e os passos 1 e 3 saem no inglês do dicionário, com o horário preenchido", () => {
    const saida = textosDaSaida(guiaNoPredio(dfPlaza));
    assert.deepEqual(lidos(saida, "en"), [
      "A few quick steps before you go. Safe travels!",
      "<strong>Check-out is until 11am</strong>. Need a late checkout? Message the host.",
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

describe("Marcador {{ANDAR}} em inglês", () => {
  /** O passo "Suba ao…" do Cartão "Entrando no prédio", lido num idioma. */
  const subaAo = (guia: Apartment, idioma: Lang) =>
    textoNoIdioma(cartao(guia, "t:entrando-no-predio").steps[0].body, idioma);

  it("\"22º andar\" sem tradução digitada: o andar sai com o ordinal inglês", () => {
    assert.equal(
      subaAo(guiaNoPredio(dfPlaza), "en"),
      "Go up to the <strong>22nd floor</strong>, apartment <strong>2202</strong>.",
    );
  });

  it("com tradução digitada do andar, vale a digitada", () => {
    const guia = guiaNoPredio(dfPlaza, { ANDAR_L: { pt: "22º andar", en: "top floor (22)" } });
    assert.equal(subaAo(guia, "en"), "Go up to the <strong>top floor (22)</strong>, apartment <strong>2202</strong>.");
  });

  it("o espanhol do andar fica como está", () => {
    assert.equal(
      subaAo(guiaNoPredio(dfPlaza), "es"),
      "Sube al <strong>22º andar</strong>, apartamento <strong>2202</strong>.",
    );
  });

  it("texto do modelo sem inglês e sem chave no dicionário: o andar não sai em inglês no meio do português", () => {
    const predio: BuildingTemplate = {
      ...dfPlaza,
      checkinTemplate: {
        ...dfPlaza.checkinTemplate,
        cards: [
          {
            id: "t:elevador",
            title: semIngles("Elevador"),
            steps: [{ n: "1", body: semIngles("Pegue o elevador social até o {{ANDAR}}.") }],
          },
        ],
      },
    };
    const passo = cartao(guiaNoPredio(predio), "t:elevador").steps[0].body;
    assert.equal(textoNoIdioma(passo, "en"), "Pegue o elevador social até o 22º andar.");
    assert.equal(textoNoIdioma(passo, "es"), "Pegue o elevador social até o 22º andar.");
  });

  it("texto do modelo sem inglês: nem o andar digitado nem a senha entram em inglês no meio do português", () => {
    const predio: BuildingTemplate = {
      ...dfPlaza,
      checkinTemplate: {
        ...dfPlaza.checkinTemplate,
        cards: [
          {
            id: "t:porta",
            title: semIngles("Porta"),
            steps: [{ n: "1", body: semIngles("No {{ANDAR}}, digite {{SENHA_FECHADURA}}.") }],
          },
        ],
      },
    };
    const guia = guiaNoPredio(predio, { ANDAR_L: { pt: "22º andar", en: "top floor (22)" } });
    const passo = cartao(guia, "t:porta").steps[0].body;
    const portugues = textoNoIdioma(passo, "pt");
    assert.match(portugues, /^No 22º andar, digite <strong>a senha enviada pelo <a .*>chat<\/a><\/strong>\.$/);
    assert.equal(textoNoIdioma(passo, "en"), portugues);
    assert.equal(textoNoIdioma(passo, "es"), portugues);
  });

  const ordinais: [andar: string, ingles: string][] = [
    ["1º andar", "1st floor"],
    ["2º andar", "2nd floor"],
    ["3º andar", "3rd floor"],
    ["11º andar", "11th floor"],
    ["12º andar", "12th floor"],
    ["13º andar", "13th floor"],
    ["21º andar", "21st floor"],
    ["22º andar", "22nd floor"],
    // O campo "Andar" é digitado à mão.
    ["22° andar", "22nd floor"],
    ["22o andar", "22nd floor"],
    ["22 andar", "22nd floor"],
    ["22º Andar", "22nd floor"],
  ];
  for (const [andar, ingles] of ordinais) {
    it(`"${andar}" sai como "${ingles}"`, () => {
      assert.equal(
        subaAo(guiaNoPredio(dfPlaza, { ANDAR: andar }), "en"),
        `Go up to the <strong>${ingles}</strong>, apartment <strong>2202</strong>.`,
      );
    });
  }
});

describe("Marcador {{CHECKOUT_HORA}} em inglês", () => {
  /** O passo 1 do check-out ("O horário limite de saída é…"), lido num idioma. */
  const passo1 = (guia: Apartment, idioma: Lang) => textoNoIdioma(textosDaSaida(guia)[1], idioma);

  const horarios: [hora: string, ingles: string][] = [
    ["11h", "11am"],
    ["10h30", "10:30am"],
    ["11h00", "11am"],
    ["12h", "12pm"],
    ["14h", "2pm"],
    ["10:00", "10am"],
  ];
  for (const [hora, ingles] of horarios) {
    it(`"${hora}" sai como "${ingles}"`, () => {
      assert.equal(
        passo1(guiaNoPredio(dfPlaza, { CHECKOUT_HORA: hora }), "en"),
        `<strong>Check-out is until ${ingles}</strong>. Need a late checkout? Message the host.`,
      );
    });
  }

  it("horário fora do formato sai como foi digitado", () => {
    assert.equal(
      passo1(guiaNoPredio(dfPlaza, { CHECKOUT_HORA: "meio-dia" }), "en"),
      "<strong>Check-out is until meio-dia</strong>. Need a late checkout? Message the host.",
    );
  });

  it("o espanhol do horário fica como está", () => {
    assert.equal(
      passo1(guiaNoPredio(dfPlaza, { CHECKOUT_HORA: "14h" }), "es"),
      "La <strong>hora límite de salida es a las 14h</strong>. ¿Necesitas late check-out? Habla con la anfitriona.",
    );
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
    assert.equal(textoNoIdioma(passo1, "en"), "Please leave by <strong>11am</strong>.");
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

describe("Texto atual do seed do DF Plaza sem inglês", () => {
  const textos: [pt: string, en: string][] = [
    [
      "<strong>Não esqueça o Cartão Branco</strong> antes de descer para guardar o carro. Perda ou não devolução: reposição de <strong>R$ 300</strong>, cobrada pelo condomínio.",
      "<strong>Don't forget the White Card</strong> before going down to park. Loss or non-return: <strong>R$ 300</strong> replacement fee, charged by the building.",
    ],
    [
      "Deixe o <strong>Cartão Branco</strong> de garagem sobre a mesa de jantar (em caso de não devolução, o condomínio cobra R$ 300 pela reposição).",
      "Leave the <strong>White garage Card</strong> on the dining table (if it isn't returned, the building charges R$ 300 for a replacement).",
    ],
  ];
  for (const [pt, en] of textos) {
    it(`"${pt.slice(0, 40)}…" sai no inglês do seed, com o en vazio ou igual ao pt`, () => {
      assert.equal(textoNoIdioma({ pt, en: "" }, "en"), en);
      assert.equal(textoNoIdioma({ pt, en: pt }, "en"), en);
    });
  }
});

describe("Texto sem chave no dicionário e sem inglês digitado", () => {
  it("texto igual a um nome herdado de Object (\"constructor\", \"toString\") sai como está", () => {
    for (const pt of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      assert.equal(textoNoIdioma(semIngles(pt), "en"), pt);
      assert.equal(textoNoIdioma(semIngles(pt), "es"), pt);
    }
  });

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

/**
 * Apartamento do modo antigo no DF Plaza (prédio ligado e sem ajustes): o
 * check-in e o check-out ficaram gravados como cópia do modelo, preenchida
 * antes do dicionário inglês. Onde o modelo não tinha inglês, o `en` da cópia é
 * o português preenchido; o andar ficou "22º andar" também no inglês; o
 * espanhol veio do dicionário espanhol.
 */
function apartamentoModoAntigo(): Apartment {
  return {
    ...starterContent("Apartamento", "2202", "Residencial DF Plaza"),
    vars,
    checkin: {
      sub: {
        pt: "Da portaria até a porta do apartamento.",
        en: "From the lobby to your apartment door.",
        es: "Desde la recepción hasta la puerta del apartamento.",
      },
      cards: [
        PREREQUISITE_CARD,
        {
          id: "t:entrando-no-predio",
          title: { pt: "Entrando no prédio", en: "Entering the building", es: "Entrando al edificio" },
          steps: [
            {
              n: "3",
              body: {
                pt: "Suba ao <strong>22º andar</strong>, apartamento <strong>2202</strong>.",
                en: "Go up to the <strong>22º andar</strong>, apartment <strong>2202</strong>.",
                es: "Sube al <strong>22º andar</strong>, apartamento <strong>2202</strong>.",
              },
            },
          ],
        },
        {
          id: "t:chegou-de-carro",
          title: { pt: "Chegou de carro?", en: "Chegou de carro?", es: "¿Llegas en auto?" },
          steps: [],
          video: {
            src: "/media/como-estacionar.mp4",
            label: {
              pt: "▶ Tutorial em vídeo · como chegar e estacionar",
              en: "▶ Tutorial em vídeo · como chegar e estacionar",
              es: "▶ Tutorial en video · cómo llegar y estacionar",
            },
          },
        },
      ],
    },
    checkout: {
      sub: {
        pt: "Alguns passos rápidos antes de você sair. Boa viagem!",
        en: "Alguns passos rápidos antes de você sair. Boa viagem!",
        es: "Unos pasos rápidos antes de irte. ¡Buen viaje!",
      },
      steps: [
        {
          n: "1",
          body: {
            pt: "O <strong>horário limite de saída é 11h</strong>. Precisa de late checkout? Fale com a anfitriã.",
            en: "O <strong>horário limite de saída é 11h</strong>. Precisa de late checkout? Fale com a anfitriã.",
            es: "La <strong>hora límite de salida es a las 11h</strong>. ¿Necesitas late check-out? Habla con la anfitriona.",
          },
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
          body: {
            pt: "Feche as janelas, desligue o ar-condicionado e confira se não esqueceu nada. É só fechar a porta ao sair.",
            en: "Feche as janelas, desligue o ar-condicionado e confira se não esqueceu nada. É só fechar a porta ao sair.",
            es: "Cierra las ventanas, apaga el aire acondicionado y revisa que no olvides nada. Solo cierra la puerta al salir.",
          },
        },
      ],
    },
  };
}

describe("Conversão do modo antigo: a cópia sem o inglês do dicionário não vira ajuste", () => {
  it("o check-in gravado não vira ajuste em nenhum cartão", () => {
    const { patches } = legacyToPatches(apartamentoModoAntigo(), dfPlaza, {}, true);
    assert.equal(patches.checkin, undefined);
  });

  it("o check-out gravado não vira ajuste em nenhum passo", () => {
    const { patches } = legacyToPatches(apartamentoModoAntigo(), dfPlaza, {}, true);
    assert.equal(patches.checkout, undefined);
  });

  it("depois de convertido, o guia em inglês mostra o andar e os passos de saída em inglês", () => {
    const conteudo = apartamentoModoAntigo();
    const { patches } = legacyToPatches(conteudo, dfPlaza, {}, true);
    const guia = guideContentFromStored(conteudo, dfPlaza, { patches });
    assert.equal(
      textoNoIdioma(cartao(guia, "t:entrando-no-predio").steps[0].body, "en"),
      "Go up to the <strong>22nd floor</strong>, apartment <strong>2202</strong>.",
    );
    assert.deepEqual(lidos(textosDaSaida(guia), "en"), [
      "A few quick steps before you go. Safe travels!",
      "<strong>Check-out is until 11am</strong>. Need a late checkout? Message the host.",
      "Close the windows, turn off the A/C and double-check for forgotten items. Just shut the door on your way out.",
    ]);
  });
});

describe("Gravação do cadastro: editores do check-in e do check-out no prédio sem inglês", () => {
  it("o editor do check-out abre com o inglês do dicionário no passo sem inglês", () => {
    const form = abrirEditor(formularioNoPredio({}), dfPlaza, "checkout");
    assert.equal(
      form.checkoutOverride?.steps[2].body.en,
      "Close the windows, turn off the A/C and double-check for forgotten items. Just shut the door on your way out.",
    );
  });

  it("editor do check-out aberto e sem edição: salvar não gera ajuste", () => {
    const form = abrirEditor(formularioNoPredio({}), dfPlaza, "checkout");
    assert.equal(buildOverrides(form, dfPlaza).patches?.checkout, undefined);
  });

  it("editor do check-in aberto e sem edição: salvar não gera ajuste", () => {
    const form = abrirEditor(formularioNoPredio({}), dfPlaza, "checkin");
    assert.equal(buildOverrides(form, dfPlaza).patches?.checkin, undefined);
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

describe("Capa: a legenda do andar em espanhol", () => {
  /** A legenda do andar na Capa de um apartamento cadastrado no prédio, lida num idioma. */
  function legendaDoAndar(andar: string, idioma: Lang): string {
    const gravado = buildApartmentContent(formularioNoPredio({ floor: andar }), "Anfitriã", undefined, dfPlaza);
    const guia = guideContentFromStored(gravado, dfPlaza, { patches: {} });
    const fato = guia.hero.facts.find((f) => f.v.pt === andar);
    assert.ok(fato, `a Capa não tem a legenda "${andar}"`);
    return textoNoIdioma(fato.v, idioma);
  }

  it("\"22º andar\" sem tradução sai \"Piso 22\" em espanhol, e não no inglês do dicionário", () => {
    assert.equal(legendaDoAndar("22º andar", "es"), "Piso 22");
    assert.equal(legendaDoAndar("22º andar", "en"), "22nd floor");
    assert.equal(legendaDoAndar("22º andar", "pt"), "22º andar");
  });

  it("aceita as mesmas grafias do inglês", () => {
    assert.equal(legendaDoAndar("5° andar", "es"), "Piso 5");
    assert.equal(legendaDoAndar("5 Andar", "es"), "Piso 5");
  });
});
