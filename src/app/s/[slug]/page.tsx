import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Guide from "@/components/Guide";
import { getGuide } from "@/lib/apartments";
import { apartmentMetadata } from "@/lib/metadata";

// depende da estadia vigente (senha, datas, ordem das seções): sempre a cada request
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return {};
  const c = guide.content;
  return apartmentMetadata(
    slug,
    c,
    `${c.name[c.lang.default]} ${c.unit} · Guia da Casa`,
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();
  return <Guide apartment={guide.content} stay={guide.stay} />;
}
