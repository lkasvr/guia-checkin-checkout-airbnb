/**
 * Tira a Miniatura de um vídeo no navegador de quem envia, a partir do arquivo local, antes de
 * ele subir: o quadro de 1 s, em JPEG, com o lado maior limitado a 1280 px (os mesmos valores do
 * backfill, em `scripts/backfill-miniaturas/extractMiniatura.ts`).
 */

/** Lado maior da Miniatura, em px. */
const MAX_SIDE = 1280;
/** Qualidade do JPEG (0 a 1). */
const QUALITY = 0.8;
/** Quanto esperar o navegador abrir o vídeo ou saltar até o quadro antes de desistir. */
const TIMEOUT_MS = 15_000;

/**
 * Em que segundo tirar o quadro: 1 s, para fugir da tela preta ou do fade de abertura; num vídeo
 * de menos de 1 s, o primeiro quadro. Sem duração conhecida (WebM sem duração no cabeçalho),
 * tenta 1 s: o navegador para no fim de um vídeo mais curto.
 */
export function frameTime(duration: number): number {
  return Number.isFinite(duration) && duration < 1 ? 0 : 1;
}

/** Tamanho da Miniatura: o do vídeo, reduzido até o lado maior caber em 1280 px. */
export function frameSize(width: number, height: number): { width: number; height: number } {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Espera o evento do vídeo; rejeita se o navegador der erro ou não responder a tempo. */
function waitFor(video: HTMLVideoElement, event: "loadeddata" | "seeked"): Promise<void> {
  return new Promise((resolve, reject) => {
    const onEvent = () => done();
    const onError = () => done(new Error(`o navegador não abriu o vídeo (${video.error?.message || `erro ${video.error?.code}`})`));
    const timer = setTimeout(() => done(new Error(`o navegador não respondeu em ${TIMEOUT_MS / 1000} s`)), TIMEOUT_MS);
    function done(error?: Error) {
      clearTimeout(timer);
      video.removeEventListener(event, onEvent);
      video.removeEventListener("error", onError);
      if (error) reject(error);
      else resolve();
    }
    video.addEventListener(event, onEvent);
    video.addEventListener("error", onError);
  });
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
  try {
    const loaded = waitFor(video, "loadeddata");
    video.src = src;
    await loaded;
    const time = frameTime(video.duration);
    if (time > 0) {
      const seeked = waitFor(video, "seeked");
      video.currentTime = time;
      await seeked;
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
    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
    if (!jpeg || jpeg.type !== "image/jpeg") throw new Error("o navegador não gerou o JPEG");
    return jpeg;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(src);
  }
}
