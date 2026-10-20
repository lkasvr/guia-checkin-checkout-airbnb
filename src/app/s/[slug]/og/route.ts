import sharp from "sharp";
import { getGuide } from "@/lib/apartments";

/**
 * Imagem de pré-visualização do link (WhatsApp, Instagram, iMessage): a capa
 * do apartamento recortada em 1200×630 e regravada em JPEG leve. Capas
 * originais pesadas (ou em PNG) fazem o WhatsApp desistir da imagem; aqui o
 * resultado fica em poucas centenas de KB. Servida em `<slug>.anfyi.com.br/og`.
 */

const W = 1200;
const H = 630;
const VIDEO_EXT = /\.(mp4|webm|mov)(\?|$)/i;

async function loadCover(src: string, base: string): Promise<Buffer | null> {
  if (VIDEO_EXT.test(src)) return null;
  try {
    const res = await fetch(new URL(src, base), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

const jpeg = (img: sharp.Sharp) => img.jpeg({ quality: 80, mozjpeg: true }).toBuffer();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return new Response("Not found", { status: 404 });

  const raw = await loadCover(guide.content.hero.img, request.url);
  if (raw) {
    try {
      const body = await jpeg(sharp(raw).rotate().resize(W, H, { fit: "cover", position: "centre" }));
      return new Response(new Uint8Array(body), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    } catch {
      // imagem corrompida: cai no bloco neutro abaixo
    }
  }

  // Sem capa utilizável (vídeo, arquivo indisponível): bloco neutro da marca,
  // com cache curto pra voltar à foto assim que ela estiver acessível.
  const neutral = await jpeg(
    sharp({ create: { width: W, height: H, channels: 3, background: "#faf5ee" } }),
  );
  return new Response(new Uint8Array(neutral), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, s-maxage=60" },
  });
}
