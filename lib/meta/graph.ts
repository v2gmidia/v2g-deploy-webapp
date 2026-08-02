import "server-only";
import { FalhaMeta, META_API_VERSION } from "./oauth";

/**
 * Leitura do que o token alcança: contas de anúncio, páginas e as contas
 * de Instagram ligadas a elas.
 *
 * Só leitura. Nada aqui cria, altera ou publica coisa alguma — o escopo
 * `ads_management` está concedido mas não é exercido neste lote.
 */

const GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;

async function chamar<T>(caminho: string, token: string): Promise<T> {
  const separador = caminho.includes("?") ? "&" : "?";
  const resposta = await fetch(`${GRAPH}${caminho}${separador}access_token=${token}`, {
    cache: "no-store",
  });
  const corpo = (await resposta.json()) as Record<string, unknown>;

  if (!resposta.ok || corpo.error) {
    const erro = (corpo.error ?? {}) as Record<string, unknown>;
    throw new FalhaMeta("Leitura no Meta falhou", {
      code: typeof erro.code === "number" ? erro.code : undefined,
      subcode: typeof erro.error_subcode === "number" ? erro.error_subcode : undefined,
      type: typeof erro.type === "string" ? erro.type : undefined,
      fbtrace_id: typeof erro.fbtrace_id === "string" ? erro.fbtrace_id : undefined,
    });
  }
  return corpo as T;
}

export interface ContaDeAnuncio {
  externalId: string;
  nome: string;
  moeda: string | null;
  /** 1 = ativa. Qualquer outro valor impede anunciar. */
  statusMeta: number;
  elegivel: boolean;
  motivoInelegivel: string | null;
}

/**
 * Os status possíveis de uma conta de anúncio, em português.
 *
 * Contas inelegíveis NÃO são escondidas da lista — aparecem
 * desabilitadas com o motivo. Sumir com elas faz o cliente achar que a
 * conta dele não existe, e o suporte vira adivinhação.
 */
const MOTIVO_POR_STATUS: Record<number, string> = {
  2: "Esta conta está desativada no Facebook.",
  3: "Esta conta não pagou uma fatura pendente.",
  7: "Esta conta está em análise pelo Facebook.",
  8: "Esta conta foi encerrada.",
  9: "Esta conta está no período de carência após um problema de pagamento.",
  100: "Esta conta foi fechada permanentemente.",
  101: "Esta conta foi encerrada por violação das regras do Facebook.",
};

export async function listarContasDeAnuncio(token: string): Promise<ContaDeAnuncio[]> {
  const dados = await chamar<{
    data?: Array<{
      id: string;
      name?: string;
      account_status?: number;
      currency?: string;
    }>;
  }>("/me/adaccounts?fields=id,name,account_status,currency&limit=100", token);

  return (dados.data ?? []).map((c) => {
    const statusMeta = c.account_status ?? 0;
    const elegivel = statusMeta === 1;
    return {
      externalId: c.id,
      nome: c.name?.trim() || c.id,
      moeda: c.currency ?? null,
      statusMeta,
      elegivel,
      motivoInelegivel: elegivel
        ? null
        : (MOTIVO_POR_STATUS[statusMeta] ?? "Esta conta não está disponível para anunciar."),
    };
  });
}

