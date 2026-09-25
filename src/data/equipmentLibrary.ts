import type { Accordion, Apartment, ItemPatches } from "@/data/types";
import { legacyId } from "@/data/itemMerge";

/**
 * Biblioteca de equipamentos: o que já foi escrito em qualquer prédio ou
 * apartamento (título, passos, foto/vídeo, foto com itens numerados e
 * traduções), pra reaproveitar ao cadastrar o mesmo equipamento de novo.
 * Não tem tabela própria: é lida do que já está salvo. Pra cada título vale a
 * versão salva por último.
 */
export type EquipmentModel = {
  /** Título normalizado — o que identifica "o mesmo equipamento". */
  key: string;
  accordion: Accordion;
  /** De onde veio (ex.: "Residencial DF Plaza" ou "Ap 1305C"). */
  source: string;
  updatedAt: string;
};

export type EquipmentSource = {
  label: string;
  updatedAt: Date;
  /** Equipamentos de A Casa gravados direto no prédio ou no apartamento. */
  accordions?: Accordion[];
  /** Ajustes deste apartamento sobre o modelo (equipamento editado ou acrescentado). */
  patches?: ItemPatches;
};

/** Só entra na biblioteca o que tem algo pra reaproveitar além do título. */
const hasContent = (a: Accordion): boolean =>
  !!a.title.pt.trim() &&
  (a.steps.some((s) => s.body.pt.trim()) || !!a.diagram?.img?.trim() || !!a.media?.trim());

export const equipmentKey = (title: string): string => legacyId(title);

export function collectEquipment(sources: EquipmentSource[]): EquipmentModel[] {
  const best = new Map<string, EquipmentModel>();
  for (const src of sources) {
    const found: Accordion[] = [
      ...(src.accordions ?? []),
      ...Object.values(src.patches?.accordions?.edited ?? {}),
      ...(src.patches?.accordions?.added ?? []),
    ];
    for (const raw of found) {
      if (!hasContent(raw)) continue;
      const key = equipmentKey(raw.title.pt);
      const current = best.get(key);
      if (current && new Date(current.updatedAt) >= src.updatedAt) continue;
      // O id é de quem gravou; quem reaproveita recebe um id novo.
      const { id: _id, ...accordion } = raw;
      void _id;
      best.set(key, { key, accordion, source: src.label, updatedAt: src.updatedAt.toISOString() });
    }
  }
  return [...best.values()].sort((a, b) => a.accordion.title.pt.localeCompare(b.accordion.title.pt, "pt"));
}

/** Fonte de um apartamento a partir do conteúdo gravado (com ou sem prédio ligado). */
export function apartmentSource(apt: {
  label: string;
  updatedAt: Date;
  content: unknown;
  overrides: unknown;
}): EquipmentSource {
  const content = apt.content as Apartment;
  const patches = (apt.overrides as { patches?: ItemPatches } | null)?.patches;
  return {
    label: apt.label,
    updatedAt: apt.updatedAt,
    accordions: content?.home?.accordions ?? [],
    patches,
  };
}
