import { dataDaLeitura, uuidDaLeitura } from "./contrato-metricas";

/** Não lê Host, cookies ou parâmetros enviados pelo navegador. */
export function recorteDaHomologacao(env: Record<string, string | undefined>) {
  if (env.V2G_QA_MANAGER_METRICS_REHEARSAL_ENABLED !== "true"
    || env.V2G_MANAGER_WORK_ENABLED !== "true"
    || env.V2G_MANAGER_METRICS_READ_ENABLED !== "true"
    || env.VERCEL_PROJECT_ID !== "prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn"
    || env.VERCEL_PROJECT_PRODUCTION_URL !== "v2g-webapp-qa.vercel.app"
    || env.NEXT_PUBLIC_SITE_URL !== "https://v2g-webapp-qa.vercel.app"
    || env.NEXT_PUBLIC_SUPABASE_URL !== "https://zskpijnqgkqwxksqmzmf.supabase.co") return null;
  const businessId = env.V2G_QA_MANAGER_BUSINESS_ID;
  const operatorProfileId = env.V2G_QA_MANAGER_OPERATOR_PROFILE_ID;
  const desde = env.V2G_QA_MANAGER_DESDE;
  const ate = env.V2G_QA_MANAGER_ATE;
  const nome = env.V2G_QA_MANAGER_BUSINESS_NAME;
  if (!uuidDaLeitura(businessId) || !uuidDaLeitura(operatorProfileId)
    || !dataDaLeitura(desde) || !dataDaLeitura(ate) || desde > ate
    || !nome?.trim() || nome !== nome.trim() || nome.length > 200) return null;
  return { businessId, operatorProfileId, desde, ate, nome };
}

/** URL observada no checkpoint 07/08; disponibilidade não é presumida.
 * A aprovação do runtime de leitura é configuração separada, default OFF. */
export function backendDaHomologacaoLiberado(env: Record<string, string | undefined>) {
  return env.V2G_QA_MANAGER_BACKEND_READ_VERIFIED === "true"
    && env.V2G_BACKEND_URL === "https://ia-backend-qa.5hue9s.easypanel.host";
}
