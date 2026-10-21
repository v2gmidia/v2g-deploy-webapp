import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { consultarEstadoPagamento } from "@/lib/contratacao/consultar-estado-pagamento";
import { origemAsaasNoServidor } from "@/lib/contratacao/origem-asaas-servidor";

export async function GET(req: NextRequest) {
  if (!checkoutSandboxSeguroNesteServidor() || process.env.V2G_CHECKOUT_API_ENABLED !== "true")
    return NextResponse.json({ erro: "indisponivel" }, { status: 503 });
  const referencia = req.nextUrl.searchParams.get("ref") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(referencia))
    return NextResponse.json({ erro: "referencia_invalida" }, { status: 400 });
  const admin = createAdminClient();
  const assistidoAtivo = process.env.V2G_ASSISTED_ASAAS_ENABLED === "true";
  const { data: pedido, error } = await admin.from("commercial_orders")
    .select("id, status, origin, payment_method, provider_charge_id").eq("external_ref", referencia).maybeSingle();
  if (error) return NextResponse.json({ erro: "consulta_falhou" }, { status: 503 });
  if (!pedido || !await origemAsaasNoServidor(admin, pedido, assistidoAtivo))
    return NextResponse.json({ erro: "nao_encontrado" }, { status: 404 });
  const status = await consultarEstadoPagamento(admin, pedido);
  // Nunca devolve IDs financeiros, contato ou payload bruto ao portador da referência.
  return NextResponse.json({ status }, {
    headers: { "Cache-Control": "no-store, private" },
  });
}
