/** Mensagem que o anfitrião manda ao hóspede junto com o link do guia. */

const INTRO =
  "Olá, tudo bem? 😊\n\nPor gentileza, peço que acesse o link abaixo: colocamos ali todas as orientações e informações do apartamento, desde como chegar até o Wi-Fi, as regras da casa e dicas da região. Ele é bem dinâmico e interativo! ✨";
const PREREQUISITE =
  'Na primeira parte, em "Antes de chegar", tem o que preciso de vocês pra liberar o acesso no condomínio (foto do documento de cada hóspede e, se vierem de carro, os dados do veículo). Se puderem me enviar por aqui mesmo com antecedência, agilizo tudo pra vocês! 🪪';
const OUTRO = "Estou à disposição para quaisquer dúvidas e necessidades ☺️";

export const guideUrl = (slug: string): string => `https://${slug}.anfyi.com.br`;

/** Um apartamento só: o link vem logo depois do primeiro parágrafo. */
export function singleMessage(url: string): string {
  return `${INTRO}\n\n👉 ${url}\n\n${PREREQUISITE}\n\n${OUTRO}`;
}

/** Vários apartamentos: os links vão no fim, cada um com o número/torre. */
export function multiMessage(items: { label: string; url: string }[]): string {
  const links = items.map((i) => `👉 ${i.label}: ${i.url}`).join("\n");
  return `${INTRO}\n${PREREQUISITE}\n\n${OUTRO}\n\n${links}`;
}

/** Nome do prédio sem a palavra genérica do começo ("Residencial DF Plaza" → "DF Plaza"). */
const shortBuildingName = (building: string): string =>
  building.trim().replace(/^(residencial|edifício|edificio|condomínio|condominio|ed\.)\s+/i, "");

/**
 * "1305C · DF Plaza", ou "1305 · Torre C · DF Plaza" quando o número não traz a
 * torre junto. Se o número já termina na letra da torre (1305C + "Torre C")
 * não repete a torre. Sem prédio, fica só número/torre.
 */
export function exportLabel(unit: string, tower: string, building = ""): string {
  const u = unit.trim();
  const towerName = tower.trim();
  const buildingName = shortBuildingName(building);
  const parts = [u];
  if (towerName) {
    const towerId = towerName.replace(/^(torre|bloco|tower|block)\s+/i, "").trim();
    if (!(towerId && u.toUpperCase().endsWith(towerId.toUpperCase()))) parts.push(towerName);
  }
  if (buildingName) parts.push(buildingName);
  return parts.join(" · ");
}

export const whatsappShareUrl = (text: string): string =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;

/** Copia pro clipboard, com plano B pra navegadores sem a API (ou sem https). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}
