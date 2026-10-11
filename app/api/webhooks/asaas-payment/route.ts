import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { lerPagamentoConfirmado } from "@/lib/contratacao/pagamento-evento";
import { EVENTOS_FINANCEIROS, lerEventoFinanceiro } from "@/lib/contratacao/evento-financeiro";

export const runtime = "nodejs";

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
  const consulta = admin.from("commercial_orders")
    .select("id, status, origin, payment_method, billing_period, total_cents, provider_customer_id, provider_charge_id, provider_subscription_id, provider_first_due_date, provider_checkout_id");
  const { data: pedido, error } = financeiro.assinaturaId
    ? await consulta.eq("provider_subscription_id", financeiro.assinaturaId).maybeSingle()
    : await consulta.eq("provider_charge_id", financeiro.cobrancaId).maybeSingle();
  if (error || !pedido) return NextResponse.json({ erro: "vinculo_pendente" }, { status: 503 });
  if (pedido.origin !== "self_service" || pedido.provider_checkout_id
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
    const { data: aprovado, error: erroAprovacao } = await admin.rpc("aprovar_pagamento_api_self_service", {
      p_order_id: pedido.id, p_charge_id: evento.cobrancaId,
      p_subscription_id: evento.assinaturaId, p_customer_id: evento.clienteId,
      p_event_id: evento.eventoId, p_event_type: evento.tipo,
      p_total_cents: evento.totalCentavos, p_due_date: evento.vencimento,
    });
    if (erroAprovacao) return NextResponse.json({ erro: "gravacao_falhou" }, { status: 503 });
    if (aprovado !== true) return NextResponse.json({ erro: "estado_incompativel" }, { status: 409 });
    return NextResponse.json({ ok: true });
  }
  // Renovacoes, recusas e estornos sao fatos separados da primeira compra.
  // A gravação não revoga acesso nem altera campanhas sem decisão operacional.
  const { data: registrado, error: erroRegistro } = await admin.rpc("registrar_evento_financeiro_asaas", {
    p_order_id: pedido.id, p_event_id: financeiro.eventoId,
    p_charge_id: financeiro.cobrancaId, p_subscription_id: financeiro.assinaturaId,
    p_customer_id: financeiro.clienteId, p_event_type: financeiro.tipo,
    p_amount_cents: financeiro.valorCentavos, p_due_date: financeiro.vencimento,
  });
  if (erroRegistro) return NextResponse.json({ erro: "gravacao_falhou" }, { status: 503 });
  if (registrado !== true) return NextResponse.json({ erro: "evento_divergente" }, { status: 422 });
  return NextResponse.json({ ok: true });
}
