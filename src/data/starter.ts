import type { Apartment, L } from "@/data/types";
import type { BuildingTemplate } from "@/data/buildingModel";
import { DEFAULT_CONDO_RULES } from "@/data/defaultRules";
import { PREREQUISITE_CARD } from "@/data/prerequisiteCard";

const t = (pt: string, en?: string): L => ({ pt, en: en ?? pt });

type StarterSections = Pick<
  Apartment,
  "checkin" | "rules" | "contacts" | "home" | "amenities" | "tourism" | "dining"
> & { checkout: NonNullable<Apartment["checkout"]> };

/**
 * As seções do guia como o conteúdo inicial as preenche: os subtítulos, já com
 * o inglês, e o check-in com o cartão "Antes de chegar". O apartamento novo
 * (`starterContent`) e o prédio novo (`newBuildingTemplate`) nascem com elas.
 */
function starterSections(): StarterSections {
  return {
    checkin: { sub: t("Instruções de chegada.", "Arrival instructions."), cards: [PREREQUISITE_CARD] },
    checkout: { sub: t("Antes de sair.", "Before you leave."), steps: [] },
    rules: { sub: t("Regras da casa.", "House rules."), items: [] },
    contacts: { sub: t("Contatos.", "Contacts."), items: [] },
    home: { sub: t(""), slides: [], accordions: [] },
    amenities: { sub: t(""), items: [] },
    tourism: { sub: t(""), items: [] },
    dining: { sub: t(""), items: [] },
  };
}

/**
 * O conteúdo com que um prédio nasce pelo cadastro de apartamento, quando o
 * "Edifício" digitado ainda não existe: as regras de convivência padrão, os
 * subtítulos do conteúdo inicial, o check-in com o cartão "Antes de chegar", o
 * check-out vazio e as outras seções vazias. `resolveBuilding` grava este
 * conteúdo, e a prévia do cadastro o usa para mostrar o guia que vai ser gravado.
 *
 * A tela "Novo prédio" tem os próprios valores iniciais.
 */
export function newBuildingTemplate(): BuildingTemplate {
  const s = starterSections();
  return {
    rules: { sub: s.rules.sub, items: [...DEFAULT_CONDO_RULES] },
    home: s.home,
    amenities: s.amenities,
    tourism: s.tourism,
    dining: s.dining,
    checkinTemplate: s.checkin,
    checkoutTemplate: s.checkout,
    location: null,
  };
}

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
    ...starterSections(),
    footer: {
      img: "/media/mesa.webp",
      msg: t("Boa estadia!", "Enjoy your stay!"),
      whoPrefix: t("Com carinho, ", "Warmly, "),
      whoName: name,
      phones: "",
    },
  };
}
