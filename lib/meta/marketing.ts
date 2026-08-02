import "server-only";
import { FalhaMeta, META_API_VERSION } from "./oauth";

/**
 * As chamadas de ESCRITA da Marketing API.
 *
 * Separado de `graph.ts` de propósito: aquele só lê, e a diferença entre
 * "lê" e "cria objeto na conta de anúncio do cliente" merece uma fronteira
 * visível no import. Quem importa daqui está mexendo em coisa que pode
 * gastar dinheiro.
 */

const GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;

function normalizarErro(corpo: Record<string, unknown>): FalhaMeta {
  const erro = (corpo.error ?? {}) as Record<string, unknown>;
  return new FalhaMeta("Chamada à Marketing API falhou", {
    code: typeof erro.code === "number" ? erro.code : undefined,
    subcode: typeof erro.error_subcode === "number" ? erro.error_subcode : undefined,
    type: typeof erro.type === "string" ? erro.type : undefined,
    fbtrace_id: typeof erro.fbtrace_id === "string" ? erro.fbtrace_id : undefined,
    mensagemUsuario:
      typeof erro.error_user_msg === "string" ? erro.error_user_msg : undefined,
    tituloUsuario:
      typeof erro.error_user_title === "string" ? erro.error_user_title : undefined,
  });
}

export async function lerMarketing<T>(caminho: string, token: string): Promise<T> {
  const separador = caminho.includes("?") ? "&" : "?";
  const resposta = await fetch(`${GRAPH}${caminho}${separador}access_token=${token}`, {
    cache: "no-store",
  });
  const corpo = (await resposta.json()) as Record<string, unknown>;
  if (!resposta.ok || corpo.error) throw normalizarErro(corpo);
  return corpo as T;
}

export interface OpcoesDeCriacao {
  /**
   * Ensaio a seco. O Meta valida o pedido inteiro e **não cria nada** —
   * responde `{"success": true}` se passaria, ou o erro específico se
   * não.
   *
   * Comprovado contra a conta real: 5 campanhas antes, 5 depois, e o
   * pedido com defeito devolveu a mensagem exata do campo faltando, em
   * português. Ver `docs/publicar-campanha.md` §0.a.
   *
   * É o que permite descobrir que a publicação vai falhar ANTES de criar
   * o primeiro objeto — muito mais barato que a limpeza de meio-caminho.
   */
  validarApenas?: boolean;
}

/**
 * Cria um objeto. Devolve o id, ou `null` quando foi só validação.
 *
 * `null` no modo validação não é omissão: é o tipo forçando quem chama a
 * lidar com o fato de que nada foi criado. Um `string` de mentira ali
 * viraria um id falso gravado no banco.
 */
export async function criarNoMeta(
  caminho: string,
  token: string,
  campos: Record<string, string>,
  opcoes: OpcoesDeCriacao = {},
): Promise<string | null> {
  const corpoForm = new URLSearchParams({ ...campos, access_token: token });
  if (opcoes.validarApenas) {
    corpoForm.set("execution_options", JSON.stringify(["validate_only"]));
  }

  const resposta = await fetch(`${GRAPH}${caminho}`, {
    method: "POST",
    body: corpoForm,
    cache: "no-store",
  });
  const corpo = (await resposta.json()) as Record<string, unknown>;
  if (!resposta.ok || corpo.error) throw normalizarErro(corpo);

  if (opcoes.validarApenas) return null;

  const id = corpo.id;
  if (typeof id !== "string" || !id) {
    // Resposta 200 sem id é caso que não deveria existir. Falhar aqui é
    // melhor que gravar `undefined` como id externo e só descobrir na
    // próxima etapa da cadeia, com um objeto órfão no meio.
    throw new FalhaMeta("O Meta aceitou a criação mas não devolveu id", {});
  }
  return id;
}

/**
 * Apaga um objeto. Usado só para limpar teste — a publicação NUNCA apaga
 * nada sozinha (`docs/publicar-campanha.md` §7: o órfão pausado não
 * gasta, e apagar numa corrida é pior que deixar).
 */
export async function apagarNoMeta(id: string, token: string): Promise<boolean> {
  // Método HTTP DELETE de verdade. NÃO use `POST` com `_method=DELETE`:
  // medido contra a conta real, aquilo responde `{"success": true}` e
  // **não apaga nada** — a campanha continua listada e PAUSED. Um falso
  // positivo silencioso, que numa rotina de limpeza significaria achar
  // que a conta está limpa enquanto o lixo se acumula.
  const resposta = await fetch(
    `${GRAPH}/${id}?access_token=${encodeURIComponent(token)}`,
    { method: "DELETE", cache: "no-store" },
  );
  const corpo = (await resposta.json()) as Record<string, unknown>;
  if (!resposta.ok || corpo.error) throw normalizarErro(corpo);
  return corpo.success === true;
}
