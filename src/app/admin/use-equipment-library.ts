"use client";

import { useEffect, useState } from "react";
import { listEquipmentLibrary } from "@/app/admin/actions";
import type { EquipmentModel } from "@/data/equipmentLibrary";

/** Equipamentos já cadastrados em qualquer prédio/apartamento (ver `equipmentLibrary.ts`). */
export function useEquipmentLibrary(): EquipmentModel[] {
  const [library, setLibrary] = useState<EquipmentModel[]>([]);
  useEffect(() => {
    let cancelled = false;
    listEquipmentLibrary()
      .then((l) => {
        if (!cancelled) setLibrary(l);
      })
      .catch(() => {
        if (!cancelled) setLibrary([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return library;
}
