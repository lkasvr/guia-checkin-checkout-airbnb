"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Guide from "@/components/Guide";
import { buildApartmentContent, type ApartmentFormInput } from "@/data/buildApartmentContent";
import { slugify } from "@/lib/slug";
import {
  createApartmentDetailed,
  updateApartmentDetailed,
  type ApartmentWizardPayload,
} from "@/app/admin/actions";
import type { Apartment } from "@/data/types";

const field =
  "rounded-xl border border-line bg-bg px-3 py-2 text-[15px] text-ink outline-none focus:border-coffee";
const labelCls = "flex flex-col gap-1 text-[13px] font-semibold text-soft";
const sectionTitle = "mt-6 font-display text-[19px] font-normal";

type FormState = ApartmentFormInput & { slug: string; label: string };

const EMPTY: FormState = {
  building: "",
  unit: "",
  tower: "",
  floor: "",
  parking: "",
  maxGuests: "",
  checkinTime: "",
  checkoutTime: "",
  doorCodeMode: "per_stay",
  doorCode: "",
  wifiNetwork: "",
  wifiPassword: "",
  rulesText: "",
  smoking: "no",
  pets: "no",
  hostWhatsapp: "",
  coHostName: "",
  coHostWhatsapp: "",
  internalNotes: "",
  slug: "",
  label: "",
};

