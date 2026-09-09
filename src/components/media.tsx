"use client";

import Image from "next/image";
import { isVideoUrl } from "@/lib/upload";

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
  priority,
  autoPlayLoop,
}: {
  src: string;
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  autoPlayLoop?: boolean;
}) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={`${fill ? "absolute inset-0 h-full w-full" : ""} ${className}`}
        {...(autoPlayLoop
          ? { autoPlay: true, muted: true, loop: true, playsInline: true }
          : { controls: true, playsInline: true, preload: "none" as const })}
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
      priority={priority}
      className={className}
    />
  );
}
