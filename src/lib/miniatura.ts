/**
 * Miniatura: a imagem parada no lugar do vídeo até o play. Mora no mesmo
 * endereço do vídeo, trocando a extensão por `.jpg` (ADR 0001). Este módulo é o
 * único lugar que conhece essa convenção e o que conta como vídeo: o guia, o
 * envio e o backfill devem usar estas funções em vez de repetir a regra. Sem
 * dependências, pra rodar igual no navegador, no servidor e no script.
 */

const VIDEO_EXT = /\.(mp4|webm|mov)$/i;
/** Extensão e tipo do arquivo da Miniatura: um JPEG com o nome do vídeo. */
export const MINIATURA_EXT = ".jpg";
export const MINIATURA_TYPE = "image/jpeg";
// origem (`https://host`, opcional) · caminho · query e fragmento
const URL_PARTS = /^((?:[a-z][a-z\d+.-]*:)?\/\/[^/?#]*)?([^?#]*)([\s\S]*)$/i;

/**
 * Separa o endereço em origem, caminho e resto (`?v=2`, `#t=0.1`). Só o caminho
 * tem extensão: nem o domínio (`https://exemplo.mov`) nem a query contam.
 */
function splitUrl(url: string): { origin: string; path: string; rest: string } {
  const [, origin = "", path = "", rest = ""] = URL_PARTS.exec(url) ?? [];
  return { origin, path, rest };
}

/** A extensão do arquivo decide a renderização: não existe um campo de "tipo" separado. */
export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(splitUrl(url).path);
}

/**
 * Caminho da Miniatura de um vídeo: o mesmo caminho com a extensão trocada; `undefined` se não for
 * vídeo. Recebe caminho puro, como o `pathname` do Blob, que é nome de arquivo e pode ter `#` ou
 * `?`. É por ele que o envio e o backfill gravam a Miniatura.
 */
export function miniaturaPathname(path: string): string | undefined {
  return VIDEO_EXT.test(path) ? path.replace(VIDEO_EXT, MINIATURA_EXT) : undefined;
}

/**
 * Endereço da Miniatura de um vídeo; `undefined` se não for vídeo. Só a extensão
 * muda: domínio, query e fragmento seguem como estavam.
 */
export function miniaturaUrl(url: string): string | undefined {
  const { origin, path, rest } = splitUrl(url);
  const miniatura = miniaturaPathname(path);
  return miniatura === undefined ? undefined : origin + miniatura + rest;
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
    const miniatura = miniaturaPathname(path);
    return miniatura !== undefined && !existing.has(miniatura);
  });
}
