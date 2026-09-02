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
    // Um botão por seção que o guia sempre renderiza (Contatos sempre tem ao
    // menos SAMU/Bombeiros; A Casa/Lazer/Brasília/Onde Comer vêm do prédio
    // quando ligado) — sem entrada aqui, a seção existe mas fica sem atalho.
    nav: [
      { href: "#checkin", label: t("Check-in") },
      { href: "#wifi", label: t("Wi-Fi") },
      { href: "#regras", label: t("Regras", "Rules") },
      { href: "#contatos", label: t("Contatos", "Contacts") },
      { href: "#casa", label: t("A Casa", "The Home") },
      { href: "#lazer", label: t("Lazer", "Amenities") },
      { href: "#turismo", label: t("Brasília") },
      { href: "#comer", label: t("Onde Comer", "Dining") },
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
      img: "/media/mesa.webp",
      msg: t("Boa estadia!", "Enjoy your stay!"),
      whoPrefix: t("Com carinho, ", "Warmly, "),
      whoName: name,
      phones: "",
    },
  };
}
