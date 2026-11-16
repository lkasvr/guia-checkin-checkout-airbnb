/**
 * A chave do Blob no ambiente, ou `undefined` se não houver. O prefixo que a Vercel deu à
 * variável ao conectar o Blob Store (`BLOB_VERCEL_STORAGE_READ_WRITE_TOKEN`) veio diferente do
 * padrão esperado pelo SDK (`BLOB_READ_WRITE_TOKEN`), então aceitamos os dois, nesta ordem; uma
 * variável vazia conta como ausente. A rota que emite o token de envio e o script de backfill
 * das Miniaturas leem a chave por aqui, para nunca aceitarem nomes diferentes.
 */
export function blobToken(env: Record<string, string | undefined>): string | undefined {
  return env.BLOB_VERCEL_STORAGE_READ_WRITE_TOKEN || env.BLOB_READ_WRITE_TOKEN || undefined;
}
