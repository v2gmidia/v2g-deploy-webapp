"use client";

import { useEffect, useState } from "react";

export const ATRASO_INDICADOR_MS = 600;
export const LIMIAR_OPERACAO_DEMORADA_MS = 8_000;

export type EstadoVisualDaOperacao = "oculto" | "visivel" | "demorado";

export function estadoVisualDaOperacao(
  ativa: boolean,
  duracaoMs: number,
): EstadoVisualDaOperacao {
  if (!ativa || duracaoMs < ATRASO_INDICADOR_MS) return "oculto";
  return duracaoMs >= LIMIAR_OPERACAO_DEMORADA_MS ? "demorado" : "visivel";
}

/** Evita piscar feedback em respostas rápidas e explica esperas prolongadas. */
export function useTempoDaOperacao(ativa: boolean) {
  const [estado, setEstado] = useState<EstadoVisualDaOperacao>("oculto");

  useEffect(() => {
    if (!ativa) {
      setEstado("oculto");
      return;
    }
    const mostrar = window.setTimeout(
      () => setEstado("visivel"),
      ATRASO_INDICADOR_MS,
    );
    const demorar = window.setTimeout(
      () => setEstado("demorado"),
      LIMIAR_OPERACAO_DEMORADA_MS,
    );
    return () => {
      window.clearTimeout(mostrar);
      window.clearTimeout(demorar);
    };
  }, [ativa]);

  return {
    visivel: ativa && estado !== "oculto",
    demorada: ativa && estado === "demorado",
  };
}
