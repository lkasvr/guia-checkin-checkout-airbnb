import type { ApartmentFormInput, BuildingTemplate } from "@/data/buildApartmentContent";
import { apartmentPreview, openEditor } from "@/data/apartmentPreview";

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
 * O clique em "Personalizar para este apartamento" nas regras, ou em "Ajustar
 * check-in/check-out manualmente", num formulário cujo "Edifício" é o prédio
 * dado. O editor abre pelo mesmo caminho do cadastro: o prédio da prévia
 * (`apartmentPreview`) e `openEditor`.
 */
export function abrirEditor(
  form: ApartmentFormInput,
  predio: BuildingTemplate,
  secao: "rules" | "checkin" | "checkout",
): ApartmentFormInput {
  const previa = apartmentPreview(form, "Anfitriã", undefined, [{ ...predio, name: form.building }]);
  return openEditor(form, secao, previa);
}
