import type { Amenity, Apartment, ItemPatches, Place } from "@/data/types";
import { legacyId, sameContent } from "@/data/itemMerge";

/**
 * Biblioteca de itens de Lazer, Onde Comer e Guia de Brasília: tudo o que já foi escrito em
 * qualquer prédio ou apartamento (foto, título, texto, horário, traduções,
 * site, mapa), para reaproveitar ao montar outro. Não tem tabela própria: é
 * lida do que já está salvo. Itens com o mesmo título e o mesmo conteúdo viram
 * uma só opção; o mesmo título com conteúdo diferente (a piscina de um prédio
 * não é a de outro) aparece como opções separadas, cada uma com a sua origem.
 */
export type LibraryModel<T> = {
  /** Título normalizado: o que identifica "o mesmo item". */
  key: string;
  item: T;
  /** De onde veio (ex.: "Residencial DF Plaza" ou "Ap 1305C"). */
  source: string;
  updatedAt: string;
};

export type AmenityModel = LibraryModel<Amenity>;
export type PlaceModel = LibraryModel<Place>;
export type SectionLibrary = {
  amenities: AmenityModel[];
  dining: PlaceModel[];
  tourism: PlaceModel[];
};

export type LibrarySource = {
  label: string;
  updatedAt: Date;
  amenities?: Amenity[];
  dining?: Place[];
  tourism?: Place[];
  /** Ajustes deste apartamento sobre o modelo (item editado ou acrescentado). */
  patches?: ItemPatches;
};

export const amenityKey = (a: Pick<Amenity, "title">): string => legacyId(a.title.pt);
export const placeKey = (p: Pick<Place, "title">): string => legacyId(p.title);

function collect<T extends { id?: string }>(
  found: { raw: T; src: LibrarySource }[],
  keyOf: (t: T) => string,
  titleOf: (t: T) => string,
): LibraryModel<T>[] {
  const out: LibraryModel<T>[] = [];
  for (const { raw, src } of found) {
    if (!titleOf(raw).trim()) continue;
    // O id é de quem gravou; quem reaproveita recebe um id novo.
    const { id: _id, ...rest } = raw;
    void _id;
    const item = rest as unknown as T;
    const key = keyOf(raw);
    const same = out.find((m) => m.key === key && sameContent(m.item, item));
    const updatedAt = src.updatedAt.toISOString();
    if (same) {
      if (new Date(same.updatedAt) < src.updatedAt) {
        same.source = src.label;
        same.updatedAt = updatedAt;
      }
      continue;
    }
    out.push({ key, item, source: src.label, updatedAt });
  }
  return out.sort(
    (a, b) =>
      titleOf(a.item).localeCompare(titleOf(b.item), "pt") ||
      b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function collectSectionLibrary(sources: LibrarySource[]): SectionLibrary {
  const amenities: { raw: Amenity; src: LibrarySource }[] = [];
  const dining: { raw: Place; src: LibrarySource }[] = [];
  const tourism: { raw: Place; src: LibrarySource }[] = [];
  for (const src of sources) {
    for (const raw of [
      ...(src.amenities ?? []),
      ...Object.values(src.patches?.amenities?.edited ?? {}),
      ...(src.patches?.amenities?.added ?? []),
    ])
      amenities.push({ raw, src });
    for (const raw of [
      ...(src.dining ?? []),
      ...Object.values(src.patches?.dining?.edited ?? {}),
      ...(src.patches?.dining?.added ?? []),
    ])
      dining.push({ raw, src });
    for (const raw of [
      ...(src.tourism ?? []),
      ...Object.values(src.patches?.tourism?.edited ?? {}),
      ...(src.patches?.tourism?.added ?? []),
    ])
      tourism.push({ raw, src });
  }
  return {
    amenities: collect(amenities, amenityKey, (a) => a.title.pt),
    dining: collect(dining, placeKey, (p) => p.title),
    tourism: collect(tourism, placeKey, (p) => p.title),
  };
}

/** Fonte de um apartamento a partir do conteúdo gravado (com ou sem prédio ligado). */
export function apartmentLibrarySource(apt: {
  label: string;
  updatedAt: Date;
  content: unknown;
  overrides: unknown;
}): LibrarySource {
  const content = apt.content as Apartment;
  const patches = (apt.overrides as { patches?: ItemPatches } | null)?.patches;
  return {
    label: apt.label,
    updatedAt: apt.updatedAt,
    amenities: content?.amenities?.items ?? [],
    dining: content?.dining?.items ?? [],
    tourism: content?.tourism?.items ?? [],
    patches,
  };
}
