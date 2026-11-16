import {
  doorCodeFromInput,
  varsFromInput,
  type ApartmentFormInput,
  type BuildingTemplate,
} from "@/data/buildApartmentContent";
import { editorValues } from "@/data/patches";

/**
 * Só para os testes: o formulário do cadastro de um apartamento no prédio
 * "Residencial DF Plaza", com os campos que o teste não passa num valor neutro.
 * Cada suíte troca só o campo que ela examina (a unidade, o horário de saída…).
 */
export function formularioNoPredio(campos: Partial<ApartmentFormInput>): ApartmentFormInput {
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

/**
 * O clique em "Personalizar para este apartamento" no check-in ou no
 * check-out: o editor abre com o modelo do prédio preenchido pelos marcadores
 * do formulário, como o painel faz.
 */
export function abrirEditor(
  form: ApartmentFormInput,
  predio: BuildingTemplate,
  secao: "checkin" | "checkout",
): ApartmentFormInput {
  const valores = editorValues(predio, undefined, varsFromInput(form), doorCodeFromInput(form));
  return secao === "checkin"
    ? { ...form, checkinOverride: valores.checkin }
    : { ...form, checkoutOverride: valores.checkout };
}
