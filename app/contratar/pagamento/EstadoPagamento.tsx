"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ehEstadoPagamentoPublico, mensagemEstadoPagamento,
  type EstadoPagamentoPublico } from "@/lib/contratacao/estado-pagamento-publico";
import { EsperaFormulario, useEsperaFormulario } from "../../(public)/entrar/EsperaFormulario";

export function EstadoPagamento({ referencia, inicial }: { referencia: string; inicial: EstadoPagamentoPublico }) {
  const [estado, setEstado] = useState<EstadoPagamentoPublico>(inicial);
  const [falha,setFalha] = useState(false);
  const [consultando,setConsultando] = useState(false);
  const consultarAgora = useRef<()=>void>(()=>{});
  const espera = useEsperaFormulario(consultando);
  useEffect(() => {
    if (estado === "refunded" || estado === "cancelled") return;
    let vivo = true;
    let pendente = false;
    const controller = new AbortController();
    const consultar = async () => {
      if (pendente || document.visibilityState === "hidden") return;
      pendente = true;
      setConsultando(true);
      try {
        const resposta = await fetch(`/api/contratar/status?ref=${encodeURIComponent(referencia)}`, {
          cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]),
        });
        if (!resposta.ok) throw new Error("consulta indisponível");
        const corpo: unknown = await resposta.json();
        if (!corpo || typeof corpo !== "object" || !("status" in corpo)
            || !ehEstadoPagamentoPublico(corpo.status)) throw new Error("estado indisponível");
        if (vivo) setFalha(false);
        if (vivo && corpo.status !== estado) {
          setEstado(corpo.status);
          // Atualiza também QR, formulário e avisos renderizados no servidor.
          if (corpo.status !== "verification_unavailable") window.location.reload();
        }
      } catch {
        if (vivo) setFalha(true);
      } finally { pendente = false; if(vivo) setConsultando(false); }
    };
    consultarAgora.current=()=>{void consultar();};
    const timer = setInterval(()=>{void consultar();}, 5000);
    return () => { vivo = false; clearInterval(timer); controller.abort(); consultarAgora.current=()=>{}; };
  }, [estado, referencia]);
  return <>
    <p className={estado === "payment_approved" ? "form-notice" : "form-warning"} role="status">
      {falha ? "Não foi possível atualizar a situação do pedido. Não faça outro pagamento antes de conferir." : mensagemEstadoPagamento(estado)}
    </p>
    {falha && <p>Última informação recebida: {estado === "payment_approved" ? "pagamento confirmado pelo Asaas." : estado === "awaiting_payment" ? "aguardando confirmação do Asaas." : "há uma ocorrência ou conferência pendente neste pedido."}</p>}
    {!falha && estado === "payment_approved" && <>
      <p>O pagamento foi confirmado. A entrega do e-mail e a criação do seu acesso são etapas separadas.</p>
      <p><Link href="/entrar?modo=cadastro">Criar meu acesso</Link></p>
    </>}
    {!["refunded","cancelled"].includes(estado) && <div className="contratar-consulta">
      <button type="button" disabled={consultando} onClick={()=>consultarAgora.current()}>{consultando ? "Conferindo pedido…" : "Conferir pedido agora"}</button>
    </div>}
    <EsperaFormulario pendente={consultando} fase={espera.fase}
      lenta="Consultando o estado deste pedido. Isso não envia uma nova cobrança."
      longa="A consulta está demorando. Aguarde ou confira novamente quando a conexão voltar; não é preciso pagar outra vez." />
  </>;
}
