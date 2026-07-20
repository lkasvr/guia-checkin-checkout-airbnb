"use client";

import { MotionConfig } from "motion/react";
import type { Apartment, Step } from "@/data/types";
import { LanguageProvider, useLang } from "@/lib/i18n";
import { CARD, DOT, LangToggle, Reveal, Rich } from "@/components/ui";
import { PROPERTY_TZ } from "@/lib/tz";
import type { StayInfo } from "@/lib/apartments";

export default function ArrivalPage(props: {
  content: Apartment;
  mode: "checkin" | "checkout";
  stay: StayInfo | null;
  slug: string;
}) {
  return (
    <LanguageProvider initial={props.content.lang.default}>
      <MotionConfig reducedMotion="user">
        <main className="mx-auto max-w-[640px] px-[18px] pb-12">
          {props.stay ? (
            props.mode === "checkin" ? (
              <Checkin content={props.content} stay={props.stay} slug={props.slug} />
            ) : (
              <Checkout content={props.content} stay={props.stay} slug={props.slug} />
            )
          ) : (
            <Unavailable content={props.content} slug={props.slug} />
          )}
        </main>
      </MotionConfig>
    </LanguageProvider>
  );
}

function Topbar() {
  return (
    <div className="flex items-center justify-end pt-4">
      <LangToggle />
    </div>
  );
}

function StayDates({ stay }: { stay: StayInfo }) {
  const { lang, t } = useLang();
  const dateFmt = new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "short",
    timeZone: PROPERTY_TZ,
  });
  const fmt = (iso: string) => dateFmt.format(new Date(iso));
  return (
    <div className="mt-4 flex gap-2">
      <div className="flex-1 rounded-2xl border border-line bg-card p-[12px_14px] text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-soft">
          {t({ pt: "Entrada", en: "Check-in" })}
        </div>
        <div className="font-display text-[19px] text-coffee">
          {fmt(stay.checkInISO)}
        </div>
      </div>
      <div className="flex-1 rounded-2xl border border-line bg-card p-[12px_14px] text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-soft">
          {t({ pt: "Saída", en: "Check-out" })}
        </div>
        <div className="font-display text-[19px] text-coffee">
          {fmt(stay.checkOutISO)}
        </div>
      </div>
    </div>
  );
}

function Header({
  eyebrow,
  title,
  unit,
  guestName,
}: {
  eyebrow: string;
  title: string;
  unit: string;
  guestName: string | null;
}) {
  const { t } = useLang();
  return (
    <header className="pt-2">
      <p className="text-[12px] font-bold uppercase tracking-[0.32em] text-coffee">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-display text-[clamp(40px,12vw,64px)] font-normal leading-none">
        {title} <span className="text-terra">{unit}</span>
      </h1>
      {guestName && (
        <p className="mt-3 text-[16px] text-soft">
          {t({ pt: "Olá, ", en: "Hi, " })}
          <strong className="font-semibold text-ink">{guestName}</strong> 👋
        </p>
      )}
    </header>
  );
}

function Steps({ steps }: { steps: Step[] }) {
  const { t } = useLang();
  return (
    <ol className="list-none">
      {steps.map((s, i) => (
        <li
          key={i}
          className="flex items-start gap-3.5 py-3 [&+li]:border-t [&+li]:border-dashed [&+li]:border-line"
        >
          <span className={`${DOT} mt-0.5`}>{s.n}</span>
          <Rich as="p" html={t(s.body)} className="text-[16.5px]" />
        </li>
      ))}
    </ol>
  );
}

