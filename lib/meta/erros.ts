import "server-only";
import { FalhaMeta, type ErroMeta } from "./oauth";

/**
 * Tradução dos erros do Meta, com a mesma regra do `lib/auth-errors.ts`:
 * o original nunca vai para a tela, só para o log do servidor.
 *
 * Aqui a regra é ainda mais dura, porque em várias rotas do Meta o corpo
 * da resposta contém o próprio token. Por isso o que se registra é
 * `code`, `subcode`, `type` e `fbtrace_id` — nunca o corpo.
 */

export const MENSAGEM_GENERICA_META =
  "Não conseguimos falar com o Instagram agora. Tente de novo em alguns minutos.";

/**
 * Os três modos de morte do token. Nenhum tem refresh silencioso: o Meta
 * não devolve token novo sem o usuário reautorizar no navegador.
 * Ver docs/token-vault.md.
 */
export type MotivoQuebra = "expired" | "revoked";

export interface DiagnosticoToken {
  quebrou: boolean;
  motivo?: MotivoQuebra;
  /** o que a interface diz ao usuário */
  mensagem?: string;
}

const SUBCODIGOS: Record<number, { motivo: MotivoQuebra; mensagem: string }> = {
  458: {
    motivo: "revoked",
    mensagem: "A conexão com o Instagram foi removida nas configurações do Facebook.",
  },
  460: {
    motivo: "revoked",
    mensagem: "A senha do Facebook mudou, e isso desfez a conexão com o Instagram.",
  },
  463: {
    motivo: "expired",
    mensagem: "A conexão com o Instagram expirou — isso acontece a cada 60 dias.",
  },
  467: {
    motivo: "revoked",
    mensagem: "A conexão com o Instagram não é mais válida.",
  },
};

/**
 * Um erro do Meta virou "o token morreu"?
 *
 * `code === 190` é a família de erros de token inválido. O subcódigo diz
 * qual dos três casos foi. Sem subcódigo conhecido, ainda tratamos como
 * revogado — um token 190 não volta a funcionar sozinho, e insistir só
 * queima chamada.
 */
export function diagnosticar(erro: unknown): DiagnosticoToken {
  if (!(erro instanceof FalhaMeta)) return { quebrou: false };

  const { code, subcode } = erro.detalhe;
  if (code !== 190) return { quebrou: false };

  const conhecido = subcode ? SUBCODIGOS[subcode] : undefined;
  if (conhecido) return { quebrou: true, ...conhecido };

  return {
    quebrou: true,
    motivo: "revoked",
    mensagem: "A conexão com o Instagram não é mais válida.",
  };
}

/** O log do servidor — único lugar onde o detalhe técnico aparece. */
export function registrarErroMeta(contexto: string, erro: unknown): void {
  const detalhe: ErroMeta = erro instanceof FalhaMeta ? erro.detalhe : {};
  console.error(
    `[meta:${contexto}] code=${detalhe.code ?? "-"} subcode=${detalhe.subcode ?? "-"} ` +
      `type=${detalhe.type ?? "-"} trace=${detalhe.fbtrace_id ?? "-"}`,
  );
}

/**
 * O que o usuário vê quando o Facebook devolve erro no próprio redirect
 * (ele recusou, fechou a janela, ou a configuração está errada).
 */
export const ERROS_DE_CALLBACK: Record<string, string> = {
  recusado:
    "Você não autorizou a conexão. Sem ela não conseguimos anunciar por você — quando quiser, é só tentar de novo.",
  state:
    "Este link expirou por segurança. Comece a conexão de novo — leva menos de um minuto.",
  sessao: "Sua sessão expirou enquanto você autorizava. Entre de novo e refaça a conexão.",
  negocio: "Não encontramos seu negócio. Comece pelo cadastro do seu negócio.",
  troca: MENSAGEM_GENERICA_META,
  gravacao:
    "Conseguimos a autorização, mas não conseguimos salvá-la. Tente de novo — se continuar, fale com a gente.",
  // Falha nossa, não do cliente: falta configuração no ambiente. O texto
  // não diz "variável de ambiente" porque quem lê não tem o que fazer
  // com essa informação — o log do servidor tem o detalhe.
  config:
    "A conexão com o Instagram ainda não está liberada aqui. Já estamos sabendo — fale com a gente que a gente destrava para você.",
};
