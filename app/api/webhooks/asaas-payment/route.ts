import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { lerPagamentoConfirmado } from "@/lib/contratacao/pagamento-evento";
import { EVENTOS_FINANCEIROS, lerEventoFinanceiro } from "@/lib/contratacao/evento-financeiro";
import { processarAssinatura3ds } from "@/lib/contratacao/processar-assinatura-3ds";
import { processarEmailPagamento } from "@/lib/contratacao/processar-email-pagamento";
import { origemAsaasNoServidor } from "@/lib/contratacao/origem-asaas-servidor";
import { asaasSandbox } from "@/lib/contratacao/asaas-sandbox";
import { confirmacaoCanonicaConfere } from "@/lib/contratacao/confirmacao-canonica";

export const runtime = "nodejs";
export const maxDuration = 120;

function tokenValido(recebido: string | null, esperado: string | undefined): boolean {
  if (!recebido || !esperado || esperado.length < 32) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!checkoutSandboxSeguroNesteServidor())
    return NextResponse.json({ erro: "indisponivel" }, { status: 503 });
  if (!tokenValido(req.headers.get("asaas-access-token"), process.env.ASAAS_WEBHOOK_TOKEN))
    return NextResponse.json({ erro: "nao_autorizado" }, { status: 401 });
  let payload: unknown;
  try { payload = await req.json(); }
  catch { return NextResponse.json({ erro: "payload_invalido" }, { status: 400 }); }
  if (payload && typeof payload === "object" && "event" in payload
      && typeof payload.event === "string" && !EVENTOS_FINANCEIROS.includes(payload.event as typeof EVENTOS_FINANCEIROS[number]))
    return NextResponse.json({ ok: true, ignorado: true });
  const financeiro = lerEventoFinanceiro(payload);
  if (!financeiro) return NextResponse.json({ erro: "evento_invalido" }, { status: 422 });
  const ehAprovacao = financeiro.tipo === "PAYMENT_CONFIRMED" || financeiro.tipo === "PAYMENT_RECEIVED";
  const evento = ehAprovacao ? lerPagamentoConfirmado(payload) : null;
  if (ehAprovacao && !evento) return NextResponse.json({ erro: "evento_invalido" }, { status: 422 });

  const admin = createAdminClient();
  const schema3ds = process.env.V2G_CHECKOUT_3DS_SCHEMA_ENABLED === "true";
  const assistidoAtivo = process.env.V2G_ASSISTED_ASAAS_ENABLED === "true";
  const consulta = admin.from("commercial_orders")
    .select("id, status, origin, payment_method, billing_period, total_cents, provider_customer_id, provider_charge_id, provider_subscription_id, provider_first_due_date, provider_checkout_id");
  const { data: pedido, error } = financeiro.assinaturaId
    ? await consulta.eq("provider_subscription_id", financeiro.assinaturaId).maybeSingle()
    : await consulta.eq("provider_charge_id", financeiro.cobrancaId).maybeSingle();
  if (error || !pedido) return NextResponse.json({ erro: "vinculo_pendente" }, { status: 503 });
  if (!await origemAsaasNoServidor(admin, pedido, assistidoAtivo))
    return NextResponse.json({ erro: "pedido_divergente" }, { status: 422 });
  const assistido = pedido.origin === "assisted";
  let fluxo3ds = false;
  if (schema3ds) {
    const fluxo = await admin.from("commercial_orders").select("provider_card_flow").eq("id", pedido.id).single();
    if (fluxo.error) return NextResponse.json({ erro: "consulta_falhou" }, { status: 503 });
    fluxo3ds = fluxo.data.provider_card_flow === "initial_3ds";
  }
  if (ehAprovacao && (assistido || fluxo3ds)) {
    try {
      const canonico = await asaasSandbox(`/payments/${encodeURIComponent(financeiro.cobrancaId)}`);
      if (!canonico.ok) return NextResponse.json({ erro: "confirmacao_pendente" }, { status: 503 });
      if (!confirmacaoCanonicaConfere(pedido.id, financeiro, canonico.body))
        return NextResponse.json({ erro: "confirmacao_divergente" }, { status: 422 });
    } catch { return NextResponse.json({ erro: "confirmacao_pendente" }, { status: 503 }); }
  }
  if (fluxo3ds && financeiro.assinaturaId === null) {
    if (financeiro.forma !== "CREDIT_CARD" || (ehAprovacao && evento?.referencia !== pedido.id))
      return NextResponse.json({ erro: "pedido_divergente" }, { status: 422 });
    const gravacao = await admin.rpc(assistido ? "registrar_evento_inicial_3ds_comercial" : "registrar_evento_inicial_3ds", {
      p_order_id: pedido.id, p_event_id: financeiro.eventoId, p_charge_id: financeiro.cobrancaId,
      p_customer_id: financeiro.clienteId, p_event_type: financeiro.tipo,
      p_amount_cents: financeiro.valorCentavos, p_due_date: financeiro.vencimento,
    });
    if (gravacao.error) return NextResponse.json({ erro: "gravacao_falhou" }, { status: 503 });
    if (gravacao.data !== true) return NextResponse.json({ erro: "evento_divergente" }, { status: 422 });
    // Notificacao do fato pago e recorrencia sao independentes. Tentar ambas
    // mesmo quando uma falhar; replay reaproveita reservas/outbox, nunca apaga pagamento.
    let emailOk = true, assinaturaOk = true;
    if (ehAprovacao) {
      try { emailOk = await processarEmailPagamento(admin, pedido.id, financeiro.cobrancaId); }
      catch { emailOk = false; }
    }
    if (financeiro.tipo === "PAYMENT_CONFIRMED") {
      try { assinaturaOk = await processarAssinatura3ds(admin, pedido.id); }
      catch { assinaturaOk = false; }
    }
    if (!assinaturaOk)
      return NextResponse.json({ erro: "assinatura_requer_conciliacao" }, { status: 503 });
    if (!emailOk)
      return NextResponse.json({ erro: "email_pendente" }, { status: 503 });
    return NextResponse.json({ ok: true });
  }
  if (pedido.provider_checkout_id
      || pedido.provider_customer_id !== financeiro.clienteId
      || pedido.total_cents !== financeiro.valorCentavos
      || (financeiro.assinaturaId !== null && (pedido.billing_period !== "monthly"
        || pedido.payment_method !== "asaas_card" || financeiro.forma !== "CREDIT_CARD"))
      || (financeiro.assinaturaId === null && (pedido.billing_period === "monthly"
        || (pedido.payment_method === "asaas_pix" && financeiro.forma !== "PIX")
        || (pedido.payment_method === "asaas_card" && financeiro.forma !== "CREDIT_CARD"))))
    return NextResponse.json({ erro: "pedido_divergente" }, { status: 422 });
  if (pedido.status === "awaiting_payment" && ehAprovacao) {
    if (!evento || (evento.assinaturaId === null && evento.referencia !== pedido.id)
        || (evento.assinaturaId !== null && pedido.provider_first_due_date !== evento.vencimento))
      return NextResponse.json({ erro: "pedido_divergente" }, { status: 422 });
    const { data: aprovado, error: erroAprovacao } = await admin.rpc(assistido ? "aprovar_pagamento_api_comercial" : "aprovar_pagamento_api_self_service", {
      p_order_id: pedido.id, p_charge_id: evento.cobrancaId,
      p_subscription_id: evento.assinaturaId, p_customer_id: evento.clienteId,
      p_event_id: evento.eventoId, p_event_type: evento.tipo,
      p_total_cents: evento.totalCentavos, p_due_date: evento.vencimento,
    });
    if (erroAprovacao) return NextResponse.json({ erro: "gravacao_falhou" }, { status: 503 });
    if (aprovado !== true) return NextResponse.json({ erro: "estado_incompativel" }, { status: 409 });
    if (!await processarEmailPagamento(admin, pedido.id, financeiro.cobrancaId))
      return NextResponse.json({ erro: "email_pendente" }, { status: 503 });
    return NextResponse.json({ ok: true });
  }
  // Renovacoes, recusas e estornos sao fatos separados da primeira compra.
  // A gravação não revoga acesso nem altera campanhas sem decisão operacional.
  const { data: registrado, error: erroRegistro } = await admin.rpc(assistido ? "registrar_evento_financeiro_comercial" : "registrar_evento_financeiro_asaas", {
    p_order_id: pedido.id, p_event_id: financeiro.eventoId,
    p_charge_id: financeiro.cobrancaId, p_subscription_id: financeiro.assinaturaId,
    p_customer_id: financeiro.clienteId, p_event_type: financeiro.tipo,
    p_amount_cents: financeiro.valorCentavos, p_due_date: financeiro.vencimento,
  });
  if (erroRegistro) return NextResponse.json({ erro: "gravacao_falhou" }, { status: 503 });
  if (registrado !== true) return NextResponse.json({ erro: "evento_divergente" }, { status: 422 });
  if (ehAprovacao && !await processarEmailPagamento(admin, pedido.id, financeiro.cobrancaId))
    return NextResponse.json({ erro: "email_pendente" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
