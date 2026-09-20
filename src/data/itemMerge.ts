import type {
  Accordion,
  Amenity,
  CheckinCard,
  ItemPatch,
  Place,
  Rule,
  Slide,
  Step,
} from "@/data/types";

/**
 * Motor de "modelo + ajustes do apartamento": o guia mostra a lista do prédio
 * (ao vivo) trocando só os itens que aquele apartamento editou à mão. Cada item
 * é reconhecido por um id que não muda quando o texto muda.
 */

export function newId(): string {
  const c = globalThis.crypto;
  return c && "randomUUID" in c ? c.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Conteúdo antigo não tem id gravado: o id sai do título, sempre igual pro mesmo texto. */
export const legacyId = (text: string): string => `t:${norm(text)}`;

export const ruleId = (r: Rule): string => r.id ?? legacyId(r.title.pt);
export const slideId = (s: Slide): string => s.id ?? legacyId(s.title.pt);
export const accordionId = (a: Accordion): string => a.id ?? legacyId(a.title.pt);
export const amenityId = (a: Amenity): string => a.id ?? legacyId(a.title.pt);
export const placeId = (p: Place): string => p.id ?? legacyId(p.title);
export const cardId = (c: CheckinCard): string => c.id ?? legacyId(c.title.pt);
/** Passo de check-out: identificado pelo número ("1", "2"…). */
export const stepId = (s: Step): string => `n:${s.n}`;

/** Ids de uma lista, garantindo que dois itens de mesmo título não colidam. */
export function uniqueIds<T>(items: T[], getId: (item: T) => string): string[] {
  const seen = new Map<string, number>();
  return items.map((item) => {
    const id = getId(item);
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    return n === 1 ? id : `${id}~${n}`;
  });
}

/** Lista do modelo com os ajustes de um apartamento aplicados. */
export function mergeItems<T>(
  model: T[],
  patch: ItemPatch<T> | undefined,
  getId: (item: T) => string,
): T[] {
  if (!patch) return model;
  const ids = uniqueIds(model, getId);
  const removed = new Set(patch.removed ?? []);
  const out: T[] = [];
  model.forEach((item, i) => {
    const id = ids[i];
    if (removed.has(id)) return;
    out.push(patch.edited?.[id] ?? item);
  });
  return [...out, ...(patch.added ?? [])];
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  }
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  // Chave com valor `undefined` conta como ausente.
  const keys = new Set([...Object.keys(ra), ...Object.keys(rb)]);
  for (const k of keys) if (!deepEqual(ra[k], rb[k])) return false;
  return true;
}

export const isEmptyPatch = (p: ItemPatch<unknown> | undefined): boolean =>
  !p || (!p.edited || Object.keys(p.edited).length === 0) && !(p.removed?.length) && !(p.added?.length);

/**
 * O que o apartamento mudou em relação ao modelo. Compara no formato de
 * formulário (só português): assim um item que a pessoa não tocou nunca vira
 * "editado" só porque o formulário não guarda as traduções.
 *
 * `toContent` devolve `null` pra item inválido (ex.: título vazio).
 */
export function diffItems<In extends { id?: string }, Out extends { id?: string }>(
  modelIn: In[],
  currentIn: In[],
  toContent: (item: In) => Out | null,
): ItemPatch<Out> | undefined {
  const modelById = new Map(modelIn.map((m) => [m.id, m]));
  const patch: ItemPatch<Out> = {};
  const kept = new Set<string>();

  for (const cur of currentIn) {
    const model = cur.id ? modelById.get(cur.id) : undefined;
    if (model && cur.id) {
      kept.add(cur.id);
      if (deepEqual(model, cur)) continue;
      const out = toContent(cur);
      if (out) (patch.edited ??= {})[cur.id] = { ...out, id: cur.id };
      else (patch.removed ??= []).push(cur.id);
    } else {
      const out = toContent(cur);
      if (out) (patch.added ??= []).push({ ...out, id: cur.id ?? newId() });
    }
  }
  for (const m of modelIn) {
    if (m.id && !kept.has(m.id) && !(patch.removed ?? []).includes(m.id)) {
      (patch.removed ??= []).push(m.id);
    }
  }
  return isEmptyPatch(patch) ? undefined : patch;
}
