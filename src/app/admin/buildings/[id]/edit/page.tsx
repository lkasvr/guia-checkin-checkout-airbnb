import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BuildingEditor } from "@/app/admin/buildings/building-editor";
import type { BuildingEditPayload } from "@/app/admin/buildings/actions";
import type { Apartment } from "@/data/types";

export const dynamic = "force-dynamic";

export default async function EditBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const building = await prisma.building.findUnique({
    where: { id },
    select: { id: true, name: true, amenities: true, tourism: true, dining: true },
  });
  if (!building) notFound();

  const amenities = building.amenities as unknown as Apartment["amenities"];
  const tourism = building.tourism as unknown as Apartment["tourism"];
  const dining = building.dining as unknown as Apartment["dining"];

  const initial: BuildingEditPayload = {
    amenitiesSub: amenities.sub.pt,
    amenities: amenities.items.map((a) => ({ title: a.title.pt, text: a.text.pt, wide: !!a.wide })),
    tourismSub: tourism.sub.pt,
    tourism: tourism.items.map((p) => ({
      title: p.title,
      text: p.text.pt,
      meta: p.meta,
      site: p.site ?? "",
      maps: p.maps ?? "",
    })),
    diningSub: dining.sub.pt,
    dining: dining.items.map((p) => ({
      title: p.title,
      text: p.text.pt,
      meta: p.meta,
      site: p.site ?? "",
      maps: p.maps ?? "",
    })),
  };

  return <BuildingEditor buildingId={building.id} buildingName={building.name} initial={initial} />;
}
