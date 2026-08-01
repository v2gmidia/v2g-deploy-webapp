import "server-only";

/**
 * Troca de código por token no Meta.
 *
 * `import "server-only"` no topo é o que faz o build quebrar se este
 * arquivo for puxado, direta ou indiretamente, para um bundle de
 * navegador — e o App Secret vive aqui dentro. É a mesma proteção do
 * `lib/supabase/admin.ts`.
 *
 * NADA neste arquivo escreve na conta de anúncio do cliente. Ele só
 * troca códigos por tokens e pergunta ao Meta o que o token alcança.
 */

export const META_API_VERSION = "v25.0";
const GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Os escopos pedidos no consentimento.
 *
 * `ads_management` é pedido aqui e NÃO é usado neste lote — nenhuma linha
 * de código cria ou altera campanha. Está na lista porque o segundo
 * consentimento cairia no pior momento do funil (o cliente esperando o
 * anúncio subir), e porque ele e `ads_read` passam pelo mesmo App Review:
 * pedir separado significa enfrentar a fila do Meta duas vezes, com risco
 * de o segundo pedido ser negado com cliente já rodando.
 * Ver docs/oauth-meta.md §2.
 */
export const ESCOPOS = [
  "ads_read",
  "ads_management",
  "business_management",
  "pages_show_list",
  "instagram_basic",
] as const;

export function credenciaisMeta(): { appId: string; appSecret: string } {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("Faltam META_APP_ID ou META_APP_SECRET no ambiente.");
  }
  return { appId, appSecret };
}

export function urlDeRedirect(): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) throw new Error("Falta NEXT_PUBLIC_SITE_URL no ambiente.");
  // Sem barra no fim, e idêntico ao registrado no painel do Meta —
  // qualquer diferença de caractere vira `redirect_uri_mismatch`.
  return `${base.replace(/\/+$/, "")}/auth/meta/callback`;
}

export function urlDeConsentimento(state: string): string {
  const { appId } = credenciaisMeta();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: urlDeRedirect(),
    state,
    scope: ESCOPOS.join(","),
    response_type: "code",
  });
  return `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params}`;
}

export interface ErroMeta {
  code?: number;
  subcode?: number;
  type?: string;
  fbtrace_id?: string;
}

export class FalhaMeta extends Error {
  readonly detalhe: ErroMeta;
  constructor(mensagem: string, detalhe: ErroMeta = {}) {
    super(mensagem);
    this.name = "FalhaMeta";
    this.detalhe = detalhe;
  }
}

/**
 * Chama a Graph API e normaliza o erro.
 *
 * O corpo da resposta NUNCA entra na mensagem de erro: em várias rotas
 * ele contém o próprio token. O que sobrevive é `code`, `error_subcode`,
 * `type` e `fbtrace_id` — o suficiente para diagnosticar e para abrir
 * chamado no Meta, e nada que sirva para alguém se autenticar.
 */
async function chamar<T>(url: string): Promise<T> {
  const resposta = await fetch(url, { cache: "no-store" });
  const corpo = (await resposta.json()) as Record<string, unknown>;

  if (!resposta.ok || corpo.error) {
    const erro = (corpo.error ?? {}) as Record<string, unknown>;
    throw new FalhaMeta("Chamada ao Meta falhou", {
      code: typeof erro.code === "number" ? erro.code : undefined,
      subcode: typeof erro.error_subcode === "number" ? erro.error_subcode : undefined,
      type: typeof erro.type === "string" ? erro.type : undefined,
      fbtrace_id: typeof erro.fbtrace_id === "string" ? erro.fbtrace_id : undefined,
    });
  }

  return corpo as T;
}

/** Passo 1: o `code` do callback vira um token de curta duração (horas). */
async function tokenCurto(code: string): Promise<string> {
  const { appId, appSecret } = credenciaisMeta();
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: urlDeRedirect(),
    code,
  });
  const dados = await chamar<{ access_token: string }>(
    `${GRAPH}/oauth/access_token?${params}`,
  );
  return dados.access_token;
}

/**
 * Passo 2: o curto vira o de longa duração (~60 dias).
 * Guardar o curto seria inútil — some em algumas horas.
 */
async function tokenLongo(curto: string): Promise<string> {
  const { appId, appSecret } = credenciaisMeta();
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: curto,
  });
  const dados = await chamar<{ access_token: string }>(
    `${GRAPH}/oauth/access_token?${params}`,
  );
  return dados.access_token;
}

export interface DadosDoToken {
  token: string;
  expiraEm: Date | null;
  metaUserId: string;
  escopos: string[];
}

/**
 * Passo 3: pergunta ao próprio Meta o que o token é.
 *
 * `debug_token` exige um app access token (`<id>|<secret>`), e é por isso
 * que este passo só pode existir no servidor. Devolve quando expira, quem
 * autorizou e — importante — quais escopos foram DE FATO concedidos: o
 * usuário pode desmarcar permissões na tela de consentimento, e o que
 * pedimos nem sempre é o que recebemos.
 */
async function inspecionar(token: string): Promise<Omit<DadosDoToken, "token">> {
  const { appId, appSecret } = credenciaisMeta();
  const params = new URLSearchParams({
    input_token: token,
    access_token: `${appId}|${appSecret}`,
  });
  const dados = await chamar<{
    data: { expires_at?: number; user_id?: string; scopes?: string[] };
  }>(`https://graph.facebook.com/debug_token?${params}`);

  const d = dados.data ?? {};
  return {
    // expires_at = 0 significa "não expira" (raro, mas existe).
    expiraEm: d.expires_at ? new Date(d.expires_at * 1000) : null,
    metaUserId: d.user_id ?? "",
    escopos: d.scopes ?? [],
  };
}

/** Os três passos, na ordem, a partir do `code` do callback. */
export async function trocarCodePorToken(code: string): Promise<DadosDoToken> {
  const curto = await tokenCurto(code);
  const longo = await tokenLongo(curto);
  const info = await inspecionar(longo);
  return { token: longo, ...info };
}
