/** Formata progressivamente pro padrão "+55 61 98250-0188" enquanto a pessoa digita. */
export function formatPhoneBR(value: string): string {
  const trimmed = value.trim();
  let digits: string;
  if (trimmed.startsWith("+55")) {
    // O campo já mostra o "+55 " na frente: ao digitar, ele volta junto e não é DDD.
    digits = trimmed.slice(3).replace(/\D/g, "");
  } else {
    digits = value.replace(/\D/g, "");
    // Número colado com o 55 do país, sem o "+".
    if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);
  if (!digits) return "";

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  let out = `+55 ${ddd}`;
  if (rest.length > 4) {
    const splitAt = rest.length > 8 ? rest.length - 4 : 4;
    out += ` ${rest.slice(0, splitAt)}-${rest.slice(splitAt)}`;
  } else if (rest.length > 0) {
    out += ` ${rest}`;
  }
  return out;
}
