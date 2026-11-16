import { spawn } from "node:child_process";

/** Lado maior da Miniatura, em px: o mesmo teto da Miniatura gerada no navegador do painel. */
const MAX_SIDE = 1280;
/** Qualidade do JPEG na escala do ffmpeg (2 é a melhor, 31 a pior). */
const JPEG_QSCALE = 5;
/** Quanto o ffmpeg espera a rede responder antes de desistir de uma leitura. */
const NETWORK_TIMEOUT_S = 30;
/** Quanto um vídeo pode levar, ao todo, antes de o ffmpeg ser interrompido. */
const VIDEO_TIMEOUT_S = 120;

type FfmpegResult = { jpeg: Buffer; stderr: string; code: number | null; timedOut: boolean };

/**
 * Tira a Miniatura de um vídeo: o quadro de 1 s, em JPEG, com o lado maior limitado a 1280 px.
 * O vídeo pode ser um endereço público (`https://...`) ou um arquivo local.
 *
 * O salto para 1 s vem antes da entrada (`-ss` antes de `-i`): o ffmpeg lê o índice do vídeo,
 * pula para o quadro-chave anterior a 1 s e, num endereço HTTP, pede por requisições de faixa só
 * esses bytes, sem baixar o vídeo inteiro. Num vídeo com menos de 1 s, o salto passa do fim e
 * não sai quadro nenhum; aí a Miniatura é o primeiro quadro.
 */
export async function extractMiniatura(video: string): Promise<Buffer> {
  const atOneSecond = await runFfmpeg(video, { seekToOneSecond: true });
  if (atOneSecond.jpeg.length > 0) return atOneSecond.jpeg;

  const firstFrame = await runFfmpeg(video, { seekToOneSecond: false });
  if (firstFrame.jpeg.length > 0) return firstFrame.jpeg;
  throw new Error(failureReason(firstFrame));
}

function runFfmpeg(video: string, { seekToOneSecond }: { seekToOneSecond: boolean }): Promise<FfmpegResult> {
  const args = [
    "-hide_banner",
    "-nostdin",
    "-v", "error",
    "-rw_timeout", String(NETWORK_TIMEOUT_S * 1_000_000),
    ...(seekToOneSecond ? ["-ss", "1"] : []),
    "-i", video,
    "-frames:v", "1",
    "-an", "-sn", "-dn",
    "-vf", `scale='min(${MAX_SIDE},iw)':'min(${MAX_SIDE},ih)':force_original_aspect_ratio=decrease`,
    "-q:v", String(JPEG_QSCALE),
    "-f", "mjpeg",
    "pipe:1",
  ];

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", args, { timeout: VIDEO_TIMEOUT_S * 1000 });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    ffmpeg.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    ffmpeg.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    ffmpeg.on("error", (error: NodeJS.ErrnoException) =>
      reject(error.code === "ENOENT" ? new Error("ffmpeg não encontrado: instale o ffmpeg nesta máquina.") : error),
    );
    ffmpeg.on("close", (code, signal) =>
      resolve({
        jpeg: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr).toString(),
        code,
        timedOut: signal !== null && code === null,
      }),
    );
  });
}

/**
 * O motivo da falha em uma linha: as duas primeiras mensagens de erro do ffmpeg, que costumam
 * trazer a causa ("moov atom not found", "HTTP error 403 Forbidden"), sem o prefixo
 * `[componente @ 0x...]` de cada uma.
 */
function failureReason({ stderr, code, timedOut }: FfmpegResult): string {
  if (timedOut) return `o ffmpeg não terminou em ${VIDEO_TIMEOUT_S} s`;
  const messages = stderr
    .split("\n")
    .map((line) => line.replace(/^(\[[^\]]*\]\s*)+/, "").trim())
    .filter(Boolean);
  return messages.slice(0, 2).join(" · ") || `o ffmpeg terminou com o código ${code} sem gerar imagem`;
}
