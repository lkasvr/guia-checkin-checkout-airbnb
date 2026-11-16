/**
 * Tira a Miniatura de um vídeo no navegador de quem envia, a partir do arquivo local, antes de
 * ele subir: o quadro de `MINIATURA_FRAME_S`, em JPEG, com o lado maior limitado a
 * `MINIATURA_MAX_SIDE` (o mesmo quadro e o mesmo teto do backfill, em
 * `scripts/backfill-miniaturas/extractMiniatura.ts`).
 */

import { MINIATURA_FRAME_S, MINIATURA_MAX_SIDE, MINIATURA_TYPE } from "@/lib/miniatura";

/** Qualidade do JPEG (0 a 1). */
const QUALITY = 0.8;
/**
 * Quanto a captura inteira pode esperar o navegador (abrir o vídeo, saltar até o quadro e gerar o
 * JPEG) antes de desistir: o envio do vídeo só começa depois dela.
 */
const TIMEOUT_MS = 15_000;

/**
 * Em que segundo tirar o quadro: `MINIATURA_FRAME_S`; num vídeo mais curto que isso, o primeiro
 * quadro. Sem duração conhecida (WebM sem duração no cabeçalho), tenta `MINIATURA_FRAME_S`: o
 * navegador para no fim de um vídeo mais curto, e `captureMiniatura` volta ao primeiro quadro.
 */
export function frameTime(duration: number): number {
  return Number.isFinite(duration) && duration < MINIATURA_FRAME_S ? 0 : MINIATURA_FRAME_S;
}

/** Tamanho da Miniatura: o do vídeo, reduzido até o lado maior caber em `MINIATURA_MAX_SIDE`. */
export function frameSize(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, MINIATURA_MAX_SIDE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** O resultado de `promise`, ou a recusa se o navegador não responder até `deadline`. */
function beforeDeadline<T>(promise: Promise<T>, deadline: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`o navegador não respondeu em ${TIMEOUT_MS / 1000} s`)),
      Math.max(0, deadline - Date.now()),
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Espera o evento do vídeo; rejeita se o navegador der erro ou não responder até `deadline`. */
function waitFor(video: HTMLVideoElement, event: "loadeddata" | "seeked", deadline: number): Promise<void> {
  let onEvent = () => {};
  let onError = () => {};
  const happened = new Promise<void>((resolve, reject) => {
    onEvent = () => resolve();
    onError = () => reject(new Error(`o navegador não abriu o vídeo (${video.error?.message || `erro ${video.error?.code}`})`));
    video.addEventListener(event, onEvent);
    video.addEventListener("error", onError);
  });
  return beforeDeadline(happened, deadline).finally(() => {
    video.removeEventListener(event, onEvent);
    video.removeEventListener("error", onError);
  });
}

/** Salta o vídeo para `time` e espera o quadro, dentro do mesmo prazo. */
async function seekTo(video: HTMLVideoElement, time: number, deadline: number): Promise<void> {
  const seeked = waitFor(video, "seeked", deadline);
  video.currentTime = time;
  await seeked;
}

/**
 * O JPEG da Miniatura do vídeo. Falha quando o navegador não decodifica a imagem do vídeo (um
 * `.mov` em HEVC no Chrome, por exemplo): quem chama sobe o vídeo assim mesmo.
 */
export async function captureMiniatura(file: File): Promise<Blob> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  const src = URL.createObjectURL(file);
  const deadline = Date.now() + TIMEOUT_MS;
  try {
    const loaded = waitFor(video, "loadeddata", deadline);
    video.src = src;
    await loaded;
    const time = frameTime(video.duration);
    if (time > 0) {
      await seekTo(video, time, deadline);
      // Sem duração no cabeçalho, ela só aparece depois do salto: um vídeo mais curto parou no
      // último quadro, e a Miniatura dele é o primeiro.
      if (video.duration < MINIATURA_FRAME_S) await seekTo(video, 0, deadline);
    }
    // Vídeo cuja imagem o navegador não decodifica pode abrir só com o som, sem largura.
    if (!video.videoWidth || !video.videoHeight) throw new Error("o navegador não decodifica a imagem deste vídeo");

    const { width, height } = frameSize(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("o navegador não desenha em canvas");
    ctx.drawImage(video, 0, 0, width, height);
    const jpeg = await beforeDeadline(
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, MINIATURA_TYPE, QUALITY)),
      deadline,
    );
    if (!jpeg || jpeg.type !== MINIATURA_TYPE) throw new Error("o navegador não gerou o JPEG");
    return jpeg;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(src);
  }
}
