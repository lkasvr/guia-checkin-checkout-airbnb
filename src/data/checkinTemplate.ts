import type { Alert, Apartment, ApartmentVars, CheckinCard, CleanVars, L, Step } from "@/data/types";
import type { BuildingTemplate } from "@/data/buildingModel";
import { withPrerequisiteCard } from "@/data/prerequisiteCard";
import { translateEs } from "@/data/es";
import { inglesConhecido, textoNoIdioma, type Lang } from "@/data/idioma";
import { portariaRefToken } from "@/data/towers";
import { cleanCheckoutTime } from "@/lib/checkoutTime";
import { cleanUnit } from "@/lib/unit";

type DoorCode = Apartment["checkin"]["doorCode"];
/** Valor de um marcador: igual em qualquer idioma (torre, vaga…) ou um por idioma (frases prontas). */
type TokenValue = string | L;
type Tokens = Record<string, TokenValue>;

const CHAT_LINK =
  '<a class="chatlink" href="https://www.airbnb.com/guest/messages" target="_blank" rel="noopener">chat</a>';

/** Troca `{{TOKEN}}` pelo valor correspondente — usado no template de check-in/check-out do prédio. */
function fillTokens(text: string, tokens: Tokens, lang: Lang): string {
  return Object.entries(tokens).reduce((acc, [key, value]) => {
    const v = typeof value === "string" ? value : (value[lang] ?? value.pt);
    return acc.replaceAll(`{{${key}}}`, v);
  }, text);
}
type Fill = (l: L) => L;

function fillSteps(steps: Step[], fill: Fill): Step[] {
  return steps.map((s) => ({ ...s, body: fill(s.body) }));
}
function fillAlerts(alerts: Alert[] | undefined, fill: Fill) {
  return alerts?.map((a) => ({ ...a, body: fill(a.body) }));
}
function fillCard(card: CheckinCard, fill: Fill): CheckinCard {
  return {
    ...card,
    title: fill(card.title),
    tag: card.tag && fill(card.tag),
    steps: fillSteps(card.steps, fill),
    alerts: fillAlerts(card.alerts, fill),
    video: card.video && { ...card.video, label: fill(card.video.label) },
  };
}

/** Andar/vaga com tradução vira um valor por idioma; sem tradução segue igual em todos (como sempre foi). */
const withTranslation = (pt: string, l: L | undefined): TokenValue => (l ? { pt, en: l.en, es: l.es } : pt);

/**
 * De onde vem o inglês do modelo ao preencher: o do texto, com os marcadores
 * ainda por preencher (`undefined` quando o texto não tem inglês), e, se
 * houver, os valores dos marcadores próprios para esse inglês.
 */
type FonteDoIngles = {
  texto: (l: L) => string | undefined;
  marcadores?: (tokens: Tokens) => Tokens;
};

/** O valor de um marcador como texto do guia: o igual em todo idioma vira um texto sem tradução. */
const comoTexto = (v: TokenValue): L => (typeof v === "string" ? { pt: v, en: v } : v);

/**
 * O guia, os editores e o cálculo dos ajustes: o inglês do texto é o digitado
 * ou o do dicionário (`inglesConhecido`), e o {{ANDAR}} em inglês é o
 * digitado ou, sem ele, o do dicionário ("22º andar" → "22nd floor"), pela
 * mesma regra do guia (`textoNoIdioma`).
 */
const DICIONARIO: FonteDoIngles = {
  texto: inglesConhecido,
  marcadores: (tokens) => ({ ...tokens, ANDAR: textoNoIdioma(comoTexto(tokens.ANDAR), "en") }),
};

/** A cópia do modo antigo: o `en` gravado no modelo e os marcadores de sempre (ver `legacyCheckinCopy`). */
const GRAVADO: FonteDoIngles = { texto: (l) => l.en };

/**
 * O preenchimento de cada texto do modelo com os marcadores deste apartamento.
 *
 * O espanhol e o inglês sem tradução são procurados nos dicionários a partir
 * do texto do modelo, com os marcadores ainda por preencher — assim um mesmo
 * texto vale para todo apartamento, seja qual for a torre/andar/vaga dele. Sem
 * isso, cada apartamento gerava um texto em português diferente (a torre certa
 * já embutida) que nunca batia com a chave do dicionário, e o espanhol caía
 * silenciosamente para o inglês, e o inglês para o português.
 *
 * Texto sem inglês sai em inglês igual ao português, marcadores inclusive:
 * nenhum valor em inglês entra no meio do português, nem o andar ("Suba ao
 * 22nd floor") nem a senha ("digite the code sent via chat").
 */
