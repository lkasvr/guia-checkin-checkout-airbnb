import { isVideoUrl, miniaturaUrl, videosMissingMiniatura } from "../../src/lib/miniatura";

/** Um arquivo listado no Blob: o caminho dentro do armazenamento e o endereço público. */
export type BlobFile = { pathname: string; url: string };

/** Um vídeo sem Miniatura e o caminho da Miniatura que ele vai ganhar. */
export type PendingVideo = { video: BlobFile; miniatura: string };

/** O que falta fazer no Blob. */
export type Backlog = {
  /** Quantos vídeos há no Blob. */
  found: number;
  /** Os vídeos sem Miniatura: o que o lote cria. */
  pending: PendingVideo[];
};

/** O que o lote fez. */
export type Outcome = {
  /** Caminhos das Miniaturas gravadas. */
  created: string[];
  /** Vídeos cuja Miniatura não saiu, com o motivo. */
  failures: { video: string; reason: string }[];
};

/** Os vídeos do Blob e, entre eles, os que ainda não têm Miniatura. */
export function backlogOf(files: BlobFile[]): Backlog {
  const missing = new Set(videosMissingMiniatura(files.map((file) => file.pathname)));
  return {
    found: files.filter((file) => isVideoUrl(file.pathname)).length,
    pending: files.flatMap((video) => {
      const miniatura = miniaturaUrl(video.pathname);
      return miniatura && missing.has(video.pathname) ? [{ video, miniatura }] : [];
    }),
  };
}

/** Guarda o JPEG de uma Miniatura no caminho dela. */
export type Save = (miniaturaPath: string, jpeg: Buffer) => Promise<void>;

/**
 * Cria a Miniatura de cada vídeo, um de cada vez; a falha de um não derruba o lote.
 * `extract` tira o JPEG do endereço público do vídeo, `save` o guarda no caminho da Miniatura
 * e `onProgress` recebe uma linha por vídeo, para acompanhar um lote demorado.
 */
export async function createMiniaturas(
  pending: PendingVideo[],
  { extract, save, onProgress }: {
    extract: (videoUrl: string) => Promise<Buffer>;
    save: Save;
    onProgress: (line: string) => void;
  },
): Promise<Outcome> {
  const outcome: Outcome = { created: [], failures: [] };
  for (const [i, { video, miniatura }] of pending.entries()) {
    const step = `[${i + 1}/${pending.length}] ${video.pathname}`;
    try {
      await save(miniatura, await extract(video.url));
      outcome.created.push(miniatura);
      onProgress(`${step} → ${miniatura}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      outcome.failures.push({ video: video.pathname, reason });
      onProgress(`${step}: falhou (${reason})`);
    }
  }
  return outcome;
}

/**
 * Para onde vão as Miniaturas, um modo por opção da linha de comando: `gravar` grava no Blob;
 * `pasta` salva numa pasta local, o que testa a extração sem gravar no Blob; `ensaio` não
 * guarda nada e só lista o que faria.
 */
export type Destination = { kind: "gravar" } | { kind: "pasta"; dir: string } | { kind: "ensaio" };

/** Os vídeos sem Miniatura, cada um com o caminho da Miniatura que vai ganhar. */
export function formatPending({ pending }: Backlog): string {
  const lines = pending.map(({ video, miniatura }) => `  ${video.pathname} → ${miniatura}`);
  return [`Vídeos sem Miniatura (${pending.length}):`, ...lines].join("\n");
}

/** O relatório que o script imprime no fim: as quatro contagens e o motivo de cada falha. */
export function formatReport(
  backlog: Backlog,
  destination: Destination,
  { created, failures }: Outcome = { created: [], failures: [] },
): string {
  const out: string[] = [];
  if (destination.kind === "ensaio") out.push("Ensaio: nada foi gravado.", formatPending(backlog), "");
  if (destination.kind === "pasta") out.push(`Miniaturas salvas em ${destination.dir}: nada foi gravado no Blob.`, "");
  out.push(
    `Vídeos encontrados: ${backlog.found}`,
    `Miniaturas criadas: ${created.length}`,
    `Pulados (já tinham Miniatura): ${backlog.found - backlog.pending.length}`,
    `Falhas: ${failures.length}`,
    ...failures.map(({ video, reason }) => `  ${video}: ${reason}`),
  );
  return out.join("\n");
}
