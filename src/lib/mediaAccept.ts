/**
 * O que um campo de mídia do painel aceita. Este módulo é o único lugar que decide, para cada
 * caso, o que o seletor de arquivo oferece e o que o botão diz: o campo consulta a tabela em vez
 * de repetir a regra. Sem dependências, pra rodar igual no navegador e no teste.
 */

/** Só vídeo, ou foto e vídeo. */
export type MediaAccept = "video" | "any";

export const MEDIA_ACCEPT: Record<
  MediaAccept,
  {
    /** Valor do `accept` do `<input type="file">`: filtra a lista do seletor de arquivo. */
    picker: string;
    /** Botão do campo vazio. */
    send: string;
    /** Botão do campo já preenchido. */
    swap: string;
  }
> = {
  video: { picker: "video/*", send: "Enviar vídeo", swap: "Trocar vídeo" },
  any: { picker: "image/*,video/*", send: "Enviar foto ou vídeo", swap: "Trocar foto/vídeo" },
};