export function ApartmentWizard({
  hostId,
  hostName,
  mode,
  apartmentId,
  initial,
  existingContent,
}: {
  hostId: string;
  hostName: string;
  mode: "create" | "edit";
  apartmentId?: string;
  initial?: FormState;
  existingContent?: Apartment;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(initial ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (!slugTouched && (key === "building" || key === "unit")) {
        next.slug = [slugify(next.building), slugify(next.unit)].filter(Boolean).join("-");
      }
      if (key === "unit" && !f.label) next.label = value ? `Ap ${String(value).toUpperCase()}` : "";
      return next;
    });
  }

  const preview = useMemo<Apartment>(
    () => buildApartmentContent(form, hostName, existingContent),
    [form, hostName, existingContent],
  );

  function confirm() {
    setError(null);
    const payload: ApartmentWizardPayload = form;
    startTransition(async () => {
      try {
        if (mode === "create") {
          await createApartmentDetailed(hostId, payload);
        } else {
          await updateApartmentDetailed(apartmentId!, payload);
        }
        router.push("/admin");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      }
    });
  }

  if (step === 2) {
    return (
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-bg">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-bg/95 px-5 py-3 backdrop-blur">
          <button
            onClick={() => setStep(1)}
            className="text-[14px] font-semibold text-soft"
          >
            ‹ Voltar e editar
          </button>
          <span className="ml-auto max-w-[45%] truncate text-[13.5px] text-soft">
            {form.slug || "—"}.anfyi.com.br
          </span>
          <button
            onClick={confirm}
            disabled={pending}
            className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-bold text-bg disabled:opacity-60"
          >
            {pending
              ? "Salvando…"
              : mode === "create"
                ? "Confirmar e criar"
                : "Confirmar alterações"}
          </button>
        </div>
        {error && (
          <p className="mx-5 mt-3 rounded-xl border border-[rgb(168_69_46/0.35)] bg-terra-soft p-3 text-[14px] text-terra">
            {error}
          </p>
        )}
        <Guide apartment={preview} stay={null} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-[30px] font-normal">
        {mode === "create" ? "Novo apartamento" : "Editar apartamento"}
      </h1>
      <p className="mt-1 text-[15px] text-soft">
        Anfitrião: <b className="text-ink">{hostName}</b>. Preencha o essencial — dá para
        ajustar depois.
      </p>

      <h2 className={sectionTitle}>Identificação</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          Edifício
          <input
            className={field}
            value={form.building}
            onChange={(e) => set("building", e.target.value)}
            placeholder="ex.: DF Plaza Shopping"
          />
        </label>
        <label className={labelCls}>
          Número do apartamento
          <input
            className={field}
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
            placeholder="ex.: 1305C"
          />
        </label>
        <label className={labelCls}>
          Torre / bloco
          <input className={field} value={form.tower} onChange={(e) => set("tower", e.target.value)} />
        </label>
        <label className={labelCls}>
          Andar
          <input className={field} value={form.floor} onChange={(e) => set("floor", e.target.value)} />
        </label>
        <label className={labelCls}>
          Vaga(s) na garagem
          <input
            className={field}
            value={form.parking}
            onChange={(e) => set("parking", e.target.value)}
            placeholder="ex.: Vaga 269, subsolo -3"
          />
        </label>
        <label className={labelCls}>
          Nº máximo de hóspedes
          <input
            type="number"
            min={1}
            className={field}
            value={form.maxGuests}
            onChange={(e) => set("maxGuests", e.target.value)}
          />
        </label>
        <label className={labelCls}>
          Rótulo interno
          <input
            className={field}
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="ex.: Ap 1305C · DF Plaza"
          />
        </label>
        <label className={labelCls}>
          Link do guia
          <div className="flex items-center gap-1">
            <input
              className={`${field} flex-1`}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", slugify(e.target.value));
              }}
            />
            <span className="whitespace-nowrap text-[13px] text-soft">.anfyi.com.br</span>
          </div>
        </label>
      </div>

      <h2 className={sectionTitle}>Check-in e fechadura</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          Check-in (horário)
          <input
            className={field}
            value={form.checkinTime}
            onChange={(e) => set("checkinTime", e.target.value)}
            placeholder="ex.: A partir das 15h"
          />
        </label>
        <label className={labelCls}>
          Check-out (horário)
          <input
            className={field}
            value={form.checkoutTime}
            onChange={(e) => set("checkoutTime", e.target.value)}
            placeholder="ex.: Até as 11h"
          />
        </label>
        <label className={labelCls}>
          Senha da fechadura
          <select
            className={field}
            value={form.doorCodeMode}
            onChange={(e) => set("doorCodeMode", e.target.value as "fixed" | "per_stay")}
          >
            <option value="per_stay">Por hóspede (gerada a cada reserva)</option>
            <option value="fixed">Fixa do apartamento</option>
          </select>
        </label>
        {form.doorCodeMode === "fixed" && (
          <label className={labelCls}>
            Senha fixa
            <input
              className={field}
              value={form.doorCode}
              onChange={(e) => set("doorCode", e.target.value)}
              placeholder="ex.: 4517#"
            />
          </label>
        )}
      </div>

      <h2 className={sectionTitle}>Wi-Fi</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          Nome da rede
          <input
            className={field}
            value={form.wifiNetwork}
            onChange={(e) => set("wifiNetwork", e.target.value)}
          />
        </label>
        <label className={labelCls}>
          Senha do Wi-Fi
          <input
            className={field}
            value={form.wifiPassword}
            onChange={(e) => set("wifiPassword", e.target.value)}
          />
        </label>
      </div>

      <h2 className={sectionTitle}>Regras</h2>
      <div className="mt-3 grid gap-3">
        <label className={labelCls}>
          Regras específicas deste apartamento (uma por linha)
          <textarea
            rows={4}
            className={field}
            value={form.rulesText}
            onChange={(e) => set("rulesText", e.target.value)}
            placeholder={"Não mexer no quadro de energia da área de serviço"}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>
            Fumo
            <select
              className={field}
              value={form.smoking}
              onChange={(e) => set("smoking", e.target.value as "yes" | "no")}
            >
              <option value="no">Proibido</option>
              <option value="yes">Permitido</option>
            </select>
          </label>
          <label className={labelCls}>
            Animais
            <select
              className={field}
              value={form.pets}
              onChange={(e) => set("pets", e.target.value as "yes" | "no")}
            >
              <option value="no">Não permitido</option>
              <option value="yes">Permitido</option>
            </select>
          </label>
        </div>
      </div>

      <h2 className={sectionTitle}>Contatos</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          WhatsApp do anfitrião
          <input
            className={field}
            value={form.hostWhatsapp}
            onChange={(e) => set("hostWhatsapp", e.target.value)}
            placeholder="+55 61 99999-9999"
          />
        </label>
        <div />
        <label className={labelCls}>
          Coanfitrião / gestor (nome)
          <input
            className={field}
            value={form.coHostName}
            onChange={(e) => set("coHostName", e.target.value)}
          />
        </label>
        <label className={labelCls}>
          Coanfitrião / gestor (WhatsApp)
          <input
            className={field}
            value={form.coHostWhatsapp}
            onChange={(e) => set("coHostWhatsapp", e.target.value)}
          />
        </label>
      </div>

      <h2 className={sectionTitle}>Notas internas</h2>
      <p className="mt-1 text-[13px] text-soft">
        Só o superadmin e o anfitrião veem isso — nunca aparece no guia do hóspede.
      </p>
      <label className={`${labelCls} mt-3`}>
        Observações do apartamento / item com defeito ou em reparo
        <textarea
          rows={3}
          className={field}
          value={form.internalNotes}
          onChange={(e) => set("internalNotes", e.target.value)}
        />
      </label>

      <button
        onClick={() => setStep(2)}
        disabled={!form.building || !form.unit || !form.slug}
        className="mt-7 w-full rounded-full bg-ink px-6 py-3 text-[15px] font-bold text-bg disabled:opacity-50"
      >
        Ver prévia →
      </button>
    </div>
  );
}
