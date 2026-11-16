"use client";

import { useEffect, useState } from "react";
import { listSectionLibrary } from "@/app/admin/actions";
import type { SectionLibrary } from "@/data/sectionLibrary";

const EMPTY: SectionLibrary = { amenities: [], dining: [], tourism: [] };

/** Itens de Lazer, Onde Comer e Guia de Brasília já cadastrados em qualquer prédio/apartamento (ver `sectionLibrary.ts`). */
export function useSectionLibrary(): SectionLibrary {
  const [library, setLibrary] = useState<SectionLibrary>(EMPTY);
  useEffect(() => {
    let cancelled = false;
    listSectionLibrary()
      .then((l) => {
        if (!cancelled) setLibrary(l);
      })
      .catch(() => {
        if (!cancelled) setLibrary(EMPTY);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return library;
}
