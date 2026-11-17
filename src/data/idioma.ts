import type { L } from "@/data/types";
import { translateEs } from "@/data/es";

export type Lang = "pt" | "en" | "es";

/**
 * O texto que o hóspede lê num idioma. O `t` do `LanguageProvider` só chama
 * esta função, para que o que o guia mostra possa ser testado sem montar a
 * página.
 *
 * Espanhol: o próprio conteúdo (`es`), depois o dicionário dos textos padrão
 * e, sem tradução, o inglês.
 */
export function textoNoIdioma(l: L, idioma: Lang): string {
  if (idioma === "pt") return l.pt;
  if (idioma === "en") return l.en;
  return l.es ?? translateEs(l.pt) ?? l.en;
}
