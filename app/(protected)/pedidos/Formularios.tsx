"use client";

import { useActionState } from "react";
import {
  aprovarPixAssistidoAction, criarPedidoPixAction,
  registrarComprovantePixAction, type PedidoActionState,
} from "./actions";

const inicial: PedidoActionState = {};

export function NovoPedidoPix({ referencia }: { referencia: string }) {
  const [estado, acao, pendente] = useActionState(criarPedidoPixAction, inicial);
  return <form action={acao} className="auth-card">
    <h2>Registrar venda assistida por Pix</h2>
    <p className="note">Este registro não cobra, não confirma pagamento e não envia chave Pix.</p>
    <input type="hidden" name="ref" value={referencia} />
    <label>Razão social<input name="legalName" required maxLength={200} /></label>
    <label>CNPJ<input name="cnpj" required inputMode="numeric" /></label>
    <label>E-mail da compra<input name="email" type="email" required /></label>
    <label>Contas de anúncio<input name="unitCount" type="number" min="1" max="100" defaultValue="1" required /></label>
    <label>Período<select name="billingPeriod" defaultValue="monthly">
      <option value="monthly">Mensal · R$ 500 por conta</option>
      <option value="annual_upfront">Anual à vista · R$ 5.280 por conta</option>
    </select></label>
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
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    <button type="submit" disabled={pendente}>Registrar comprovante</button>
  </form>;
}

export function AprovarPix({ orderId }: { orderId: string }) {
  const [estado, acao, pendente] = useActionState(aprovarPixAssistidoAction, inicial);
  return <form action={acao}>
    <input type="hidden" name="orderId" value={orderId} />
    <p className="note">A aprovação libera o cadastro com o e-mail da compra. Use somente após conferir o comprovante.</p>
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    <button type="submit" disabled={pendente}>Aprovar acesso pelo comprovante</button>
  </form>;
}
