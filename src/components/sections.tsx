"use client";

import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Apartment } from "@/data/types";
import { useLang } from "@/lib/i18n";
import { CARD, LangToggle, Reveal, Rich, SectionHead, Steps, useCopy } from "@/components/ui";
import { Media } from "@/components/media";
import { isVideoUrl } from "@/lib/upload";
import { mapsEmbedUrl, mapsSearchUrl, normalizeMapsUrl, whatsappDigits } from "@/lib/maps";

/* ----------------------------- HERO ----------------------------- */

const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const heroItem: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 90, damping: 16 },
  },
};

/**
 * Proporção (largura/altura) da foto ou vídeo da capa, lida depois de carregar.
 * A capa usa isso pra acompanhar o formato de cada foto em vez de uma altura
 * fixa — foto de celular (em pé) não perde metade do topo e do rodapé.
 */
function useCoverRatio(boxRef: React.RefObject<HTMLElement | null>, src: string) {
  const [ratio, setRatio] = useState<number | null>(null);
  useEffect(() => {
    const el = boxRef.current?.querySelector<HTMLImageElement | HTMLVideoElement>("img, video");
    if (!el) return;
    const read = () => {
      const w = el instanceof HTMLVideoElement ? el.videoWidth : el.naturalWidth;
      const h = el instanceof HTMLVideoElement ? el.videoHeight : el.naturalHeight;
      if (w && h) setRatio(w / h);
    };
    const event = el instanceof HTMLVideoElement ? "loadedmetadata" : "load";
    el.addEventListener(event, read);
    // Imagem que já carregou antes da hidratação não dispara "load" de novo.
    const frame = requestAnimationFrame(read);
    return () => {
      el.removeEventListener(event, read);
      cancelAnimationFrame(frame);
    };
  }, [boxRef, src]);
  return ratio;
}

/** Ícone de cada quadradinho da capa, pela legenda (em português) que o formulário gera. */
const FACT_ICON: Record<string, string> = {
  Garagem: "🚗",
  "Capacidade máxima": "👥",
  "Check-in": "🔑",
  "Check-out": "🧳",
};

