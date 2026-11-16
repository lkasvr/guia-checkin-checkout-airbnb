/**
 * Horário de saída sem o "Até às" na frente, para o marcador {{CHECKOUT_HORA}}.
 * O modelo do prédio já escreve "O horário limite de saída é {{CHECKOUT_HORA}}"
 * (e "es a las …" em espanhol); quem digita "Até às 11h" no campo gerava
 * "é Até às 11h". Se não sobrar nada ("Até às" sozinho), fica como digitado.
 * Vazio continua vazio: quem põe o padrão "11h" no lugar é `varsToTokens`, ao
 * preencher o marcador. O quadradinho "Check-out" da Capa não passa por aqui:
 * mostra o campo como foi digitado.
 */
export function cleanCheckoutTime(time: string): string {
  const trimmed = time.trim();
  const stripped = trimmed.replace(/^(até\s+às|até\s+as|ate\s+as|até|às|as)(\s+|$)/i, "");
  return stripped || trimmed;
}
