import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lerCheckoutEncerrado, lerCheckoutPago } from "@/lib/contratacao/checkout-evento";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";

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
  try { payload = await req.json(); } catch { return NextResponse.json({ erro: "payload_invalido" }, { status: 400 }); }
  if (payload && typeof payload === "object" && "event" in payload
      && (payload.event === "CHECKOUT_CANCELED" || payload.event === "CHECKOUT_EXPIRED")) {
    const encerrado = lerCheckoutEncerrado(payload);
    if (!encerrado) return NextResponse.json({ erro: "evento_invalido" }, { status: 422 });
    const admin = createAdminClient();
    const { data: pedido, error: erroBusca } = await admin.from("commercial_orders")
      .select("id").eq("provider_checkout_id", encerrado.checkoutId).maybeSingle();
    if (erroBusca || !pedido) return NextResponse.json({ erro: "pedido_indisponivel" }, { status: 503 });
    const { data: encerramento, error: erroEncerrar } = await admin.rpc("encerrar_checkout_self_service", {
      p_order_id: pedido.id, p_checkout_id: encerrado.checkoutId,
      p_event_id: encerrado.eventoId, p_event_type: encerrado.tipo,
    });
    if (erroEncerrar) return NextResponse.json({ erro: "gravacao_falhou" }, { status: 503 });
    return NextResponse.json({ ok: encerramento === true }, { status: encerramento === true ? 200 : 409 });
  }
  if (payload && typeof payload === "object" && "event" in payload
      && payload.event !== "CHECKOUT_PAID") return NextResponse.json({ ok: true, ignorado: true });
  const evento = lerCheckoutPago(payload);
  if (!evento) return NextResponse.json({ erro: "evento_invalido" }, { status: 422 });
  const admin = createAdminClient();
  const { data: pedido, error: erroPedido } = await admin.from("commercial_orders")
    .select("id, external_ref, status, origin, total_cents, provider_checkout_id")
    .eq("provider_checkout_id", evento.checkoutId).maybeSingle();
  if (erroPedido) return NextResponse.json({ erro: "consulta_falhou" }, { status: 503 });
  if (!pedido) return NextResponse.json({ erro: "pedido_indisponivel" }, { status: 503 });
  if (pedido.origin !== "self_service"
      || pedido.total_cents !== evento.totalCentavos
      || (evento.referencia && pedido.id !== evento.referencia))
    return NextResponse.json({ erro: "pedido_divergente" }, { status: 422 });
  const { data: aprovado, error: erroAprovacao } = await admin.rpc("aprovar_checkout_self_service", {
    p_order_id: pedido.id, p_checkout_id: evento.checkoutId,
    p_event_id: evento.eventoId, p_customer_id: evento.customerId,
  });
  if (erroAprovacao) return NextResponse.json({ erro: "gravacao_falhou" }, { status: 503 });
  if (aprovado !== true) return NextResponse.json({ erro: "estado_incompativel" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
