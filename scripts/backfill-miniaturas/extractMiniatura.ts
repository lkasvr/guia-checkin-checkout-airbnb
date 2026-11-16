import { spawn } from "node:child_process";

/** Lado maior da Miniatura, em px: o mesmo teto da Miniatura gerada no navegador do painel. */
const MAX_SIDE = 1280;
/** Qualidade do JPEG na escala do ffmpeg (2 é a melhor, 31 a pior). */
const JPEG_QSCALE = 5;
/** Quanto o ffmpeg espera a rede responder antes de desistir de uma leitura. */
const NETWORK_TIMEOUT_S = 30;
/** Quanto uma chamada ao ffmpeg ou ao ffprobe pode levar, ao todo, antes de ser interrompida. */
const PROCESS_TIMEOUT_S = 120;

type ProcessResult = { stdout: Buffer; stderr: string; code: number | null; timedOut: boolean };

/**
 * Tira a Miniatura de um vídeo: o quadro de 1 s, em JPEG, com o lado maior limitado a 1280 px.
 * O vídeo pode ser um endereço público (`https://...`) ou um arquivo local.
 *
 * O salto para 1 s vem antes da entrada (`-ss` antes de `-i`): o ffmpeg lê o índice do vídeo,
 * pula para o quadro-chave anterior a 1 s e, num endereço HTTP, pede por requisições de faixa só
 * esses bytes, sem baixar o vídeo inteiro.
 *
 * Se não sair quadro em 1 s, a duração decide. Num vídeo de até 1 s, o salto passou do fim, e a
 * Miniatura é o primeiro quadro. Num vídeo mais longo, algo falhou (a rede, um arquivo cortado),
 * e o primeiro quadro seria a tela preta ou o fade de abertura que o quadro de 1 s existe para
 * evitar; aí a extração falha com o motivo, e o vídeo segue sem Miniatura para a próxima rodada.
 */
export async function extractMiniatura(video: string): Promise<Buffer> {
  const atOneSecond = await runFfmpeg(video, { seekToOneSecond: true });
  if (atOneSecond.stdout.length > 0) return atOneSecond.stdout;

  const duration = await videoDuration(video);
  if (duration === undefined || duration > 1) {
    const lasts = duration === undefined ? "a duração do vídeo é desconhecida" : `o vídeo dura ${duration} s`;
    throw new Error(failureReason(atOneSecond, `nenhum quadro em 1 s, e ${lasts}`));
  }

  const firstFrame = await runFfmpeg(video, { seekToOneSecond: false });
  if (firstFrame.stdout.length > 0) return firstFrame.stdout;
  throw new Error(failureReason(firstFrame, "nenhum quadro no vídeo"));
}

function runFfmpeg(video: string, { seekToOneSecond }: { seekToOneSecond: boolean }): Promise<ProcessResult> {
  return run("ffmpeg", [
    "-hide_banner",
    "-nostdin",
    "-v", "error",
    "-rw_timeout", String(NETWORK_TIMEOUT_S * 1_000_000),
    ...(seekToOneSecond ? ["-ss", "1"] : []),
    "-i", video,
    "-frames:v", "1",
    "-an", "-sn", "-dn",
    "-vf", `scale='min(${MAX_SIDE},iw)':'min(${MAX_SIDE},ih)':force_original_aspect_ratio=decrease`,
    // A faixa de cor do JPEG, dita de antemão: sem ela, quando não chega quadro nenhum, o
    // codificador ainda tenta abrir e enche o erro de mensagens que escondem a causa real.
    "-pix_fmt", "yuvj420p",
    "-q:v", String(JPEG_QSCALE),
    "-f", "mjpeg",
    "pipe:1",
  ]);
}

/** Duração do vídeo em segundos, pelo ffprobe (só o cabeçalho e o índice), ou `undefined`. */
async function videoDuration(video: string): Promise<number | undefined> {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-rw_timeout", String(NETWORK_TIMEOUT_S * 1_000_000),
    "-select_streams", "v:0",
    "-show_entries", "stream=duration:format=duration",
    "-of", "json",
    video,
  ]);
  let info: { streams?: { duration?: string }[]; format?: { duration?: string } };
  try {
    info = JSON.parse(stdout.toString());
  } catch {
    return undefined;
  }
  // A duração da trilha de vídeo; sem ela (alguns WebM), a do arquivo.
  for (const value of [info.streams?.[0]?.duration, info.format?.duration]) {
    const seconds = Number.parseFloat(value ?? "");
    if (Number.isFinite(seconds)) return seconds;
  }
  return undefined;
}

function run(command: string, args: string[]): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { timeout: PROCESS_TIMEOUT_S * 1000 });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code, signal) =>
      resolve({
        stdout: Buffer.concat(stdout),
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
 * `[componente @ 0x...]` de cada uma. Sem mensagem, vale o `fallback`.
 */
function failureReason({ stderr, timedOut }: ProcessResult, fallback: string): string {
  if (timedOut) return `o ffmpeg não terminou em ${PROCESS_TIMEOUT_S} s`;
  const messages = stderr
    .split("\n")
    .map((line) => line.replace(/^(\[[^\]]*\]\s*)+/, "").trim())
    .filter(Boolean);
  return messages.slice(0, 2).join(" · ") || fallback;
}
