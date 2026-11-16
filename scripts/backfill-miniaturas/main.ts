/**
 * Backfill das Miniaturas: cria a Miniatura de cada vídeo que já estava no Blob antes de o
 * painel passar a gerá-la no envio (spec #33, ADR 0001). Uso único, roda localmente, da raiz
 * do projeto; os modos estão em `USAGE`, logo abaixo, que o script imprime quando chamado sem
 * modo.
 *
 * O `--gravar` escreve no armazenamento de produção: só com o OK explícito do dono do projeto,
 * e ainda pede, antes de gravar, que se digite `s` diante da lista do que vai ser criado.
 * Repetir o script não sobrescreve nada, porque pula os vídeos que já têm Miniatura e o Blob
 * recusa gravar por cima de um arquivo existente.
 *
 * Precisa da chave do Blob no `.env.development.local` (os mesmos nomes de variável que a rota
 * de envio aceita) e, menos no ensaio, do `ffmpeg` e do `ffprobe` instalados. O ffmpeg precisa
 * decodificar HEVC (H.265), o formato de parte dos tours: o pacote `ffmpeg-free` do Fedora não
 * decodifica, e esses vídeos falham com "no decoder found for: hevc"; o `ffmpeg` do RPM Fusion
 * decodifica.
 */
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";
import { list, put } from "@vercel/blob";
import { config as loadEnv } from "dotenv";
import { blobToken } from "../../src/lib/blobToken";
import { backlogOf, createMiniaturas, formatPending, formatReport, type BlobFile, type Destination } from "./backfill";
import { extractMiniatura } from "./extractMiniatura";

const USAGE = `Uso (da raiz do projeto):
  npm run backfill:miniaturas -- --ensaio         só lista o que faria, sem gravar nada
  npm run backfill:miniaturas -- --pasta=<pasta>  tira as Miniaturas e salva na pasta local
  npm run backfill:miniaturas -- --gravar         grava as Miniaturas no Blob de PRODUÇÃO`;

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

/** O destino escolhido na linha de comando: exatamente um dos três modos. */
function destinationFromArgs(): Destination {
  let values;
  try {
    ({ values } = parseArgs({
      options: { ensaio: { type: "boolean" }, pasta: { type: "string" }, gravar: { type: "boolean" } },
    }));
  } catch (error) {
    exitWithError(`${(error as Error).message}\n\n${USAGE}`);
  }
  const chosen = [values.ensaio, values.pasta !== undefined, values.gravar].filter(Boolean).length;
  if (chosen !== 1) exitWithError(`Escolha um modo, e só um.\n\n${USAGE}`);
  if (values.ensaio) return { kind: "ensaio" };
  if (values.pasta !== undefined) {
    if (!values.pasta) exitWithError(`Diga a pasta: --pasta=<pasta>.\n\n${USAGE}`);
    return { kind: "pasta", dir: resolve(values.pasta) };
  }
  return { kind: "gravar" };
}

/**
 * A chave do Blob, lida dos arquivos de ambiente locais na mesma ordem do Next em
 * desenvolvimento (o primeiro arquivo vence; o ambiente do terminal vence os arquivos). Ela vai
 * explícita em cada chamada ao SDK do Blob, que assim a usa antes de qualquer token OIDC.
 */
function requireBlobToken(): string {
  loadEnv({ path: [".env.development.local", ".env.local", ".env"], quiet: true });
  const token = blobToken(process.env);
  if (!token) {
    exitWithError(
      "Falta a chave do Blob: defina BLOB_VERCEL_STORAGE_READ_WRITE_TOKEN (ou BLOB_READ_WRITE_TOKEN) " +
        "no .env.development.local da raiz do projeto.\n" +
        "Copie o valor do painel da Vercel → Storage → o armazenamento → aba .env.local.",
    );
  }
  return token;
}

function requireFfmpeg() {
  for (const tool of ["ffmpeg", "ffprobe"]) {
    if (spawnSync(tool, ["-version"]).status !== 0) {
      exitWithError(`Falta o ${tool}: instale o ffmpeg (que traz o ffprobe) nesta máquina e rode de novo.`);
    }
  }
}

/** O Blob inteiro, página por página. */
async function listBlob(token: string): Promise<BlobFile[]> {
  const files: BlobFile[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ token, cursor, limit: 1000 });
    files.push(...page.blobs.map(({ pathname, url }) => ({ pathname, url })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return files;
}

/** Uma linha da entrada padrão; entrada vazia ou fechada vale como resposta vazia. */
function ask(question: string): Promise<string> {
  process.stdout.write(question);
  return new Promise((answer) => {
    const input = createInterface({ input: process.stdin });
    input.once("line", (line) => {
      answer(line.trim());
      input.close();
    });
    input.once("close", () => answer(""));
  });
}

/** Onde cada modo guarda o JPEG. */
function saverFor(destination: Destination, token: string) {
  if (destination.kind === "pasta") {
    return async (miniaturaPath: string, jpeg: Buffer) => {
      const target = resolve(destination.dir, miniaturaPath);
      if (!target.startsWith(destination.dir + sep)) throw new Error(`caminho fora da pasta: ${miniaturaPath}`);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, jpeg);
    };
  }
  return async (miniaturaPath: string, jpeg: Buffer) => {
    await put(miniaturaPath, jpeg, {
      access: "public",
      token,
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: false,
    });
  };
}

async function main() {
  const destination = destinationFromArgs();
  const token = requireBlobToken();
  if (destination.kind !== "ensaio") requireFfmpeg();

  console.log("Listando o Blob...");
  const files = await listBlob(token);
  console.log(`${files.length} arquivos no Blob.`);

  const backlog = backlogOf(files);
  if (destination.kind === "ensaio") {
    console.log(`\n${formatReport(backlog, destination)}`);
    return;
  }

  if (destination.kind === "gravar" && backlog.pending.length > 0) {
    console.log(`\n${formatPending(backlog)}\n`);
    const answer = await ask(`Gravar ${backlog.pending.length} Miniaturas no Blob de PRODUÇÃO? Digite "s" para seguir: `);
    if (answer.toLowerCase() !== "s") exitWithError("\nCancelado: nada foi gravado.");
  }

  console.log("");
  const outcome = await createMiniaturas(backlog.pending, {
    extract: extractMiniatura,
    save: saverFor(destination, token),
    onProgress: (line) => console.log(line),
  });
  console.log(`\n${formatReport(backlog, destination, outcome)}`);
  if (outcome.failures.length > 0) process.exitCode = 1;
}

main().catch((error) => exitWithError(`O script parou: ${error instanceof Error ? error.message : error}`));
