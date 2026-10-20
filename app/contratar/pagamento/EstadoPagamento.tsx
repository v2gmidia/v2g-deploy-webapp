"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ehEstadoPagamentoPublico, mensagemEstadoPagamento,
  type EstadoPagamentoPublico } from "@/lib/contratacao/estado-pagamento-publico";

export function EstadoPagamento({ referencia, inicial }: { referencia: string; inicial: EstadoPagamentoPublico }) {
  const [estado, setEstado] = useState<EstadoPagamentoPublico>(inicial);
  useEffect(() => {
    if (estado === "refunded" || estado === "cancelled") return;
    let vivo = true;
    let pendente = false;
    const controller = new AbortController();
    const timer = setInterval(async () => {
      if (pendente || document.visibilityState === "hidden") return;
      pendente = true;
      try {
        const resposta = await fetch(`/api/contratar/status?ref=${encodeURIComponent(referencia)}`, {
          cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
        });
        if (!resposta.ok) throw new Error("consulta indisponível");
        const corpo: unknown = await resposta.json();
        if (!corpo || typeof corpo !== "object" || !("status" in corpo)
            || !ehEstadoPagamentoPublico(corpo.status)) throw new Error("estado indisponível");
        if (vivo && corpo.status !== estado) {
          setEstado(corpo.status);
          // Atualiza também QR, formulário e avisos renderizados no servidor.
          if (corpo.status !== "verification_unavailable") window.location.reload();
        }
      } catch {
        if (vivo) setEstado("verification_unavailable");
      } finally { pendente = false; }
    }, 5000);
    return () => { vivo = false; clearInterval(timer); controller.abort(); };
  }, [estado, referencia]);
  return <>
    <p className={estado === "payment_approved" ? "form-notice" : "form-warning"} role="status">
      {mensagemEstadoPagamento(estado)}
    </p>
    {estado === "payment_approved" && <p><Link href="/entrar?modo=cadastro">Criar meu acesso</Link></p>}
  </>;
}