function filler(tokens: Tokens, fonte: FonteDoIngles): Fill {
  const marcadoresEmIngles = fonte.marcadores?.(tokens) ?? tokens;
  return (l) => {
    const pt = fillTokens(l.pt, tokens, "pt");
    const en = fonte.texto(l);
    const es = l.es ?? translateEs(l.pt);
    return {
      pt,
      en: en === undefined ? pt : fillTokens(en, marcadoresEmIngles, "en"),
      ...(es !== undefined ? { es: fillTokens(es, tokens, "es") } : {}),
    };
  };
}

export const varsToTokens = (v: ApartmentVars): Record<string, TokenValue> => ({
  TORRE: v.TORRE,
  ANDAR: withTranslation(v.ANDAR, v.ANDAR_L),
  UNIDADE: v.UNIDADE,
  VAGA: withTranslation(v.VAGA, v.VAGA_L),
  // Único lugar do padrão de quem deixou "Check-out (horário)" vazio: vale para o
  // guia, os editores e a conversão do modo antigo, que não passa por `cleanVars`.
  CHECKOUT_HORA: v.CHECKOUT_HORA || "11h",
});

/**
 * Como o passo "digite a senha na fechadura" descreve a senha depende de como
 * este apartamento a entrega: com senha fixa, repete o código (o cartão lá
 * em cima já mostra, mas repetir no passo a passo evita a pessoa voltar e
 * procurar); sem senha fixa, é por hóspede e chega pelo chat.
 */
function doorCodeToken(doorCode: DoorCode): L {
  if (doorCode?.mode === "fixed") {
    return {
      pt: `<strong>a senha ${doorCode.code}</strong>, mostrada acima nesta página`,
      en: `<strong>the code ${doorCode.code}</strong>, shown above on this page`,
      es: `<strong>el código ${doorCode.code}</strong>, que aparece arriba en esta página`,
    };
  }
  return {
    pt: `<strong>a senha enviada pelo ${CHAT_LINK}</strong>`,
    en: `<strong>the code sent via ${CHAT_LINK}</strong>`,
    es: `<strong>el código enviado por el ${CHAT_LINK}</strong>`,
  };
}

function fillCheckinTemplate(
  building: BuildingTemplate,
  vars: ApartmentVars,
  doorCode: DoorCode,
  fonte: FonteDoIngles,
): Apartment["checkin"] {
  const tokens: Tokens = {
    ...varsToTokens(vars),
    SENHA_FECHADURA: doorCodeToken(doorCode),
    PORTARIA_REF: portariaRefToken(building.location?.intercom, vars.TORRE),
  };
  const fill = filler(tokens, fonte);
  const ci = building.checkinTemplate;
  return {
    sub: fill(ci.sub),
    cards: withPrerequisiteCard(ci.cards.map((c) => fillCard(c, fill))),
  };
}

function fillCheckoutTemplate(
  building: BuildingTemplate,
  vars: ApartmentVars,
  fonte: FonteDoIngles,
): NonNullable<Apartment["checkout"]> {
  const fill = filler(varsToTokens(vars), fonte);
  const co = building.checkoutTemplate;
  return { sub: fill(co.sub), steps: fillSteps(co.steps, fill) };
}

/** Check-in do modelo já com torre/andar/unidade/vaga deste apartamento e o cartão "Antes de chegar" no topo. */
export function filledCheckin(
  building: BuildingTemplate,
  vars: ApartmentVars,
  doorCode?: DoorCode,
): Apartment["checkin"] {
  return fillCheckinTemplate(building, vars, doorCode, DICIONARIO);
}

export function filledCheckout(
  building: BuildingTemplate,
  vars: ApartmentVars,
): NonNullable<Apartment["checkout"]> {
  return fillCheckoutTemplate(building, vars, DICIONARIO);
}

/**
 * O check-in do modelo como um apartamento do modo antigo o guardou: a cópia
 * preenchida antes do dicionário inglês, com o inglês gravado no modelo (a
 * cópia do português, onde não há tradução) e o andar sem o dicionário. A
 * conversão do modo antigo (`legacyToPatches`) compara a cópia gravada com
 * isto: comparada com `filledCheckin`, a falta do inglês do dicionário viraria
 * ajuste e congelaria o português na versão inglesa.
 */
