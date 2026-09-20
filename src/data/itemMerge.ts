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
  /** Itens que vivem fora do ajuste (ex.: regras próprias do apartamento), depois dos do modelo e dos acrescentados. */
  extra: T[] = [],
): T[] {
  if (!patch) return extra.length ? [...model, ...extra] : model;
  const ids = uniqueIds(model, getId);
  const removed = new Set(patch.removed ?? []);
  const out: T[] = [];
  model.forEach((item, i) => {
    const id = ids[i];
    if (removed.has(id)) return;
    out.push(patch.edited?.[id] ?? item);
  });
  const all = [...out, ...(patch.added ?? []), ...extra];
  return patch.order?.length ? applyOrder(all, patch.order, getId) : all;
}

/** Itens na ordem de `order`; o que não está nela vai pro fim, na ordem em que estava. */
function applyOrder<T>(items: T[], order: string[], getId: (item: T) => string): T[] {
  const ids = uniqueIds(items, getId);
  const rank = new Map(order.map((id, i) => [id, i]));
  return items
    .map((item, i) => ({ item, i, r: rank.get(ids[i]) ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map((x) => x.item);
}

/** Forma "canônica" pra comparar conteúdo: sem id e sem vazios (undefined, false, "", []). */
export function canon(v: unknown): unknown {
  if (Array.isArray(v)) {
    const a = v.map(canon);
    return a.length ? a : undefined;
  }
  if (v && typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([k]) => k !== "id")
      .map(([k, x]) => [k, canon(x)] as const)
      .filter(([, x]) => x !== undefined);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return v === false || v === "" || v === null ? undefined : v;
}

/** Só o português: sem as traduções (`en`/`es`), que o formulário não edita. */
const dropLangs = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(dropLangs);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>)
        .filter(([k]) => k !== "en" && k !== "es")
        .map(([k, x]) => [k, dropLangs(x)]),
    );
  }
  return v;
};
const samePt = (a: unknown, b: unknown) => deepEqual(canon(dropLangs(a)), canon(dropLangs(b)));

export const sameContent = (a: unknown, b: unknown): boolean => deepEqual(canon(a), canon(b));

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

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
  !p ||
  ((!p.edited || Object.keys(p.edited).length === 0) &&
    !p.removed?.length &&
    !p.added?.length &&
    !p.order?.length);

/** Coloca `order` no ajuste só quando a ordem final foge da natural (modelo, depois os acrescentados). */
export function withOrder<T>(
  patch: ItemPatch<T>,
  finalIds: string[],
  naturalIds: string[],
): ItemPatch<T> {
  if (!sameIds(finalIds, naturalIds)) patch.order = finalIds;
  return patch;
}

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
  /** Ajuste já gravado: se o português não mudou, mantém as traduções que ele já tinha. */
  previous?: ItemPatch<Out>,
): ItemPatch<Out> | undefined {
  const modelById = new Map(modelIn.map((m) => [m.id, m]));
  const patch: ItemPatch<Out> = {};
  const kept = new Set<string>();
  const finalIds: string[] = [];

  for (const cur of currentIn) {
    const model = cur.id ? modelById.get(cur.id) : undefined;
    const prevEdited = cur.id ? previous?.edited?.[cur.id] : undefined;
    const prevAdded = cur.id ? previous?.added?.find((a) => a.id === cur.id) : undefined;
    if (model && cur.id) {
      kept.add(cur.id);
      const now = prevEdited ? toContent(cur) : null;
      if (prevEdited && now && samePt(prevEdited, now)) {
        (patch.edited ??= {})[cur.id] = prevEdited;
        finalIds.push(cur.id);
        continue;
      }
      if (deepEqual(model, cur)) {
        finalIds.push(cur.id);
        continue;
      }
      const out = toContent(cur);
      if (out) {
        (patch.edited ??= {})[cur.id] = { ...out, id: cur.id };
        finalIds.push(cur.id);
      } else (patch.removed ??= []).push(cur.id);
    } else {
      const out = toContent(cur);
      if (out) {
        const id = cur.id ?? newId();
        (patch.added ??= []).push(prevAdded && samePt(prevAdded, out) ? prevAdded : { ...out, id });
        finalIds.push(id);
      }
    }
  }
  for (const m of modelIn) {
    if (m.id && !kept.has(m.id) && !(patch.removed ?? []).includes(m.id)) {
      (patch.removed ??= []).push(m.id);
    }
  }
  const natural = [
    ...modelIn.filter((m) => m.id && !(patch.removed ?? []).includes(m.id)).map((m) => m.id as string),
    ...(patch.added ?? []).map((a) => a.id as string),
  ];
  withOrder(patch, finalIds, natural);
  return isEmptyPatch(patch) ? undefined : patch;
}
