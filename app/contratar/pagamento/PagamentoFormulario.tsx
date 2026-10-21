"use client";

import { useActionState } from "react";
import { iniciarPagamento, type PagamentoState } from "./actions";
import { Turnstile } from "@/components/seguranca/Turnstile";

export function PagamentoFormulario({ referencia, metodo, turnstileSiteKey, usa3ds = false }: {
  referencia: string; metodo: "asaas_pix" | "asaas_card"; turnstileSiteKey?: string; usa3ds?: boolean;
}) {
  const [estado, acao, pendente] = useActionState<PagamentoState, FormData>(async (anterior, form) => {
    if (usa3ds && metodo === "asaas_card") form.set("deviceInfo", JSON.stringify({
      colorDepth: window.screen.colorDepth, screenHeight: window.screen.height,
      screenWidth: window.screen.width, timeZoneOffset: new Date().getTimezoneOffset() / 60,
      language: navigator.language,
    }));
    return iniciarPagamento(anterior, form);
  }, {});
  return <div className="contratar-pagamento-form">
    <h2>{metodo === "asaas_pix" ? "Pagar com Pix" : "Pagar com cartão"}</h2>
    <p>{metodo === "asaas_pix"
      ? "Gere um Pix para este pedido. Você verá o QR Code e o código para copiar nesta página."
      : "Informe somente um cartão de teste em uma conexão HTTPS de QA. Os dados são enviados ao Asaas para esta cobrança e não são persistidos pela V2G."}</p>
    {usa3ds && <p>O banco pode solicitar a autenticação do cartão. Voltar a esta página não confirma o pagamento; aguardamos a confirmação do Asaas.</p>}
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    <form action={acao} onSubmit={metodo === "asaas_card" ? e => {
      const formulario = e.currentTarget;
      setTimeout(() => formulario.reset(), 0);
    } : undefined}>
      <input type="hidden" name="ref" value={referencia} />
      {metodo === "asaas_card" && <div className="contratar-cartao-campos">
        <label>Nome no cartão<input name="holderName" autoComplete="cc-name" maxLength={120} required /></label>
        <label>CPF ou CNPJ do titular<input name="holderDocument" inputMode="numeric" autoComplete="off" required /></label>
        <label className="contratar-campo-largo">Número do cartão<input name="cardNumber" inputMode="numeric" autoComplete="cc-number" required /></label>
        <label>Mês de validade<input name="expiryMonth" inputMode="numeric" autoComplete="cc-exp-month" placeholder="MM" maxLength={2} required /></label>
        <label>Ano de validade<input name="expiryYear" inputMode="numeric" autoComplete="cc-exp-year" placeholder="AAAA" maxLength={4} required /></label>
        <label>Código de segurança<input name="ccv" inputMode="numeric" autoComplete="cc-csc" maxLength={4} required /></label>
        <label>CEP de cobrança<input name="postalCode" inputMode="numeric" autoComplete="postal-code" required /></label>
        <label>Número do endereço<input name="addressNumber" autoComplete="address-line2" maxLength={20} required /></label>
      </div>}
      {turnstileSiteKey !== undefined && <Turnstile siteKey={turnstileSiteKey} />}
      <button type="submit" disabled={pendente}>{pendente ? "Enviando…"
        : metodo === "asaas_pix" ? "Gerar Pix de teste" : "Pagar com cartão de teste"}</button>
    </form>
  </div>;
}
