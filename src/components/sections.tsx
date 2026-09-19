"use client";

import Image from "next/image";
import { motion, type Variants } from "motion/react";
import { useCallback, useRef, useState } from "react";
import type { Apartment } from "@/data/types";
import { useLang } from "@/lib/i18n";
import { CARD, LangToggle, Reveal, Rich, SectionHead, Steps } from "@/components/ui";
import { Media } from "@/components/media";
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

export function Hero({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  return (
    <header className="relative -mx-[18px] px-6 pb-2.5 text-left">
      <div className="relative -mx-6 h-[44svh] max-h-[430px] min-h-[280px]">
        <Media
          src={ap.hero.img}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_24%]"
          autoPlayLoop
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(59_45_36/0.22)_0%,rgb(250_245_238/0)_34%,rgb(250_245_238/0.35)_62%,rgb(250_245_238/0.85)_84%,var(--color-bg)_100%)]" />
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
            {t({ pt: "Fazer check-in ↓", en: "Check in ↓" })}
          </a>
          <a
            href="#wifi"
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-ink bg-[rgb(255_253_249/0.85)] px-[22px] py-3.5 text-[15.5px] font-bold text-ink transition-transform active:scale-95"
          >
            Wi-Fi ↓
          </a>
        </motion.div>
        <motion.div variants={heroItem} className="mt-[18px] grid grid-cols-3 gap-2">
          {ap.hero.facts.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-line bg-card p-[12px_10px] text-center"
            >
              <div className="font-display text-[20px] leading-[1.15] text-coffee">
                {t(f.k)}
              </div>
              <div className="mt-1 text-[11.5px] font-bold uppercase tracking-[0.08em] text-soft">
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

  const openLabel = t({ pt: "Abrir no Google Maps", en: "Open in Google Maps" });
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
              title={t({ pt: "Mapa do endereço", en: "Address map" })}
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
            📍 {t({ pt: "Como chegar", en: "Getting here" })}
          </p>
          {address && (
            <p className="mt-1.5 font-display text-[21px] font-normal leading-[1.25]">{address}</p>
          )}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-ink px-[20px] py-3 text-[14.5px] font-bold text-bg no-underline transition-transform active:scale-95"
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
  return (
    <section id="checkin" className="pt-[54px]">
      <Reveal>
        <SectionHead n="1">{t({ pt: "Check-in", en: "Check-in" })}</SectionHead>
        <p className="mb-[22px] mt-2.5 text-[16px] text-soft">{t(ap.checkin.sub)}</p>
      </Reveal>

      {ap.checkin.doorCode?.mode === "fixed" && (
        <Reveal>
          <div className="mb-[18px] flex items-center gap-3.5 rounded-[18px] border border-line bg-card p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-blush text-[22px]">
              🔑
            </span>
            <div>
              <b className="block text-[13px] font-bold uppercase tracking-[0.08em] text-soft">
                {t({ pt: "Senha da fechadura", en: "Door lock code" })}
              </b>
              <span className="block select-all font-mono text-[20px] font-bold text-ink">
                {ap.checkin.doorCode.code}
              </span>
            </div>
          </div>
        </Reveal>
      )}

      {ap.checkin.cards.map((card, ci) => (
        <Reveal key={ci}>
          <div className={`${CARD} ${card.banner ? "px-[22px] pb-6 pt-0" : "p-[24px_22px]"}`}>
            {card.banner && (
              <div className="relative -mx-[22px] mb-[18px] h-[130px]">
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
                <span className="ml-2 inline-block rounded-full bg-terra-soft px-2.5 py-1 align-middle text-[11px] font-bold uppercase tracking-[0.14em] text-terra">
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
        <SectionHead n="✦">{t({ pt: "Saída", en: "Check-out" })}</SectionHead>
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
  const { t, lang } = useLang();
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const copy = useCallback(async () => {
    const ok = lang === "en" ? "Password copied ✓" : "Senha copiada ✓";
    const fail =
      lang === "en"
        ? "Tap and hold the password to copy"
        : "Toque e segure a senha para copiar";
    try {
      await navigator.clipboard.writeText(ap.wifi.password);
      show(ok);
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = ap.wifi.password;
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
  }, [ap.wifi.password, lang, show]);

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
          <div className="relative mt-5 text-[11.5px] uppercase tracking-[0.3em] opacity-75">
            {t({ pt: "Rede", en: "Network" })}
          </div>
          <div className="relative mt-1.5 font-display text-[clamp(27px,7.4vw,34px)] leading-[1.1]">
            {ap.wifi.network}
          </div>
          <div className="relative mt-5 text-[11.5px] uppercase tracking-[0.3em] opacity-75">
            {t({ pt: "Senha", en: "Password" })}
          </div>
          <div className="relative mt-1.5 select-all rounded-2xl border border-dashed border-[rgb(255_233_214/0.5)] bg-white/[0.12] p-[14px_10px] font-mono text-[clamp(29px,8.6vw,40px)] font-bold tracking-[0.02em]">
            {ap.wifi.password}
          </div>
          <button
            type="button"
            onClick={copy}
            className="relative mt-4 rounded-full bg-[#faf0e8] px-[30px] py-3.5 text-[16px] font-bold text-terra-deep transition-transform active:scale-95"
          >
            {t({ pt: "Copiar senha", en: "Copy password" })}
          </button>
          <div className="relative mt-3.5 text-[14px] opacity-85">{t(ap.wifi.speed)}</div>
        </div>
      </Reveal>

      <div
        role="status"
        className={`fixed bottom-6 left-1/2 z-[99] -translate-x-1/2 rounded-full bg-ink px-[22px] py-3 text-[15px] font-semibold text-bg transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
        }`}
      >
        {toast}
      </div>
    </section>
  );
}

/* ----------------------------- RULES ---------------------------- */

export function Rules({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  return (
    <section id="regras" className="pt-[54px]">
      <Reveal>
        <SectionHead n="3">{t({ pt: "Regras da Casa", en: "House Rules" })}</SectionHead>
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
        <SectionHead n="4">{t({ pt: "Contatos", en: "Contacts" })}</SectionHead>
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
          "inline-flex items-center gap-1.5 rounded-full px-[18px] py-2.5 text-[14px] font-bold no-underline transition-transform active:scale-95";
        return (
          <Reveal key={i}>
            <div className="mb-2.5 rounded-[18px] border border-line bg-card p-4">
              <div className="flex items-center gap-3.5">{identity}</div>
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                <a
                  href={`tel:${c.tel}`}
                  className="mr-auto whitespace-nowrap text-[17px] font-bold text-coffee no-underline"
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
                  📞 {t({ pt: "Ligar", en: "Call" })}
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

export function Home({ ap }: { ap: Apartment }) {
  const { t } = useLang();
  // Tour em vídeo: o do apartamento vale no lugar do do prédio. Sempre o 1º elemento da seção.
  const tour = ap.homeVideo?.trim() || ap.home.video?.trim();
  return (
    <section id="casa" className="pt-[54px]">
      <Reveal>
        <SectionHead n="5">{t({ pt: "A Casa", en: "The Home" })}</SectionHead>
        <p className="mb-[22px] mt-2.5 text-[16px] text-soft">{t(ap.home.sub)}</p>
      </Reveal>

      {tour && (
        <Reveal>
          <div className="mb-4">
            <p className="mb-2.5 text-[13px] font-bold uppercase tracking-[0.14em] text-coffee">
              🎬 {t({ pt: "Tour pelo apartamento", en: "Apartment tour" })}
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
        <div className="no-scrollbar -mx-[18px] flex snap-x snap-mandatory gap-3 overflow-x-auto px-[18px] pb-2 pt-1">
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
              <Steps steps={acc.steps} className="text-[15.5px]" />

              {acc.diagram && (
                <figure className="mt-4 flex items-start gap-4 border-t border-dashed border-line pt-3.5">
                  <Image
                    src={acc.diagram.img}
                    alt={acc.diagram.alt}
                    width={300}
                    height={266}
                    sizes="108px"
                    className="h-auto w-[108px] shrink-0 rounded-xl border border-line bg-white p-1.5"
                  />
                  <ol className="min-w-0 flex-1 list-none text-[13.5px] leading-[1.35]">
                    {acc.diagram.legend.map((it) => (
                      <li key={it.n} className="flex gap-2 py-0.5">
                        <b className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blush text-[12px] font-bold text-coffee">
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
        <SectionHead n="6">{t({ pt: "Lazer", en: "Amenities" })}</SectionHead>
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
                <span className="mt-1 block text-[13px] leading-[1.4] text-soft">{t(a.text)}</span>
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
              <span className="mt-2.5 inline-block rounded-full bg-terra-soft px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.1em] text-terra">
                {p.meta}
              </span>

              {(p.maps || p.site) && (
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {p.maps && (
                    <a
                      href={mapsRoute(p.maps)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-ink px-[18px] py-2.5 text-[13.5px] font-bold text-bg no-underline transition-transform active:scale-95"
                    >
                      {t({ pt: "Como chegar ↗", en: "Directions ↗" })}
                    </a>
                  )}
                  {p.site && (
                    <a
                      href={p.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-line bg-bg px-[18px] py-2.5 text-[13.5px] font-bold text-ink no-underline transition-transform active:scale-95"
                    >
                      {t({ pt: "Site ↗", en: "Website ↗" })}
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
      title={t({ pt: "Guia de Brasília", en: "Brasília Guide" })}
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
      title={t({ pt: "Onde Comer", en: "Where to Eat" })}
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
