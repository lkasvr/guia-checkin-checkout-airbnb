/** Texto localizado PT/EN. Strings marcadas como "ricas" podem conter HTML
 *  simples e confiável (<strong>, <a class="chatlink">, <span class="hint">),
 *  renderizado via o componente <Rich/>. */
export type L = {
  pt: string;
  en: string;
  /** Opcional: sem ele o guia usa o dicionário de textos padrão (`src/data/es.ts`) e, por último, o inglês. */
  es?: string;
};

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
  video?: { src: string; poster?: string; label: L };
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
  /** Foto ou vídeo do equipamento (URL do arquivo enviado) — aparece antes dos passos. */
  media?: string;
  diagram?: { img: string; alt: string; legend: LegendItem[] };
};

export type Amenity = { img: string; title: L; text: L; wide?: boolean };

export type Place = {
  img?: string;
  title: string;
  text: L;
  meta: string;
  /** página oficial do lugar (abre em nova aba) */
  site?: string;
  /** destino da rota no Google Maps, em texto (ex.: "Nazo, Av. das Araucárias 635") */
  maps?: string;
};

export type NavItem = { href: string; label: L };

/** Endereço completo + link do Google Maps do prédio — ambos opcionais, cada um sozinho já basta pra mostrar o cartão. */
export type MapLocation = { address: string; mapsUrl: string };

export type Apartment = {
  slug: string;
  lang: { default: "pt" | "en" };
  name: L;
  /** Identificador público da unidade exibido no título (ex.: "1305C"). */
  unit: string;
  eyebrow: L;
  building: string;
  /** Próprio do apartamento; em branco herda ao vivo do prédio (`Building.location`). */
  location?: MapLocation;
  hero: { img: string; sub: L; facts: Fact[] };
  nav: NavItem[];

  wifi: { network: string; password: string; speed: L };

  checkin: {
    sub: L;
    cards: CheckinCard[];
    /** Senha fixa do apartamento, exibida sempre; ausente = senha por hóspede (via Stay). */
    doorCode?: { mode: "fixed"; code: string } | { mode: "per_stay" };
  };
  checkout?: { sub: L; steps: Step[] };
  rules: { sub: L; items: Rule[] };
  contacts: { sub: L; items: Contact[] };
  /** `video`: tour em vídeo, sempre o 1º elemento de A Casa (o de `homeVideo` vale no lugar deste). */
  home: { sub: L; slides: Slide[]; accordions: Accordion[]; video?: string };
  /** Tour em vídeo só deste apartamento — vale no lugar do vídeo do prédio, sem desligar o resto de A Casa do prédio. */
  homeVideo?: string;
  amenities: { sub: L; items: Amenity[] };
  tourism: { sub: L; items: Place[] };
  dining: { sub: L; items: Place[] };

  footer: { img: string; msg: L; whoPrefix: L; whoName: string; phones: string };
};
