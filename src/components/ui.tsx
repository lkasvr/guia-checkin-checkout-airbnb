"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ElementType, ReactNode } from "react";
import { useLang } from "@/lib/i18n";

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
