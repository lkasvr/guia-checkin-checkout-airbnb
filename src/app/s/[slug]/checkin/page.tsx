import { notFound } from "next/navigation";
import ArrivalPage from "@/components/arrival";
import { getActiveStay, getApartmentBySlug } from "@/lib/apartments";

// time-gated: depende da estadia vigente, sempre a cada request
export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const apartment = await getApartmentBySlug(slug);
  if (!apartment) notFound();

  const stay = await getActiveStay(apartment.id);

  return (
    <ArrivalPage
      content={apartment.content}
      mode="checkin"
      slug={slug}
      stay={
        stay
          ? {
              guestName: stay.guestName,
              doorCode: stay.doorCode,
              checkInISO: stay.checkInAt.toISOString(),
              checkOutISO: stay.checkOutAt.toISOString(),
            }
          : null
      }
    />
  );
}
