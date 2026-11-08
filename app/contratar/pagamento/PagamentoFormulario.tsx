"use client";

import { useActionState, useRef, useState } from "react";
import { iniciarPagamento, type PagamentoState } from "./actions";
import { Turnstile } from "@/components/seguranca/Turnstile";
import { EsperaFormulario, useEsperaFormulario, useFocoResultado } from "../../(public)/entrar/EsperaFormulario";
import { executarComFeedback } from "../../(public)/entrar/acao-local";

export function PagamentoFormulario({ referencia, metodo, turnstileSiteKey, usa3ds = false, sandbox = true }: {
  referencia: string; metodo: "asaas_pix" | "asaas_card"; turnstileSiteKey?: string; usa3ds?: boolean; sandbox?: boolean;
}) {
  const formulario = useRef<HTMLFormElement>(null);
  const [campos, setCampos] = useState({holderName:"",holderDocument:"",expiryMonth:"",expiryYear:"",postalCode:"",addressNumber:""});
  const campo = (nome: keyof typeof campos) => ({value:campos[nome],onChange:(e:React.ChangeEvent<HTMLInputElement>)=>setCampos(atual=>({...atual,[nome]:e.target.value}))});
  const [estado, acao, pendente] = useActionState<PagamentoState, FormData>(async (anterior, form) => {
    // FormData já capturada. Limpar só PAN/CVV; nome/endereço/validade sobrevivem ao erro.
    for (const nome of ["cardNumber","ccv"]) {
      const input = formulario.current?.elements.namedItem(nome);
      if (input instanceof HTMLInputElement) input.value = "";
    }
    if (usa3ds && metodo === "asaas_card") form.set("deviceInfo", JSON.stringify({
      colorDepth: window.screen.colorDepth, screenHeight: window.screen.height,
      screenWidth: window.screen.width, timeZoneOffset: new Date().getTimezoneOffset() / 60,
      language: navigator.language,
    }));
    return executarComFeedback(()=>iniciarPagamento(anterior, form), {erro:"Não foi possível confirmar o resultado. A cobrança pode ter sido iniciada. Acompanhe este pedido antes de tentar pagar novamente."});
  }, {});
  const espera = useEsperaFormulario(pendente);
  const erro = useFocoResultado(pendente,estado.erro);
  return <div className="contratar-pagamento-form">
    <h2>{metodo === "asaas_pix" ? "Pagar com Pix" : "Pagar com cartão"}</h2>
    <p>{metodo === "asaas_pix"
      ? "Gere um Pix para este pedido. Você verá o QR Code e o código para copiar nesta página."
      : sandbox ? "Informe somente um cartão de teste em uma conexão HTTPS de QA. Os dados são enviados ao Asaas para esta cobrança e não são persistidos pela V2G."
      : "Os dados do cartão são enviados ao Asaas para esta cobrança e não são armazenados pela V2G."}</p>
    {usa3ds && <p>O banco pode solicitar a autenticação do cartão. Voltar a esta página não confirma o pagamento; aguardamos a confirmação do Asaas.</p>}
    {!pendente && estado.erro && <p ref={erro} tabIndex={-1} className="form-error" role="alert">{estado.erro}
      {metodo === "asaas_card" && " Por segurança, informe novamente o número e o código do cartão se a orientação permitir outra tentativa."}</p>}
    <form ref={formulario} action={acao} aria-busy={pendente} onSubmit={e=>{espera.permitir(e);}}>
      <input type="hidden" name="ref" value={referencia} />
      {metodo === "asaas_card" && <div className="contratar-cartao-campos">
        <label>Nome no cartão<input name="holderName" {...campo("holderName")} autoComplete="cc-name" maxLength={120} required /></label>
        <label>CPF ou CNPJ do titular<input name="holderDocument" {...campo("holderDocument")} inputMode="numeric" autoComplete="off" required /></label>
        <label className="contratar-campo-largo">Número do cartão<input name="cardNumber" inputMode="numeric" autoComplete="cc-number" required /></label>
        <label>Mês de validade<input name="expiryMonth" {...campo("expiryMonth")} inputMode="numeric" autoComplete="cc-exp-month" placeholder="MM" maxLength={2} required /></label>
        <label>Ano de validade<input name="expiryYear" {...campo("expiryYear")} inputMode="numeric" autoComplete="cc-exp-year" placeholder="AAAA" maxLength={4} required /></label>
        <label>Código de segurança<input name="ccv" inputMode="numeric" autoComplete="cc-csc" maxLength={4} required /></label>
        <label>CEP de cobrança<input name="postalCode" {...campo("postalCode")} inputMode="numeric" autoComplete="postal-code" required /></label>
        <label>Número do endereço<input name="addressNumber" {...campo("addressNumber")} autoComplete="address-line2" maxLength={20} required /></label>
      </div>}
      {turnstileSiteKey !== undefined && <Turnstile siteKey={turnstileSiteKey} />}
      <button type="submit" disabled={pendente}>{pendente ? "Enviando…"
        : metodo === "asaas_pix" ? (sandbox ? "Gerar Pix de teste" : "Gerar Pix")
        : sandbox ? "Pagar com cartão de teste" : "Pagar com cartão"}</button>
      <EsperaFormulario pendente={pendente} fase={espera.fase}
        lenta={metodo === "asaas_pix" ? "Preparando o Pix deste pedido. Aguarde o código; o pagamento ainda não foi confirmado." : "Enviando o pagamento ao Asaas. O banco pode solicitar autenticação; isso ainda não confirma a compra."}
        longa="A resposta está demorando. A cobrança pode ter sido iniciada: não envie novamente. Acompanhe este mesmo pedido antes de tentar outro pagamento." />
      {pendente && espera.fase >= 2 && <p><a href={`/contratar/pagamento?ref=${encodeURIComponent(referencia)}`}>Acompanhar este pedido</a></p>}
    </form>
  </div>;
}
