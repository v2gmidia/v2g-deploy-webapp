"use client";

import { useTransition } from "react";
import { EsperaLocal } from "@/components/ui/EsperaLocal";

export default function ErroDoInicio({ reset }: { reset: () => void }) {
  const [tentando, iniciar] = useTransition();
  return <section>
    <h1>Não conseguimos abrir seu Início</h1>
    <p role="alert">Confira sua conexão e tente novamente. Você também pode acessar outra área pelo menu.</p>
    <button className="cta" type="button" disabled={tentando} onClick={() => iniciar(reset)}>Tentar novamente</button>
    <EsperaLocal ativa={tentando} mensagem="Tentando abrir seu Início…" mensagemDemorada="A consulta continua demorando. Você pode aguardar ou abrir outra área pelo menu." />
  </section>;
}
