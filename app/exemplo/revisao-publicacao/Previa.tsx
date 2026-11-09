"use client";
import { useState } from "react";
import { PreviaDaPeca } from "../../(protected)/gestor/criativos/PreviaDaPeca";
import { ConfirmarPublicacao } from "../../(protected)/gestor/criativos/ConfirmarPublicacao";
export function Previa() {
  const [falha, setFalha] = useState(false);
  return <main className="canvas"><h1>Revisão e publicação — exemplo local</h1>
    <p>Dados fictícios, imagem da V2G apenas para testar a prévia. Não acessa carteira, banco ou Meta.</p>
    <section className="auth-card"><h2>Peça de exemplo</h2><p>Peça aprovada pelo gestor</p>
      <PreviaDaPeca url="/marca.png" nome="Imagem de exemplo V2G" />
      <p><strong>Publicação:</strong> Ainda sem confirmação de publicação.</p>
      <label><input type="checkbox" checked={falha} onChange={e=>setFalha(e.target.checked)} />Simular retorno incerto</label>
      <ConfirmarPublicacao id="11111111-1111-4111-8111-111111111111" contas={['act_123']} hoje="2026-11-09"
        confirmar={async()=>{ if(falha) throw Error('simulação'); return {ok:'Exemplo: confirmação registrada. Nenhum dado real foi salvo.'}; }} />
    </section>
    <section className="auth-card"><h2>Exemplo com publicação confirmada</h2>
      <p>Peça aprovada pelo gestor</p><p>Publicação: Confirmada pelo gestor em 09/11/2026. Registro manual; não confirma entrega atual.</p>
      <p>Conta act_123 · anúncio 456 · dados fictícios.</p>
    </section>
    </main>;
}
