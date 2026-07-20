/** Domínio-raiz da marca. Subdomínios viram slug de apartamento. */
export const ROOT_DOMAIN = "anfyi.com.br";

/** Slug padrão para hosts fora da marca (localhost, *.vercel.app). */
export const DEFAULT_SLUG = "1305c";

/** Rótulos que nunca são slug de apartamento. */
const RESERVED = new Set(["www", "app", "api"]);

export type HostRoute =
  | { kind: "apex" } // anfyi.com.br / www — landing da marca
  | { kind: "dashboard" } // app.anfyi.com.br — área do anfitrião
  | { kind: "guide"; slug: string } // <slug>.anfyi.com.br — hall principal
  | { kind: "checkin"; slug: string } // checkin<slug> / checkin-<slug>
  | { kind: "checkout"; slug: string } // checkout<slug> / checkout-<slug>
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
  if (RESERVED.has(label)) return { kind: "apex" };

  const m = label.match(/^(checkin|checkout)-?(.+)$/);
  if (m) {
    const kind = m[1] as "checkin" | "checkout";
    return { kind, slug: m[2] };
  }
  return { kind: "guide", slug: label };
}
