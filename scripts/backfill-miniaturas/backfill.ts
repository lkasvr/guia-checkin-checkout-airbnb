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

/**
 * O caminho no Blob é nome de arquivo, não endereço: pode ter `#` ou `?`, que as funções da
 * Miniatura leriam como começo do fragmento ou da query (`tour#1.mp4` viraria `tour`). Por isso
 * elas recebem o caminho codificado, trecho a trecho entre as barras, e a Miniatura volta
 * decodificada para o caminho de verdade.
 */
const toUrlPath = (pathname: string) => pathname.split("/").map(encodeURIComponent).join("/");
const fromUrlPath = (path: string) => path.split("/").map(decodeURIComponent).join("/");

/** Os vídeos do Blob e, entre eles, os que ainda não têm Miniatura. */
export function backlogOf(files: BlobFile[]): Backlog {
  const paths = files.map((file) => toUrlPath(file.pathname));
  const missing = new Set(videosMissingMiniatura(paths));
  return {
    found: paths.filter(isVideoUrl).length,
    pending: files.flatMap((video, i) => {
      const miniatura = miniaturaUrl(paths[i]);
      return miniatura && missing.has(paths[i]) ? [{ video, miniatura: fromUrlPath(miniatura) }] : [];
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
