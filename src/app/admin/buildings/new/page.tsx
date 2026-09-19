import { prisma } from "@/lib/db";
import { BuildingEditor, type BuildingOption } from "@/app/admin/buildings/building-editor";
import type { BuildingEditPayload } from "@/app/admin/buildings/actions";
import { toBuildingTemplate } from "@/data/buildApartmentContent";
import { PREREQUISITE_CARD } from "@/data/prerequisiteCard";
import { checkinFromContent } from "@/data/sectionContent";

export const dynamic = "force-dynamic";

const EMPTY: BuildingEditPayload = {
  rules: { sub: "", items: [] },
  home: { sub: "", slides: [], accordions: [] },
  // Todo modelo novo já nasce com o cartão de documento/veículo no topo.
  checkin: checkinFromContent({ sub: { pt: "", en: "" }, cards: [PREREQUISITE_CARD] }),
  checkout: { sub: "", steps: [] },
  amenities: { sub: "", items: [] },
  tourism: { sub: "", items: [] },
  dining: { sub: "", items: [] },
  defaultHeroImg: "",
  defaultFooterImg: "",
  location: { address: "", mapsUrl: "" },
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
      location: true,
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
