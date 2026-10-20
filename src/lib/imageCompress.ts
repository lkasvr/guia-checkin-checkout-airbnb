/**
 * Prepara a foto antes de subir pro Blob: reduz pro tamanho que o celular
 * realmente mostra e regrava em WebP de alta qualidade. Captura de tela em PNG
 * costuma cair de vários MB pra algumas centenas de KB sem diferença visível.
 */

const MAX_SIDE = 2000;
const QUALITY = 0.9;
// Abaixo disso, mexer na foto só gasta qualidade à toa.
const SKIP_BELOW_BYTES = 300 * 1024;
// Realce leve só quando a imagem foi reduzida (reduzir amacia os contornos).
const SHARPEN_AMOUNT = 0.2;

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Realce 3x3 (cruz): centro = 1 + 4a, vizinhos = -a. Preserva o canal alfa. */
function sharpen(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const src = ctx.getImageData(0, 0, w, h);
  const out = ctx.createImageData(w, h);
  const s = src.data;
  const o = out.data;
  const center = 1 + 4 * amount;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        o[i] = s[i];
        o[i + 1] = s[i + 1];
        o[i + 2] = s[i + 2];
        o[i + 3] = s[i + 3];
        continue;
      }
      for (let c = 0; c < 3; c++) {
        const v =
          s[i + c] * center -
          amount * (s[i + c - 4] + s[i + c + 4] + s[i + c - w * 4] + s[i + c + w * 4]);
        o[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      o[i + 3] = s[i + 3];
    }
  }
  ctx.putImageData(out, 0, 0);
}

/**
 * Devolve o arquivo original se a compressão não ajudar (já pequeno, formato
 * não suportado pelo navegador, ou o resultado ficou maior).
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const alreadySmall = scale === 1 && file.size <= SKIP_BELOW_BYTES;
  if (alreadySmall) {
    bitmap.close();
    return file;
  }

  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  if (scale < 0.8) sharpen(ctx, w, h, SHARPEN_AMOUNT);

  let blob = await toBlob(canvas, "image/webp", QUALITY);
  let ext = "webp";
  if (!blob || blob.type !== "image/webp") {
    // Navegador sem encoder de WebP: JPEG sobre fundo branco (JPEG não tem transparência).
    const flat = document.createElement("canvas");
    flat.width = w;
    flat.height = h;
    const fctx = flat.getContext("2d");
    if (!fctx) return file;
    fctx.fillStyle = "#fff";
    fctx.fillRect(0, 0, w, h);
    fctx.drawImage(canvas, 0, 0);
    blob = await toBlob(flat, "image/jpeg", QUALITY);
    ext = "jpg";
  }
  if (!blob || blob.size >= file.size) return file;

  const base = file.name.replace(/\.[^.]+$/, "") || "foto";
  return new File([blob], `${base}.${ext}`, { type: blob.type });
}
