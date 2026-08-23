import Link from "next/link";
import { prisma } from "@/lib/db";
import { createHost, resetHostPassword } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

const field =
  "rounded-xl border border-line bg-bg px-3 py-2 text-[15px] text-ink outline-none focus:border-coffee";
const labelCls = "flex flex-col gap-1 text-[13px] font-semibold text-soft";

export default async function AdminHome() {
  const hosts = await prisma.user.findMany({
    where: { role: "HOST" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      apartments: { select: { slug: true }, orderBy: { createdAt: "asc" } },
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

      <h2 className="mt-8 font-display text-[21px] font-normal">Cadastrados</h2>
      <div className="mt-3 grid gap-3">
        {hosts.map((h) => (
          <div key={h.id} className="rounded-2xl border border-line bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <b className="text-[16.5px]">{h.name ?? h.email}</b>
                <span className="block text-[14px] text-soft">
                  {h.email} ·{" "}
                  {h.apartments.length
                    ? h.apartments.map((a) => a.slug).join(", ")
                    : "sem apartamentos"}
                </span>
              </div>
              {h.apartments[0] && (
                <a
                  href={`https://${h.apartments[0].slug}.anfyi.com.br`}
                  className="whitespace-nowrap text-[13.5px] font-semibold text-terra underline underline-offset-2"
                >
                  {h.apartments[0].slug} ↗
                </a>
              )}
            </div>

            <details className="mt-3 border-t border-line pt-3">
              <summary className="cursor-pointer text-[13.5px] font-semibold text-soft">
                Redefinir senha
              </summary>
              <form
                action={resetHostPassword.bind(null, h.id)}
                className="mt-3 flex flex-col gap-2 sm:flex-row"
              >
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  aria-label={`Nova senha de ${h.name ?? h.email}`}
                  placeholder="Nova senha (mín. 8 caracteres)"
                  className={`${field} flex-1`}
                />
                <button className="rounded-full bg-ink px-5 py-2 text-[14px] font-bold text-bg">
                  Salvar
                </button>
              </form>
              <p className="mt-2 text-[13px] text-soft">
                O anfitrião passa a usar esta senha no próximo login. Quem já
                estiver com sessão aberta continua logado até o token expirar.
              </p>
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