/* ============================================================
   POR QUE `meta_connections.instagram_account_id` EXISTE VAZIA

   A coluna está no schema desde a migration 0005 e NUNCA é preenchida.
   Não é resíduo esquecido — é uma decisão, e esta é a nota para quem
   encontrar isso daqui a alguns meses.

   Existia aqui uma `listarPerfisDeInstagram()` que lia
   `/me/accounts?fields=...,instagram_business_account{id,username}` e
   alimentava um seletor de perfil na tela de escolha. Foi removida
   porque o Facebook rejeita a autorização inteira com
   "Invalid Scopes: instagram_basic" — o escopo não vem com o produto
   "Login do Facebook" sozinho.

   O detalhe que decidiu a remoção: sem o escopo, o Facebook NÃO devolve
   erro. Ele só omite o subcampo. A tela então concluiria "não achamos um
   Instagram profissional" para todo mundo, inclusive para quem tem um, e
   mandaria essa pessoa ao WhatsApp resolver um problema inexistente.
   Interface afirmando o que não verificou.

   PARA VOLTAR A PREENCHER A COLUNA seria preciso, nesta ordem:
     1. Painel do Meta → Adicionar produto → Instagram →
        **Instagram Graph API** (não o "Instagram Basic Display", que é
        para conteúdo pessoal e não serve para anúncios);
     2. `instagram_basic` de volta em `ESCOPOS` (lib/meta/oauth.ts);
     3. App Review + verificação de empresa para o escopo funcionar fora
        do modo desenvolvimento;
     4. restaurar esta função e o seletor no formulário de escolha.

   A conta de Instagram do cliente também precisa ser Profissional
   (Comercial ou Criador) E estar vinculada a uma Página — sem esse
   vínculo a API não devolve nada, mesmo com o escopo concedido.

   Nada disso é necessário para o v1: quem recebe o anúncio é a conta de
   anúncio, e a identidade vem pela página.

   ERRO QUE ISSO CAUSOU, para não se repetir: ao remover aquela função eu
   conferi que nada no código existente quebrava — e não quebrava mesmo.
   Só que ela era também a ÚNICA chamada a `/me/accounts`, ou seja, a
   única fonte possível do `meta_page_id`. O buraco só apareceu no lote
   seguinte, quando publicar exigiu `object_story_spec.page_id`.
   Ao remover algo, a pergunta não é só "quem chama isto hoje" — é
   "o que dependeria disto depois".
   ============================================================ */

export interface PaginaDoFacebook {
  id: string;
  nome: string;
  categoria: string | null;
}

/**
 * As Páginas que o token alcança. Usa `pages_show_list`, que está no
 * consentimento desde o início.
 *
 * Só os campos seguros: `id`, `name`, `category`. Campo inválido na
 * lista de `fields` derruba a resposta INTEIRA, e a listagem de páginas
 * é obrigatória para publicar — não pode falhar por causa de um campo
 * acessório. A verificação de WhatsApp é uma chamada separada, de
 * propósito (ver `verificarWhatsAppDaPagina`).
 */
export async function listarPaginas(token: string): Promise<PaginaDoFacebook[]> {
  const dados = await chamar<{
    data?: Array<{ id: string; name?: string; category?: string }>;
  }>("/me/accounts?fields=id,name,category&limit=100", token);

  return (dados.data ?? []).map((p) => ({
    id: p.id,
    nome: p.name?.trim() || p.id,
    categoria: p.category ?? null,
  }));
}

/**
 * `true` = tem WhatsApp ligado, `false` = não tem, `null` = não deu para
 * verificar.
 *
 * Os três estados são intencionais. O campo que reporta o número mudou
 * de nome entre versões da API, e um `false` errado mandaria o cliente
 * resolver um problema que ele não tem — o mesmo defeito que derrubou o
 * seletor de Instagram. Quando a chamada falha, a resposta honesta é
 * "não sei", e a tela diz isso em vez de inventar.
 */
export async function verificarWhatsAppDaPagina(
  token: string,
  pageId: string,
): Promise<boolean | null> {
  try {
    const dados = await chamar<{
      whatsapp_number?: string;
      connected_whatsapp_business_account?: { id?: string };
    }>(`/${pageId}?fields=whatsapp_number,connected_whatsapp_business_account`, token);

    const numero = dados.whatsapp_number?.trim();
    const waba = dados.connected_whatsapp_business_account?.id;
    return Boolean(numero || waba);
  } catch {
    // Não propaga: a escolha da página não pode ficar refém desta
    // checagem. Quem chama trata `null` como "não verificado".
    return null;
  }
}

export interface PaginaComWhatsApp extends PaginaDoFacebook {
  /** true = pronta, false = falta ligar, null = não deu para verificar */
  whatsapp: boolean | null;
}

/** Lista as páginas e verifica o WhatsApp de cada uma, em paralelo. */
export async function listarPaginasComWhatsApp(
  token: string,
): Promise<PaginaComWhatsApp[]> {
  const paginas = await listarPaginas(token);
  return Promise.all(
    paginas.map(async (p) => ({ ...p, whatsapp: await verificarWhatsAppDaPagina(token, p.id) })),
  );
}
