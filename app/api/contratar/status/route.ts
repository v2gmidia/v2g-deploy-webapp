import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";

export async function GET(req: NextRequest) {
  if (!checkoutSandboxSeguroNesteServidor() || process.env.V2G_CHECKOUT_API_ENABLED !== "true")
    return NextResponse.json({ erro: "indisponivel" }, { status: 503 });
  const referencia = req.nextUrl.searchParams.get("ref") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(referencia))
    return NextResponse.json({ erro: "referencia_invalida" }, { status: 400 });
  const admin = createAdminClient();
  const { data: pedido, error } = await admin.from("commercial_orders")
    .select("status, origin").eq("external_ref", referencia).maybeSingle();
  if (error) return NextResponse.json({ erro: "consulta_falhou" }, { status: 503 });
  if (!pedido || pedido.origin !== "self_service")
    return NextResponse.json({ erro: "nao_encontrado" }, { status: 404 });
  return NextResponse.json({ status: pedido.status }, {
    headers: { "Cache-Control": "no-store, private" },
  });
}
