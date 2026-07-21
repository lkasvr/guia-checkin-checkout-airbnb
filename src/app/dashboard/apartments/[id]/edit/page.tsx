import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { Apartment } from "@/data/types";
import { updateApartmentContent } from "@/app/dashboard/actions";

export const dynamic = "force-dynamic";

const field =
  "rounded-xl border border-line bg-bg px-3 py-2 text-[15px] text-ink outline-none focus:border-coffee";
const labelCls = "flex flex-col gap-1 text-[13px] font-semibold text-soft";

export default async function EditGuidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const apt = await prisma.apartment.findFirst({
    where: { id, hostId: session!.user.id },
    select: { id: true, label: true, content: true },
  });
  if (!apt) notFound();
  const c = apt.content as unknown as Apartment;

  return (
    <>
      <Link
        href={`/dashboard/apartments/${apt.id}`}
        className="text-[14px] font-semibold text-soft no-underline"
      >
        ‹ Voltar
      </Link>
      <h1 className="mt-2 font-display text-[30px] font-normal">Editar guia</h1>
      <p className="mt-1 text-[15px] text-soft">
        Identidade e textos que aparecem no cabeçalho do guia e no
        compartilhamento (título e prévia em redes). Os campos “sub” aceitam{" "}
        <code className="text-ink">&lt;strong&gt;</code>.
      </p>

      <form
        action={updateApartmentContent.bind(null, apt.id)}
        className="mt-5 grid gap-3 sm:grid-cols-2"
      >
        <label className={labelCls}>
          Nome (PT)
          <input name="name_pt" required defaultValue={c.name.pt} className={field} />
        </label>
        <label className={labelCls}>
          Nome (EN)
          <input name="name_en" defaultValue={c.name.en} className={field} />
        </label>
        <label className={labelCls}>
          Unidade
          <input
            name="unit"
            required
            defaultValue={c.unit}
            placeholder="ex.: 1305C"
            className={field}
          />
        </label>
        <label className={labelCls}>
          Prédio / condomínio
          <input name="building" defaultValue={c.building} className={field} />
        </label>
        <label className={labelCls}>
          Eyebrow (PT)
          <input name="eyebrow_pt" defaultValue={c.eyebrow.pt} className={field} />
        </label>
        <label className={labelCls}>
          Eyebrow (EN)
          <input name="eyebrow_en" defaultValue={c.eyebrow.en} className={field} />
        </label>
        <label className={`${labelCls} sm:col-span-2`}>
          Subtítulo do hero (PT) — usado na descrição/prévia
          <textarea
            name="hero_sub_pt"
            rows={3}
            defaultValue={c.hero.sub.pt}
            className={field}
          />
        </label>
        <label className={`${labelCls} sm:col-span-2`}>
          Subtítulo do hero (EN)
          <textarea
            name="hero_sub_en"
            rows={3}
            defaultValue={c.hero.sub.en}
            className={field}
          />
        </label>
        <button className="rounded-full bg-ink px-6 py-3 text-[15px] font-bold text-bg sm:col-span-2">
          Salvar
        </button>
      </form>
    </>
  );
}
