"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import "./espera-local.css";

/** Trava no mesmo evento; os textos longos não presumem progresso do servidor. */
export function useEsperaFormulario(pendente: boolean) {
  const travado = useRef(false);
  const [fase, setFase] = useState<0 | 1 | 2>(0);
  useEffect(() => {
    if (!pendente) { travado.current = false; setFase(0); return; }
    const localizado = setTimeout(() => setFase(1), 2000);
    const demorado = setTimeout(() => setFase(2), 10000);
    return () => { clearTimeout(localizado); clearTimeout(demorado); };
  }, [pendente]);
  return {
    fase,
    permitir(evento: FormEvent<HTMLFormElement>) {
      if (travado.current || pendente) { evento.preventDefault(); return false; }
      travado.current = true;
      return true;
    },
  };
}

export function EsperaFormulario({ pendente, fase, lenta, longa }: {
  pendente: boolean; fase: number; lenta: string; longa: string;
}) {
  return <p className="espera-01-02" role="status" aria-live="polite" aria-atomic="true">
    {pendente && fase > 0 ? (fase >= 2 ? longa : lenta) : ""}
  </p>;
}

export function useFocoResultado(pendente: boolean, resultado: string | undefined) {
  const alvo = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!pendente && resultado) alvo.current?.focus({ preventScroll: false });
  }, [pendente, resultado]);
  return alvo;
}
