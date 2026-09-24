import type { Alert, Apartment, ApartmentVars, CheckinCard, L, Step } from "@/data/types";
import type { BuildingTemplate } from "@/data/buildingModel";
import { withPrerequisiteCard } from "@/data/prerequisiteCard";
import { translateEs } from "@/data/es";
import { portariaRefToken } from "@/data/towers";

type DoorCode = Apartment["checkin"]["doorCode"];
/** Valor de um marcador: igual em qualquer idioma (torre, vaga…) ou um por idioma (frases prontas). */
type TokenValue = string | L;
type Tokens = Record<string, TokenValue>;

const CHAT_LINK =
  '<a class="chatlink" href="https://www.airbnb.com/guest/messages" target="_blank" rel="noopener">chat</a>';

/** Troca `{{TOKEN}}` pelo valor correspondente — usado no template de check-in/check-out do prédio. */
function fillTokens(text: string, tokens: Tokens, lang: "pt" | "en" | "es"): string {
  return Object.entries(tokens).reduce((acc, [key, value]) => {
    const v = typeof value === "string" ? value : (value[lang] ?? value.pt);
    return acc.replaceAll(`{{${key}}}`, v);
  }, text);
}
/**
 * O espanhol é procurado no dicionário a partir do texto do *template*, com os
 * `{{TOKEN}}` ainda por preencher — assim um mesmo texto vale para todo
 * apartamento, seja qual for a torre/andar/vaga dele. Sem isso, cada
 * apartamento gerava um texto em português diferente (a torre certa já
 * embutida) que nunca batia com a chave do dicionário, e o espanhol caía
 * silenciosamente para o inglês.
 */
function fillL(l: L, tokens: Tokens): L {
  const es = l.es ?? translateEs(l.pt);
  return {
    pt: fillTokens(l.pt, tokens, "pt"),
    en: fillTokens(l.en, tokens, "en"),
    ...(es !== undefined ? { es: fillTokens(es, tokens, "es") } : {}),
  };
}
function fillSteps(steps: Step[], tokens: Tokens): Step[] {
  return steps.map((s) => ({ ...s, body: fillL(s.body, tokens) }));
}
function fillAlerts(alerts: Alert[] | undefined, tokens: Tokens) {
  return alerts?.map((a) => ({ ...a, body: fillL(a.body, tokens) }));
}
function fillCard(card: CheckinCard, tokens: Tokens): CheckinCard {
  return {
    ...card,
    title: fillL(card.title, tokens),
    tag: card.tag && fillL(card.tag, tokens),
    steps: fillSteps(card.steps, tokens),
    alerts: fillAlerts(card.alerts, tokens),
    video: card.video && { ...card.video, label: fillL(card.video.label, tokens) },
  };
}

export const varsToTokens = (v: ApartmentVars): Record<string, string> => ({
  TORRE: v.TORRE,
  ANDAR: v.ANDAR,
  UNIDADE: v.UNIDADE,
  VAGA: v.VAGA,
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

/** Check-in do modelo já com torre/andar/unidade/vaga deste apartamento e o cartão "Antes de chegar" no topo. */
export function filledCheckin(
  building: BuildingTemplate,
  vars: ApartmentVars,
  doorCode?: DoorCode,
): Apartment["checkin"] {
  const tokens: Tokens = {
    ...varsToTokens(vars),
    SENHA_FECHADURA: doorCodeToken(doorCode),
    PORTARIA_REF: portariaRefToken(building.location?.intercom, vars.TORRE),
  };
  const ci = building.checkinTemplate;
  return {
    sub: fillL(ci.sub, tokens),
    cards: withPrerequisiteCard(ci.cards.map((c) => fillCard(c, tokens))),
  };
}

export function filledCheckout(
  building: BuildingTemplate,
  vars: ApartmentVars,
): NonNullable<Apartment["checkout"]> {
  const tokens = varsToTokens(vars);
  const co = building.checkoutTemplate;
  return { sub: fillL(co.sub, tokens), steps: fillSteps(co.steps, tokens) };
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
} {
  const FIXED_CAPTIONS = ["Garagem", "Capacidade máxima", "Check-in", "Check-out"];
  const find = (caption: string) => facts.find((f) => f.v.pt === caption);
  // A legenda do fact de torre/andar não é fixa (é o próprio andar) — é
  // reconhecido por eliminação: o único fact cuja legenda não é uma das fixas.
  const towerFact = facts.find((f) => !FIXED_CAPTIONS.includes(f.v.pt));
  const guests = find("Capacidade máxima");
  return {
    tower: towerFact?.k.pt ?? "",
    floor: towerFact && towerFact.v.pt !== "—" ? towerFact.v.pt : "",
    parking: find("Garagem")?.k.pt ?? "",
    maxGuests: guests ? guests.k.pt.replace(/\s*hóspedes$/, "") : "",
    checkinTime: find("Check-in")?.k.pt ?? "",
    checkoutTime: find("Check-out")?.k.pt ?? "",
  };
}

/** Marcadores deste apartamento: os gravados ou, em conteúdo antigo, lidos dos quadradinhos da capa. */
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
