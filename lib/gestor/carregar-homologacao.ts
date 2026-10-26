import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lerMetricasDaCarteira, type ResultadoDaLeituraDaCarteira } from "@/lib/backend/metricas-da-carteira";
import { uuidDaLeitura } from "./contrato-metricas";
import { backendDaHomologacaoLiberado, recorteDaHomologacao } from "./homologacao-qa";

export async function carregarHomologacao() {
  const recorte = recorteDaHomologacao(process.env);
  if (!recorte) notFound();
  const cliente = await createClient();
  const { data: { user }, error } = await cliente.auth.getUser();
  if (error || !user || user.id !== recorte.operatorProfileId
    || user.app_metadata?.papel !== "operador") notFound();

  const admin = createAdminClient();
  const atribuicao = await admin.from("manager_accounts").select("business_id, operator_profile_id")
    .eq("business_id", recorte.businessId).eq("operator_profile_id", user.id).maybeSingle();
  if (atribuicao.error || atribuicao.data?.business_id !== recorte.businessId
    || atribuicao.data?.operator_profile_id !== user.id) notFound();
  const negocio = await admin.from("businesses").select("id, name, profile_id, dados_ficticios")
    .eq("id", recorte.businessId).maybeSingle();
  if (negocio.error || negocio.data?.id !== recorte.businessId
    || negocio.data?.dados_ficticios !== true || negocio.data?.name !== recorte.nome
    || !uuidDaLeitura(negocio.data?.profile_id)) notFound();

  // Só o negócio autorizado chega às consultas da fila. Erro nunca vira zero.
  const fila = await admin.from("creative_review_requests")
    .select("id, original_name, status, reviewed_at", { count: "exact" })
    .eq("business_id", recorte.businessId).order("created_at", { ascending: false }).limit(20);
  const backendLiberado = backendDaHomologacaoLiberado(process.env);
  const resultado: ResultadoDaLeituraDaCarteira = backendLiberado
    ? await lerMetricasDaCarteira(recorte)
    : { ok: false, motivo: "indisponivel", mensagem: "A leitura do backend QA ainda aguarda conferência do ambiente. Nenhum número foi consultado." };
  return {
    recorte,
    nome: negocio.data.name as string,
    fila: fila.error ? null : fila.data,
    total: fila.error ? null : fila.count,
    resultado,
  };
}
