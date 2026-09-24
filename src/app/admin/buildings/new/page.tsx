import { prisma } from "@/lib/db";
import { BuildingEditor, type BuildingOption } from "@/app/admin/buildings/building-editor";
import type { BuildingEditPayload } from "@/app/admin/buildings/actions";
import { toBuildingTemplate } from "@/data/buildApartmentContent";
import { PREREQUISITE_CARD } from "@/data/prerequisiteCard";
import { checkinFromContent, emptyL } from "@/data/sectionContent";

export const dynamic = "force-dynamic";

const EMPTY: BuildingEditPayload = {
  rules: { sub: emptyL(), items: [] },
  home: { sub: emptyL(), slides: [], accordions: [] },
  // Todo modelo novo já nasce com o cartão de documento/veículo no topo.
  checkin: checkinFromContent({ sub: { pt: "", en: "" }, cards: [PREREQUISITE_CARD] }),
  checkout: { sub: emptyL(), steps: [] },
  amenities: { sub: emptyL(), items: [] },
  tourism: { sub: emptyL(), items: [] },
  dining: { sub: emptyL(), items: [] },
  defaultHeroImg: "",
  defaultFooterImg: "",
  location: { address: "", mapsUrl: "", portariaPhone: "", intercom: [] },
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
