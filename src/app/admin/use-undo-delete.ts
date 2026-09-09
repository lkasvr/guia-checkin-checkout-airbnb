"use client";

import { useCallback, useRef, useState } from "react";

const UNDO_MS = 10_000;

export type UndoDeleteState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "error"; message: string };

/**
 * Exclusão com 10s de desfazer, sem fila/servidor: `run()` só é chamada de
 * verdade depois do temporizador — fechar a aba antes disso cancela a
 * exclusão (fica tudo como estava), o que é mais seguro do que o contrário
 * numa ação sem volta.
 */
export function useUndoDelete(run: () => Promise<void>) {
  const [state, setState] = useState<UndoDeleteState>({ status: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    setState({ status: "pending" });
    timer.current = setTimeout(() => {
      run().catch((e) => {
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Não foi possível excluir.",
        });
      });
    }, UNDO_MS);
  }, [run]);

  const undo = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setState({ status: "idle" });
  }, []);

  return { state, start, undo };
}
