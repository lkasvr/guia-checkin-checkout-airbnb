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
  /** só usado quando o passo é item de lista com ajustes por apartamento (check-out) */
  id?: string;
  /** número/marcador exibido na bolinha ("1".."4" ou "✦") */
  n: string;
  /** corpo do passo (rico) */
  body: L;
};

export type Alert = { icon: string; body: L };

export type CheckinCard = {
  /** Identidade estável do item (antigo, sem id: derivada do título — ver `itemMerge.ts`). */
  id?: string;
  title: L;
  tag?: L;
  banner?: string; // caminho da imagem de banner
  steps: Step[];
  alerts?: Alert[];
  video?: { src: string; poster?: string; label: L };
};

export type Rule = { id?: string; icon: string; title: L; text: L; hot?: boolean };

export type Contact = {
  icon: string;
  name: string;
  role: L;
  phone: string; // exibição, ex. "(61) 98250-0188"
  tel: string; // href tel:, ex. "+5561982500188"
  sos?: boolean;
};

export type Slide = { id?: string; img: string; title: L; text: L };

export type LegendItem = { n: string; label: L };

export type Accordion = {
  id?: string;
  icon: string;
  title: L;
  steps: Step[];
  /** Foto ou vídeo do equipamento (URL do arquivo enviado) — aparece antes dos passos. */
  media?: string;
  diagram?: { img: string; alt: string; legend: LegendItem[] };
};

export type Amenity = { id?: string; img: string; title: L; text: L; wide?: boolean };

export type Place = {
  id?: string;
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

/** Código do interfone de uma torre (ex.: "Torre C" → "*1"). */
export type IntercomCode = {
  tower: string;
  code: string;
  /** Restaurante ao lado da portaria dessa torre (ex.: "Spoleto") — entra no passo "vá à portaria" do check-in. */
  restaurant?: string;
};

/**
 * O que o prédio guarda além do mapa (a coluna `Building.location` é JSON livre):
 * telefone da portaria e o código do interfone de cada torre.
 */
export type BuildingInfo = MapLocation & {
  portariaPhone?: string;
  intercom?: IntercomCode[];
};

/** Valores que preenchem os marcadores {{TORRE}}, {{ANDAR}}… do check-in/check-out do prédio. */
export type ApartmentVars = {
  TORRE: string;
  ANDAR: string;
  UNIDADE: string;
  VAGA: string;
  CHECKOUT_HORA: string;
};

/** Contatos digitados no formulário — guardados pra poder reaproveitar em outro apartamento do anfitrião. */
export type ContactInfo = {
  hostWhatsapp: string;
  coHostName: string;
  coHostWhatsapp: string;
};

/** Portaria só deste apartamento; vazio = usa o do prédio (telefone) / o da torre (código). */
export type PortariaOverride = { phone?: string; code?: string };

/**
 * Ajustes de um apartamento sobre a lista do modelo (prédio): o que ele editou,
 * removeu ou acrescentou. Item que não aparece aqui segue o modelo ao vivo.
 */
export type ItemPatch<T> = {
  /** id do item do modelo → versão editada neste apartamento */
  edited?: Record<string, T>;
  /** ids de itens do modelo que este apartamento tirou */
  removed?: string[];
  /** itens só deste apartamento (vêm depois dos do modelo) */
  added?: T[];
  /** ordem final dos ids, quando este apartamento não segue a ordem natural (modelo, depois os próprios) */
  order?: string[];
};

export type ItemPatches = {
  rules?: ItemPatch<Rule>;
  slides?: ItemPatch<Slide>;
  accordions?: ItemPatch<Accordion>;
  amenities?: ItemPatch<Amenity>;
  tourism?: ItemPatch<Place>;
  dining?: ItemPatch<Place>;
  checkin?: ItemPatch<CheckinCard>;
  checkout?: ItemPatch<Step>;
};

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
  /** Marcadores do check-in/check-out (torre, andar…) deste apartamento. */
  vars?: ApartmentVars;
  contactInfo?: ContactInfo;
  portaria?: PortariaOverride;
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
