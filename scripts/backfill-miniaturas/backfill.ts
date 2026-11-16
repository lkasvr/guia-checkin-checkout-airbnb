import type { BlobFile } from "../../src/lib/blobFile";
import { miniaturaPathname, videosMissingMiniatura } from "../../src/lib/miniatura";

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

/** Os vídeos do Blob e, entre eles, os que ainda não têm Miniatura. Só vídeo tem Miniatura. */
export function backlogOf(files: BlobFile[]): Backlog {
  const missing = new Set(videosMissingMiniatura(files.map((file) => file.pathname)));
  const videos = files.flatMap((video): PendingVideo[] => {
    const miniatura = miniaturaPathname(video.pathname);
    return miniatura === undefined ? [] : [{ video, miniatura }];
  });
  return {
    found: videos.length,
    pending: videos.filter(({ video }) => missing.has(video.pathname)),
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
