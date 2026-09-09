"use client";

import Link from "next/link";
import { useState } from "react";
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

export type HostCardApartment = { id: string; slug: string; label: string; active: boolean };
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
      <div className="flex items-center gap-3 rounded-xl border border-line bg-bg px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-[14px]">
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
        <div className="flex shrink-0 gap-3 pt-0.5">
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
