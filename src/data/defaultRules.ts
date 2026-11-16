import type { L, Rule } from "@/data/types";

/**
 * Regras de convivência que valem em praticamente qualquer condomínio (vêm do
 * regimento interno dos prédios). Todo modelo de prédio novo já nasce com
 * elas; os ids são fixos pra que o script de atualização dos prédios
 * existentes não duplique. Regras que só existem em alguns prédios (entrega
 * na portaria, horário do lixo, piscina...) ficam no modelo de cada prédio.
 */
/**
 * Regras de piscina comuns a qualquer condomínio que tenha uma: entram no
 * texto do item "Piscina" do Lazer (não na lista de regras), porque só valem
 * pra quem tem piscina.
 */
export const POOL_RULES: L = {
  pt: "Use traje de banho, chinelo e toalha, e circule de roupa de banho só na área da piscina. Não é permitido vidro, óleo bronzeador (protetor solar pode, retirando o excesso na ducha) nem animais. Antes de pegar o elevador, confira se a roupa de banho está seca.",
  en: "Wear swimwear, sandals and bring a towel, and wear swimwear only in the pool area. No glass, tanning oil (sunscreen is fine, rinse off the excess in the shower first) or animals. Make sure your swimwear is dry before taking the elevator.",
  es: "Usa traje de baño, chanclas y toalla, y circula en traje de baño solo en la zona de la piscina. No se permite vidrio, aceite bronceador (el protector solar sí, quitando el exceso en la ducha) ni animales. Antes de usar el ascensor, comprueba que tu traje de baño esté seco.",
};

export const DEFAULT_CONDO_RULES: Rule[] = [
  {
    id: "default-vizinhanca",
    icon: "🤝",
    title: {
      pt: "Respeito aos vizinhos",
      en: "Be considerate of neighbors",
      es: "Respeto a los vecinos",
    },
    text: {
      pt: "É proibido incomodar a vizinhança, seja por barulho ou por qualquer outro tipo de comportamento. Nos corredores e no hall, converse em tom moderado e evite aglomerações.",
      en: "Disturbing the neighbors is not allowed, whether through noise or any other kind of behavior. In hallways and the lobby, keep your voice down and avoid gathering in groups.",
      es: "Está prohibido molestar a los vecinos, ya sea por ruido o por cualquier otro tipo de comportamiento. En los pasillos y el lobby, habla en tono moderado y evita aglomeraciones.",
    },
  },
  {
    id: "default-trajes-areas-comuns",
    icon: "🩳",
    title: {
      pt: "Trajes nas áreas comuns",
      en: "Dress code in common areas",
      es: "Vestimenta en áreas comunes",
    },
    text: {
      pt: "Não é permitido circular sem camisa ou em trajes íntimos pelas áreas comuns do condomínio.",
      en: "Walking through the building's common areas shirtless or in underwear is not allowed.",
      es: "No está permitido circular sin camiseta ni en ropa interior por las áreas comunes del condominio.",
    },
  },
  {
    id: "default-fumo-areas-comuns",
    icon: "🚭",
    title: {
      pt: "Áreas comuns livres de fumo",
      en: "Smoke-free common areas",
      es: "Áreas comunes libres de humo",
    },
    text: {
      pt: "É proibido fumar no hall, nos elevadores, nos corredores e nos ambientes de lazer fechados do condomínio.",
      en: "Smoking is not allowed in the lobby, elevators, hallways or the building's indoor leisure areas.",
      es: "Está prohibido fumar en el lobby, los ascensores, los pasillos y las áreas de ocio cerradas del condominio.",
    },
  },
  {
    id: "default-elevadores",
    icon: "🛗",
    title: {
      pt: "Uso dos elevadores",
      en: "Using the elevators",
      es: "Uso de los ascensores",
    },
    text: {
      pt: "Não segure a porta além do tempo necessário, não leve comida, não pule e respeite o número máximo de pessoas.",
      en: "Don't hold the doors longer than needed, don't bring food inside, no jumping, and respect the maximum number of people.",
      es: "No sujetes la puerta más tiempo del necesario, no lleves comida, no saltes y respeta el número máximo de personas.",
    },
  },
  {
    id: "default-delivery",
    icon: "🛵",
    title: {
      pt: "Delivery e entregas",
      en: "Delivery and couriers",
      es: "Delivery y entregas",
    },
    text: {
      pt: "Entregadores de aplicativo não sobem aos apartamentos: retire seu pedido na portaria.",
      en: "Delivery couriers can't go up to the apartments: please pick up your order at the front desk.",
      es: "Los repartidores de aplicaciones no suben a los apartamentos: recoge tu pedido en la portería.",
    },
  },
  {
    id: "default-janelas-sacadas",
    icon: "🪟",
    title: {
      pt: "Janelas e sacadas",
      en: "Windows and balconies",
      es: "Ventanas y balcones",
    },
    text: {
      pt: "Não sente nem suba em janelas, parapeitos e sacadas, e não jogue nada por elas, nem lixo nem pontas de cigarro.",
      en: "Don't sit or climb on windows, ledges or balcony railings, and don't throw anything out of them, including trash or cigarette butts.",
      es: "No te sientes ni subas a ventanas, antepechos o barandillas de balcón, y no tires nada por ellos, ni basura ni colillas.",
    },
  },
];
