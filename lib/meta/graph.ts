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

export interface PerfilDeInstagram {
  paginaId: string;
  paginaNome: string;
  instagramId: string | null;
  instagramUsuario: string | null;
}

/**
 * As páginas do Facebook e o Instagram profissional ligado a cada uma.
 *
 * Instagram sem página vinculada não aparece aqui — é uma limitação da
 * API, não nossa. Na prática significa conta pessoal, que é justamente o
 * caso que a tela precisa tratar com um caminho humano.
 */
export async function listarPerfisDeInstagram(token: string): Promise<PerfilDeInstagram[]> {
  const dados = await chamar<{
    data?: Array<{
      id: string;
      name?: string;
      instagram_business_account?: { id: string; username?: string };
    }>;
  }>("/me/accounts?fields=id,name,instagram_business_account{id,username}&limit=100", token);

  return (dados.data ?? []).map((p) => ({
    paginaId: p.id,
    paginaNome: p.name?.trim() || p.id,
    instagramId: p.instagram_business_account?.id ?? null,
    instagramUsuario: p.instagram_business_account?.username ?? null,
  }));
}
