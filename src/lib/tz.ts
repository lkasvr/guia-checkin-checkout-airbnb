/**
 * Fuso dos imóveis (Brasília). O Brasil não observa horário de verão desde
 * 2019, então o offset é -03:00 o ano inteiro — dá para converter sem lib.
 * (Suporte a fuso por apartamento fica como follow-up.)
 */
const OFFSET = "-03:00";

/** `<input type="datetime-local">` ("YYYY-MM-DDTHH:mm", hora de Brasília) → Date UTC. */
export function parseLocalBR(input: string): Date {
  return new Date(`${input}:00${OFFSET}`);
}

/** Desloca o instante para o relógio de Brasília, para ler os campos em UTC. */
function toBrasiliaClock(date: Date): Date {
  return new Date(date.getTime() - 3 * 60 * 60 * 1000);
}

/** Date (instante UTC) → "YYYY-MM-DDTHH:mm" na hora de Brasília, p/ o input. */
export function toLocalBRInput(date: Date): string {
  const brasilia = toBrasiliaClock(date);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${brasilia.getUTCFullYear()}-${p(brasilia.getUTCMonth() + 1)}-${p(brasilia.getUTCDate())}` +
    `T${p(brasilia.getUTCHours())}:${p(brasilia.getUTCMinutes())}`
  );
}

/** Date (instante UTC) → "YYYY-MM-DD" do dia-calendário em Brasília. */
export function localDayBR(date: Date): string {
  return toBrasiliaClock(date).toISOString().slice(0, 10);
}

/** Os dois instantes caem no mesmo dia-calendário de Brasília? */
export function isSameDayBR(a: Date, b: Date): boolean {
  return localDayBR(a) === localDayBR(b);
}

/** Fuso IANA para formatação de exibição (Intl). */
export const PROPERTY_TZ = "America/Sao_Paulo";
