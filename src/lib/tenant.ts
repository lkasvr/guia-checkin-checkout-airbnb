/** Domínio-raiz da marca. Subdomínios viram slug de apartamento. */
export const ROOT_DOMAIN = "anfyi.com.br";

/**
 * Extrai o slug do apartamento a partir do host da requisição.
 * - `1305c.anfyi.com.br` → "1305c"
 * - `anfyi.com.br` / `www.anfyi.com.br` → null (apex, usa o padrão)
 * - hosts fora da marca (`*.vercel.app`, `localhost`) → null (usa o padrão)
 */
export function slugFromHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const h = host.split(":")[0].toLowerCase(); // remove a porta
  if (h === ROOT_DOMAIN || h === `www.${ROOT_DOMAIN}`) return null;
  const suffix = `.${ROOT_DOMAIN}`;
  if (h.endsWith(suffix)) {
    const label = h.slice(0, -suffix.length).split(".")[0];
    return label || null;
  }
  return null;
}
