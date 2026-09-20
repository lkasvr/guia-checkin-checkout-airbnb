"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import type { Step } from "@/data/types";
import { LANGS, useLang, type Lang } from "@/lib/i18n";

/** Cartão base (borda + fundo + sombra sutil), compartilhado entre guia e arrival. */
export const CARD =
  "mb-3.5 overflow-hidden rounded-[22px] border border-line bg-card shadow-[0_1px_0_rgb(59_45_36/0.04)]";
/** Bolinha numerada dos passos (check-in, acordeões, arrival). */
export const DOT =
  "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-blush font-display text-[17px] text-coffee";

/** Renderiza texto rico confiável (nosso próprio conteúdo) com <strong>, .hint e .chatlink. */
export function Rich({
  html,
  as: Tag = "span",
  className = "",
}: {
  html: string;
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag
      className={`rich ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** Revela o conteúdo suavemente ao entrar na viewport (respeita reduced-motion). */
export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ type: "spring", stiffness: 80, damping: 18 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Copiar texto com aviso na tela ("Senha copiada ✓"). Devolve `copy(texto)` e o
 * `toast` pra renderizar uma vez no componente. Funciona também onde a área de
 * transferência moderna é bloqueada (WebViews, http).
 */
export function useCopy() {
  const { t } = useLang();
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const show = useCallback((msg: string) => {
    setMessage(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2200);
  }, []);

  const copy = useCallback(
    async (text: string, label?: { pt: string; en: string; es: string }) => {
      const ok = label ? t(label) : t({ pt: "Copiado ✓", en: "Copied ✓", es: "Copiado ✓" });
      const fail = t({
        pt: "Toque e segure para copiar",
        en: "Tap and hold to copy",
        es: "Toca y mantén presionado para copiar",
      });
      try {
        await navigator.clipboard.writeText(text);
        show(ok);
      } catch {
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          show(ok);
        } catch {
          show(fail);
        }
      }
      if (typeof navigator.vibrate === "function") navigator.vibrate(12);
    },
    [t, show],
  );

  const toast = (
    <div
      role="status"
      className={`fixed bottom-6 left-1/2 z-[99] max-w-[90vw] -translate-x-1/2 rounded-full bg-ink px-[22px] py-3 text-center text-[15px] font-semibold text-bg transition-all duration-300 ${
        message ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-20 opacity-0"
      }`}
    >
      {message}
    </div>
  );
  return { copy, toast };
}

/** Lista de passos com bolinha numerada — chegada, saída e acordeões da casa. */
export function Steps({
  steps,
  className = "text-[16.5px]",
}: {
  steps: Step[];
  className?: string;
}) {
  const { t } = useLang();
  return (
    <ol className="list-none">
      {steps.map((s, i) => (
        <li
          key={i}
          className="flex items-start gap-3.5 py-3 [&+li]:border-t [&+li]:border-dashed [&+li]:border-line"
        >
          <span className={`${DOT} mt-0.5`}>{s.n}</span>
          <Rich as="p" html={t(s.body)} className={className} />
        </li>
      ))}
    </ol>
  );
}

/** Cabeçalho de seção: bolinha numerada + título display. */
export function SectionHead({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-baseline gap-3.5">
      <span className="flex h-10 w-10 shrink-0 translate-y-1.5 items-center justify-center rounded-full border border-terra font-display text-[19px] text-terra">
        {n}
      </span>
      <h2 className="font-display text-[clamp(34px,9vw,46px)] leading-[1.05] font-normal">
        {children}
      </h2>
    </div>
  );
}

/** Seletor de idioma PT/EN. */
/** Bandeira em SVG: o emoji de bandeira não aparece no Windows, o SVG aparece em qualquer aparelho. */
function Flag({ lang }: { lang: Lang }) {
  const cls =
    "h-[14px] w-[20px] shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgb(59_45_36/0.18)]";
  if (lang === "pt") {
    return (
      <svg viewBox="0 0 20 14" className={cls} aria-hidden>
        <rect width="20" height="14" fill="#009c3b" />
        <polygon points="10,1.6 18.4,7 10,12.4 1.6,7" fill="#ffdf00" />
        <circle cx="10" cy="7" r="3.3" fill="#002776" />
      </svg>
    );
  }
  if (lang === "en") {
    return (
      <svg viewBox="0 0 20 14" className={cls} aria-hidden>
        <rect width="20" height="14" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12].map((y) => (
          <rect key={y} y={y} width="20" height="1.08" fill="#b22234" />
        ))}
        <rect width="9" height="7.6" fill="#3c3b6e" />
        {[1.6, 4.1, 6.6].flatMap((x) =>
          [1.4, 3.4, 5.4].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.45" fill="#fff" />),
        )}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 14" className={cls} aria-hidden>
      <rect width="20" height="14" fill="#c60b1e" />
      <rect y="3.5" width="20" height="7" fill="#ffc400" />
    </svg>
  );
}

const LANG_LABEL: Record<Lang, string> = { pt: "Português", en: "English", es: "Español" };

/** Seletor de idioma PT/EN/ES, com a bandeira de cada um. */
export function LangToggle() {
  const { lang, setLang } = useLang();
  const base =
    "flex min-h-[38px] items-center gap-1.5 rounded-full px-3 text-[13px] font-bold tracking-[0.04em] transition-transform active:scale-95";
  return (
    <div
      role="group"
      aria-label="Idioma / Language / Idioma"
      className="flex gap-0.5 rounded-full border border-line bg-[rgb(255_253_249/0.9)] p-[3px] backdrop-blur-sm"
    >
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          aria-label={LANG_LABEL[l]}
          title={LANG_LABEL[l]}
          onClick={() => setLang(l)}
          className={`${base} ${lang === l ? "bg-ink text-bg" : "text-soft"}`}
        >
          <Flag lang={l} />
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
