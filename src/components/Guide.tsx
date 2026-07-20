"use client";

import { MotionConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Apartment } from "@/data/types";
import { LanguageProvider, useLang } from "@/lib/i18n";
import {
  Amenities,
  CheckIn,
  Contacts,
  Dining,
  Footer,
  Hero,
  Home,
  Rules,
  Tourism,
  Wifi,
} from "@/components/sections";

export default function Guide({ apartment }: { apartment: Apartment }) {
  return (
    <LanguageProvider initial={apartment.lang.default}>
      <MotionConfig reducedMotion="user">
        <GuideBody ap={apartment} />
      </MotionConfig>
    </LanguageProvider>
  );
}

function GuideBody({ ap }: { ap: Apartment }) {
  useServiceWorker();
  return (
    <main className="mx-auto max-w-[640px] px-[18px] pb-10">
      <Hero ap={ap} />
      <Nav ap={ap} />
      <CheckIn ap={ap} />
      <Wifi ap={ap} />
      <Rules ap={ap} />
      <Contacts ap={ap} />
      <Home ap={ap} />
      <Amenities ap={ap} />
      <Tourism ap={ap} />
      <Dining ap={ap} />
      <Footer ap={ap} />
    </main>
  );
}

/* Navegação fixa com "scroll-spy": destaca a seção visível e centraliza o chip. */
function Nav({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  const [active, setActive] = useState(ap.nav[0].href.slice(1));
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ids = ap.nav.map((n) => n.href.slice(1));
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ap.nav]);

  useEffect(() => {
    const el = trackRef.current?.querySelector<HTMLElement>(`[data-nav="${active}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  return (
    <nav
      aria-label="Seções do guia"
      className="sticky top-0 z-50 -mx-[18px] mt-3.5 flex items-center bg-[linear-gradient(var(--color-bg)_82%,rgb(250_245_238/0))] pb-3.5 pt-2.5"
    >
      <div
        ref={trackRef}
        className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto px-[18px]"
      >
        {ap.nav.map((n) => {
          const id = n.href.slice(1);
          const on = id === active;
          return (
            <a
              key={id}
              href={n.href}
              data-nav={id}
              className={`shrink-0 rounded-full border px-4 py-[9px] text-[14.5px] font-semibold tracking-[0.02em] transition-colors active:scale-95 ${
                on
                  ? "border-terra bg-terra text-white"
                  : "border-line bg-card text-soft"
              }`}
            >
              {t(n.label)}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

/* Registra o service worker (só em https) e auto-recarrega em atualização. */
function useServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || location.protocol !== "https:") return;

    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    const onChange = () => {
      if (!hadController || refreshing) return;
      refreshing = true;
      location.reload();
    };
    const onPrompt = (e: Event) => e.preventDefault();

    navigator.serviceWorker.addEventListener("controllerchange", onChange);
    window.addEventListener("beforeinstallprompt", onPrompt);
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.update())
      .catch(() => {});

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onChange);
      window.removeEventListener("beforeinstallprompt", onPrompt);
    };
  }, []);
}
