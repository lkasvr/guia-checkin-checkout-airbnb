import type { Apartment, BuildingInfo, ItemPatches, L } from "@/data/types";

const t = (pt: string): L => ({ pt, en: pt });

/** Conteúdo de prédio relevante pra montar um apartamento (`Building`, ver schema.prisma). */
export type BuildingTemplate = {
  rules: Apartment["rules"];
  home: Apartment["home"];
  amenities: Apartment["amenities"];
  tourism: Apartment["tourism"];
  dining: Apartment["dining"];
  checkinTemplate: Apartment["checkin"];
  checkoutTemplate: NonNullable<Apartment["checkout"]>;
  /** Endereço/mapa + telefone da portaria e códigos do interfone. */
  location: BuildingInfo | null;
};

/**
 * Como este apartamento se liga ao prédio (`Apartment.overrides`, JSON).
 *
 * - `patches` (modo atual): o que o apartamento editou/removeu/acrescentou, item
 *   por item — o resto segue o prédio ao vivo.
 * - Booleanos (modo antigo, ainda lido enquanto não houver `patches`): `true` =
 *   a seção inteira é do apartamento, sem seguir o prédio.
 */
export type ApartmentOverrides = {
  rules?: boolean;
  home?: boolean;
  amenities?: boolean;
  tourism?: boolean;
  dining?: boolean;
  patches?: ItemPatches;
};

export const BLANK_RULES: Apartment["rules"] = { sub: t(""), items: [] };
export const BLANK_HOME: Apartment["home"] = { sub: t(""), slides: [], accordions: [] };

/** Converte as colunas JSON cruas do Prisma (`Building`) pro formato tipado. */
export function toBuildingTemplate(row: {
  rules: unknown;
  home: unknown;
  amenities: unknown;
  tourism: unknown;
  dining: unknown;
  checkinTemplate: unknown;
  checkoutTemplate: unknown;
  location?: unknown;
}): BuildingTemplate {
  return {
    location: (row.location as BuildingInfo | null | undefined) ?? null,
    rules: (row.rules as Apartment["rules"] | null) ?? BLANK_RULES,
    home: (row.home as Apartment["home"] | null) ?? BLANK_HOME,
    amenities: row.amenities as Apartment["amenities"],
    tourism: row.tourism as Apartment["tourism"],
    dining: row.dining as Apartment["dining"],
    checkinTemplate: row.checkinTemplate as Apartment["checkin"],
    checkoutTemplate: row.checkoutTemplate as NonNullable<Apartment["checkout"]>,
  };
}
