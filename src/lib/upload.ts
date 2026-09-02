import { upload } from "@vercel/blob/client";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Envia direto do navegador pro Blob (não passa pelo servidor do Next) e devolve a URL pública. */
export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Envie um arquivo de imagem (JPG, PNG ou WebP).");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Imagem muito grande — o limite é 8 MB.");
  }
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
  });
  return blob.url;
}
