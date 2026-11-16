import { miniaturaPathname } from "@/lib/miniatura";

/** O que o envio de vídeo precisa do navegador e do Blob; o painel passa os de verdade. */
export type VideoUploadDeps = {
  /** Tira a Miniatura (JPEG) do arquivo local. */
  captureMiniatura: (video: File) => Promise<Blob>;
  /** Sobe o vídeo e devolve o endereço público e o caminho final no Blob. */
  putVideo: (video: File) => Promise<{ url: string; pathname: string }>;
  /** Grava o JPEG da Miniatura no caminho pedido. */
  putMiniatura: (pathname: string, jpeg: Blob) => Promise<void>;
};

/**
 * Sobe o vídeo e grava a Miniatura no caminho final dele, com `.jpg` (ADR 0001). Devolve o
 * endereço do vídeo e se a Miniatura foi gravada.
 */
export async function uploadVideo(
  video: File,
  { captureMiniatura, putVideo, putMiniatura }: VideoUploadDeps,
): Promise<{ url: string; miniaturaSaved: boolean }> {
  const jpeg = await captureMiniatura(video).catch(() => undefined);
  const { url, pathname } = await putVideo(video);
  const miniatura = miniaturaPathname(pathname);
  if (!jpeg || !miniatura) return { url, miniaturaSaved: false };
  try {
    await putMiniatura(miniatura, jpeg);
    return { url, miniaturaSaved: true };
  } catch {
    return { url, miniaturaSaved: false };
  }
}
