import { upload } from "@vercel/blob/client";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Envia direto do navegador pro Blob (não passa pelo servidor do Next) e devolve a URL pública. */
export async function uploadMedia(file: File): Promise<string> {
  const isVideo = VIDEO_TYPES.includes(file.type);
  const isImage = file.type.startsWith("image/");
  if (!isImage && !isVideo) {
    throw new Error("Envie uma foto (JPG, PNG, WebP) ou um vídeo (MP4, WebM, MOV).");
  }
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    throw new Error(`Arquivo muito grande — o limite é ${limit / (1024 * 1024)} MB.`);
  }
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
  });
  return blob.url;
}

const VIDEO_EXT = /\.(mp4|webm|mov)$/i;

/** Extensão do arquivo decide a renderização — não existe um campo de "tipo" separado. */
export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url);
}
