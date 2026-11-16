/**
 * O que um campo de mídia do painel aceita. Este módulo é o único lugar que decide, para cada
 * caso, o que o seletor de arquivo oferece, que arquivo passa no envio (pelo tipo e pelo
 * tamanho), como a recusa se explica, o que o botão diz e que orientação o campo mostra: o
 * campo e o `uploadMedia` consultam o módulo em vez de repetir a regra, e o token de envio de foto
 * e vídeo (`uploadTokenOptions`) lê daqui os tipos e o tamanho que aceita; o da Miniatura, que
 * ninguém escolhe no seletor, tem regra própria em `uploadToken`. O envio testa o arquivo de
 * novo porque o filtro do seletor não basta: quem troca para "todos os arquivos" escolhe
 * qualquer coisa. Sem dependências, pra rodar igual no navegador, no servidor e no teste.
 */

/** Tipos MIME de vídeo que o guia toca: MP4, WebM ou MOV. */
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Tipo MIME de foto: qualquer `image/*` (o envio reduz a foto antes de subir). */
export const isImageType = (mime: string) => mime.startsWith("image/");
const isVideoType = (mime: string) => VIDEO_TYPES.includes(mime);

export const MB = 1024 * 1024;
/** Maior foto aceita na escolha; o envio ainda a reduz antes de subir. */
const MAX_IMAGE_BYTES = 30 * MB;
/** Maior vídeo que sobe. */
const MAX_VIDEO_BYTES = 50 * MB;

/**
 * Tipos MIME que o token de envio deixa gravar no Blob. A foto chega reduzida pelo navegador
 * (WebP ou JPEG) ou, quando reduzir não ajuda, como foi escolhida; o vídeo sobe como foi escolhido.
 */
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", ...VIDEO_TYPES];
/**
 * Maior arquivo que o token de envio deixa gravar: o limite do vídeo, para que nenhum caminho
 * fora do painel grave um vídeo maior. A foto chega reduzida, bem abaixo dele.
 */
export const MAX_UPLOAD_BYTES = MAX_VIDEO_BYTES;

const VIDEO_HINT = `Vídeo de até ${MAX_VIDEO_BYTES / MB} MB: comprima para 720p antes de enviar.`;

/** Só foto, só vídeo, ou os dois. */
export type MediaAccept = "image" | "video" | "any";

/**
 * Por que o arquivo escolhido não pode subir por este campo, ou `null` se pode. Roda antes de
 * qualquer requisição, então a recusa não gasta envio.
 */
export function refusal(file: { type: string; size: number }, accepts: MediaAccept): string | null {
  const { allows, formats } = MEDIA_ACCEPT[accepts];
  if (!allows(file.type)) return `Envie ${formats}.`;
  const [limit, noun] = isVideoType(file.type)
    ? [MAX_VIDEO_BYTES, "Vídeo"]
    : [MAX_IMAGE_BYTES, "Arquivo"];
  return file.size > limit ? `${noun} muito grande — o limite é ${limit / MB} MB.` : null;
}

export const MEDIA_ACCEPT: Record<
  MediaAccept,
  {
    /** Valor do `accept` do `<input type="file">`: filtra a lista do seletor de arquivo. */
    picker: string;
    /** Se o arquivo escolhido, pelo tipo MIME, passa no envio. */
    allows: (mime: string) => boolean;
    /** Completa a recusa "Envie …". */
    formats: string;
    /** Botão do campo vazio. */
    send: string;
    /** Botão do campo já preenchido. */
    swap: string;
    /** Orientação mostrada junto do botão, só nos campos que aceitam vídeo. */
    hint?: string;
  }
> = {
  image: {
    picker: "image/*",
    allows: isImageType,
    formats: "uma foto (JPG, PNG, WebP)",
    send: "Enviar foto",
    swap: "Trocar foto",
  },
  video: {
    picker: "video/*",
    allows: isVideoType,
    formats: "um vídeo (MP4, WebM, MOV)",
    send: "Enviar vídeo",
    swap: "Trocar vídeo",
    hint: VIDEO_HINT,
  },
  any: {
    picker: "image/*,video/*",
    allows: (mime) => isImageType(mime) || isVideoType(mime),
    formats: "uma foto (JPG, PNG, WebP) ou um vídeo (MP4, WebM, MOV)",
    send: "Enviar foto ou vídeo",
    swap: "Trocar foto/vídeo",
    hint: VIDEO_HINT,
  },
};
