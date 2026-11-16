"use client";

import Image from "next/image";
import { isVideoUrl, miniaturaToShow } from "@/lib/miniatura";

/**
 * Todo vídeo do guia passa por aqui, pra só baixar quando o hóspede aperta o play:
 * `preload="none"` e nenhum fragmento `#t=` no `src` (o salto faz o navegador baixar
 * um pedaço do vídeo só pra achar o quadro). Até o play, o lugar é da Miniatura, que o
 * atributo `poster` pede direto do arquivo (do Blob, ou da pasta pública nos vídeos
 * estáticos), sem passar pelo otimizador de imagens; se o `.jpg` não existir, o player
 * aparece vazio e o vídeo toca igual (ADR 0001). `miniatura` é a explícita dos dados
 * (precedência em `miniaturaToShow`).
 */
export function GuideVideo({
  src,
  miniatura,
  className,
}: {
  src: string;
  miniatura?: string;
  className?: string;
}) {
  return (
    <video
      src={src}
      poster={miniaturaToShow(src, miniatura)}
      controls
      playsInline
      preload="none"
      className={className}
    />
  );
}

/**
 * Foto ou vídeo no mesmo campo — decide sozinho pela extensão do arquivo
 * (sem um campo de "tipo" separado, ver `isVideoUrl`). `fill` reproduz o
 * mesmo preenchimento de `next/image` (o pai precisa de `position: relative`).
 */
export function Media({
  src,
  alt = "",
  fill,
  width,
  height,
  sizes,
  className = "",
}: {
  src: string;
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
}) {
  if (isVideoUrl(src)) {
    return (
      <GuideVideo
        src={src}
        className={`${fill ? "absolute inset-0 h-full w-full" : ""} ${className}`}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={sizes}
      className={className}
    />
  );
}
