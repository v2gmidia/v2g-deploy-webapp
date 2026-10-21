"use client";

import { useActionState, useState } from "react";
import {
  aprovarPixAssistidoAction, criarPedidoPixAction, criarPedidoAsaasAction,
  registrarComprovantePixAction, type PedidoActionState,
} from "./actions";

const inicial: PedidoActionState = {};

export function NovoPedidoPix({ referencia, vinculoLeadAtivo = false, asaasAtivo = false }: {
  referencia: string;
  vinculoLeadAtivo?: boolean;
  asaasAtivo?: boolean;
}) {
  const [estado, acao, pendente] = useActionState(asaasAtivo ? criarPedidoAsaasAction : criarPedidoPixAction, inicial);
  const [origem, definirOrigem] = useState("");
  return <form action={acao} className="auth-card">
    <h2>{asaasAtivo ? "Registrar venda assistida pelo Asaas · QA" : "Registrar venda assistida por Pix"}</h2>
    <p className="note">{asaasAtivo ? "Registre o pedido e depois abra o link de teste para o comprador. Não cria cobrança, não envia mensagem e não confirma pagamento." : "Este registro não cobra, não confirma pagamento e não envia chave Pix."}</p>
    <input type="hidden" name="ref" value={referencia} />
    {(vinculoLeadAtivo || asaasAtivo) && <label>Origem desta venda
      <select name="vinculoLead" value={origem} required onChange={(event) => definirOrigem(event.target.value)}>
        <option value="">Selecione a origem</option>
        {vinculoLeadAtivo && <option value="v2g_site">Pré-cadastro da LP</option>}
        <option value="atendimento_direto">Atendimento direto, sem pré-cadastro da LP</option>
      </select>
    </label>}
    {vinculoLeadAtivo && origem === "v2g_site" && <>
      <label>ID do lead da LP
        <input name="sourceLeadId" type="number" min="1" step="1" required inputMode="numeric" />
      </label>
      <p className="note">O servidor só cria o pedido se este ID existir e CNPJ, e-mail e WhatsApp coincidirem exatamente com o pré-cadastro.</p>
    </>}
    <label>Razão social<input name="legalName" required maxLength={200} /></label>
    <label>CNPJ<input name="cnpj" required inputMode="numeric" maxLength={18} /></label>
    <label>E-mail da compra<input name="email" type="email" required maxLength={254} /></label>
    {asaasAtivo && <label>Nome completo do comprador<input name="buyerName" required maxLength={120} /></label>}
    {(asaasAtivo || (vinculoLeadAtivo && origem === "v2g_site")) && <label>{origem === "v2g_site" ? "WhatsApp do pré-cadastro" : "WhatsApp do comprador"}
      <input name="whatsapp" required inputMode="tel" maxLength={30} />
    </label>}
    <label>Contas de anúncio<input name="unitCount" type="number" min="1" max="100" defaultValue="1" required /></label>
    <label>Período<select name="billingPeriod" defaultValue="monthly">
      <option value="monthly">Mensal · R$ 500 por conta</option>
      {asaasAtivo && <option value="semiannual_upfront">Semestral à vista · R$ 2.850 por conta</option>}
      <option value="annual_upfront">Anual à vista · R$ 5.280 por conta</option>
    </select></label>
    {asaasAtivo && <label>Pagamento<select name="paymentMethod" defaultValue="asaas_card">
      <option value="asaas_card">Cartão pelo Asaas</option>
      <option value="asaas_pix">Pix pelo Asaas · somente plano à vista</option>
    </select></label>}
    <label><input type="checkbox" name="declaresCnpj" value="yes" required /> O comprador declarou que tem CNPJ.</label>
    <label><input type="checkbox" name="sellsByWhatsApp" value="yes" required /> O comprador declarou que vende pelo WhatsApp.</label>
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    <button className="cta" type="submit" disabled={pendente}>Registrar pedido pendente</button>
  </form>;
}

export function ComprovantePix({ orderId }: { orderId: string }) {
  const [estado, acao, pendente] = useActionState(registrarComprovantePixAction, inicial);
  return <form action={acao}>
    <input type="hidden" name="orderId" value={orderId} />
    <label>Referência do comprovante recebido
      <input name="reference" required minLength={3} maxLength={300}
        placeholder="Ex.: mensagem e data no atendimento" />
    </label>
    <p className="note">Registre onde localizar o comprovante e a conciliação bancária. Receber uma imagem não comprova o crédito e não libera acesso.</p>
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    <button type="submit" disabled={pendente}>Registrar comprovante</button>
  </form>;
}

export function AprovarPix({ orderId }: { orderId: string }) {
  const [estado, acao, pendente] = useActionState(aprovarPixAssistidoAction, inicial);
  return <form action={acao}>
    <input type="hidden" name="orderId" value={orderId} />
    <p className="note">A aprovação libera o primeiro acesso com o e-mail da compra. Ela não assina contrato, emite nota ou publica anúncio.</p>
    <label><input type="checkbox" name="pagamentoConferido" value="yes" required /> Conferi o crédito efetivo na conta recebedora, o valor, a identificação da transferência e o pedido correto. A evidência está localizável pela referência do comprovante.</label>
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    <button type="submit" disabled={pendente}>Confirmar pagamento e liberar primeiro acesso</button>
  </form>;
}
