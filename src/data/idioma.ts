import type { L } from "@/data/types";
import { translateEn } from "@/data/en";
import { translateEs } from "@/data/es";

export type Lang = "pt" | "en" | "es";

/**
 * O inglês que alguém digitou: o `en` gravado, quando não é vazio nem igual
 * ao `pt`. "`en` igual ao `pt`" conta como sem inglês porque é o que o editor
 * grava com "Inglês (opcional)" em branco (`toL`), e o editor o mostra vazio ao
 * reabrir (`fromL`) pela mesma regra.
 */
export function inglesDigitado(l: L): string | undefined {
  return l.en && l.en !== l.pt ? l.en : undefined;
}

/**
 * O inglês que se conhece de um texto: o digitado (`inglesDigitado`); senão o
 * do dicionário inglês (`src/data/en.ts`), procurado pelo `pt`. `undefined`
 * quando não há nenhum dos dois: o texto não tem inglês.
 */
export function inglesConhecido(l: L): string | undefined {
  return inglesDigitado(l) ?? translateEn(l.pt);
}

/**
 * O texto que o hóspede lê num idioma. O `t` do `LanguageProvider` só chama
 * esta função, para que o que o guia mostra possa ser testado sem montar a
 * página.
 *
 * - Inglês: o inglês conhecido (`inglesConhecido`); senão o `pt`.
 * - Espanhol: o `es` gravado; senão o dicionário espanhol; senão o inglês
 *   resolvido acima.
 */
export function textoNoIdioma(l: L, idioma: Lang): string {
  if (idioma === "pt") return l.pt;
  if (idioma === "en") return inglesConhecido(l) ?? l.pt;
  return l.es ?? translateEs(l.pt) ?? textoNoIdioma(l, "en");
}
