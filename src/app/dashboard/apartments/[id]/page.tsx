import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { toLocalBRInput } from "@/lib/tz";
import { StayStatus } from "@/generated/prisma/client";
import {
  createStay,
  deleteStay,
  setApartmentActive,
  updateStay,
} from "@/app/dashboard/actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<StayStatus, string> = {
  SCHEDULED: "Agendada",
  ACTIVE: "Ativa",
  COMPLETED: "Concluída",
  CANCELED: "Cancelada",
};

const field =
  "rounded-xl border border-line bg-bg px-3 py-2 text-[15px] text-ink outline-none focus:border-coffee";
const labelCls = "flex flex-col gap-1 text-[13px] font-semibold text-soft";

export default async function ApartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const apartment = await prisma.apartment.findFirst({
    where: { id, hostId: session!.user.id },
    select: {
      id: true,
      slug: true,
      label: true,
      active: true,
      stays: {
        orderBy: { checkInAt: "desc" },
        select: {
          id: true,
          guestName: true,
          doorCode: true,
          checkInAt: true,
          checkOutAt: true,
          status: true,
          accessCode: true,
        },
      },
    },
  });
  if (!apartment) notFound();

  return (
    <>
      <Link
        href="/dashboard"
        className="text-[14px] font-semibold text-soft no-underline"
      >
        ‹ Apartamentos
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[30px] font-normal">{apartment.label}</h1>
        <a
          href={`https://${apartment.slug}.anfyi.com.br`}
          className="text-[14px] font-semibold text-terra underline underline-offset-2"
        >
          {apartment.slug}.anfyi.com.br ↗
        </a>
        <Link
          href={`/dashboard/apartments/${apartment.id}/edit`}
          className="text-[14px] font-semibold text-soft underline underline-offset-2"
        >
          Editar guia
        </Link>
        <form
          action={setApartmentActive.bind(null, apartment.id, !apartment.active)}
          className="ml-auto"
        >
          <button
            className={`rounded-full px-4 py-2 text-[13.5px] font-bold ${
              apartment.active
                ? "border border-line bg-card text-soft"
                : "bg-terra text-white"
            }`}
          >
            {apartment.active ? "Ativo — desativar" : "Inativo — ativar"}
          </button>
        </form>
      </div>

      {/* Nova estadia */}
      <section className="mt-7 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-[21px] font-normal">Nova estadia</h2>
        <p className="mt-1 text-[14px] text-soft">
          O check-in/checkout só ficam disponíveis dentro do período.
        </p>
        <form
          action={createStay.bind(null, apartment.id)}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <label className={labelCls}>
            Hóspede
            <input name="guestName" className={field} placeholder="Nome" />
          </label>
          <label className={labelCls}>
            Senha da fechadura
            <input name="doorCode" className={field} placeholder="ex.: 246810" />
          </label>
          <label className={labelCls}>
            Check-in
            <input name="checkInAt" type="datetime-local" required className={field} />
          </label>
          <label className={labelCls}>
            Check-out
            <input name="checkOutAt" type="datetime-local" required className={field} />
          </label>
          <button className="rounded-full bg-ink px-6 py-3 text-[15px] font-bold text-bg sm:col-span-2">
            Criar estadia
          </button>
        </form>
      </section>

      {/* Estadias existentes */}
      <h2 className="mt-8 font-display text-[21px] font-normal">Estadias</h2>
      <div className="mt-3 grid gap-3">
        {apartment.stays.map((s) => (
          <form
            key={s.id}
            action={updateStay.bind(null, s.id)}
            className="rounded-2xl border border-line bg-card p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelCls}>
                Hóspede
                <input
                  name="guestName"
                  defaultValue={s.guestName ?? ""}
                  className={field}
                />
              </label>
              <label className={labelCls}>
                Senha da fechadura
                <input
                  name="doorCode"
                  defaultValue={s.doorCode ?? ""}
                  className={field}
                />
              </label>
              <label className={labelCls}>
                Check-in
                <input
                  name="checkInAt"
                  type="datetime-local"
                  defaultValue={toLocalBRInput(s.checkInAt)}
                  required
                  className={field}
                />
              </label>
              <label className={labelCls}>
                Check-out
                <input
                  name="checkOutAt"
                  type="datetime-local"
                  defaultValue={toLocalBRInput(s.checkOutAt)}
                  required
                  className={field}
                />
              </label>
              <label className={labelCls}>
                Status
                <select name="status" defaultValue={s.status} className={field}>
                  {Object.values(StayStatus).map((v) => (
                    <option key={v} value={v}>
                      {STATUS_LABEL[v]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end gap-2">
                <button className="flex-1 rounded-full bg-ink px-4 py-2.5 text-[14px] font-bold text-bg">
                  Salvar
                </button>
                <button
                  formAction={deleteStay.bind(null, s.id)}
                  className="rounded-full border border-[rgb(168_69_46/0.4)] px-4 py-2.5 text-[14px] font-bold text-terra"
                >
                  Excluir
                </button>
              </div>
            </div>
            <p className="mt-2 text-[12.5px] text-soft">
              Link do hóspede: código <code className="text-ink">{s.accessCode}</code>
            </p>
          </form>
        ))}

        {apartment.stays.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-[15px] text-soft">
            Nenhuma estadia cadastrada.
          </p>
        )}
      </div>
    </>
  );
}
