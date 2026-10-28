"use client";
import { useState } from "react";
import { contextoDoNegocio } from "@/lib/criativos/contexto-do-negocio";
import { OrientacaoExterna } from "@/app/(protected)/criativos/OrientacaoExterna";
import { PedidoDeImagem } from "@/app/(protected)/criativos/PedidoDeImagem";

export function Previa() {
  const [negocio, setNegocio] = useState("A"), [pedido, setPedido] = useState(false);
  const em = "2026-10-27T12:00:00Z", vazio = negocio === "Sem dados";
  const contexto = contextoDoNegocio({ id: negocio, name: vazio ? null : `Barbearia fictícia ${negocio}`,
    onboarding: vazio ? {} : { respostas: { oferta: { texto: `Corte e barba ${negocio} com agendamento`, origem: "texto", em },
      publico: { texto: `Clientes da barbearia ${negocio}`, origem: "texto", em } } } }, vazio ? null : {
    valor: negocio === "A" ? "#112233, #AABBCC" : "#334455, #DDEEFF", origem: "onboarding.marca.coresConfirmadas", registradoEm: em, estado: "confirmado_cliente",
  }, { logos: 1, fotos: 0, semTipo: 0 });
  return <main style={{ maxWidth: "760px", margin: "32px auto", padding: "20px" }}>
    <h1>Contexto do criativo · prévia local</h1>
    <p>Dados fictícios. Não consulta nem altera cadastros, não envia arquivos e não gera imagens.</p>
    <label htmlFor="negocio-previa">Negócio fictício</label>{" "}
    <select id="negocio-previa" value={negocio} onChange={e => setNegocio(e.target.value)}><option>A</option><option>B</option><option>Sem dados</option></select>{" "}
    <button type="button" className="cta ghost" onClick={() => setPedido(!pedido)}>{pedido ? "Ver orientação externa" : "Ver pedido de criação"}</button>
    {pedido ? <PedidoDeImagem key={negocio} businessId={negocio} requestId="00000000-0000-4000-8000-000000000005" hoje="2026-10-27" pedidos={[]} falhou={false} previa contexto={contexto} />
      : <OrientacaoExterna key={negocio} referenciaId="700155112131034" contexto={contexto}
        dados={{ objetivo: "Receber mensagens no WhatsApp", promocao: false, validade: null, hoje: "2026-10-27" }} />}
  </main>;
}
