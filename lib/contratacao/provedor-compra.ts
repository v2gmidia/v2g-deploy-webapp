import "server-only";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { asaasSandbox } from "@/lib/contratacao/asaas-sandbox";
import { novasComprasProducaoSeguras, processamentoProducaoSeguro, origemCompraProducao, requisicaoProducaoSegura } from "./ambiente-producao";
import { asaasProducao } from "./asaas-producao";
import { callback3dsQa } from "./cartao-3ds";
import type { SupabaseClient } from "@supabase/supabase-js";

export function compraDisponivel() {return checkoutSandboxSeguroNesteServidor() || novasComprasProducaoSeguras();}
export function processamentoDisponivel() {return checkoutSandboxSeguroNesteServidor() || processamentoProducaoSeguro();}
export function requisicaoCompraPermitida(cabecalhos: { get(nome:string): string|null }, mutacao = false) {
  return checkoutSandboxSeguroNesteServidor() || requisicaoProducaoSegura(cabecalhos,mutacao);
}
export function provedorDaCompra(finalidade:"purchase"|"processing") {
  if (checkoutSandboxSeguroNesteServidor()) return asaasSandbox;
  return (path:string,options:Parameters<typeof asaasProducao>[1]={})=>asaasProducao(path,options,finalidade);
}
export function callback3dsCompra(referencia:string) {
  if (checkoutSandboxSeguroNesteServidor()) return callback3dsQa(referencia);
  if (!/^[0-9a-f-]{36}$/i.test(referencia)) throw Error("Referencia invalida");
  const origin=origemCompraProducao(process.env);
  if (!origin) throw Error("Ambiente indisponivel");
  return `${origin}/contratar/pagamento?ref=${referencia}`;
}
/** Missing prerequisites prevent public-mode writes and rendering. No cached positive result. */
export async function schemaCompraPronto(admin:SupabaseClient) {
  if (checkoutSandboxSeguroNesteServidor()) return true;
  if (!processamentoProducaoSeguro()) return false;
  try {const r=await admin.rpc("checkout_producao_schema_v1");return !r.error&&r.data===1;}
  catch {return false;}
}
