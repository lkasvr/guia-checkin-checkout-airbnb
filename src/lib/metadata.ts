import type { Metadata } from "next";
import type { Apartment } from "@/data/types";

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "").trim();

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
  const images = [content.hero.img];
  return {
    title: { absolute: title },
    description,
    openGraph: { type: "website", title, description, url, images },
    twitter: { card: "summary_large_image", title, description, images },
    appleWebApp: { title: `Ap ${content.unit}` },
  };
}
