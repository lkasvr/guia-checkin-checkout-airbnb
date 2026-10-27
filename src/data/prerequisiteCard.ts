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
        pt: "O condomínio exige o cadastro prévio de todos os hóspedes para liberar o acesso na portaria. Por isso, pedimos que envie pelo chat do Airbnb, com antecedência, a foto do documento de identidade (RG ou CNH) de cada hóspede que vai ficar no apartamento. Se alguém do grupo vier de carro, inclua também modelo, marca, cor e placa do veículo. Esses dados são usados somente para o cadastro no condomínio.",
        en: "The building requires every guest to be registered in advance before access is granted at the front desk. Please send, through Airbnb chat and ahead of your arrival, a photo of an ID document (national ID or driver's license) for each guest staying at the apartment. If anyone in your group is arriving by car, please also include the vehicle's model, brand, color and license plate. This information is used only for the building's registration.",
        es: "El condominio exige el registro previo de todos los huéspedes para autorizar el acceso en la recepción. Por eso, te pedimos que envíes por el chat de Airbnb, con anticipación, una foto del documento de identidad (pasaporte o documento nacional) de cada huésped que se alojará en el apartamento. Si alguien del grupo llega en auto, incluye también modelo, marca, color y placa del vehículo. Estos datos se usan únicamente para el registro en el condominio.",
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
