import type { CheckinCard } from "@/data/types";

/**
 * Primeiro cartão de todo check-in: pedido de documento (e dados do veículo)
 * pra liberar o acesso na portaria. É o pré-requisito pra entrar, por isso
 * vem antes de qualquer instrução de chegada.
 */
export const PREREQUISITE_CARD: CheckinCard = {
  title: { pt: "Antes de chegar", en: "Before you arrive" },
  tag: { pt: "Pré-requisito", en: "Required" },
  steps: [],
  alerts: [
    {
      icon: "🪪",
      body: {
        pt: "Para agilizar a liberação do seu acesso na portaria, envie ao anfitrião, com antecedência, uma foto do documento de identidade (RG ou CNH) de cada hóspede que vai ficar no apartamento. Se alguém do grupo vier de carro, inclua também modelo, marca, cor e placa do veículo.",
        en: "To speed up your access clearance at the front desk, please send the host, in advance, a photo of an ID document (national ID or driver's license) for every guest staying at the apartment. If anyone in your group is arriving by car, please also include the vehicle's model, brand, color, and license plate.",
      },
    },
  ],
};

export const isPrerequisiteCard = (card: CheckinCard): boolean =>
  card.title.pt === PREREQUISITE_CARD.title.pt;

/** Garante o cartão no topo sem duplicar quando já existe. */
export function withPrerequisiteCard(cards: CheckinCard[]): CheckinCard[] {
  return cards.some(isPrerequisiteCard) ? cards : [PREREQUISITE_CARD, ...cards];
}
