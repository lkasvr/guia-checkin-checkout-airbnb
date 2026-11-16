import type { ApartmentFormInput } from "@/data/buildApartmentContent";

/**
 * Só para os testes: o formulário do cadastro de um apartamento no prédio
 * "Residencial DF Plaza", com os campos que o teste não passa num valor neutro.
 * Cada suíte troca só o campo que ela examina (a unidade, o horário de saída…).
 */
export function formularioNoPredio(campos: Partial<ApartmentFormInput> = {}): ApartmentFormInput {
  return {
    building: "Residencial DF Plaza",
    unit: "2202",
    heroImg: "",
    footerImg: "",
    tower: "Torre A",
    floor: "22º andar",
    parking: "",
    maxGuests: "4",
    checkinTime: "15h",
    checkoutTime: "11h",
    doorCodeMode: "per_stay",
    doorCode: "",
    wifiNetwork: "",
    wifiPassword: "",
    ownRules: [],
    smoking: "no",
    pets: "no",
    hostWhatsapp: "",
    coHostName: "",
    coHostWhatsapp: "",
    portariaPhone: "",
    intercomCode: "",
    internalNotes: "",
    locationAddress: "",
    locationMapsUrl: "",
    homeVideo: "",
    overrides: {},
    ...campos,
  };
}
