/** Configuração SINTÉTICA. Não lê arquivos/segredos nem autoriza rede. */
export function configProducao() {
  return {
    NODE_ENV:'production',VERCEL:'1',VERCEL_ENV:'production',
    VERCEL_PROJECT_ID:'prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl',
    VERCEL_PROJECT_PRODUCTION_URL:'app.v2gmidia.com.br',
    NEXT_PUBLIC_SUPABASE_URL:'https://ushccxpoxjikzqnwhgfd.supabase.co',
    NEXT_PUBLIC_SITE_URL:'https://app.v2gmidia.com.br',
    ASAAS_ENVIRONMENT:'production',ASAAS_PRODUCTION_API_KEY:'fixture-production-key',
    ASAAS_PRODUCTION_WEBHOOK_TOKEN:'production-fixture-'.repeat(3),
    ASAAS_API_KEY:'fixture-qa-key',ASAAS_WEBHOOK_TOKEN:'sandbox-fixture-'.repeat(3),
    V2G_PRODUCTION_URL_CONFIRMED:'true',
    V2G_PRODUCTION_CHECKOUT_URL:'https://app.v2gmidia.com.br/contratar',
    V2G_PRODUCTION_CHECKOUT_ENABLED:'true',V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED:'true',
    V2G_PRODUCTION_3DS_CONFIRMED:'true',
    V2G_CHECKOUT_API_ENABLED:'true',V2G_CHECKOUT_SECURITY_ENABLED:'true',
    V2G_CHECKOUT_3DS_SCHEMA_ENABLED:'true',V2G_CHECKOUT_3DS_ENABLED:'true',
    TURNSTILE_SITE_KEY:'fixture-site',TURNSTILE_SECRET_KEY:'fixture-secret',
    V2G_CHECKOUT_SECURITY_HASH_SECRET:'fixture-hash-'.repeat(4),
    V2G_TURNSTILE_ALLOWED_HOSTNAMES:'app.v2gmidia.com.br',
    V2G_PRODUCTION_PAYMENT_EMAIL_ENABLED:'true',
    V2G_PRODUCTION_PAYMENT_EMAIL_RESEND_API_KEY:'fixture-production-email-key',
    V2G_PRODUCTION_PAYMENT_EMAIL_FROM:'financeiro@example.invalid',
  };
}
