const REF_BANCO_REAL = "ushccxpoxjikzqnwhgfd";
const REF_BANCO_QA = "zskpijnqgkqwxksqmzmf";
const PROJETO_VERCEL_QA = "prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn";
const HOST_QA = "v2g-webapp-qa.vercel.app";

/** Um pagamento fictício no Asaas nunca pode liberar acesso no banco real. */
export function checkoutSandboxSeguro(config: {
  nodeEnv?: string;
  habilitado?: string;
  asaasAmbiente?: string;
  supabaseUrl?: string;
  qaRef?: string;
  qaDeployEnabled?: string;
  vercelProjectId?: string;
  vercelProjectProductionUrl?: string;
  siteUrl?: string;
}): boolean {
  if (config.habilitado !== "true"
      || config.asaasAmbiente !== "sandbox" || !config.qaRef
      || config.qaRef === REF_BANCO_REAL || !/^[a-z0-9]{20}$/.test(config.qaRef)) return false;
  if (config.nodeEnv === "production" && (
    config.qaDeployEnabled !== "true"
    || config.qaRef !== REF_BANCO_QA
    || config.vercelProjectId !== PROJETO_VERCEL_QA
    || config.vercelProjectProductionUrl !== HOST_QA
    || config.siteUrl !== `https://${HOST_QA}`
  )) return false;
  try {
    const url = new URL(config.supabaseUrl ?? "");
    return url.protocol === "https:" && url.hostname === `${config.qaRef}.supabase.co`;
  } catch { return false; }
}

export function checkoutSandboxSeguroNesteServidor(): boolean {
  return checkoutSandboxSeguro({
    nodeEnv: process.env.NODE_ENV,
    habilitado: process.env.V2G_CHECKOUT_ENABLED,
    asaasAmbiente: process.env.ASAAS_ENVIRONMENT,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    qaRef: process.env.V2G_CHECKOUT_SANDBOX_DB_REF,
    qaDeployEnabled: process.env.V2G_CHECKOUT_QA_DEPLOY_ENABLED,
    vercelProjectId: process.env.VERCEL_PROJECT_ID,
    vercelProjectProductionUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  });
}
