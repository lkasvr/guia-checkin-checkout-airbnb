import { execFile } from "node:child_process";
import { MB } from "../../src/lib/mediaAccept";

/** Lado maior da Miniatura, em px: o teto que a spec #33 sugere para a Miniatura gerada no painel. */
const MAX_SIDE = 1280;
/** Qualidade do JPEG na escala do ffmpeg (2 é a melhor, 31 a pior). */
const JPEG_QSCALE = 5;
/** Quanto o ffmpeg espera a rede responder antes de desistir de uma leitura. */
const NETWORK_TIMEOUT_S = 30;
/** Quanto uma chamada ao ffmpeg ou ao ffprobe pode levar, ao todo, antes de ser interrompida. */
const PROCESS_TIMEOUT_S = 120;

type ProcessResult = { stdout: Buffer; stderr: string; timedOut: boolean };

/**
 * Tira a Miniatura de um vídeo: o quadro de 1 s, em JPEG, com o lado maior limitado a 1280 px.
 * O vídeo pode ser um endereço público (`https://...`) ou um arquivo local.
 *
 * O salto para 1 s vem antes da entrada (`-ss` antes de `-i`): o ffmpeg lê o índice do vídeo,
 * pula para o quadro-chave anterior a 1 s e, num endereço HTTP, pede por requisições de faixa só
 * esses bytes, sem baixar o vídeo inteiro.
 *
 * Se o ffmpeg acusar erro (decodificador, rede, arquivo cortado), a extração falha com o motivo,
 * sem cair no primeiro quadro: ele seria a tela preta ou o fade de abertura que o quadro de 1 s
 * existe para evitar, e o vídeo segue sem Miniatura para a próxima rodada. Se não sair imagem nem
 * erro, o salto passou do fim do vídeo: num vídeo de até 1 s, a Miniatura é o primeiro quadro.
 */
export async function extractMiniatura(video: string): Promise<Buffer> {
  const atOneSecond = await runFfmpeg(video, { seekToOneSecond: true });
  if (atOneSecond.stdout.length > 0) return atOneSecond.stdout;
  if (atOneSecond.stderr.trim() || atOneSecond.timedOut) throw new Error(failureReason(atOneSecond));

  const duration = await videoDuration(video);
  if (duration === undefined || duration > 1) {
    const lasts = duration === undefined ? "a duração do vídeo é desconhecida" : `o vídeo dura ${duration} s`;
    throw new Error(`nenhum quadro em 1 s, e ${lasts}`);
  }
  const firstFrame = await runFfmpeg(video, { seekToOneSecond: false });
  if (firstFrame.stdout.length > 0) return firstFrame.stdout;
  throw new Error(failureReason(firstFrame));
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

/**
 * Duração do vídeo em segundos, pelo ffprobe (só o cabeçalho e o índice), ou `undefined`. O
 * ffprobe imprime a duração da trilha de vídeo e depois a do arquivo; vale a primeira que for
 * número (alguns WebM não informam a da trilha, só a do arquivo).
 */
async function videoDuration(video: string): Promise<number | undefined> {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    "-rw_timeout", String(NETWORK_TIMEOUT_S * 1_000_000),
    "-select_streams", "v:0",
    "-show_entries", "stream=duration:format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    video,
  ]);
  return stdout.toString().split("\n").map((line) => Number.parseFloat(line)).find(Number.isFinite);
}

/** Roda o programa e devolve a saída mesmo quando ele termina com erro. */
function run(command: string, args: string[]): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      { encoding: "buffer", timeout: PROCESS_TIMEOUT_S * 1000, maxBuffer: 32 * MB },
      (error, stdout, stderr) => {
        // Código em texto (ENOENT, saída grande demais) é falha do processo; número é só o código de saída.
        if (typeof error?.code === "string") return reject(error);
        resolve({ stdout, stderr: stderr.toString(), timedOut: error?.killed === true });
      },
    );
  });
}

/**
 * O motivo da falha em uma linha: as duas primeiras mensagens de erro do ffmpeg, que costumam
 * trazer a causa ("moov atom not found", "HTTP error 403 Forbidden"), sem o prefixo
 * `[componente @ 0x...]` de cada uma.
 */
function failureReason({ stderr, timedOut }: ProcessResult): string {
  if (timedOut) return `o ffmpeg não terminou em ${PROCESS_TIMEOUT_S} s`;
  const messages = stderr
    .split("\n")
    .map((line) => line.replace(/^(\[[^\]]*\]\s*)+/, "").trim())
    .filter(Boolean);
  return messages.slice(0, 2).join(" · ") || "o ffmpeg não gerou imagem";
}
