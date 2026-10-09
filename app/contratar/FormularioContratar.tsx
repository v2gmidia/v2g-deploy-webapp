"use client";

import { startTransition, useActionState, useState } from "react";
import { iniciarCompra, type CompraState } from "./actions";
import { valorDoPedidoCentavos, type PeriodoDeCobranca } from "@/lib/contratacao/preco";

const inicial: CompraState = {};

export function FormularioContratar({ referencia, apiAtiva }: { referencia: string; apiAtiva: boolean }) {
  const [estado, acao, pendente] = useActionState(iniciarCompra, inicial);
  const [periodo, setPeriodo] = useState<PeriodoDeCobranca>("monthly");
  const [metodo, setMetodo] = useState<"asaas_pix" | "asaas_card">("asaas_card");
  const [contas, setContas] = useState(1);
  const [campos, setCampos] = useState({ nome: "", email: "", whatsapp: "", razaoSocial: "",
    cnpj: "", vendeWhatsApp: "" });
  const editar = (chave: keyof typeof campos) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCampos(atual => ({ ...atual, [chave]: e.target.value }));
  const total = Number.isInteger(contas) && contas > 0
    ? valorDoPedidoCentavos(contas, periodo) / 100 : 0;
  return <section className="contratar-formulario" aria-labelledby="contratar-form-titulo">
    <h2 id="contratar-form-titulo">Comece pela sua empresa</h2>
    <p>{apiAtiva ? "Os dados abaixo identificam o pedido. No Pix, o código de pagamento aparece na próxima tela; no cartão, você informa os dados de pagamento lá."
      : "Os dados abaixo identificam o pedido. O pagamento de teste será concluído no Asaas."}</p>
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    <form onSubmit={e => {
      e.preventDefault();
      const dados = new FormData(e.currentTarget);
      startTransition(() => acao(dados));
    }}>
      <input type="hidden" name="referencia" value={referencia} />
      <div className="contratar-campos">
        <label>Nome completo<input name="nome" autoComplete="name" maxLength={120} value={campos.nome} onChange={editar("nome")} required /></label>
        <label>E-mail para acessar a conta<input name="email" type="email" autoComplete="email" value={campos.email} onChange={editar("email")} required /></label>
        <label>WhatsApp com DDD<input name="whatsapp" type="tel" autoComplete="tel" value={campos.whatsapp} onChange={editar("whatsapp")} required /></label>
        <label>Razão social<input name="razaoSocial" autoComplete="organization" maxLength={200} value={campos.razaoSocial} onChange={editar("razaoSocial")} required /></label>
        <label>CNPJ<input name="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" value={campos.cnpj} onChange={editar("cnpj")} required /></label>
      </div>
      <fieldset className="contratar-declaracoes">
        <legend>Antes de continuar</legend>
        <label>Meu negócio vende por conversa no WhatsApp
          <select name="vendeWhatsApp" value={campos.vendeWhatsApp} onChange={editar("vendeWhatsApp")} required><option value="" disabled>Selecione</option><option value="sim">Sim</option><option value="nao">Não</option></select>
        </label>
      </fieldset>
      <div className="contratar-opcoes">
        <label>Contas de anúncios
          <input name="contas" type="number" min={1} max={100} step={1} value={contas}
            onChange={e => setContas(Number(e.target.value))} required />
        </label>
        <label>Forma de contratação
          <select name="periodo" value={periodo} onChange={e => {
            const proximo = e.target.value as PeriodoDeCobranca;
            setPeriodo(proximo);
            if (proximo === "monthly") setMetodo("asaas_card");
          }}>
            <option value="monthly">Mensal — R$ 500 por conta</option>
            <option value="semiannual_upfront">Semestral à vista — R$ 2.850 por conta</option>
            <option value="annual_upfront">Anual à vista — R$ 5.280 por conta</option>
          </select>
        </label>
        <label>Pagamento
          <select name="metodo" value={metodo} onChange={e => setMetodo(e.target.value as "asaas_pix" | "asaas_card")}>
            {periodo !== "monthly" && <option value="asaas_pix">Pix à vista</option>}
            <option value="asaas_card">Cartão</option>
          </select>
        </label>
      </div>
      <p className="contratar-resumo"><strong>R$ {total.toLocaleString("pt-BR")}</strong>
        <span>{periodo === "monthly" ? " por mês · permanência mínima de 6 meses"
          : periodo === "semiannual_upfront" ? " à vista por 6 meses · 5% de desconto"
          : " à vista por 12 meses · 12% de desconto"}</span></p>
      <button type="submit" disabled={pendente}>
        {pendente ? "Preparando pagamento…" : !apiAtiva ? "Continuar para o checkout de teste"
          : metodo === "asaas_pix" ? "Gerar Pix na V2G" : "Continuar para pagar na V2G"}
      </button>
      <p className="contratar-rodape">O acesso ao WebApp depende da confirmação do pagamento pelo provedor. A campanha inicial depende também de contrato assinado e preparação com o gestor.</p>
    </form>
  </section>;
}
