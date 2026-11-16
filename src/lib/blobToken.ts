/**
 * Onde mora a chave do Blob. O prefixo que a Vercel deu à variável ao conectar o Blob Store
 * veio diferente do padrão esperado pelo SDK (`BLOB_READ_WRITE_TOKEN`), então aceitamos os
 * dois nomes, nesta ordem de preferência. A rota que emite o token de envio e o script de
 * backfill das Miniaturas leem a chave por aqui, para nunca aceitarem nomes diferentes.
 */
export const BLOB_TOKEN_VARS = ["BLOB_VERCEL_STORAGE_READ_WRITE_TOKEN", "BLOB_READ_WRITE_TOKEN"] as const;

/** A chave do Blob no ambiente, ou `undefined` se nenhum dos nomes tiver valor. */
export function blobToken(env: Record<string, string | undefined>): string | undefined {
  for (const name of BLOB_TOKEN_VARS) {
    if (env[name]) return env[name];
  }
  return undefined;
}
