"use client";

import Link from "next/link";
import { useState } from "react";
import {
  copyText,
  guideUrl,
  multiMessage,
  singleMessage,
  whatsappShareUrl,
} from "@/lib/shareMessage";
import {
  deleteApartment,
  deleteHost,
  setApartmentActiveAsAdmin,
  setHostActive,
} from "@/app/admin/actions";
import { ResetPasswordForm } from "@/app/admin/reset-password-form";
import { useUndoDelete } from "@/app/admin/use-undo-delete";

const field =
  "rounded-xl border border-line bg-bg px-3 py-2 text-[15px] text-ink outline-none focus:border-coffee";
const badgeCls =
  "ml-2 rounded-full bg-terra-soft px-2 py-0.5 align-middle text-[11px] font-bold uppercase tracking-[0.08em] text-terra";
const linkBtn = "whitespace-nowrap text-[13px] font-semibold underline underline-offset-2";

export type HostCardApartment = {
  id: string;
  slug: string;
  label: string;
  active: boolean;
  /** "1305C" ou "1305 · Torre C" — vai junto do link na mensagem de exportar. */
  exportLabel: string;
};
export type HostCardData = {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  apartments: HostCardApartment[];
};

function UndoBar({ message, onUndo }: { message: string; onUndo: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-line bg-bg px-3 py-2.5 text-[13.5px]">
      <span className="text-soft">{message}</span>
      <button type="button" onClick={onUndo} className={`${linkBtn} text-terra`}>
        Desfazer
      </button>
    </div>
  );
}

/** Copia e mostra "Copiado ✓" por um instante. */
function CopyButton({ text, label, className }: { text: string; label: string; className: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  async function copy() {
    setState((await copyText(text)) ? "ok" : "fail");
    setTimeout(() => setState("idle"), 2200);
  }
  return (
    <button type="button" onClick={copy} className={className}>
      {state === "ok" ? "Copiado ✓" : state === "fail" ? "Não copiou" : label}
    </button>
  );
}

function ExportPanel({ apartments }: { apartments: HostCardApartment[] }) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(apartments.filter((a) => a.active).map((a) => a.id)),
  );
  const chosen = apartments.filter((a) => selected.has(a.id));
  const message = multiMessage(
    chosen.map((a) => ({ label: a.exportLabel, url: guideUrl(a.slug) })),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (apartments.length === 0) {
    return <p className="mt-3 text-[13.5px] text-soft">Este anfitrião ainda não tem apartamentos.</p>;
  }

  return (
    <div className="mt-3 rounded-xl border border-dashed border-line bg-bg p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13.5px] font-semibold text-ink">
          De quais apartamentos exportar os links?
        </span>
        <span className="flex gap-3">
          <button
            type="button"
            className={`${linkBtn} text-soft`}
            onClick={() => setSelected(new Set(apartments.map((a) => a.id)))}
          >
            Todos
          </button>
          <button
            type="button"
            className={`${linkBtn} text-soft`}
            onClick={() => setSelected(new Set())}
          >
            Nenhum
          </button>
        </span>
      </div>
      <div className="mt-2 grid gap-1.5">
        {apartments.map((a) => (
          <label
            key={a.id}
            className="flex items-center gap-2.5 rounded-lg border border-line bg-card px-3 py-2.5 text-[14px]"
          >
            <input
              type="checkbox"
              className="h-[18px] w-[18px] shrink-0"
              checked={selected.has(a.id)}
              onChange={() => toggle(a.id)}
            />
            <span className="min-w-0 flex-1 truncate">
              <b>{a.exportLabel}</b> <span className="text-soft">· {a.label}</span>
            </span>
            {!a.active && <span className={badgeCls}>Inativo</span>}
          </label>
        ))}
      </div>

      <textarea
        readOnly
        rows={9}
        value={chosen.length ? message : "Marque ao menos um apartamento."}
        className={`${field} mt-3 w-full text-[13.5px] leading-[1.45]`}
        aria-label="Mensagem a ser enviada"
      />
      <div className="mt-2.5 flex flex-wrap gap-2">
        <CopyButton
          text={message}
          label="Copiar mensagem"
          className={`rounded-full bg-ink px-5 py-2.5 text-[14px] font-bold text-bg ${chosen.length ? "" : "pointer-events-none opacity-50"}`}
        />
        <a
          href={chosen.length ? whatsappShareUrl(message) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!chosen.length}
          className={`rounded-full bg-[#128C7E] px-5 py-2.5 text-[14px] font-bold text-white no-underline ${chosen.length ? "" : "pointer-events-none opacity-50"}`}
        >
          💬 Enviar pelo WhatsApp
        </a>
      </div>
    </div>
  );
}

