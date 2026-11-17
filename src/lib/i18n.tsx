"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { L } from "@/data/types";
import { textoNoIdioma, type Lang } from "@/data/idioma";

export type { Lang } from "@/data/idioma";

export const LANGS: Lang[] = ["pt", "en", "es"];

const HTML_LANG: Record<Lang, string> = { pt: "pt-BR", en: "en", es: "es" };

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** resolve um texto localizado para o idioma ativo */
  t: (v: L) => string;
};

const LangContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "guia1305c-lang";

export function LanguageProvider({
  children,
  initial = "pt",
}: {
  children: ReactNode;
  initial?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initial);

  // restaura a preferência salva (só no cliente; evita mismatch de hidratação)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- o servidor não lê localStorage: ler no efeito, depois da hidratação, é o padrão que a referência do useEffect recomenda
      if (saved === "pt" || saved === "en" || saved === "es") setLangState(saved);
    } catch {
      /* localStorage indisponível */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = HTML_LANG[l];
  }, []);

  const t = useCallback((v: L) => textoNoIdioma(v, lang), [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): Ctx {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang precisa estar dentro de <LanguageProvider>");
  return ctx;
}
