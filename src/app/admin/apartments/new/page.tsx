import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ApartmentWizard } from "@/app/admin/apartments/wizard";
import { toBuildingTemplate } from "@/data/buildApartmentContent";

export const dynamic = "force-dynamic";

export default async function NewApartmentPage({
  searchParams,
}: {
  searchParams: Promise<{ hostId?: string }>;
}) {
  const { hostId } = await searchParams;
  if (!hostId) notFound();

  const [host, buildings] = await Promise.all([
    prisma.user.findFirst({
      where: { id: hostId, role: "HOST" },
      select: { id: true, name: true, email: true },
    }),
    prisma.building.findMany({
      select: {
        id: true,
        name: true,
        rules: true,
        home: true,
        amenities: true,
        tourism: true,
        dining: true,
        checkinTemplate: true,
        checkoutTemplate: true,
        defaultHeroImg: true,
        defaultFooterImg: true,
        location: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!host) notFound();

  return (
    <ApartmentWizard
      mode="create"
      hostId={host.id}
      hostName={host.name ?? host.email}
      buildings={buildings.map((b) => ({
        id: b.id,
        name: b.name,
        defaultHeroImg: b.defaultHeroImg,
        defaultFooterImg: b.defaultFooterImg,
        ...toBuildingTemplate(b),
      }))}
    />
  );
}
