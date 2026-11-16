import type { Backlog, Outcome } from "./backfill";

/** Os vídeos sem Miniatura, cada um com o caminho da Miniatura que vai ganhar. */
export function formatPending({ pending }: Backlog): string {
  const lines = pending.map(({ video, miniatura }) => `  ${video.pathname} → ${miniatura}`);
  return [`Vídeos sem Miniatura (${pending.length}):`, ...lines].join("\n");
}

/** O relatório que o script imprime no fim: as quatro contagens e o motivo de cada falha. */
export function formatReport(backlog: Backlog, { created, failures }: Outcome = { created: [], failures: [] }): string {
  return [
    `Vídeos encontrados: ${backlog.found}`,
    `Miniaturas criadas: ${created.length}`,
    `Pulados (já tinham Miniatura): ${backlog.found - backlog.pending.length}`,
    `Falhas: ${failures.length}`,
    ...failures.map(({ video, reason }) => `  ${video}: ${reason}`),
  ].join("\n");
}
