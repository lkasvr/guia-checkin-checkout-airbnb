/**
 * Número da unidade sem o "Ap" na frente. O guia já escreve "Apartamento …" e
 * "Ap …" antes dele; quem digita "Ap 2202" no campo gerava "Ap Ap 2202".
 */
export function cleanUnit(unit: string): string {
  const trimmed = unit.trim();
  const stripped = trimmed.replace(/^(apartamento|apto|apt|ap)(\.|\s)+/i, "").trim();
  return stripped || trimmed;
}
