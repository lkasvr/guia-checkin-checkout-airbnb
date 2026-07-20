import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Guide from "@/components/Guide";
import { getApartmentBySlug } from "@/lib/apartments";
import { apartmentMetadata } from "@/lib/metadata";

// dados por tenant lidos do banco a cada request
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) return {};
  const c = apartment.content;
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
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) notFound();
  return <Guide apartment={apartment.content} />;
}
