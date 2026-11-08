"use client";

import { useEffect, useState } from "react";
import { EsperaLocal } from "@/components/ui/EsperaLocal";
import styles from "./CarregandoInicio.module.css";

export function CarregandoInicio() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisivel(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  return <section aria-label="Início" className={styles.raiz}>
    <EsperaLocal ativa spinner={false} mensagem="Carregando seu Início…" mensagemDemorada="A consulta do Início está demorando. Você pode aguardar ou abrir outra área pelo menu." />
    <div className={styles.estrutura} data-visivel={visivel} aria-hidden="true">
      <div className={styles.cabecalho}><span className={styles.titulo} /><span className={styles.periodo} /></div>
      <div className={styles.situacao} />
      <div className={styles.numeros}>{[0, 1, 2, 3].map((item) => <div className={styles.numero} key={item}><span /><b /></div>)}</div>
      <div className={styles.conteudo} />
    </div>
  </section>;
}
