/**
 * O texto sem as pontas em branco e sem o prefixo que `prefix` casa no começo.
 * Se não sobrar nada, devolve o texto como foi digitado, só sem as pontas:
 * "Ap" sozinho continua "Ap", "Até às" sozinho continua "Até às". É a forma
 * comum da limpeza dos marcadores (`cleanUnit`, `cleanCheckoutTime`); cada uma
 * só diz qual prefixo tirar.
 */
export function withoutPrefix(text: string, prefix: RegExp): string {
  const trimmed = text.trim();
  return trimmed.replace(prefix, "") || trimmed;
}
