import { upload } from "@vercel/blob/client";
import { compressImage } from "@/lib/imageCompress";
import { MEDIA_ACCEPT, isImageType, isVideoType, type MediaAccept } from "@/lib/mediaAccept";

// Limite da foto original; depois de reduzida ela costuma ficar bem abaixo disso.
export const MAX_IMAGE_BYTES = 30 * 1024 * 1024;
const MAX_IMAGE_AFTER_COMPRESSION = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
// Arquivos grandes sobem em partes (paralelas e com nova tentativa por parte).
const MULTIPART_FROM_BYTES = 20 * 1024 * 1024;

/**
 * Envia direto do navegador pro Blob (não passa pelo servidor do Next) e devolve a URL pública.
 * Recusa o arquivo que o campo não aceita (`accepts`, ver `MEDIA_ACCEPT`).
 */
export async function uploadMedia(original: File, accepts: MediaAccept = "any"): Promise<string> {
  const { allows, formats } = MEDIA_ACCEPT[accepts];
  if (!allows(original.type)) throw new Error(`Envie ${formats}.`);
  const isVideo = isVideoType(original.type);
  const isImage = isImageType(original.type);
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
