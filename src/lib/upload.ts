import { upload } from "@vercel/blob/client";
import { compressImage } from "@/lib/imageCompress";
import { MB, isImageType, refusal, type MediaAccept } from "@/lib/mediaAccept";
import { captureMiniatura } from "@/lib/miniaturaCapture";
import { miniaturaRequest } from "@/lib/uploadToken";
import { uploadVideo, type Uploaded } from "@/lib/videoUpload";

// Teto da foto já reduzida (o da foto escolhida fica em `mediaAccept`); costuma sobrar folga.
const MAX_IMAGE_AFTER_COMPRESSION = 8 * MB;
// Arquivos grandes sobem em partes (paralelas e com nova tentativa por parte).
const MULTIPART_FROM_BYTES = 20 * MB;
/** A rota que emite o token de envio. */
const HANDLE_UPLOAD_URL = "/api/upload";
/** Quanto a gravação da Miniatura (o token e o JPEG, de até 2 MB) pode levar antes de desistir. */
const MINIATURA_UPLOAD_TIMEOUT_MS = 30_000;

/**
 * Envia direto do navegador pro Blob (não passa pelo servidor do Next). Recusa, antes de qualquer
 * requisição, o arquivo que o campo não aceita pelo tipo ou pelo tamanho (`accepts`, ver
 * `refusal`). A foto sobe reduzida; o vídeo sobe com a Miniatura (ver `uploadVideo`), e a falha
 * dela nunca derruba o envio do vídeo: volta como `miniaturaError`.
 */
export async function uploadMedia(original: File, accepts: MediaAccept = "any"): Promise<Uploaded> {
  const reason = refusal(original, accepts);
  if (reason) throw new Error(reason);
  if (!isImageType(original.type)) {
    return uploadVideo(original, { captureMiniatura, putVideo: putFile, putMiniatura });
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

/**
 * Grava a Miniatura no caminho exato pedido, com o token próprio dela (ver `uploadTokenOptions`).
 * Com prazo: um pedido que trava vira falha da Miniatura, e o vídeo, que já subiu, entra no campo.
 */
async function putMiniatura(pathname: string, jpeg: Blob) {
  // AbortController, e não AbortSignal.timeout: o SDK do Blob só desiste de vez com "AbortError";
  // o "TimeoutError" do AbortSignal.timeout ele toma por falha passageira e tenta de novo, até 10 vezes.
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), MINIATURA_UPLOAD_TIMEOUT_MS);
  try {
    await upload(pathname, jpeg, {
      access: "public",
      handleUploadUrl: HANDLE_UPLOAD_URL,
      contentType: jpeg.type,
      clientPayload: miniaturaRequest(jpeg.type),
      abortSignal: deadline.signal,
    });
  } catch (error) {
    if (deadline.signal.aborted) {
      throw new Error(`a gravação da Miniatura não terminou em ${MINIATURA_UPLOAD_TIMEOUT_MS / 1000} s`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
