import type { Apartment, BuildingInfo, Contact, ContactInfo, IntercomCode } from "@/data/types";
import { deriveVars } from "@/data/checkinTemplate";

/** Só dígitos, com `+55` na frente — formato `tel:` a partir do que a pessoa digitou. */
export function toTel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

/** "Torre C", "torre c" e "C" viram a mesma chave ("c"). */
export function towerKey(tower: string): string {
  return tower
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/^(torre|bloco|tower|block)\s+/, "");
}

/** Código do interfone da torre digitada (ex.: "Torre C" → "*1"), ou "" se não houver. */
export function lookupIntercom(list: IntercomCode[] | undefined, tower: string): string {
  const key = towerKey(tower);
  if (!key) return "";
  return list?.find((i) => towerKey(i.tower) === key)?.code.trim() ?? "";
}

/**
 * Contato da portaria: telefone e código do interfone. Vale o do apartamento;
 * sem ele, o telefone do prédio e o código da torre. Sem telefone não há contato.
 */
export function portariaContact(content: Apartment, info: BuildingInfo | null): Contact | null {
  const own = content.portaria;
  const phone = own?.phone?.trim() || info?.portariaPhone?.trim() || "";
  if (!phone) return null;
  const code =
    own?.code?.trim() || lookupIntercom(info?.intercom, deriveVars(content).TORRE) || "";
  return {
    icon: "🛎️",
    name: "",
    role: code
      ? {
          pt: `Interfone <b>${code}</b> ou telefone`,
          en: `Intercom <b>${code}</b> or phone`,
          es: `Interfono <b>${code}</b> o teléfono`,
        }
      : { pt: "Portaria", en: "Front desk", es: "Recepción" },
    phone,
    tel: toTel(phone),
  };
}

/** Coloca a portaria antes das emergências, no lugar do "Interfone" digitado à mão em conteúdo antigo. */
export function withPortaria(contacts: Contact[], portaria: Contact | null): Contact[] {
  if (!portaria) return contacts;
  const rest = contacts.filter((c) => !/interfone|intercom/i.test(`${c.role.pt} ${c.role.en}`));
  const at = rest.findIndex((c) => c.sos);
  return at === -1 ? [...rest, portaria] : [...rest.slice(0, at), portaria, ...rest.slice(at)];
}

/**
 * Contatos que a pessoa digitou no formulário deste apartamento. Conteúdo
 * antigo não guardou isso: o 1º e o 2º contato com WhatsApp viram anfitrião e
 * coanfitrião.
 */
export function contactInfoFromContent(content: Apartment): ContactInfo {
  if (content.contactInfo) return content.contactInfo;
  const whats = content.contacts.items.filter(
    (c) => !c.sos && /whats/i.test(`${c.role.pt} ${c.role.en}`),
  );
  return {
    hostWhatsapp: whats[0]?.phone ?? "",
    coHostName: whats[1]?.name ?? "",
    coHostWhatsapp: whats[1]?.phone ?? "",
  };
}

export type ReusableContacts = {
  label: string;
  hostWhatsapp: string;
  coHostName: string;
  coHostWhatsapp: string;
};

/** Contatos distintos dos outros apartamentos do anfitrião, pra reaproveitar no formulário. */
export function reusableContacts(rows: { label: string; content: unknown }[]): ReusableContacts[] {
  const seen = new Set<string>();
  const out: ReusableContacts[] = [];
  for (const r of rows) {
    const c = contactInfoFromContent(r.content as Apartment);
    if (!c.hostWhatsapp && !c.coHostWhatsapp) continue;
    const key = `${c.hostWhatsapp}|${c.coHostName}|${c.coHostWhatsapp}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const who = [c.hostWhatsapp, c.coHostName && `${c.coHostName} ${c.coHostWhatsapp}`.trim()]
      .filter(Boolean)
      .join(" · ");
    out.push({ label: `${r.label} — ${who}`, ...c });
  }
  return out;
}
