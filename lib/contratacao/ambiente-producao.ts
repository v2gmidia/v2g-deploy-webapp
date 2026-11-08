/** Domínio decidido por Victor em 06/11. Não habilita nenhuma flag por padrão. */
export const URL_COMPRA_PRODUCAO = "https://app.v2gmidia.com.br/contratar";
const HOST_PRODUCAO = "app.v2gmidia.com.br";
type Config = Record<string,string|undefined>;
const PROJETO = "prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl";
const BANCO = "ushccxpoxjikzqnwhgfd";

export function origemCompraProducao(c:Config): string | null {
  if (c.NODE_ENV!=="production" || c.VERCEL!=="1" || c.VERCEL_ENV!=="production"
    || c.VERCEL_PROJECT_ID!==PROJETO || c.ASAAS_ENVIRONMENT!=="production"
    || c.V2G_PRODUCTION_URL_CONFIRMED!=="true"
    || c.V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED!=="true"
    || c.NEXT_PUBLIC_SUPABASE_URL!==`https://${BANCO}.supabase.co`
    || !c.ASAAS_PRODUCTION_API_KEY || !c.ASAAS_PRODUCTION_WEBHOOK_TOKEN
    || c.ASAAS_PRODUCTION_WEBHOOK_TOKEN.length<32
    || c.ASAAS_PRODUCTION_API_KEY===c.ASAAS_API_KEY
    || c.ASAAS_PRODUCTION_WEBHOOK_TOKEN===c.ASAAS_WEBHOOK_TOKEN) return null;
  try {
    const url = new URL(c.V2G_PRODUCTION_CHECKOUT_URL??"");
    if (url.protocol!=="https:" || url.username || url.password || url.port || url.search || url.hash
      || url.pathname!=="/contratar" || url.origin!==c.NEXT_PUBLIC_SITE_URL
      || url.hostname!==HOST_PRODUCAO
      // A Vercel informa o menor domínio próprio produtivo (também em preview).
      // Nunca usar esta variável isoladamente como prova do ambiente/requisição.
      || c.VERCEL_PROJECT_PRODUCTION_URL!==url.hostname) return null;
    return url.origin;
  } catch { return null; }
}
export function processamentoProducaoSeguro(c:Config = process.env): boolean {
  return origemCompraProducao(c)!==null;
}
export function novasComprasProducaoSeguras(c:Config = process.env): boolean {
  const hosts = (c.V2G_TURNSTILE_ALLOWED_HOSTNAMES??"").split(",").map(s=>s.trim()).filter(Boolean);
  return processamentoProducaoSeguro(c) && c.V2G_PRODUCTION_CHECKOUT_ENABLED==="true"
    && c.V2G_CHECKOUT_API_ENABLED==="true" && c.V2G_CHECKOUT_SECURITY_ENABLED==="true"
    && c.V2G_CHECKOUT_3DS_SCHEMA_ENABLED==="true" && c.V2G_CHECKOUT_3DS_ENABLED==="true"
    && c.V2G_PRODUCTION_3DS_CONFIRMED==="true"
    && !!c.TURNSTILE_SITE_KEY && !!c.TURNSTILE_SECRET_KEY && (c.V2G_CHECKOUT_SECURITY_HASH_SECRET?.length??0)>=32
    && hosts.length>0 && hosts.every(host=>host===HOST_PRODUCAO)
    && c.V2G_PRODUCTION_PAYMENT_EMAIL_ENABLED==="true"
    && !!c.V2G_PRODUCTION_PAYMENT_EMAIL_RESEND_API_KEY
    && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(c.V2G_PRODUCTION_PAYMENT_EMAIL_FROM??"");
}

/** A configuração do projeto não prova qual alias recebeu a requisição.
 * Host/protocolo vêm da requisição HTTPS na Vercel; mutações exigem a origem
 * do aplicativo. Não aceitar origem da LP, alias Vercel ou x-forwarded-host.
 */
export function requisicaoProducaoSegura(cabecalhos: { get(nome:string): string|null },
  mutacao = false, c:Config = process.env): boolean {
  const origem = origemCompraProducao(c);
  if (!origem || cabecalhos.get("host")!==HOST_PRODUCAO
    || cabecalhos.get("x-forwarded-proto")!=="https") return false;
  const recebida = cabecalhos.get("origin");
  return recebida===origem || (!mutacao && recebida===null);
}
