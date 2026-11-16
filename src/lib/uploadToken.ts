/**
 * O que o token de envio direto pro Blob deixa gravar. A rota `/api/upload` emite o token com
 * estas opções, e o envio do painel monta aqui o pedido da Miniatura, para os dois lados nunca
 * discordarem do formato. Sem dependências além do `mediaAccept` e do módulo da Miniatura, pra
 * rodar igual no navegador, no servidor e no teste.
 */
import { MAX_UPLOAD_BYTES, MB, UPLOAD_TYPES } from "@/lib/mediaAccept";
import { MINIATURA_EXT, MINIATURA_TYPE } from "@/lib/miniatura";

/** Opções do token que o Blob confere na hora de gravar (as de `handleUpload`). */
export type UploadTokenOptions = {
  allowedContentTypes: string[];
  addRandomSuffix: boolean;
  maximumSizeInBytes: number;
  allowOverwrite?: boolean;
};

/** Maior Miniatura aceita: um JPEG de 1280 px fica muito abaixo disso. */
const MAX_MINIATURA_BYTES = 2 * MB;

/**
 * O `clientPayload` com que o envio pede o token de uma Miniatura, declarando o tipo do arquivo
 * que vai subir. A rota recusa o pedido de outro tipo, e o token ainda só aceita JPEG.
 */
export function miniaturaRequest(contentType: string): string {
  return JSON.stringify({ miniatura: { contentType } });
}

/** Lê o pedido de Miniatura do `clientPayload`, ou `undefined` se o pedido não for de Miniatura. */
function parseMiniaturaRequest(clientPayload: string | null): { contentType?: unknown } | undefined {
  if (!clientPayload) return undefined;
  try {
    const parsed = JSON.parse(clientPayload);
    return typeof parsed?.miniatura === "object" && parsed.miniatura !== null ? parsed.miniatura : undefined;
  } catch {
    return undefined;
  }
}

/**
 * As opções do token para o arquivo `pathname`. Um pedido de Miniatura (ver `miniaturaRequest`)
 * grava só JPEG pequeno no caminho exato pedido, que é o do vídeo com `.jpg` (ADR 0001), sem
 * sufixo aleatório e sem sobrescrever o que já existe; o resto é foto ou vídeo do painel, com
 * sufixo aleatório. Lança o motivo da recusa, que a rota devolve com status 400.
 */
export function uploadTokenOptions(pathname: string, clientPayload: string | null): UploadTokenOptions {
  const miniatura = parseMiniaturaRequest(clientPayload);
  if (!miniatura) {
    return { allowedContentTypes: UPLOAD_TYPES, addRandomSuffix: true, maximumSizeInBytes: MAX_UPLOAD_BYTES };
  }
  if (miniatura.contentType !== MINIATURA_TYPE) throw new Error("A Miniatura só pode ser JPEG.");
  if (!pathname.endsWith(MINIATURA_EXT)) throw new Error(`O caminho da Miniatura tem de terminar em ${MINIATURA_EXT}.`);
  return {
    allowedContentTypes: [MINIATURA_TYPE],
    addRandomSuffix: false,
    maximumSizeInBytes: MAX_MINIATURA_BYTES,
    allowOverwrite: false,
  };
}
