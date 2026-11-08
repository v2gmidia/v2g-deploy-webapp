"use client";

import { useEffect, useState } from "react";
import styles from "./EsperaLocal.module.css";

/** Apresentação somente. A operação, o bloqueio de duplicação e o retry pertencem ao chamador. */
export function EsperaLocal({ ativa, mensagem, mensagemDemorada, spinner = true }: {
  ativa: boolean;
  mensagem: string;
  mensagemDemorada: string;
  spinner?: boolean;
}) {
  // Desmontar o relógio ao terminar impede que o aviso longo vaze para outra operação.
  return <div role="status" aria-live="polite" aria-atomic="true">
    {ativa && <RelogioDaEspera mensagem={mensagem} mensagemDemorada={mensagemDemorada} spinner={spinner} />}
  </div>;
}

function RelogioDaEspera({ mensagem, mensagemDemorada, spinner }: { mensagem: string; mensagemDemorada: string; spinner: boolean }) {
  const [fase, setFase] = useState<"silenciosa" | "espera" | "demorada">("silenciosa");
  useEffect(() => {
    const mostrar = setTimeout(() => setFase("espera"), 1000);
    const explicar = setTimeout(() => setFase("demorada"), 10000);
    return () => { clearTimeout(mostrar); clearTimeout(explicar); };
  }, []);
  if (fase === "silenciosa") return null;
  return <p className={styles.espera}>
    {spinner && fase === "espera" && <span className={styles.spinner} aria-hidden="true" />}
    <span>{fase === "demorada" ? mensagemDemorada : mensagem}</span>
  </p>;
}
