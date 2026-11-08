"use client";

import { useEffect, useState } from "react";

/** Feedback de espera, nunca estimativa de progresso. Operações rápidas não piscam. */
export function useEsperaLocal(operacao: string | null) {
  const [espera, setEspera] = useState<{ operacao: string | null; visivel: boolean; longa: boolean }>({
    operacao: null, visivel: false, longa: false,
  });
  useEffect(() => {
    setEspera({ operacao, visivel: false, longa: false });
    if (!operacao) return;
    const curto = setTimeout(() => setEspera({ operacao, visivel: true, longa: false }), 1000);
    const longo = setTimeout(() => setEspera({ operacao, visivel: true, longa: true }), 10_000);
    return () => { clearTimeout(curto); clearTimeout(longo); };
  }, [operacao]);
  return operacao && espera.operacao === operacao ? espera : { visivel: false, longa: false };
}
