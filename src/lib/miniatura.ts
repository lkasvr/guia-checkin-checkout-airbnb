/**
 * Miniatura: a imagem parada no lugar do vídeo até o play. Mora no mesmo
 * endereço do vídeo, trocando a extensão por `.jpg` (ADR 0001). Este módulo é o
 * único lugar que conhece essa convenção e o que conta como vídeo: o guia, o
 * envio e o backfill devem usar estas funções em vez de repetir a regra. Sem
 * dependências, pra rodar igual no navegador, no servidor e no script.
 */

const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

/** Separa o caminho da query e do fragmento (`?v=2`, `#t=0.1`), que ficam fora da extensão. */
function splitPath(url: string): [path: string, rest: string] {
  const cut = url.search(/[?#]/);
  return cut === -1 ? [url, ""] : [url.slice(0, cut), url.slice(cut)];
}

/** A extensão do arquivo decide a renderização: não existe um campo de "tipo" separado. */
export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(splitPath(url)[0]);
}

/**
 * Endereço (ou caminho do Blob) da Miniatura de um vídeo; `undefined` se não for
 * vídeo. Só a extensão muda: query e fragmento seguem como estavam.
 */
export function miniaturaUrl(url: string): string | undefined {
  const [path, rest] = splitPath(url);
  return VIDEO_EXT.test(path) ? path.replace(VIDEO_EXT, ".jpg") + rest : undefined;
}

/**
 * A Miniatura explícita nos dados (o campo `poster` dos vídeos estáticos em
 * `/media`) vence a deduzida. Uma explícita vazia conta como ausente.
 */
export function miniaturaToShow(videoUrl: string, explicitMiniatura?: string): string | undefined {
  return explicitMiniatura || miniaturaUrl(videoUrl);
}

/**
 * Dos caminhos (`pathname`) listados no Blob, os vídeos cujo `.jpg` não está na
 * lista. Fotos soltas não contam. Precisa da lista inteira, com todas as páginas:
 * numa lista parcial, um vídeo cujo `.jpg` ficou noutra página parece sem Miniatura.
 */
export function videosMissingMiniatura(paths: string[]): string[] {
  const existing = new Set(paths);
  return paths.filter((path) => {
    const miniatura = miniaturaUrl(path);
    return miniatura !== undefined && !existing.has(miniatura);
  });
}
