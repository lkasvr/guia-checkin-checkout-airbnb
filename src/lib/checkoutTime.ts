/** Horário de saída de quem não preencheu o campo "Check-out (horário)". */
const DEFAULT_CHECKOUT_TIME = "11h";

/**
 * Horário de saída sem o "Até às" na frente, para o marcador {{CHECKOUT_HORA}}.
 * O modelo do prédio já escreve "O horário limite de saída é {{CHECKOUT_HORA}}"
 * (e "es a las …" em espanhol); quem digita "Até às 11h" no campo gerava
 * "é Até às 11h". Vazio vira "11h"; se não sobrar nada ("Até às" sozinho),
 * fica como digitado.
 */
export function cleanCheckoutTime(time: string): string {
  const trimmed = time.trim();
  if (!trimmed) return DEFAULT_CHECKOUT_TIME;
  const stripped = trimmed.replace(/^(até\s+às|até\s+as|ate\s+as|até|às|as)(\s+|$)/i, "").trim();
  return stripped || trimmed;
}
