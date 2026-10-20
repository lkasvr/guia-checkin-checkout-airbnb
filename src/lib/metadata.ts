import type { Metadata } from "next";
import type { Apartment } from "@/data/types";

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "").trim();

function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * Metadata por tenant derivado do conteúdo do apartamento (preenchido pelo
 * anfitrião). O `title` é passado por página (guia, check-in, checkout);
 * descrição e imagem OG saem do próprio conteúdo. Imagens relativas são
 * resolvidas contra o metadataBase do layout raiz.
 */
export function apartmentMetadata(
  slug: string,
  content: Apartment,
  title: string,
): Metadata {
  const lang = content.lang.default;
  const description = stripHtml(content.hero.sub[lang]);
  const url = `https://${slug}.anfyi.com.br`;
  // `v` muda quando a capa muda: o WhatsApp guarda o preview por URL de imagem.
  const images = [{ url: `${url}/og?v=${shortHash(content.hero.img)}`, width: 1200, height: 630 }];
  return {
    title: { absolute: title },
    description,
    openGraph: { type: "website", title, description, url, images },
    twitter: { card: "summary_large_image", title, description, images },
    appleWebApp: { title: `Ap ${content.unit}` },
  };
}
