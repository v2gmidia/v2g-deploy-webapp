"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { EsperaLocal } from "@/components/ui/EsperaLocal";

export function AtualizarInicio() {
  const router = useRouter();
  const [atualizando, iniciar] = useTransition();
  return <div>
    <button type="button" className="botao-leve alvo-em-texto" disabled={atualizando} onClick={() => iniciar(() => router.refresh())}>Tentar novamente</button>
    <EsperaLocal ativa={atualizando} mensagem="Consultando os dados novamente…" mensagemDemorada="A consulta está demorando. O conteúdo anterior continua disponível; você pode aguardar ou abrir outra área pelo menu." />
  </div>;
}
