const REF_BANCO_REAL = "ushccxpoxjikzqnwhgfd";

/** Um pagamento fictício no Asaas nunca pode liberar acesso no banco real. */
export function checkoutSandboxSeguro(config: {
  nodeEnv?: string;
  habilitado?: string;
  asaasAmbiente?: string;
  supabaseUrl?: string;
  qaRef?: string;
}): boolean {
  if (config.nodeEnv === "production" || config.habilitado !== "true"
      || config.asaasAmbiente !== "sandbox" || !config.qaRef
      || config.qaRef === REF_BANCO_REAL || !/^[a-z0-9]{20}$/.test(config.qaRef)) return false;
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
  });
}
