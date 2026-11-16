"use client";

import { useEffect, useState } from "react";
import { listSectionLibrary } from "@/app/admin/actions";
import type { SectionLibrary } from "@/data/sectionLibrary";

const EMPTY: SectionLibrary = { amenities: [], dining: [] };

/** Itens de Lazer e Onde Comer já cadastrados em qualquer prédio/apartamento (ver `sectionLibrary.ts`). */
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
