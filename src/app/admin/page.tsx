import Link from "next/link";
import { prisma } from "@/lib/db";
import { createHost } from "@/app/admin/actions";
import { ResetPasswordForm } from "@/app/admin/reset-password-form";

export const dynamic = "force-dynamic";

const field =
  "rounded-xl border border-line bg-bg px-3 py-2 text-[15px] text-ink outline-none focus:border-coffee";
const labelCls = "flex flex-col gap-1 text-[13px] font-semibold text-soft";

export default async function AdminHome() {
  const buildings = await prisma.building.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, _count: { select: { apartments: true } } },
  });
  const hosts = await prisma.user.findMany({
    where: { role: "HOST" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      apartments: {
        select: { id: true, slug: true, label: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return (
    <>
      <h1 className="font-display text-[32px] font-normal">Anfitriões</h1>
      <p className="mt-1 text-[15px] text-soft">
        Crie e gerencie as contas de anfitrião da plataforma.
      </p>

      <section className="mt-6 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-display text-[21px] font-normal">Novo anfitrião</h2>
        <p className="mt-1 text-[14px] text-soft">
          Informe um slug para já criar o primeiro apartamento (o anfitrião
          completa o guia depois).
        </p>
        <form action={createHost} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>
            Nome
            <input name="name" required className={field} placeholder="Nome do anfitrião" />
          </label>
          <label className={labelCls}>
            E-mail
            <input name="email" type="email" required autoComplete="off" className={field} />
          </label>
          <label className={labelCls}>
            Senha
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={field}
            />
          </label>
          <label className={labelCls}>
            Slug do 1º apê (opcional)
            <input name="slug" className={field} placeholder="ex.: 2610b" />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>
            Rótulo do 1º apê (opcional)
            <input name="label" className={field} placeholder="Ap 2610B · Ed. Exemplo" />
          </label>
          <button className="rounded-full bg-ink px-6 py-3 text-[15px] font-bold text-bg sm:col-span-2">
            Criar anfitrião
          </button>
        </form>
      </section>

      <h2 className="mt-8 font-display text-[21px] font-normal">Prédios</h2>
      <p className="mt-1 text-[15px] text-soft">
        Lazer, guia da cidade e onde comer — compartilhado entre os apartamentos do mesmo prédio.
        Um prédio novo é criado automaticamente ao preencher o Edifício na criação de um apartamento.
      </p>
      <div className="mt-3 grid gap-1.5">
        {buildings.map((b) => (
          <div
            key={b.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2"
          >
            <span className="min-w-0 flex-1 truncate text-[14px]">{b.name}</span>
            <span className="whitespace-nowrap text-[13px] text-soft">
              {b._count.apartments} {b._count.apartments === 1 ? "apartamento" : "apartamentos"}
            </span>
            <Link
              href={`/admin/buildings/${b.id}/edit`}
              className="whitespace-nowrap text-[13px] font-semibold text-terra underline underline-offset-2"
            >
              Editar
            </Link>
          </div>
        ))}
        {buildings.length === 0 && (
          <p className="text-[14px] text-soft">Nenhum prédio ainda.</p>
        )}
      </div>

      <h2 className="mt-8 font-display text-[21px] font-normal">Cadastrados</h2>
      <div className="mt-3 grid gap-3">
        {hosts.map((h) => (
          <div key={h.id} className="rounded-2xl border border-line bg-card p-4">
            <div className="min-w-0">
              <b className="text-[16.5px]">{h.name ?? h.email}</b>
              <span className="block text-[14px] text-soft">{h.email}</span>
            </div>

            <div className="mt-3 grid gap-1.5">
              {h.apartments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-bg px-3 py-2"
                >
                  <span className="min-w-0 flex-1 truncate text-[14px]">{a.label}</span>
                  <a
                    href={`https://${a.slug}.anfyi.com.br`}
                    className="whitespace-nowrap text-[13px] font-semibold text-terra underline underline-offset-2"
                  >
                    {a.slug} ↗
                  </a>
                  <Link
                    href={`/admin/apartments/${a.id}/edit`}
                    className="whitespace-nowrap text-[13px] font-semibold text-soft underline underline-offset-2"
                  >
                    Editar
                  </Link>
                </div>
              ))}
              {h.apartments.length === 0 && (
                <p className="text-[14px] text-soft">Sem apartamentos ainda.</p>
              )}
              <Link
                href={`/admin/apartments/new?hostId=${h.id}`}
                className="mt-1 text-[13.5px] font-semibold text-terra underline underline-offset-2"
              >
                + Novo apartamento
              </Link>
            </div>

            <details className="mt-3 border-t border-line pt-3">
              <summary className="cursor-pointer text-[13.5px] font-semibold text-soft">
                Redefinir senha
              </summary>
              <ResetPasswordForm
                hostId={h.id}
                hostEmail={h.email}
                hostNome={h.name ?? h.email}
                inputClassName={field}
              />
            </details>
          </div>
        ))}
        {hosts.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-[15px] text-soft">
            Nenhum anfitrião ainda.
          </p>
        )}
      </div>

      <p className="mt-8 text-center text-[13px] text-soft">
        <Link href="/dashboard" className="text-terra underline underline-offset-2">
          Ir para um painel de anfitrião
        </Link>
      </p>
    </>
  );
}
