/**
 * O que um campo de mídia do painel aceita. Este módulo é o único lugar que decide, para cada
 * caso, o que o seletor de arquivo oferece, que arquivo passa no envio, como a recusa cita os
 * formatos e o que o botão diz: o campo e o `uploadMedia` consultam a tabela em vez de repetir a
 * regra. O envio testa o arquivo de novo porque o filtro do seletor não basta: quem troca para
 * "todos os arquivos" escolhe qualquer coisa. Sem dependências, pra rodar igual no navegador e no
 * teste.
 */

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Tipo MIME de foto: qualquer `image/*` (o envio reduz a foto antes de subir). */
export const isImageType = (mime: string) => mime.startsWith("image/");
/** Tipo MIME de vídeo que o guia toca: MP4, WebM ou MOV. */
export const isVideoType = (mime: string) => VIDEO_TYPES.includes(mime);

/** Só foto, só vídeo, ou os dois. */
export type MediaAccept = "image" | "video" | "any";

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
  },
  any: {
    picker: "image/*,video/*",
    allows: (mime) => isImageType(mime) || isVideoType(mime),
    formats: "uma foto (JPG, PNG, WebP) ou um vídeo (MP4, WebM, MOV)",
    send: "Enviar foto ou vídeo",
    swap: "Trocar foto/vídeo",
  },
};
