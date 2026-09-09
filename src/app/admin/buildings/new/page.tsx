import { prisma } from "@/lib/db";
import { BuildingEditor, type BuildingOption } from "@/app/admin/buildings/building-editor";
import type { BuildingEditPayload } from "@/app/admin/buildings/actions";
import { toBuildingTemplate } from "@/data/buildApartmentContent";

export const dynamic = "force-dynamic";

const EMPTY: BuildingEditPayload = {
  rules: { sub: "", items: [] },
  home: { sub: "", slides: [], accordions: [] },
  checkin: { sub: "", cards: [] },
  checkout: { sub: "", steps: [] },
  amenities: { sub: "", items: [] },
  tourism: { sub: "", items: [] },
  dining: { sub: "", items: [] },
  defaultHeroImg: "",
  defaultFooterImg: "",
};

export default async function NewBuildingPage() {
  const buildings = await prisma.building.findMany({
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
    },
    orderBy: { name: "asc" },
  });

  const options: BuildingOption[] = buildings.map((b) => ({
    id: b.id,
    name: b.name,
    defaultHeroImg: b.defaultHeroImg,
    defaultFooterImg: b.defaultFooterImg,
    ...toBuildingTemplate(b),
  }));

  return <BuildingEditor mode="create" initial={EMPTY} buildings={options} />;
}
