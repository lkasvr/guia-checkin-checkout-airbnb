/** Texto localizado PT/EN. Strings marcadas como "ricas" podem conter HTML
 *  simples e confiável (<strong>, <a class="chatlink">, <span class="hint">),
 *  renderizado via o componente <Rich/>. */
export type L = { pt: string; en: string };

export type Fact = { k: L; v: L };

export type Step = {
  /** número/marcador exibido na bolinha ("1".."4" ou "✦") */
  n: string;
  /** corpo do passo (rico) */
  body: L;
};

export type Alert = { icon: string; body: L };

export type CheckinCard = {
  title: L;
  tag?: L;
  banner?: string; // caminho da imagem de banner
  steps: Step[];
  alerts?: Alert[];
  video?: { src: string; poster: string; label: L };
};

export type Rule = { icon: string; title: L; text: L; hot?: boolean };

export type Contact = {
  icon: string;
  name: string;
  role: L;
  phone: string; // exibição, ex. "(61) 98250-0188"
  tel: string; // href tel:, ex. "+5561982500188"
  sos?: boolean;
};

export type Slide = { img: string; title: L; text: L };

export type LegendItem = { n: string; label: L };

export type Accordion = {
  icon: string;
  title: L;
  steps: Step[];
  diagram?: { img: string; alt: string; legend: LegendItem[] };
};

export type Amenity = { img: string; title: L; text: L; wide?: boolean };

export type Place = { img?: string; title: string; text: L; meta: string };

export type NavItem = { href: string; label: L };

export type Apartment = {
  slug: string;
  lang: { default: "pt" | "en" };
  name: L;
  eyebrow: L;
  building: string;
  hero: { img: string; sub: L; facts: Fact[] };
  nav: NavItem[];

  wifi: { network: string; password: string; speed: L };

  checkin: { sub: L; cards: CheckinCard[] };
  rules: { sub: L; items: Rule[] };
  contacts: { sub: L; items: Contact[] };
  home: { sub: L; slides: Slide[]; accordions: Accordion[] };
  amenities: { sub: L; items: Amenity[] };
  tourism: { sub: L; items: Place[] };
  dining: { sub: L; items: Place[] };

  footer: { msg: L; whoPrefix: L; whoName: string; phones: string };
};
