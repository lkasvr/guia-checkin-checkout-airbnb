import { notFound } from "next/navigation";
import ArrivalPage from "@/components/arrival";
import { getArrival } from "@/lib/apartments";

// time-gated: depende da estadia vigente, sempre a cada request
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getArrival(slug);
  if (!data) notFound();

  return (
    <ArrivalPage content={data.content} mode="checkout" slug={slug} stay={data.stay} />
  );
}
