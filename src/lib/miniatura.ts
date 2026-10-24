/**
 * Miniatura: a imagem parada no lugar do vídeo até o play. Mora no mesmo
 * endereço do vídeo, trocando a extensão por `.jpg` (ADR 0001), e este é o
 * único lugar que conhece essa convenção: guia, painel e backfill passam por
 * aqui. Sem dependências, pra rodar igual no navegador, no servidor e no script.
 */

const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

/** Endereço (ou caminho do Blob) da Miniatura de um vídeo; `undefined` se não for vídeo. */
export function miniaturaUrl(videoUrl: string): string | undefined {
  return VIDEO_EXT.test(videoUrl) ? videoUrl.replace(VIDEO_EXT, ".jpg") : undefined;
}

/** A Miniatura explícita nos dados (vídeos estáticos em `/media`) vence a deduzida. */
export function miniaturaToShow(videoUrl: string, explicit?: string): string | undefined {
  return explicit || miniaturaUrl(videoUrl);
}

/** Dos caminhos listados no Blob, os vídeos cujo `.jpg` não está na lista. Fotos soltas não contam. */
export function videosMissingMiniatura(paths: string[]): string[] {
  const existing = new Set(paths);
  return paths.filter((path) => {
    const miniatura = miniaturaUrl(path);
    return miniatura !== undefined && !existing.has(miniatura);
  });
}
