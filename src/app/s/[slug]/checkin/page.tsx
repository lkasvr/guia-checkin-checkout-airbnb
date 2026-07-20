import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArrivalPage from "@/components/arrival";
import { getArrival } from "@/lib/apartments";
import { apartmentMetadata } from "@/lib/metadata";

// time-gated: depende da estadia vigente, sempre a cada request
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArrival(slug);
  if (!data) return {};
  return apartmentMetadata(slug, data.content, `Check-in · Ap ${data.content.unit}`);
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getArrival(slug);
  if (!data) notFound();

  return (
    <ArrivalPage content={data.content} mode="checkin" slug={slug} stay={data.stay} />
  );
}
