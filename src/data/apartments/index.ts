import type { Apartment } from "@/data/types";
import { ap1305c } from "@/data/apartments/1305c";

/** Registro de apartamentos por slug. Adicionar um novo apê = adicionar aqui. */
export const apartments: Record<string, Apartment> = {
  "1305c": ap1305c,
};

export const DEFAULT_SLUG = "1305c";

export function getApartment(slug: string = DEFAULT_SLUG): Apartment | undefined {
  return apartments[slug];
}
