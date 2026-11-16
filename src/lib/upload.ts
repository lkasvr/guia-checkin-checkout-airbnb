import { upload } from "@vercel/blob/client";
import { compressImage } from "@/lib/imageCompress";
import { MB, isImageType, refusal, type MediaAccept } from "@/lib/mediaAccept";

// Teto da foto já reduzida (o da foto escolhida fica em `mediaAccept`); costuma sobrar folga.
const MAX_IMAGE_AFTER_COMPRESSION = 8 * MB;
// Arquivos grandes sobem em partes (paralelas e com nova tentativa por parte).
const MULTIPART_FROM_BYTES = 20 * MB;

/**
 * Envia direto do navegador pro Blob (não passa pelo servidor do Next) e devolve a URL pública.
 * Recusa, antes de qualquer requisição, o arquivo que o campo não aceita pelo tipo ou pelo
 * tamanho (`accepts`, ver `refusal`).
 */
export async function uploadMedia(original: File, accepts: MediaAccept = "any"): Promise<string> {
  const reason = refusal(original, accepts);
  if (reason) throw new Error(reason);
  const isImage = isImageType(original.type);
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
