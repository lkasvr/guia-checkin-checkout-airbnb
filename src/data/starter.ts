import type { Apartment, L } from "@/data/types";

const t = (pt: string, en?: string): L => ({ pt, en: en ?? pt });

/**
 * Conteúdo inicial (válido, porém em branco) para um apartamento novo criado
 * pelo superadmin. O anfitrião completa depois pelo painel. Mantém todas as
 * seções exigidas por `Apartment`, com listas vazias e textos-placeholder.
 */
export function starterContent(
  name: string,
  unit: string,
  building: string,
): Apartment {
  return {
    slug: "",
    lang: { default: "pt" },
    name: t(name),
    unit,
    eyebrow: t("Guia de boas-vindas", "Welcome guide"),
    building,
    hero: {
      img: "/media/hero.webp",
      sub: t(building),
      facts: [],
    },
    nav: [
      { href: "#checkin", label: t("Check-in") },
      { href: "#wifi", label: t("Wi-Fi") },
      { href: "#regras", label: t("Regras", "Rules") },
    ],
    wifi: { network: "", password: "", speed: t("") },
    checkin: { sub: t("Instruções de chegada."), cards: [] },
    checkout: { sub: t("Antes de sair."), steps: [] },
    rules: { sub: t("Regras da casa."), items: [] },
    contacts: { sub: t("Contatos."), items: [] },
    home: { sub: t(""), slides: [], accordions: [] },
    amenities: { sub: t(""), items: [] },
    tourism: { sub: t(""), items: [] },
    dining: { sub: t(""), items: [] },
    footer: {
      msg: t("Boa estadia!", "Enjoy your stay!"),
      whoPrefix: t("Com carinho, ", "Warmly, "),
      whoName: name,
      phones: "",
    },
  };
}