export function Hero({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  const coverRef = useRef<HTMLDivElement>(null);
  const ratio = useCoverRatio(coverRef, ap.hero.img);
  // Grade de duas colunas: quadradinhos curtos lado a lado (o último, se sobrar sozinho, ocupa a
  // linha toda); texto comprido (ex.: "Vaga rotativa (sinalizada na cor verde)") ganha a linha
  // inteira, no fim.
  const facts = ap.hero.facts.map((f, i) => ({
    f,
    long: t(f.k).length > 20,
    icon: FACT_ICON[f.v.pt] ?? (i === 0 ? "🏢" : ""),
  }));
  const orderedFacts = [...facts.filter((x) => !x.long), ...facts.filter((x) => x.long)];
  return (
    <header className="relative -mx-[18px] px-6 pb-2.5 text-left">
      <div
        ref={coverRef}
        className="relative -mx-6"
        // Altura = largura ÷ proporção da foto, entre 300px e ~450px (520px em tela larga).
        // Sem `aspect-ratio`: junto de min-height ele alarga a caixa além da tela.
        style={{
          height: `clamp(300px, calc(min(100vw, 640px) / ${ratio ?? 0.85}), min(520px, 120vw))`,
        }}
      >
        <Media
          src={ap.hero.img}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_24%]"
          autoPlayLoop
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(59_45_36/0.22)_0%,rgb(250_245_238/0)_28%,rgb(250_245_238/0)_56%,rgb(250_245_238/0.32)_76%,rgb(250_245_238/0.8)_91%,var(--color-bg)_100%)]" />
      </div>

      <div className="absolute right-4 top-4 z-[5]">
        <LangToggle />
      </div>

      <motion.div variants={heroContainer} initial="hidden" animate="show" className="mt-1.5">
        <motion.p
          variants={heroItem}
          className="text-[12px] font-bold uppercase tracking-[0.32em] text-coffee"
        >
          {t(ap.eyebrow)}
        </motion.p>
        <motion.h1
          variants={heroItem}
          className="mt-2.5 font-display text-[clamp(46px,14vw,76px)] font-normal leading-none tracking-[-0.01em]"
        >
          {t(ap.name)}
          <br />
          <span className="text-terra">{ap.unit}</span>
        </motion.h1>
        <motion.div variants={heroItem}>
          <Rich
            as="p"
            html={t(ap.hero.sub)}
            className="mt-3 max-w-[34ch] text-[16px] text-soft [&_strong]:font-semibold [&_strong]:text-ink"
          />
        </motion.div>
        <motion.div variants={heroItem} className="mt-[22px] flex flex-wrap gap-2.5">
          <a
            href="#checkin"
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-ink px-[22px] py-3.5 text-[15.5px] font-bold text-bg transition-transform active:scale-95"
          >
            {t({ pt: "Fazer check-in ↓", en: "Check in ↓", es: "Hacer check-in ↓" })}
          </a>
          <a
            href="#wifi"
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-[rgb(255_253_249/0.85)] px-[22px] py-3.5 text-[15.5px] font-bold text-ink transition-transform active:scale-95"
          >
            Wi-Fi ↓
          </a>
        </motion.div>
        <motion.div variants={heroItem} className="mt-[20px] flex flex-wrap gap-2.5">
          {orderedFacts.map(({ f, long, icon }, i) => (
            <div
              key={i}
              className={`flex min-h-[92px] min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] border border-line bg-[linear-gradient(180deg,var(--color-card),rgb(255_253_249/0.7))] px-3 py-3.5 text-center shadow-[0_1px_0_rgb(59_45_36/0.04)] ${
                long ? "basis-full" : "grow basis-[calc(50%-0.3125rem)]"
              }`}
            >
              {icon && (
                <span className="text-[19px] leading-none" aria-hidden>
                  {icon}
                </span>
              )}
              <div
                className={`max-w-full font-display leading-[1.2] text-coffee [overflow-wrap:break-word] [text-wrap:balance] ${
                  long ? "text-[18px]" : "text-[20px]"
                }`}
              >
                {t(f.k)}
              </div>
              <div className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-soft [text-wrap:balance]">
                {t(f.v)}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </header>
  );
}

/* --------------------------- LOCALIZAÇÃO ------------------------ */

/**
 * Cartão "Como chegar" logo antes do check-in: prévia do mapa + endereço +
 * botão pro Google Maps. Sem endereço nem link cadastrados não renderiza nada,
 * então guias que ainda não têm esses dados ficam exatamente como eram.
 */
export function Location({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  const address = ap.location?.address?.trim() ?? "";
  const link =
    normalizeMapsUrl(ap.location?.mapsUrl) ?? (address ? mapsSearchUrl(address) : null);
  if (!link) return null;

  const openLabel = t({ pt: "Abrir no Google Maps", en: "Open in Google Maps", es: "Abrir en Google Maps" });
  return (
    <Reveal>
      <div className="mt-[34px] overflow-hidden rounded-[22px] border border-line bg-card shadow-[0_1px_0_rgb(59_45_36/0.04)]">
        {address && (
          <div className="relative h-[178px] bg-blush">
            <span className="absolute inset-0 flex items-center justify-center text-[34px]" aria-hidden>
              📍
            </span>
            <iframe
              src={mapsEmbedUrl(address)}
              title={t({ pt: "Mapa do endereço", en: "Address map", es: "Mapa de la dirección" })}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              tabIndex={-1}
              className="pointer-events-none absolute inset-0 h-full w-full border-0"
            />
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={openLabel}
              className="absolute inset-0"
            />
          </div>
        )}
        <div className="p-[16px_18px_18px]">
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-coffee">
            📍 {t({ pt: "Como chegar", en: "Getting here", es: "Cómo llegar" })}
          </p>
          {address && (
            <p className="mt-1.5 font-display text-[21px] font-normal leading-[1.25]">{address}</p>
          )}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3.5 inline-flex min-h-[46px] items-center gap-2 rounded-full bg-ink px-[20px] py-3 text-[14.5px] font-bold text-bg no-underline transition-transform active:scale-95"
          >
            {openLabel} ↗
          </a>
        </div>
      </div>
    </Reveal>
  );
}

/* --------------------------- CHECK-IN --------------------------- */

export function CheckIn({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  const { copy, toast } = useCopy();
  return (
    <section id="checkin" className="pt-[54px]">
      <Reveal>
        <SectionHead n="1">{t({ pt: "Check-in", en: "Check-in", es: "Check-in" })}</SectionHead>
        <p className="mb-[22px] mt-2.5 text-[16px] text-soft">{t(ap.checkin.sub)}</p>
      </Reveal>

      {ap.checkin.doorCode?.mode === "fixed" && (
        <Reveal>
          <button
            type="button"
            onClick={() =>
              copy(ap.checkin.doorCode?.mode === "fixed" ? ap.checkin.doorCode.code : "", {
                pt: "Senha copiada ✓",
                en: "Code copied ✓",
                es: "Código copiado ✓",
              })
            }
            className="mb-[18px] flex w-full items-center gap-3.5 rounded-[18px] border border-line bg-card p-4 text-left transition-transform active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-blush text-[22px]">
              🔑
            </span>
            <div className="min-w-0 flex-1">
              <b className="block text-[13px] font-bold uppercase tracking-[0.08em] text-soft">
                {t({ pt: "Senha da fechadura", en: "Door lock code", es: "Código de la cerradura" })}
              </b>
              <span className="block break-all font-mono text-[20px] font-bold text-ink">
                {ap.checkin.doorCode.code}
              </span>
            </div>
            <span className="shrink-0 text-[12px] font-bold uppercase tracking-[0.08em] text-terra">
              {t({ pt: "Copiar", en: "Copy", es: "Copiar" })}
            </span>
          </button>
        </Reveal>
      )}

      {ap.checkin.cards.map((card, ci) => (
        <Reveal key={ci}>
          <div className={`${CARD} ${card.banner ? "px-[22px] pb-6 pt-0" : "p-[24px_22px]"}`}>
            {card.banner && (
              <div className="relative -mx-[22px] mb-[18px] aspect-[4/5] max-h-[320px] sm:aspect-[16/10]">
                <Media
                  src={card.banner}
                  fill
                  sizes="(max-width:640px) 100vw, 640px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(59_45_36/0)_40%,rgb(255_253_249/0.9)_96%)]" />
              </div>
            )}
            <h3 className="mb-3.5 font-display text-[24px] font-normal leading-[1.15]">
              {t(card.title)}
              {card.tag && (
                <span className="ml-2 inline-block rounded-full bg-terra-soft px-2.5 py-1 align-middle text-[12px] font-bold uppercase tracking-[0.14em] text-terra">
                  {t(card.tag)}
                </span>
              )}
            </h3>

            <Steps steps={card.steps} />

            {card.alerts?.map((a, ai) => (
              <div
                key={ai}
                className="mt-3.5 flex items-start gap-3 rounded-2xl border border-[rgb(168_69_46/0.35)] bg-terra-soft p-[15px_16px] text-[15.5px] [&_strong]:text-terra"
              >
                <span className="text-[20px] leading-[1.3]">{a.icon}</span>
                <Rich html={t(a.body)} />
              </div>
            ))}

            {card.video && (
              <div className="mt-[18px]">
                <p className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.14em] text-coffee">
                  {t(card.video.label)}
                </p>
                <video
                  src={card.video.src}
                  controls
                  playsInline
                  preload="none"
                  poster={card.video.poster}
                  className="block w-full rounded-2xl border border-line bg-black"
                />
              </div>
            )}
          </div>
        </Reveal>
      ))}
      {toast}
    </section>
  );
}

/* ------------------------------ SAÍDA --------------------------- */

/**
 * Seção de saída. Fica sempre no guia — o hóspede pode querer sair antes —
 * mas sobe para o topo no dia do check-out (ver ordenação em Guide.tsx).
 * Marcador "✦" em vez de número para não renumerar as seções 1–8.
 */
export function Checkout({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  const checkout = ap.checkout;
  if (!checkout) return null;

  return (
    <section id="saida" className="pt-[54px]">
      <Reveal>
        <SectionHead n="✦">{t({ pt: "Saída", en: "Check-out", es: "Salida" })}</SectionHead>
        <p className="mb-[22px] mt-2.5 text-[16px] text-soft">{t(checkout.sub)}</p>
      </Reveal>

      <Reveal>
        <div className={`${CARD} p-[24px_22px]`}>
          <Steps steps={checkout.steps} />
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------ WIFI ---------------------------- */

export function Wifi({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  const { copy: copyText, toast } = useCopy();
  const copy = () =>
    copyText(ap.wifi.password, { pt: "Senha copiada ✓", en: "Password copied ✓", es: "Contraseña copiada ✓" });

  return (
    <section id="wifi" className="pt-[54px]">
      <Reveal>
        <SectionHead n="2">Wi-Fi</SectionHead>
        <p className="mb-[22px] mt-2.5 text-[16px] text-soft">{t(ap.wifi.speed)}</p>
      </Reveal>

      <Reveal>
        <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#8f4a30_0%,#6e3520_55%,#58291a_100%)] p-[34px_26px_28px] text-center text-[#faf0e8]">
          <div className="pointer-events-none absolute inset-0 opacity-[0.16] [background:radial-gradient(circle_at_85%_-10%,#ffd9a8_0,transparent_45%),radial-gradient(circle_at_0%_110%,#ffb98a_0,transparent_40%)]" />
          <svg
            width="46"
            height="34"
            viewBox="0 0 46 34"
            fill="none"
            stroke="#faf0e8"
            strokeWidth="3"
            strokeLinecap="round"
            className="relative mx-auto mb-1.5"
            aria-hidden
          >
            <path d="M2 12C13.5 1.5 32.5 1.5 44 12" />
            <path d="M9 19.5c8-7.5 20-7.5 28 0" opacity=".8" />
            <path d="M16 26.5c4-3.8 10-3.8 14 0" opacity=".6" />
            <circle cx="23" cy="31" r="2.4" fill="#faf0e8" stroke="none" />
          </svg>
          <div className="relative mt-5 text-[12px] uppercase tracking-[0.3em] opacity-80">
            {t({ pt: "Rede", en: "Network", es: "Red" })}
          </div>
          <div className="relative mt-1.5 font-display text-[clamp(27px,7.4vw,34px)] leading-[1.1]">
            {ap.wifi.network}
          </div>
          {ap.wifi.password.trim() && (
            <>
              <div className="relative mt-5 text-[12px] uppercase tracking-[0.3em] opacity-80">
                {t({ pt: "Senha", en: "Password", es: "Contraseña" })}
              </div>
              <button
                type="button"
                onClick={copy}
                aria-label={t({ pt: "Copiar senha", en: "Copy password", es: "Copiar contraseña" })}
                className="relative mt-1.5 block w-full break-all rounded-2xl border border-dashed border-[rgb(255_233_214/0.5)] bg-white/[0.12] p-[14px_10px] font-mono text-[clamp(29px,8.6vw,40px)] font-bold tracking-[0.02em] transition-transform active:scale-[0.98]"
              >
                {ap.wifi.password}
              </button>
              <button
                type="button"
                onClick={copy}
                className="relative mt-4 min-h-[48px] rounded-full bg-[#faf0e8] px-[30px] py-3.5 text-[16px] font-bold text-terra-deep transition-transform active:scale-95"
              >
                {t({ pt: "Copiar senha", en: "Copy password", es: "Copiar contraseña" })}
              </button>
            </>
          )}
        </div>
      </Reveal>

      {toast}
    </section>
  );
}

/* ----------------------------- RULES ---------------------------- */

export function Rules({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  return (
    <section id="regras" className="pt-[54px]">
      <Reveal>
        <SectionHead n="3">{t({ pt: "Regras da Casa", en: "House Rules", es: "Reglas de la Casa" })}</SectionHead>
        <p className="mb-[22px] mt-2.5 text-[16px] text-soft">{t(ap.rules.sub)}</p>
      </Reveal>
      <div className="grid grid-cols-1 gap-2.5">
        {ap.rules.items.map((r, i) => (
          <Reveal key={i}>
            <div className="flex items-start gap-3.5 rounded-[18px] border border-line bg-card p-4">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-[22px] ${
                  r.hot ? "bg-terra-soft" : "bg-blush"
                }`}
              >
                {r.icon}
              </span>
              <div>
                <b className={`block text-[16.5px] ${r.hot ? "text-terra" : ""}`}>{t(r.title)}</b>
                <span className="block text-[15px] text-soft">{t(r.text)}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- CONTACTS -------------------------- */

export function Contacts({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  return (
    <section id="contatos" className="pt-[54px]">
      <Reveal>
        <SectionHead n="4">{t({ pt: "Contatos", en: "Contacts", es: "Contactos" })}</SectionHead>
        <p className="mb-[22px] mt-2.5 text-[16px] text-soft">{t(ap.contacts.sub)}</p>
      </Reveal>
      {ap.contacts.items.map((c, i) => {
        const identity = (
          <>
            <span
              className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full text-[21px] ${
                c.sos ? "bg-terra-soft" : "bg-blush"
              }`}
            >
              {c.icon}
            </span>
            <div className="min-w-0 flex-1">
              {c.name && <b className="block text-[16.5px]">{c.name}</b>}
              <Rich as="span" html={t(c.role)} className="block text-[14.5px] text-soft" />
            </div>
          </>
        );

        // Emergência continua sendo um toque só pra ligar.
        if (c.sos) {
          return (
            <Reveal key={i}>
              <a
                href={`tel:${c.tel}`}
                className="mb-2.5 flex items-center gap-3.5 rounded-[18px] border border-line bg-card p-4 no-underline transition-transform active:scale-[0.99]"
              >
                {identity}
                <span className="whitespace-nowrap font-display text-[22px] font-bold text-terra">
                  {c.phone}
                </span>
              </a>
            </Reveal>
          );
        }

        // Os contatos com WhatsApp no papel (host/coanfitrião) ganham o botão de mensagem.
        const hasWhatsapp = /whats/i.test(`${c.role.pt} ${c.role.en}`);
        const btn =
          "inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-[18px] py-2.5 text-[14px] font-bold no-underline transition-transform active:scale-95";
        return (
          <Reveal key={i}>
            <div className="mb-2.5 rounded-[18px] border border-line bg-card p-4">
              <div className="flex items-center gap-3.5">{identity}</div>
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                <a
                  href={`tel:${c.tel}`}
                  className="mr-auto inline-flex min-h-[44px] items-center whitespace-nowrap text-[17px] font-bold text-coffee no-underline"
                >
                  {c.phone}
                </a>
                {hasWhatsapp && (
                  <a
                    href={`https://wa.me/${whatsappDigits(c.tel)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${btn} bg-[#128C7E] text-white`}
                  >
                    💬 WhatsApp
                  </a>
                )}
                <a href={`tel:${c.tel}`} className={`${btn} border border-line bg-bg text-ink`}>
                  📞 {t({ pt: "Ligar", en: "Call", es: "Llamar" })}
                </a>
              </div>
            </div>
          </Reveal>
        );
      })}
    </section>
  );
}

/* ------------------------------ HOME ---------------------------- */

/**
 * Imagem que abre em tela cheia ao tocar (foto/diagrama de equipamento):
 * na tela do celular a miniatura é pequena demais pra enxergar os detalhes.
 */
function Zoomable({
  src,
  alt,
  children,
}: {
  src: string;
  alt: string;
  children: React.ReactNode;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const label = t({ pt: "Ampliar", en: "Enlarge", es: "Ampliar" });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${alt}`}
        className="relative block w-full text-left"
      >
        {children}
        <span
          aria-hidden
          className="absolute bottom-2.5 right-2.5 rounded-full bg-ink/75 px-3 py-1.5 text-[12px] font-bold text-bg"
        >
          🔍 {label}
        </span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-3"
        >
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={1000}
            sizes="100vw"
            loading="eager"
            className="h-auto max-h-[88svh] w-full max-w-[900px] rounded-xl bg-white object-contain"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t({ pt: "Fechar", en: "Close", es: "Cerrar" })}
            className="absolute right-3 top-[max(12px,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[20px] font-bold text-ink"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

export function Home({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  // Tour em vídeo: o do apartamento vale no lugar do do prédio. Sempre o 1º elemento da seção.
  const tour = ap.homeVideo?.trim() || ap.home.video?.trim();
  const [slide, setSlide] = useState(0);
  const onSlidesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const box = e.currentTarget;
    const first = box.firstElementChild as HTMLElement | null;
    if (!first) return;
    const idx = Math.round(box.scrollLeft / (first.offsetWidth + 12));
    if (idx !== slide) setSlide(Math.min(Math.max(idx, 0), ap.home.slides.length - 1));
  };
  return (
    <section id="casa" className="pt-[54px]">
      <Reveal>
        <SectionHead n="5">{t({ pt: "A Casa", en: "The Home", es: "La Casa" })}</SectionHead>
        <p className="mb-[22px] mt-2.5 text-[16px] text-soft">{t(ap.home.sub)}</p>
      </Reveal>

      {tour && (
        <Reveal>
          <div className="mb-4">
            <p className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.14em] text-coffee">
              🎬 {t({ pt: "Tour pelo apartamento", en: "Apartment tour", es: "Recorrido por el apartamento" })}
            </p>
            <video
              src={`${tour}#t=0.1`}
              controls
              playsInline
              preload="metadata"
              className="block max-h-[72svh] w-full rounded-[20px] border border-line bg-black"
            />
          </div>
        </Reveal>
      )}

      {(ap.home.slides.length > 0 || !tour) && (
      <Reveal>
        <div
          onScroll={onSlidesScroll}
          className="no-scrollbar -mx-[18px] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[18px] pb-2 pt-1"
        >
          {ap.home.slides.map((s, i) => (
            <div
              key={i}
              className="w-[78%] shrink-0 snap-center overflow-hidden rounded-[20px] border border-line bg-card"
            >
              <div className="relative h-[170px]">
                <Media
                  src={s.img}
                  fill
                  sizes="(max-width:640px) 78vw, 500px"
                  className="object-cover"
                />
              </div>
              <div className="p-[14px_16px_16px]">
                <b className="block text-[16px]">{t(s.title)}</b>
                <span className="mt-[3px] block text-[14px] leading-[1.45] text-soft">
                  {t(s.text)}
                </span>
              </div>
            </div>
          ))}
        </div>
        {ap.home.slides.length > 1 && (
          <div className="mb-3 mt-1 flex justify-center gap-1.5" aria-hidden>
            {ap.home.slides.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === slide ? "w-5 bg-terra" : "w-1.5 bg-line"
                }`}
              />
            ))}
          </div>
        )}
      </Reveal>
      )}

      {ap.home.accordions.map((acc, i) => (
        <Reveal key={i}>
          <details className="group mb-2.5 overflow-hidden rounded-[18px] border border-line bg-card">
            <summary className="flex cursor-pointer list-none items-center gap-3 p-[18px] text-[17px] font-bold [&::-webkit-details-marker]:hidden">
              <span className="text-[22px]">{acc.icon}</span>
              {t(acc.title)}
              <span className="ml-auto text-[14px] text-terra transition-transform group-open:rotate-180">
                ▼
              </span>
            </summary>
            <div className="px-[18px] pb-4">
              {acc.media &&
                (isVideoUrl(acc.media) ? (
                  <video
                    src={`${acc.media}#t=0.1`}
                    controls
                    playsInline
                    preload="metadata"
                    className="mb-3.5 block max-h-[60svh] w-full rounded-xl border border-line bg-black"
                  />
                ) : (
                  <div className="mb-3.5 overflow-hidden rounded-xl border border-line bg-bg-soft">
                    <Zoomable src={acc.media} alt={t(acc.title)}>
                      <Image
                        src={acc.media}
                        alt={t(acc.title)}
                        width={800}
                        height={600}
                        sizes="(max-width:640px) 100vw, 640px"
                        className="mx-auto block h-auto max-h-[min(340px,48svh)] w-full object-contain"
                      />
                    </Zoomable>
                  </div>
                ))}
              <Steps steps={acc.steps} className="text-[15.5px]" />

              {acc.diagram && (
                <figure className="mt-4 border-t border-dashed border-line pt-3.5">
                  <Zoomable src={acc.diagram.img} alt={acc.diagram.alt}>
                    <Image
                      src={acc.diagram.img}
                      alt={acc.diagram.alt}
                      width={600}
                      height={532}
                      sizes="(max-width:640px) 92vw, 600px"
                      className="mx-auto h-auto w-full max-w-[460px] rounded-xl border border-line bg-white p-1.5"
                    />
                  </Zoomable>
                  <ol className="mt-3.5 grid list-none gap-x-4 gap-y-1.5 text-[15px] leading-[1.35] sm:grid-cols-2">
                    {acc.diagram.legend.map((it) => (
                      <li key={it.n} className="flex items-start gap-2.5">
                        <b className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blush text-[13px] font-bold text-coffee">
                          {it.n}
                        </b>
                        <span>{t(it.label)}</span>
                      </li>
                    ))}
                  </ol>
                </figure>
              )}
            </div>
          </details>
        </Reveal>
      ))}
    </section>
  );
}

/* ---------------------------- AMENITIES ------------------------- */

export function Amenities({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  return (
    <section id="lazer" className="pt-[54px]">
      <Reveal>
        <SectionHead n="6">{t({ pt: "Lazer", en: "Amenities", es: "Ocio" })}</SectionHead>
        <Rich as="p" html={t(ap.amenities.sub)} className="mb-[22px] mt-2.5 text-[16px] text-soft" />
      </Reveal>
      <div className="grid grid-cols-2 gap-2.5">
        {ap.amenities.items.map((a, i) => (
          <Reveal key={i} className={a.wide ? "col-span-2" : ""}>
            <div className="overflow-hidden rounded-[18px] border border-line bg-card">
              <div className={`relative ${a.wide ? "h-[150px]" : "h-24"}`}>
                <Media
                  src={a.img}
                  fill
                  sizes={a.wide ? "(max-width:640px) 100vw, 640px" : "(max-width:640px) 50vw, 320px"}
                  className="object-cover"
                />
              </div>
              <div className="p-[12px_13px_14px]">
                <b className="block text-[15px] leading-[1.25]">{t(a.title)}</b>
                <span className="mt-1 block text-[13.5px] leading-[1.4] text-soft">{t(a.text)}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* -------------------------- TOUR / DINING ----------------------- */

/** Google Maps URLs API: abre o app já com a rota traçada até o destino. */
function mapsRoute(destination: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

function PlaceCards({
  id,
  n,
  title,
  sub,
  items,
}: {
  id: string;
  n: string;
  title: string;
  sub: string;
  items: Apartment["tourism"]["items"];
}) {
  const { t } = useLang();
  return (
    <section id={id} className="pt-[54px]">
      <Reveal>
        <SectionHead n={n}>{title}</SectionHead>
        <p className="mb-[22px] mt-2.5 text-[16px] text-soft">{sub}</p>
      </Reveal>
      {items.map((p, i) => (
        <Reveal key={i}>
          <div className="mb-3.5 overflow-hidden rounded-[20px] border border-line bg-card">
            {p.img && (
              <div className="relative h-[190px]">
                <Media
                  src={p.img}
                  fill
                  sizes="(max-width:640px) 100vw, 640px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-[16px_18px_18px]">
              <h4 className="font-display text-[21px] font-normal leading-[1.2]">{p.title}</h4>
              <p className="mt-1.5 text-[14.5px] text-soft">{t(p.text)}</p>
              <span className="mt-2.5 inline-block rounded-full bg-terra-soft px-2.5 py-1 text-[12px] font-bold uppercase tracking-[0.1em] text-terra">
                {p.meta}
              </span>

              {(p.maps || p.site) && (
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {p.maps && (
                    <a
                      href={mapsRoute(p.maps)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center rounded-full bg-ink px-[18px] py-2.5 text-[13.5px] font-bold text-bg no-underline transition-transform active:scale-95"
                    >
                      {t({ pt: "Como chegar ↗", en: "Directions ↗", es: "Cómo llegar ↗" })}
                    </a>
                  )}
                  {p.site && (
                    <a
                      href={p.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center rounded-full border border-line bg-bg px-[18px] py-2.5 text-[13.5px] font-bold text-ink no-underline transition-transform active:scale-95"
                    >
                      {t({ pt: "Site ↗", en: "Website ↗", es: "Sitio web ↗" })}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </Reveal>
      ))}
    </section>
  );
}

export function Tourism({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  return (
    <PlaceCards
      id="turismo"
      n="7"
      title={t({ pt: "Guia de Brasília", en: "Brasília Guide", es: "Guía de Brasilia" })}
      sub={t(ap.tourism.sub)}
      items={ap.tourism.items}
    />
  );
}

export function Dining({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  return (
    <PlaceCards
      id="comer"
      n="8"
      title={t({ pt: "Onde Comer", en: "Where to Eat", es: "Dónde comer" })}
      sub={t(ap.dining.sub)}
      items={ap.dining.items}
    />
  );
}

/* ----------------------------- FOOTER --------------------------- */

export function Footer({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  return (
    <Reveal>
      <footer className="mt-16 text-center">
        <div className="overflow-hidden rounded-3xl border border-line bg-card">
          <div className="relative h-[150px]">
            <Media
              src={ap.footer.img}
              fill
              sizes="(max-width:640px) 100vw, 640px"
              className="object-cover"
            />
          </div>
          <div className="p-[26px_20px_28px]">
            <p className="mx-auto mb-3.5 max-w-[24ch] font-display text-[24px] leading-[1.3]">
              {t(ap.footer.msg)}
            </p>
            <p className="text-[15px] text-soft">
              {t(ap.footer.whoPrefix)}
              <b className="text-ink">{ap.footer.whoName}</b>
              <br />
              {ap.footer.phones}
            </p>
            <span className="mt-5 inline-block rounded-full border border-ink px-[22px] py-2 font-display text-[15px] tracking-[0.08em]">
              Ap {ap.unit}
            </span>
          </div>
        </div>
      </footer>
    </Reveal>
  );
}
