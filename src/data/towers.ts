import type { IntercomCode, L } from "@/data/types";

/** "Torre C", "torre c" e "C" viram a mesma chave ("c"). */
export function towerKey(tower: string): string {
  return tower
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^(torre|bloco|tower|block)s+/, "");
}

/**
 * Trecho "…, ao lado do restaurante X" que entra depois de "portaria" no passo a
 * passo do check-in — um por idioma, porque a frase muda. Sem restaurante
 * cadastrado pra torre, some (a frase continua certa sem ele).
 */
export function portariaRefToken(list: IntercomCode[] | undefined, tower: string): L {
  const key = towerKey(tower);
  const name = key ? list?.find((i) => towerKey(i.tower) === key)?.restaurant?.trim() : "";
  if (!name) return { pt: "", en: "", es: "" };
  return {
    pt: `, ao lado do restaurante <strong>${name}</strong>`,
    en: `, next to the <strong>${name}</strong> restaurant`,
    es: `, junto al restaurante <strong>${name}</strong>`,
  };
}
