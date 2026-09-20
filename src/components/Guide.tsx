"use client";

import { MotionConfig } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Apartment, NavItem } from "@/data/types";
import type { StayInfo } from "@/lib/apartments";
import { LanguageProvider, useLang } from "@/lib/i18n";
import { StayBanner } from "@/components/stay";
import {
  Amenities,
  CheckIn,
  Checkout,
  Contacts,
  Dining,
  Footer,
  Hero,
  Home,
  Location,
  Rules,
  Tourism,
  Wifi,
} from "@/components/sections";

/**
 * Chip/atalho da saída. É a única entrada de navegação que não vem do conteúdo
 * do tenant: a seção existe para todo apartamento, mas `ap.nav` (JSONB) foi
 * semeado antes dela existir. Dívida assumida — mover o rótulo para o conteúdo
 * exigiria migrar o JSONB de todos os tenants.
 */
const SAIDA: NavItem = { href: "#saida", label: { pt: "Saída", en: "Check-out", es: "Salida" } };
const CHECKIN_HREF = "#checkin";

export default function Guide({
  apartment,
  stay,
}: {
  apartment: Apartment;
  stay: StayInfo | null;
}) {
  return (
    <LanguageProvider initial={apartment.lang.default}>
      <MotionConfig reducedMotion="user">
        <GuideBody ap={apartment} stay={stay} />
      </MotionConfig>
    </LanguageProvider>
  );
}

function GuideBody({ ap, stay }: { ap: Apartment; stay: StayInfo | null }) {
  useServiceWorker();

  // No dia do check-out a saída assume o primeiro lugar; no resto do tempo
  // fecha o guia, porque o hóspede pode querer sair antes.
  const checkoutFirst = stay?.isCheckoutDay ?? false;
  const saida = ap.checkout ? <Checkout ap={ap} /> : null;

  return (
    <>
      <main className="mx-auto max-w-[640px] px-[18px] pb-28">
        <Hero ap={ap} />
        {stay && <StayBanner stay={stay} unit={ap.unit} />}
        <Nav ap={ap} checkoutFirst={checkoutFirst} />

        {checkoutFirst && saida}
        <Location ap={ap} />
        <CheckIn ap={ap} />
        <Wifi ap={ap} />
        <Rules ap={ap} />
        <Contacts ap={ap} />
        <Home ap={ap} />
        <Amenities ap={ap} />
        <Tourism ap={ap} />
        <Dining ap={ap} />
        {!checkoutFirst && saida}

        <Footer ap={ap} />
      </main>

      <FloatingJump ap={ap} checkoutFirst={checkoutFirst} />
    </>
  );
}

/* Navegação fixa com "scroll-spy": destaca a seção visível e centraliza o chip. */
function Nav({ ap, checkoutFirst }: { ap: Apartment; checkoutFirst: boolean }) {
  const { t } = useLang();
  const items = useMemo<NavItem[]>(() => {
    if (!ap.checkout) return ap.nav;
    return checkoutFirst ? [SAIDA, ...ap.nav] : [...ap.nav, SAIDA];
  }, [ap.nav, ap.checkout, checkoutFirst]);

  const [active, setActive] = useState(items[0]?.href.slice(1) ?? "");
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const els = items
      .map((n) => document.getElementById(n.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

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
        {items.map((n) => {
          const id = n.href.slice(1);
          const on = id === active;
          return (
            <a
              key={id}
              href={n.href}
              data-nav={id}
              className={`flex min-h-[42px] shrink-0 items-center rounded-full border px-4 text-[14.5px] font-semibold tracking-[0.02em] transition-colors active:scale-95 ${
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

/**
 * Atalhos flutuantes para chegada e saída. A saída fica no fim do guia, então
 * sem isso o hóspede que quer sair precisaria rolar tudo. No dia do check-out
 * ela vira o botão primário.
 */
function FloatingJump({ ap, checkoutFirst }: { ap: Apartment; checkoutFirst: boolean }) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  const shownRef = useRef(false);

  useEffect(() => {
    // O evento de scroll dispara dezenas de vezes por gesto; só toca no estado
    // quando cruza o limiar.
    const onScroll = () => {
      const next = window.scrollY > 360;
      if (next === shownRef.current) return;
      shownRef.current = next;
      setShow(next);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // O rótulo da chegada vem do conteúdo do tenant, não de uma constante daqui.
  const chegada = ap.nav.find((n) => n.href === CHECKIN_HREF);
  if (!ap.checkout || !chegada) return null;

  const primary = checkoutFirst ? SAIDA : chegada;
  const secondary = checkoutFirst ? chegada : SAIDA;
  const base =
    "flex min-h-[44px] items-center rounded-full px-[18px] text-[14px] font-bold no-underline transition-transform active:scale-95";

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(14px,env(safe-area-inset-bottom))] transition-all duration-300 ${
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      aria-hidden={!show}
    >
      <div
        className={`flex gap-1 rounded-full border border-line bg-[rgb(255_253_249/0.92)] p-[5px] shadow-[0_6px_24px_rgb(59_45_36/0.16)] backdrop-blur-md ${
          show ? "pointer-events-auto" : ""
        }`}
      >
        <a
          href={primary.href}
          tabIndex={show ? 0 : -1}
          className={`${base} bg-ink text-bg`}
        >
          {t(primary.label)}
        </a>
        <a
          href={secondary.href}
          tabIndex={show ? 0 : -1}
          className={`${base} text-soft`}
        >
          {t(secondary.label)}
        </a>
      </div>
    </div>
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