function Checkin({
  content,
  stay,
  slug,
}: {
  content: Apartment;
  stay: StayInfo;
  slug: string;
}) {
  const { t } = useLang();
  return (
    <>
      <Topbar />
      <Header
        eyebrow={t({ pt: "Seu check-in", en: "Your check-in" })}
        title={t({ pt: "Check-in", en: "Check-in" })}
        unit={content.unit}
        guestName={stay.guestName}
      />
      <StayDates stay={stay} />

      {stay.doorCode && (
        <Reveal>
          <div className="mt-4 overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#8f4a30_0%,#6e3520_55%,#58291a_100%)] p-[30px_26px] text-center text-[#faf0e8]">
            <div className="text-[11.5px] uppercase tracking-[0.3em] opacity-75">
              {t({ pt: "Senha da fechadura", en: "Door lock code" })}
            </div>
            <div className="mt-2 select-all font-mono text-[clamp(40px,13vw,60px)] font-bold tracking-[0.12em]">
              {stay.doorCode}
            </div>
            <div className="mt-2 text-[13.5px] opacity-80">
              {t({
                pt: `Apartamento ${content.unit}`,
                en: `Apartment ${content.unit}`,
              })}
            </div>
          </div>
        </Reveal>
      )}

      {content.checkin.cards.map((card, ci) => (
        <Reveal key={ci}>
          <div className={`${CARD} mt-1 ${card.banner ? "px-[22px] pb-6 pt-6" : "p-[24px_22px]"}`}>
            <h3 className="mb-3.5 font-display text-[24px] font-normal leading-[1.15]">
              {t(card.title)}
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
                  controls
                  playsInline
                  preload="none"
                  poster={card.video.poster}
                  className="block w-full rounded-2xl border border-line bg-black"
                >
                  <source src={card.video.src} type="video/mp4" />
                </video>
              </div>
            )}
          </div>
        </Reveal>
      ))}

      <HallLink slug={slug} />
    </>
  );
}

function Checkout({
  content,
  stay,
  slug,
}: {
  content: Apartment;
  stay: StayInfo;
  slug: string;
}) {
  const { t } = useLang();
  const checkout = content.checkout;
  return (
    <>
      <Topbar />
      <Header
        eyebrow={t({ pt: "Sua saída", en: "Your check-out" })}
        title={t({ pt: "Check-out", en: "Check-out" })}
        unit={content.unit}
        guestName={stay.guestName}
      />
      <StayDates stay={stay} />
      {checkout && (
        <Reveal>
          <div className={`${CARD} mt-4 p-[24px_22px]`}>
            <p className="mb-2 text-[16px] text-soft">{t(checkout.sub)}</p>
            <Steps steps={checkout.steps} />
          </div>
        </Reveal>
      )}
      <HallLink slug={slug} />
    </>
  );
}

function HallLink({ slug }: { slug: string }) {
  const { t } = useLang();
  return (
    <a
      href={`https://${slug}.anfyi.com.br`}
      className="mt-2 flex items-center justify-center rounded-full border border-ink bg-ink px-6 py-3.5 text-[15.5px] font-bold text-bg no-underline transition-transform active:scale-95"
    >
      {t({ pt: "Ver o guia completo →", en: "See the full guide →" })}
    </a>
  );
}

function Unavailable({ content, slug }: { content: Apartment; slug: string }) {
  const { t } = useLang();
  const host = content.contacts.items[0];
  return (
    <>
      <Topbar />
      <div className="flex min-h-[70svh] flex-col items-center justify-center text-center">
        <div className="text-[40px]">🕓</div>
        <h1 className="mt-3 font-display text-[clamp(30px,8vw,40px)] font-normal leading-tight">
          {t({
            pt: "Disponível durante a sua hospedagem",
            en: "Available during your stay",
          })}
        </h1>
        <p className="mt-3 max-w-[34ch] text-[16px] text-soft">
          {t({
            pt: "Esta página abre automaticamente no período da sua reserva. Se você já deveria ter acesso, fale com a anfitriã.",
            en: "This page opens automatically during your booking dates. If you should already have access, contact the host.",
          })}
        </p>
        {host && (
          <a
            href={`tel:${host.tel}`}
            className="mt-6 rounded-full border border-ink bg-ink px-6 py-3.5 text-[15.5px] font-bold text-bg no-underline"
          >
            {host.name || t({ pt: "Falar com a anfitriã", en: "Contact host" })} · {host.phone}
          </a>
        )}
        <a
          href={`https://${slug}.anfyi.com.br`}
          className="mt-3 text-[15px] font-semibold text-terra underline underline-offset-2"
        >
          {t({ pt: "Ir para o guia", en: "Go to the guide" })}
        </a>
      </div>
    </>
  );
}
