import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obter } from "./cliente";
import { dataDaLeitura, lerPorExecucaoDaCarteira, uuidDaLeitura, VERSAO_DO_ADAPTADOR,
  type LeituraDaCampanha } from "@/lib/gestor/contrato-metricas";

type Motivo = "acesso_negado" | "dados_invalidos" | "indisponivel" | "nao_encontrado" | "conflito" | "resposta_invalida";
export type ResultadoDaLeituraDaCarteira =
  | { ok: true; versao: string; businessId: string; campanhas: LeituraDaCampanha[] }
  | { ok: false; motivo: Motivo; mensagem: string };
const MENSAGENS: Record<Motivo, string> = {
  acesso_negado: "Não foi possível autorizar a leitura desta conta.",
  dados_invalidos: "Confira a conta e o período informado.",
  indisponivel: "Não foi possível consultar os números agora. Tente novamente mais tarde.",
  nao_encontrado: "Não há um recorte autorizado disponível para esta consulta.",
  conflito: "Os vínculos desta conta precisam de conferência antes de continuar.",
  resposta_invalida: "Os números recebidos não puderam ser conferidos. Não use esta leitura para decidir.",
};
const negar = (motivo: Motivo): ResultadoDaLeituraDaCarteira => ({ ok: false, motivo, mensagem: MENSAGENS[motivo] });

/**
 * Porta usada pelo consumidor mínimo, desligado por padrão. Autentica e confere
 * atribuição exata ANTES do backend. O dono é lido no banco, não no formulário.
 * Agências continuam negadas até haver contrato persistido de autorização.
 */
export async function lerMetricasDaCarteira(args: { businessId: string; desde: string; ate: string }): Promise<ResultadoDaLeituraDaCarteira> {
  if (!uuidDaLeitura(args.businessId) || !dataDaLeitura(args.desde) || !dataDaLeitura(args.ate) || args.desde > args.ate)
    return negar("dados_invalidos");
  try {
    const cliente = await createClient();
    const sessao = await cliente.auth.getUser();
    const user = sessao.data.user;
    if (sessao.error || !user || user.app_metadata?.papel !== "operador") return negar("acesso_negado");
    const admin = createAdminClient();
    const atribuicao = await admin.from("manager_accounts").select("business_id, operator_profile_id")
      .eq("business_id", args.businessId).eq("operator_profile_id", user.id).maybeSingle();
    if (atribuicao.error) return negar("indisponivel");
    if (atribuicao.data?.business_id !== args.businessId || atribuicao.data?.operator_profile_id !== user.id)
      return negar("acesso_negado");
    const negocio = await admin.from("businesses").select("id, profile_id").eq("id", args.businessId).maybeSingle();
    if (negocio.error) return negar("indisponivel");
    if (negocio.data?.id !== args.businessId || !uuidDaLeitura(negocio.data?.profile_id)) return negar("acesso_negado");
    const resposta = await obter(`/negocios/${encodeURIComponent(args.businessId)}/consolidado`, {
      contexto: "metricas-da-carteira", timeoutMs: 5_000,
      params: { profile_id: negocio.data.profile_id, desde: args.desde, ate: args.ate },
    });
    if (!resposta.ok) return negar(resposta.categoria === "nao_encontrado" ? "nao_encontrado"
      : resposta.categoria === "conflito" ? "conflito" : resposta.categoria === "nao_autorizado" ? "acesso_negado" : "indisponivel");
    const campanhas = lerPorExecucaoDaCarteira(resposta.dados, args);
    if (!campanhas) return negar("resposta_invalida");
    return { ok: true, versao: VERSAO_DO_ADAPTADOR, businessId: args.businessId, campanhas };
  } catch { return negar("indisponivel"); }
}
