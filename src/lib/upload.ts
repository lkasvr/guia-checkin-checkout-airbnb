import { upload } from "@vercel/blob/client";
import { compressImage } from "@/lib/imageCompress";

// Limite da foto original; depois de reduzida ela costuma ficar bem abaixo disso.
export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
const MAX_IMAGE_AFTER_COMPRESSION = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
// Arquivos grandes sobem em partes (paralelas e com nova tentativa por parte).
const MULTIPART_FROM_BYTES = 20 * 1024 * 1024;

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Envia direto do navegador pro Blob (não passa pelo servidor do Next) e devolve a URL pública. */
export async function uploadMedia(original: File): Promise<string> {
  const isVideo = VIDEO_TYPES.includes(original.type);
  const isImage = original.type.startsWith("image/");
  if (!isImage && !isVideo) {
    throw new Error("Envie uma foto (JPG, PNG, WebP) ou um vídeo (MP4, WebM, MOV).");
  }
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (original.size > limit) {
    throw new Error(`Arquivo muito grande — o limite é ${limit / (1024 * 1024)} MB.`);
  }
  const file = isImage ? await compressImage(original) : original;
  if (isImage && file.size > MAX_IMAGE_AFTER_COMPRESSION) {
    throw new Error("A foto continua muito pesada mesmo depois de reduzida — tente uma versão menor.");
  }
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    multipart: file.size > MULTIPART_FROM_BYTES,
  });
  return blob.url;
}

const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

/** Extensão do arquivo decide a renderização — não existe um campo de "tipo" separado. */
export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url);
}
