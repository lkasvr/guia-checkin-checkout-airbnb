"use client";

import { useMemo } from "react";
import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/ui";
import { PROPERTY_TZ } from "@/lib/tz";
import type { StayInfo } from "@/lib/apartments";

/**
 * Painel da hospedagem em curso: saudação, senha da fechadura e datas.
 * Renderizado logo abaixo do hero e SÓ dentro da janela da estadia — fora
 * dela o guia não expõe nada do hóspede (é o estado da prospecção).
 */
export function StayBanner({ stay, unit }: { stay: StayInfo; unit: string }) {
  const { lang, t } = useLang();

  // Trocar o idioma re-renderiza todo consumidor de useLang(); sem o memo o
  // formatter seria reconstruído a cada toggle.
  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "pt" ? "pt-BR" : lang === "es" ? "es" : "en-US", {
        day: "2-digit",
        month: "short",
        timeZone: PROPERTY_TZ,
      }),
    [lang],
  );
  const fmt = (iso: string) => dateFmt.format(new Date(iso));

  return (
    <Reveal className="mt-5">
      {stay.guestName && (
        <p className="text-[16px] text-soft">
          {t({ pt: "Olá, ", en: "Hi, ", es: "Hola, " })}
          <strong className="font-semibold text-ink">{stay.guestName}</strong> 👋
        </p>
      )}

      {stay.doorCode && (
        <div className="mt-3 overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#8f4a30_0%,#6e3520_55%,#58291a_100%)] p-[26px_24px] text-center text-[#faf0e8]">
          <div className="text-[11.5px] uppercase tracking-[0.3em] opacity-75">
            {t({ pt: "Senha da fechadura", en: "Door lock code", es: "Código de la cerradura" })}
          </div>
          <div className="mt-2 select-all font-mono text-[clamp(38px,12vw,56px)] font-bold tracking-[0.12em]">
            {stay.doorCode}
          </div>
          <div className="mt-2 text-[13.5px] opacity-80">
            {t({ pt: `Apartamento ${unit}`, en: `Apartment ${unit}`, es: `Apartamento ${unit}` })}
          </div>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <StayDate
          label={t({ pt: "Entrada", en: "Check-in", es: "Entrada" })}
          value={fmt(stay.checkInISO)}
        />
        <StayDate
          label={t({ pt: "Saída", en: "Check-out", es: "Salida" })}
          value={fmt(stay.checkOutISO)}
          highlight={stay.isCheckoutDay}
        />
      </div>
    </Reveal>
  );
}

function StayDate({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const tone = highlight
    ? { box: "border-terra bg-terra-soft", label: "text-terra", value: "text-terra-deep" }
    : { box: "border-line bg-card", label: "text-soft", value: "text-coffee" };

  return (
    <div className={`flex-1 rounded-2xl border p-[12px_14px] text-center ${tone.box}`}>
      <div className={`text-[11px] font-bold uppercase tracking-[0.14em] ${tone.label}`}>
        {label}
      </div>
      <div className={`font-display text-[19px] ${tone.value}`}>{value}</div>
    </div>
  );
}
