"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";
import type { Step } from "@/data/types";
import { useLang } from "@/lib/i18n";

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
export function LangToggle() {
  const { lang, setLang } = useLang();
  const base =
    "rounded-full px-3.5 py-[7px] text-[13.5px] font-bold tracking-[0.04em] transition-transform active:scale-95";
  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className="flex gap-0.5 rounded-full border border-line bg-[rgb(255_253_249/0.9)] p-[3px] backdrop-blur-sm"
    >
      <button
        type="button"
        aria-pressed={lang === "pt"}
        onClick={() => setLang("pt")}
        className={`${base} ${lang === "pt" ? "bg-ink text-bg" : "text-soft"}`}
      >
        PT
      </button>
      <button
        type="button"
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
        className={`${base} ${lang === "en" ? "bg-ink text-bg" : "text-soft"}`}
      >
        EN
      </button>
    </div>
  );
}
