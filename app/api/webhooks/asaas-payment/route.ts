import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { lerPagamentoConfirmado } from "@/lib/contratacao/pagamento-evento";

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
      && typeof payload.event === "string" && !["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(payload.event))
    return NextResponse.json({ ok: true, ignorado: true });
  const evento = lerPagamentoConfirmado(payload);
  if (!evento) return NextResponse.json({ erro: "evento_invalido" }, { status: 422 });

  const admin = createAdminClient();
  const consulta = admin.from("commercial_orders")
    .select("id, status, origin, payment_method, billing_period, total_cents, provider_customer_id, provider_charge_id, provider_subscription_id, provider_first_due_date, provider_checkout_id");
  const { data: pedido, error } = evento.assinaturaId
    ? await consulta.eq("provider_subscription_id", evento.assinaturaId).maybeSingle()
    : await consulta.eq("provider_charge_id", evento.cobrancaId).maybeSingle();
  if (error || !pedido) return NextResponse.json({ erro: "vinculo_pendente" }, { status: 503 });
  if (pedido.origin !== "self_service" || pedido.provider_checkout_id
      || pedido.provider_customer_id !== evento.clienteId
      || pedido.total_cents !== evento.totalCentavos
      || (evento.assinaturaId === null && evento.referencia !== pedido.id)
      || (evento.assinaturaId !== null && (pedido.billing_period !== "monthly"
        || pedido.payment_method !== "asaas_card" || evento.forma !== "CREDIT_CARD"
        || pedido.provider_first_due_date !== evento.vencimento))
      || (evento.assinaturaId === null && (pedido.billing_period === "monthly"
        || (pedido.payment_method === "asaas_pix" && evento.forma !== "PIX")
        || (pedido.payment_method === "asaas_card" && evento.forma !== "CREDIT_CARD"))))
    return NextResponse.json({ erro: "pedido_divergente" }, { status: 422 });
  // Esta fatia aprova a primeira compra. Renovacoes exigem ledger proprio.
  if (pedido.status === "payment_approved") return NextResponse.json({ ok: true, ja_aprovado: true });
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
