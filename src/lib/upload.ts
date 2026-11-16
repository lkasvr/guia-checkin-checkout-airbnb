import { upload } from "@vercel/blob/client";
import { compressImage } from "@/lib/imageCompress";
import { MB, isImageType, refusal, type MediaAccept } from "@/lib/mediaAccept";
import { captureMiniatura } from "@/lib/miniaturaCapture";
import { miniaturaRequest } from "@/lib/uploadToken";
import { uploadVideo } from "@/lib/videoUpload";

// Teto da foto já reduzida (o da foto escolhida fica em `mediaAccept`); costuma sobrar folga.
const MAX_IMAGE_AFTER_COMPRESSION = 8 * MB;
// Arquivos grandes sobem em partes (paralelas e com nova tentativa por parte).
const MULTIPART_FROM_BYTES = 20 * MB;
/** A rota que emite o token de envio. */
const HANDLE_UPLOAD_URL = "/api/upload";

/** O que o envio gravou: o endereço do arquivo e, só num vídeo, se a Miniatura foi gravada junto. */
export type Uploaded = { url: string; miniaturaSaved?: boolean };

/**
 * Envia direto do navegador pro Blob (não passa pelo servidor do Next). Recusa, antes de qualquer
 * requisição, o arquivo que o campo não aceita pelo tipo ou pelo tamanho (`accepts`, ver
 * `refusal`). A foto sobe reduzida; o vídeo sobe com a Miniatura (ver `uploadVideo`), e a falha
 * dela nunca derruba o envio do vídeo.
 */
export async function uploadMedia(original: File, accepts: MediaAccept = "any"): Promise<Uploaded> {
  const reason = refusal(original, accepts);
  if (reason) throw new Error(reason);
  if (!isImageType(original.type)) {
    return uploadVideo(original, {
      captureMiniatura: warnOnFailure("não gerada", captureMiniatura),
      putVideo: putFile,
      putMiniatura: warnOnFailure("não gravada", putMiniatura),
    });
  }
  const file = await compressImage(original);
  if (file.size > MAX_IMAGE_AFTER_COMPRESSION) {
    throw new Error("A foto continua muito pesada mesmo depois de reduzida — tente uma versão menor.");
  }
  return { url: (await putFile(file)).url };
}

/** Sobe a foto ou o vídeo com sufixo aleatório no nome. */
function putFile(file: File) {
  return upload(file.name, file, {
    access: "public",
    handleUploadUrl: HANDLE_UPLOAD_URL,
    multipart: file.size > MULTIPART_FROM_BYTES,
  });
}

/** Grava a Miniatura no caminho exato pedido, com o token próprio dela (ver `uploadTokenOptions`). */
async function putMiniatura(pathname: string, jpeg: Blob) {
  await upload(pathname, jpeg, {
    access: "public",
    handleUploadUrl: HANDLE_UPLOAD_URL,
    contentType: jpeg.type,
    clientPayload: miniaturaRequest(jpeg.type),
  });
}

/** Deixa no console o motivo da falha da Miniatura, que o painel resume num aviso só. */
function warnOnFailure<A extends unknown[], R>(what: string, step: (...args: A) => Promise<R>) {
  return (...args: A) =>
    step(...args).catch((error: unknown) => {
      console.warn(`Miniatura ${what}:`, error);
      throw error;
    });
}
