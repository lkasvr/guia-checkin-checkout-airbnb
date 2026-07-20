import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const session = await auth();
  const apartments = await prisma.apartment.findMany({
    where: { hostId: session!.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      label: true,
      active: true,
      _count: { select: { stays: true } },
    },
  });

  return (
    <>
      <h1 className="font-display text-[32px] font-normal">Seus apartamentos</h1>
      <p className="mt-1 text-[15px] text-soft">
        Gerencie o guia e as estadias de cada apartamento.
      </p>

      <div className="mt-6 grid gap-3">
        {apartments.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/apartments/${a.id}`}
            className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4 no-underline transition-transform active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <b className="text-[17px]">{a.label}</b>
                {!a.active && (
                  <span className="rounded-full bg-terra-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-terra">
                    inativo
                  </span>
                )}
              </div>
              <span className="text-[14px] text-soft">
                {a.slug}.anfyi.com.br · {a._count.stays}{" "}
                {a._count.stays === 1 ? "estadia" : "estadias"}
              </span>
            </div>
            <span className="text-[20px] text-soft">›</span>
          </Link>
        ))}

        {apartments.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-[15px] text-soft">
            Nenhum apartamento ainda.
          </p>
        )}
      </div>
    </>
  );
}
