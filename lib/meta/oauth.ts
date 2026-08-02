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
 *
 * `instagram_basic` FOI REMOVIDO. O Facebook recusava a autorização inteira
 * com "Invalid Scopes: instagram_basic", porque o escopo exige o produto
 * Instagram Graph API adicionado no painel do app. Ele servia só para
 * listar o perfil de Instagram na tela de escolha — um dado que o v1 não
 * usa para nada: quem recebe o anúncio é a conta de anúncio, e a
 * identidade vem pela página. Ver a nota em `lib/meta/graph.ts` sobre o
 * que seria preciso para trazer de volta.
 *
 * ------------------------------------------------------------------
 * `pages_read_engagement`: MANTIDO, e a razão original CAIU.
 *
 * Ele foi pedido para ler `/{page_id}?fields=whatsapp_number,...` e
 * descobrir se a página tinha WhatsApp ligado. Aquilo não funciona — os
 * campos são superfície legada e vêm ausentes até numa página com dois
 * números. O escopo resolveu o ACESSO; o dado é que não existe. Registro
 * completo em `docs/oauth-meta.md`, seção 2.1. A função que o usava foi
 * removida, e hoje NENHUMA linha deste projeto depende deste escopo.
 *
 * Foi mantido mesmo assim, por assimetria de custo:
 *
 *   - manter e não precisar  = uma linha a mais no App Review, que ainda
 *     não foi submetido. Custo marginal ≈ zero.
 *   - remover e precisar     = segunda fila de App Review E todo cliente
 *     já conectado tendo que reautorizar, porque escopo novo exige novo
 *     consentimento. Custo alto e com cliente rodando.
 *
 * E há dependência plausível à frente: `pages_show_list` só LISTA as
 * páginas onde o usuário tem papel (e nem todas do portfólio —
 * `/{business_id}/owned_pages` devolve mais). Qualquer leitura do nó da
 * Página depois da conexão — confirmar que o `meta_page_id` guardado
 * ainda é alcançável, mostrar de qual página o anúncio sai — passa por
 * `pages_read_engagement`.
 *
 * Ou seja: a resposta a "o que dependeria disto depois" é *provavelmente
 * a pré-checagem de publicação*, e na dúvida o lado barato é manter.
 * Se o App Review negar este escopo especificamente, remova sem medo:
 * nada quebra hoje.
 * ------------------------------------------------------------------
 */
export const ESCOPOS = [
  "ads_read",
  "ads_management",
  "business_management",
  "pages_show_list",
  "pages_read_engagement",
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