function ApartmentRow({ apt }: { apt: HostCardApartment }) {
  const [active, setActive] = useState(apt.active);
  const [busy, setBusy] = useState(false);
  const del = useUndoDelete(() => deleteApartment(apt.id));

  async function toggleActive() {
    setBusy(true);
    try {
      await setApartmentActiveAsAdmin(apt.id, !active);
      setActive((a) => !a);
    } finally {
      setBusy(false);
    }
  }

  if (del.state.status === "pending") {
    return <UndoBar message={`"${apt.label}" será excluído…`} onUndo={del.undo} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-line bg-bg px-3 py-2">
        <span className="min-w-[9rem] flex-1 truncate text-[14px]">
          {apt.label}
          {!active && <span className={badgeCls}>Inativo</span>}
        </span>
        <a
          href={`https://${apt.slug}.anfyi.com.br`}
          className={`${linkBtn} text-terra`}
        >
          {apt.slug} ↗
        </a>
        <Link href={`/admin/apartments/${apt.id}/edit`} className={`${linkBtn} text-soft`}>
          Editar
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={toggleActive}
          className={`${linkBtn} text-soft disabled:opacity-50`}
        >
          {active ? "Inativar" : "Reativar"}
        </button>
        <CopyButton
          text={singleMessage(guideUrl(apt.slug))}
          label="Copiar mensagem"
          className={`${linkBtn} text-soft`}
        />
        <a
          href={whatsappShareUrl(singleMessage(guideUrl(apt.slug)))}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkBtn} text-soft`}
        >
          WhatsApp
        </a>
        <button type="button" onClick={del.start} className={`${linkBtn} text-terra`}>
          Excluir
        </button>
      </div>
      {del.state.status === "error" && (
        <p className="mt-1 text-[12.5px] font-semibold text-terra">{del.state.message}</p>
      )}
    </div>
  );
}

export function HostCard({ host }: { host: HostCardData }) {
  const [active, setActive] = useState(host.active);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const del = useUndoDelete(() => deleteHost(host.id));

  async function toggleActive() {
    setBusy(true);
    try {
      await setHostActive(host.id, !active);
      setActive((a) => !a);
    } finally {
      setBusy(false);
    }
  }

  if (del.state.status === "pending") {
    return (
      <div className="rounded-2xl border border-line bg-card p-4">
        <UndoBar
          message={`Anfitrião "${host.name ?? host.email}" e ${host.apartments.length} apartamento(s) serão excluídos…`}
          onUndo={del.undo}
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <b className="text-[16.5px]">
            {host.name ?? host.email}
            {!active && <span className={badgeCls}>Inativo</span>}
          </b>
          <span className="block text-[14px] text-soft">{host.email}</span>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-x-3 gap-y-1 pt-0.5">
          <button
            type="button"
            onClick={() => setExporting((v) => !v)}
            aria-expanded={exporting}
            className={`${linkBtn} text-terra`}
          >
            {exporting ? "Fechar exportação" : "Exportar links"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={toggleActive}
            className={`${linkBtn} text-soft disabled:opacity-50`}
          >
            {active ? "Inativar" : "Reativar"}
          </button>
          <button type="button" onClick={del.start} className={`${linkBtn} text-terra`}>
            Excluir anfitrião
          </button>
        </div>
      </div>

      {del.state.status === "error" && (
        <p className="mt-2 text-[13px] font-semibold text-terra">{del.state.message}</p>
      )}

      {exporting && <ExportPanel apartments={host.apartments} />}

      <div className="mt-3 grid gap-1.5">
        {host.apartments.map((a) => (
          <ApartmentRow key={a.id} apt={a} />
        ))}
        {host.apartments.length === 0 && (
          <p className="text-[14px] text-soft">Sem apartamentos ainda.</p>
        )}
        <Link
          href={`/admin/apartments/new?hostId=${host.id}`}
          className={`${linkBtn} mt-1 text-terra`}
        >
          + Novo apartamento
        </Link>
      </div>

      <details className="mt-3 border-t border-line pt-3">
        <summary className="cursor-pointer text-[13.5px] font-semibold text-soft">
          Redefinir senha
        </summary>
        <ResetPasswordForm
          hostId={host.id}
          hostEmail={host.email}
          hostNome={host.name ?? host.email}
          inputClassName={field}
        />
      </details>
    </div>
  );
}
