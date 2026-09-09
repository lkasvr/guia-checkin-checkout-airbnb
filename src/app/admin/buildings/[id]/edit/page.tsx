import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BuildingEditor, type BuildingOption } from "@/app/admin/buildings/building-editor";
import type { BuildingEditPayload } from "@/app/admin/buildings/actions";
import { toBuildingTemplate } from "@/data/buildApartmentContent";
import {
  amenitiesFromContent,
  checkinFromContent,
  checkoutFromContent,
  homeFromContent,
  placesFromContent,
  rulesFromContent,
} from "@/data/sectionContent";

export const dynamic = "force-dynamic";

const BUILDING_SELECT = {
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
} as const;

export default async function EditBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [building, others] = await Promise.all([
    prisma.building.findUnique({ where: { id }, select: BUILDING_SELECT }),
    prisma.building.findMany({
      where: { NOT: { id } },
      select: BUILDING_SELECT,
      orderBy: { name: "asc" },
    }),
  ]);
  if (!building) notFound();

  const t = toBuildingTemplate(building);
  const initial: BuildingEditPayload = {
    rules: rulesFromContent(t.rules),
    home: homeFromContent(t.home),
    checkin: checkinFromContent(t.checkinTemplate),
    checkout: checkoutFromContent(t.checkoutTemplate),
    amenities: amenitiesFromContent(t.amenities),
    tourism: placesFromContent(t.tourism),
    dining: placesFromContent(t.dining),
    defaultHeroImg: building.defaultHeroImg ?? "",
    defaultFooterImg: building.defaultFooterImg ?? "",
  };

  const otherBuildings: BuildingOption[] = others.map((b) => ({
    id: b.id,
    name: b.name,
    defaultHeroImg: b.defaultHeroImg,
    defaultFooterImg: b.defaultFooterImg,
    ...toBuildingTemplate(b),
  }));

  return (
    <BuildingEditor
      mode="edit"
      buildingId={building.id}
      buildingName={building.name}
      initial={initial}
      buildings={otherBuildings}
    />
  );
}
