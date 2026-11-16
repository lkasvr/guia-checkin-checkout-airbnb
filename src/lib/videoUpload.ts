import { miniaturaPathname } from "@/lib/miniatura";

/**
 * O que o envio gravou: o endereço do arquivo e, só quando um vídeo ficou sem Miniatura, o
 * motivo. Num vídeo, a falta de `miniaturaError` quer dizer que a Miniatura foi gravada.
 */
export type Uploaded = { url: string; miniaturaError?: Error };

/** O que o envio de vídeo precisa do navegador e do Blob; o painel passa os de verdade. */
export type VideoUploadDeps = {
  /** Tira a Miniatura (JPEG) do arquivo local. */
  captureMiniatura: (video: File) => Promise<Blob>;
  /** Sobe o vídeo e devolve o endereço público e o caminho final no Blob. */
  putVideo: (video: File) => Promise<{ url: string; pathname: string }>;
  /** Grava o JPEG da Miniatura no caminho pedido. */
  putMiniatura: (pathname: string, jpeg: Blob) => Promise<void>;
};

const asError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

/**
 * Tira a Miniatura do arquivo local, sobe o vídeo e grava a Miniatura no caminho final dele, com
 * `.jpg` (ADR 0001). A falha da Miniatura nunca derruba o vídeo: volta como `miniaturaError`.
 */
export async function uploadVideo(
  video: File,
  { captureMiniatura, putVideo, putMiniatura }: VideoUploadDeps,
): Promise<Uploaded> {
  const jpeg = await captureMiniatura(video).catch(asError);
  const { url, pathname } = await putVideo(video);
  const miniaturaError = await saveMiniatura(pathname, jpeg, putMiniatura);
  return miniaturaError ? { url, miniaturaError } : { url };
}

/** Grava a Miniatura ao lado do vídeo; devolve o motivo se ela ficou sem gravar. */
async function saveMiniatura(
  videoPathname: string,
  jpeg: Blob | Error,
  putMiniatura: VideoUploadDeps["putMiniatura"],
): Promise<Error | undefined> {
  if (jpeg instanceof Error) return jpeg;
  const miniatura = miniaturaPathname(videoPathname);
  if (!miniatura) return new Error(`o caminho do vídeo não termina em extensão de vídeo: ${videoPathname}`);
  return putMiniatura(miniatura, jpeg).then(() => undefined, asError);
}
