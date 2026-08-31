import type { Apartment, L, Rule } from "@/data/types";
import { starterContent } from "@/data/starter";

const t = (pt: string, en?: string): L => ({ pt, en: en ?? pt });

export type ApartmentFormInput = {
  building: string;
  unit: string;
  tower: string;
  floor: string;
  parking: string;
  maxGuests: string;
  checkinTime: string;
  checkoutTime: string;
  doorCodeMode: "fixed" | "per_stay";
  doorCode: string;
  wifiNetwork: string;
  wifiPassword: string;
  rulesText: string;
  smoking: "yes" | "no";
  pets: "yes" | "no";
  hostWhatsapp: string;
  coHostName: string;
  coHostWhatsapp: string;
  internalNotes: string;
};

/** Só dígitos, com `+55` na frente — formato `tel:` a partir do que a pessoa digitou. */
function toTel(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("55") ? `+${digits}` : `+55${digits}`;
}

const EMERGENCY_CONTACTS: Apartment["contacts"]["items"] = [
  {
    icon: "🚑",
    name: "SAMU",
    role: t("Emergência médica", "Medical emergency"),
    phone: "192",
    tel: "192",
    sos: true,
  },
  {
    icon: "🚒",
    name: "",
    role: t("Incêndio e resgate", "Fire and rescue"),
    phone: "193",
    tel: "193",
    sos: true,
  },
];

/**
 * Monta o `Apartment.content` completo a partir dos campos essenciais
 * preenchidos no painel do superadmin, usando `starterContent` como base
 * para as seções ainda não cobertas pelo formulário (home/amenities/tourism/
 * dining ficam em branco, como hoje, até a fase de fotos).
 */
/**
 * `base` é o conteúdo já existente do apartamento, passado na edição — assim
 * as seções que o formulário não cobre (home/amenities/tourism/dining) são
 * preservadas em vez de voltar a ficar em branco. Na criação, `base` fica de
 * fora e usa-se o `starterContent` (tudo em branco).
 */
export function buildApartmentContent(
  input: ApartmentFormInput,
  hostName: string,
  base: Apartment = starterContent("Apartamento", input.unit, input.building),
): Apartment {

  const facts: Apartment["hero"]["facts"] = [];
  if (input.tower) facts.push({ k: t(input.tower), v: t(input.floor || "—") });
  if (input.parking) facts.push({ k: t(input.parking), v: t("Garagem", "Parking") });
  if (input.maxGuests) {
    facts.push({
      k: t(`${input.maxGuests} hóspedes`, `${input.maxGuests} guests`),
      v: t("Capacidade máxima", "Max capacity"),
    });
  }
  if (input.checkinTime) facts.push({ k: t(input.checkinTime), v: t("Check-in") });
  if (input.checkoutTime) facts.push({ k: t(input.checkoutTime), v: t("Check-out") });

  const rules: Rule[] = input.rulesText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ icon: "📌", title: t(line), text: t("") }));

  rules.push(
    input.smoking === "no"
      ? {
          icon: "🚭",
          hot: true,
          title: t("Proibido fumar", "No smoking"),
          text: t("Em todo o apartamento.", "Anywhere in the apartment."),
        }
      : { icon: "🚬", title: t("Fumo permitido", "Smoking allowed"), text: t("") },
  );
  rules.push(
    input.pets === "no"
      ? {
          icon: "🚫",
          hot: true,
          title: t("Não são permitidos animais", "No pets allowed"),
          text: t(""),
        }
      : { icon: "🐾", title: t("Animais são bem-vindos", "Pets are welcome"), text: t("") },
  );

  const contacts: Apartment["contacts"]["items"] = [];
  if (input.hostWhatsapp) {
    contacts.push({
      icon: "💬",
      name: hostName,
      role: t("Anfitrião · WhatsApp", "Host · WhatsApp"),
      phone: input.hostWhatsapp,
      tel: toTel(input.hostWhatsapp),
    });
  }
  if (input.coHostName && input.coHostWhatsapp) {
    contacts.push({
      icon: "💬",
      name: input.coHostName,
      role: t("Coanfitrião/gestor · WhatsApp", "Co-host/manager · WhatsApp"),
      phone: input.coHostWhatsapp,
      tel: toTel(input.coHostWhatsapp),
    });
  }
  contacts.push(...EMERGENCY_CONTACTS);

  const phones = [input.hostWhatsapp, input.coHostWhatsapp].filter(Boolean).join(" · ");

  return {
    ...base,
    unit: input.unit,
    building: input.building,
    hero: { ...base.hero, facts },
    checkin: {
      ...base.checkin,
      doorCode:
        input.doorCodeMode === "fixed" && input.doorCode
          ? { mode: "fixed", code: input.doorCode }
          : { mode: "per_stay" },
    },
    checkout: base.checkout,
    wifi: {
      network: input.wifiNetwork,
      password: input.wifiPassword,
      speed: base.wifi.speed,
    },
    rules: { ...base.rules, items: rules },
    contacts: { ...base.contacts, items: contacts },
    footer: { ...base.footer, whoName: hostName, phones },
  };
}
