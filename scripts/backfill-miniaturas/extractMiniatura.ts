import { execFile } from "node:child_process";
import { MINIATURA_FRAME_S, MINIATURA_MAX_SIDE } from "../../src/lib/miniatura";

/** Qualidade do JPEG na escala do ffmpeg (2 é a melhor, 31 a pior). */
const JPEG_QSCALE = 5;
/**
 * Quanto o ffmpeg e o ffprobe esperam a rede responder antes de desistir de uma leitura: 30 s,
 * na unidade da opção, que é o microssegundo.
 */
const NETWORK_TIMEOUT = ["-rw_timeout", String(30 * 1_000_000)];
/** Quanto uma chamada ao ffmpeg ou ao ffprobe pode levar, ao todo, antes de ser interrompida. */
const PROCESS_TIMEOUT_S = 120;
/** Teto da saída de uma chamada: o JPEG de uma Miniatura de 1280 px fica muito abaixo disso. */
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024;

/** A saída de uma chamada; `ok` diz se ela terminou com código 0, sem ser interrompida. */
type ProcessResult = { stdout: Buffer; stderr: string; ok: boolean; timedOut: boolean };

/** Se a chamada entregou uma imagem inteira: a saída de uma chamada que falhou pode vir cortada. */
function isImage({ ok, stdout }: ProcessResult): boolean {
  return ok && stdout.length > 0;
}

/**
 * Tira a Miniatura de um vídeo: o quadro de `MINIATURA_FRAME_S`, em JPEG, com o lado maior
 * limitado a `MINIATURA_MAX_SIDE`. O vídeo pode ser um endereço público (`https://...`) ou um
 * arquivo local.
 *
 * O salto até esse segundo vem antes da entrada (`-ss` antes de `-i`): o ffmpeg lê o índice do
 * vídeo, pula para o quadro-chave anterior a ele e, num endereço HTTP, pede por requisições de
 * faixa só esses bytes, sem baixar o vídeo inteiro.
 *
 * Quando o salto não dá imagem, quem decide é o vídeo. Se o último quadro começa antes desse
 * segundo, não existe quadro nele, e a Miniatura é o primeiro quadro. Senão, a extração falha
 * com o motivo (decodificador, rede, arquivo cortado), sem cair no primeiro quadro: ele seria a
 * tela preta ou o fade de abertura que o salto existe para evitar, e o vídeo segue sem
 * Miniatura para a próxima rodada.
 */
export async function extractMiniatura(video: string): Promise<Buffer> {
  const atFrame = await runFfmpeg(video, { seekToFrame: true });
  if (isImage(atFrame)) return atFrame.stdout;
  if (atFrame.timedOut) throw new Error(failureReason(atFrame));

  const timing = await videoTiming(video);
  if (timing === undefined || !endsBeforeFrame(timing)) {
    if (atFrame.stderr.trim()) throw new Error(failureReason(atFrame));
    const lasts = timing === undefined ? "a duração do vídeo é desconhecida" : `o vídeo dura ${timing.duration} s`;
    throw new Error(`nenhum quadro em ${MINIATURA_FRAME_S} s, e ${lasts}`);
  }
  const firstFrame = await runFfmpeg(video, { seekToFrame: false });
  if (isImage(firstFrame)) return firstFrame.stdout;
  throw new Error(failureReason(firstFrame));
}

/** A duração do vídeo e a de cada quadro, em segundos. */
type VideoTiming = { duration: number; frameDuration: number };

/** Folga para o arredondamento da duração, que o ffprobe dá em microssegundos. */
const ROUNDING_S = 0.001;

/**
 * Se o último quadro começa antes de `MINIATURA_FRAME_S`: aí o salto não acha quadro nenhum. Não
 * basta comparar a duração com esse segundo, porque ela conta até o fim do último quadro: 30
 * quadros a 29,97 fps duram 1,001 s, e o último começa em 0,968 s. Sem a taxa de quadros, vale a
 * duração de até `MINIATURA_FRAME_S`.
 */
function endsBeforeFrame({ duration, frameDuration }: VideoTiming): boolean {
  if (frameDuration === 0) return duration <= MINIATURA_FRAME_S;
  return duration - frameDuration < MINIATURA_FRAME_S - ROUNDING_S;
}

function runFfmpeg(video: string, { seekToFrame }: { seekToFrame: boolean }): Promise<ProcessResult> {
  return run("ffmpeg", [
    "-hide_banner",
    "-nostdin",
    "-v", "error",
    ...NETWORK_TIMEOUT,
    ...(seekToFrame ? ["-ss", String(MINIATURA_FRAME_S)] : []),
    "-i", video,
    "-frames:v", "1",
    "-an", "-sn", "-dn",
    "-vf", `scale='min(${MINIATURA_MAX_SIDE},iw)':'min(${MINIATURA_MAX_SIDE},ih)':force_original_aspect_ratio=decrease`,
    // A faixa de cor do JPEG, dita de antemão: sem ela, quando não chega quadro nenhum, o
    // codificador ainda tenta abrir e enche o erro de mensagens que escondem a causa real.
    "-pix_fmt", "yuvj420p",
    "-q:v", String(JPEG_QSCALE),
    "-f", "mjpeg",
    "pipe:1",
  ]);
}

/**
 * A duração do vídeo e a de cada quadro, pelo ffprobe (só o cabeçalho e o índice), ou `undefined`
 * se ele não souber a duração. Vale a duração da trilha de vídeo e, na falta dela, a do arquivo
 * (alguns WebM só informam a do arquivo). A duração do quadro sai da taxa média de quadros, que o
 * ffprobe escreve como fração ("30000/1001"); desconhecida, ela fica 0.
 */
async function videoTiming(video: string): Promise<VideoTiming | undefined> {
  const { stdout } = await run("ffprobe", [
    "-v", "error",
    ...NETWORK_TIMEOUT,
    "-select_streams", "v:0",
    "-show_entries", "stream=duration,avg_frame_rate:format=duration",
    "-of", "json",
    video,
  ]);
  let probe: { streams?: { duration?: string; avg_frame_rate?: string }[]; format?: { duration?: string } };
  try {
    probe = JSON.parse(stdout.toString());
  } catch {
    return undefined;
  }
  const stream = probe.streams?.[0];
  const duration = [stream?.duration, probe.format?.duration].map(Number).find(Number.isFinite);
  if (duration === undefined) return undefined;
  const [frames, seconds] = (stream?.avg_frame_rate ?? "").split("/").map(Number);
  return { duration, frameDuration: frames > 0 && seconds > 0 ? seconds / frames : 0 };
}

/** Roda o programa e devolve a saída mesmo quando ele termina com erro. */
function run(command: string, args: string[]): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      { encoding: "buffer", timeout: PROCESS_TIMEOUT_S * 1000, maxBuffer: MAX_OUTPUT_BYTES },
      (error, stdout, stderr) => {
        // Código em texto (ENOENT, saída grande demais) é falha do processo; número é só o código de saída.
        if (typeof error?.code === "string") return reject(error);
        resolve({ stdout, stderr: stderr.toString(), ok: !error, timedOut: error?.killed === true });
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
