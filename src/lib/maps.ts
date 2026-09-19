/**
 * Só http(s) vira link — o valor vem de um campo de texto do painel e acaba num
 * `href`, então `javascript:` e afins nunca podem passar. Sem protocolo, assume https.
 */
export function normalizeMapsUrl(raw: string | undefined | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Link de busca do Maps a partir do endereço, pra quando só o endereço foi preenchido. */
export const mapsSearchUrl = (address: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

/** Mapa embutido (prévia) — não exige chave de API. */
export const mapsEmbedUrl = (address: string): string =>
  `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`;

/** Número no formato do wa.me (só dígitos, com DDI 55 quando faltar). */
export function whatsappDigits(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  return digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
}