export function legacyCheckinCopy(building: BuildingTemplate, vars: ApartmentVars): Apartment["checkin"] {
  return fillCheckinTemplate(building, vars, undefined, GRAVADO);
}

/** O check-out do modelo como um apartamento do modo antigo o guardou (ver `legacyCheckinCopy`). */
export function legacyCheckoutCopy(
  building: BuildingTemplate,
  vars: ApartmentVars,
): NonNullable<Apartment["checkout"]> {
  return fillCheckoutTemplate(building, vars, GRAVADO);
}

/**
 * Tenta recuperar torre/andar/vaga/nº de hóspedes/horários a partir de
 * `hero.facts` — só funciona quando os facts têm o formato que o formulário
 * gera (`v.pt` bate com uma das legendas fixas abaixo); facts escritos à mão
 * (ex.: o 1305C original) não batem e ficam em branco, o que é o
 * comportamento seguro já esperado hoje.
 */
export function parseHeroFacts(facts: Apartment["hero"]["facts"]): {
  tower: string;
  floor: string;
  parking: string;
  maxGuests: string;
  checkinTime: string;
  checkoutTime: string;
  /** Tradução digitada à mão do andar/vaga ("" quando é igual ao português). */
  floorEn: string;
  floorEs: string;
  parkingEn: string;
  parkingEs: string;
} {
  const FIXED_CAPTIONS = ["Garagem", "Capacidade máxima", "Check-in", "Check-out"];
  const find = (caption: string) => facts.find((f) => f.v.pt === caption);
  // A legenda do fact de torre/andar não é fixa (é o próprio andar) — é
  // reconhecido por eliminação: o único fact cuja legenda não é uma das fixas.
  const towerFact = facts.find((f) => !FIXED_CAPTIONS.includes(f.v.pt));
  const guests = find("Capacidade máxima");
  const floorFact = towerFact && towerFact.v.pt !== "—" ? towerFact.v : undefined;
  const parkingFact = find("Garagem")?.k;
  const own = (l: L | undefined, lang: "en" | "es") => (l && l[lang] && l[lang] !== l.pt ? (l[lang] as string) : "");
  return {
    tower: towerFact?.k.pt ?? "",
    floor: towerFact && towerFact.v.pt !== "—" ? towerFact.v.pt : "",
    parking: find("Garagem")?.k.pt ?? "",
    maxGuests: guests ? guests.k.pt.replace(/\s*hóspedes$/, "") : "",
    checkinTime: find("Check-in")?.k.pt ?? "",
    checkoutTime: find("Check-out")?.k.pt ?? "",
    floorEn: own(floorFact, "en"),
    floorEs: own(floorFact, "es"),
    parkingEn: own(parkingFact, "en"),
    parkingEs: own(parkingFact, "es"),
  };
}

/**
 * Marcadores deste apartamento: os gravados ou, em conteúdo antigo, lidos dos
 * quadradinhos da capa. Saem como estão gravados; o guia os recebe limpos por
 * `cleanVars`, e a conversão do modo antigo (`legacyToPatches`) precisa deles
 * como foram digitados.
 */
export function deriveVars(content: Apartment): ApartmentVars {
  if (content.vars) return content.vars;
  const f = parseHeroFacts(content.hero.facts);
  return {
    TORRE: f.tower,
    ANDAR: f.floor,
    UNIDADE: content.unit,
    VAGA: f.parking,
    CHECKOUT_HORA: f.checkoutTime,
  };
}

/**
 * Marcadores como o guia os mostra: a unidade sem o "Ap" (`cleanUnit`) e o
 * horário de saída sem o "Até às" (`cleanCheckoutTime`). Vale nos dois pontos
 * de onde os marcadores saem para o guia, o conteúdo gravado
 * (`guideContentFromStored`) e o formulário (`varsFromInput`), para que o
 * guia, os editores e o cálculo dos ajustes concordem. Nunca na conversão do
 * modo antigo (ver `deriveVars`). Devolve `CleanVars`, o tipo que os editores e
 * o cálculo dos ajustes exigem.
 */
export function cleanVars(vars: ApartmentVars): CleanVars {
  return {
    ...vars,
    UNIDADE: cleanUnit(vars.UNIDADE),
    CHECKOUT_HORA: cleanCheckoutTime(vars.CHECKOUT_HORA),
  } as CleanVars;
}
