/**
 * Um arquivo no Blob: o caminho dentro do armazenamento (`pathname`, nome de arquivo, em que `#`
 * e `?` são letras, não fragmento nem query) e o endereço público. É o que o envio recebe do
 * Blob ao subir um vídeo e o que o backfill lista. Só tipo, pra rodar igual no navegador e no script.
 */
export type BlobFile = { pathname: string; url: string };
