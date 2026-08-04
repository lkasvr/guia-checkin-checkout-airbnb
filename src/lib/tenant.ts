/** Domínio-raiz da marca. Subdomínios viram slug de apartamento. */
export const ROOT_DOMAIN = "anfyi.com.br";

/** Slug padrão para hosts fora da marca (localhost, *.vercel.app). */
export const DEFAULT_SLUG = "1305c";

/** Rótulos que nunca são slug de apartamento. ("app" já é tratado antes, como dashboard.) */
const RESERVED = new Set(["www", "api"]);

export type HostRoute =
  | { kind: "apex" } // anfyi.com.br / www — landing da marca
  | { kind: "dashboard" } // app.anfyi.com.br — área do anfitrião
  | { kind: "admin" } // admin.anfyi.com.br — superadmin da plataforma
  | { kind: "guide"; slug: string } // <slug>.anfyi.com.br — o guia (página única)
  | { kind: "external" }; // localhost, *.vercel.app, etc.

/** Interpreta o Host e decide o destino. */
export function parseHost(host: string | null | undefined): HostRoute {
  if (!host) return { kind: "external" };
  const h = host.split(":")[0].toLowerCase();

  if (h === ROOT_DOMAIN || h === `www.${ROOT_DOMAIN}`) return { kind: "apex" };

  const suffix = `.${ROOT_DOMAIN}`;
  if (!h.endsWith(suffix)) return { kind: "external" };

  const label = h.slice(0, -suffix.length).split(".")[0];
  if (!label) return { kind: "apex" };
  if (label === "app") return { kind: "dashboard" };
  if (label === "admin") return { kind: "admin" };
  if (RESERVED.has(label)) return { kind: "apex" };

  // Chegada e saída vivem dentro do guia (página única); não há mais
  // subdomínio checkin<slug>/checkout<slug>.
  return { kind: "guide", slug: label };
}
