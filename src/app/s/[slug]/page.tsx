import { notFound } from "next/navigation";
import Guide from "@/components/Guide";
import { getApartmentBySlug } from "@/lib/apartments";

// dados por tenant lidos do banco a cada request
export const dynamic = "force-dynamic";

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
