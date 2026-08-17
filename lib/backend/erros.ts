import "server-only";

/**
 * Erros do backend V2G, por categoria, com mensagem em português.
 *
 * Mesma regra do `lib/auth-errors.ts`, e ela vale ainda mais aqui:
 *
 * 1. A resposta original NUNCA vai para a tela. O backend é FastAPI, e o
 *    corpo de erro dele é `{"detail": ...}` em inglês, às vezes com
 *    traceback de Pydantic dentro. Isso vai para o log do servidor.
 * 2. Categoria desconhecida cai na mensagem genérica. Uma frase vaga em
 *    português é melhor que uma precisa em inglês que o dono da pizzaria
 *    não entende.
 *
 * A diferença em relação ao auth: aqui o erro é DEVOLVIDO, não lançado.
 * O `credenciaisMeta()` lança quando falta variável de ambiente, e isso é
 * certo lá — sem app do Meta, o fluxo de conexão não existe. Aqui não: o
 * app tem que continuar de pé com o backend fora do ar, mostrando o resto
 * das telas. Por isso `Resultado<T>` em vez de exceção.
 */

export type CategoriaErro =
  /** Falta `V2G_BACKEND_URL` ou `V2G_BACKEND_TOKEN` no ambiente. */
  | "indisponivel"
  /** Não subiu do chão: DNS, conexão recusada. */
  | "rede"
  /**
   * O certificado HTTPS do backend não é confiável.
   *
   * Categoria separada de `rede` porque foi medida, não imaginada: hoje
   * `api.v2gmidia.com.br` serve o certificado autoassinado padrão do
   * Easypanel (`CN=Easypanel`), e o Node recusa com
   * `DEPTH_ZERO_SELF_SIGNED_CERT`. Como "erro de rede" isso pareceria
   * instabilidade passageira e alguém ficaria tentando de novo para
   * sempre — quando o conserto é emitir o certificado do domínio.
   */
  | "certificado"
  /** Passou do timeout desta chamada. */
  | "tempo_esgotado"
  /** 401 ou 403 — token errado, ausente ou revogado. */
  | "nao_autorizado"
  /** 404 — o recurso não existe. */
  | "nao_encontrado"
  /** 409 — transição de estado inválida. */
  | "conflito"
  /** 422 — o backend recusou o que a gente mandou. */
  | "dados_invalidos"
  /** 5xx — o backend quebrou. */
  | "servidor"
  /** 200, mas o corpo não tem a forma que a gente espera. */
  | "resposta_ilegivel";

export interface FalhaBackend {
  ok: false;
  categoria: CategoriaErro;
  /** o que o usuário lê */
  mensagem: string;
  /** código HTTP, quando houve resposta */
  http?: number;
}

export interface SucessoBackend<T> {
  ok: true;
  dados: T;
}

export type Resultado<T> = SucessoBackend<T> | FalhaBackend;

export const MENSAGEM_GENERICA_BACKEND =
  "Não conseguimos falar com nosso sistema agora. Tente de novo em alguns instantes.";

const MENSAGENS: Record<CategoriaErro, string> = {
  // "Indisponível" e não "não configurado": para quem lê a tela, a causa
  // é a mesma — não dá para fazer agora. Falta de variável de ambiente é
  // problema nosso, e o texto não devolve isso para o cliente resolver.
  indisponivel:
    "Essa parte ainda não está ligada por aqui. Já estamos sabendo — fale com a gente que a gente destrava para você.",
  rede: MENSAGEM_GENERICA_BACKEND,
  // Para o cliente é igual a qualquer indisponibilidade — ele não tem o
  // que fazer com a palavra "certificado". Quem precisa da distinção é
  // quem lê o log.
  certificado:
    "Essa parte ainda não está ligada por aqui. Já estamos sabendo — fale com a gente que a gente destrava para você.",
  tempo_esgotado:
    "Isso está demorando mais que o normal. O trabalho pode continuar rodando — confira de novo em alguns minutos.",
  // 401 do backend é falha NOSSA de configuração, não do cliente. O texto
  // não pede para ele "entrar de novo": a sessão dele está ótima, o que
  // está errado é o nosso token de máquina.
  nao_autorizado:
    "Não conseguimos autorizar essa operação no nosso sistema. Já estamos sabendo — fale com a gente.",
  nao_encontrado: "Não encontramos esse item. Ele pode ter sido removido.",
  conflito:
    "Esse passo já foi feito, ou ainda não é a vez dele. Recarregue a página para ver como está agora.",
  dados_invalidos:
    "Algum dado não passou na conferência do nosso sistema. Revise o que você preencheu e tente de novo.",
  servidor: MENSAGEM_GENERICA_BACKEND,
  resposta_ilegivel: MENSAGEM_GENERICA_BACKEND,
};

export function falha(categoria: CategoriaErro, http?: number): FalhaBackend {
  return { ok: false, categoria, mensagem: MENSAGENS[categoria], http };
}

/** Traduz o código HTTP em categoria. */
export function categoriaDoStatus(status: number): CategoriaErro {
  if (status === 401 || status === 403) return "nao_autorizado";
  if (status === 404) return "nao_encontrado";
  if (status === 409) return "conflito";
  if (status === 422) return "dados_invalidos";
  if (status >= 500) return "servidor";
  // 400 e outros 4xx caem em dados_invalidos: é o que eles são na
  // prática, e o log tem o código exato para quem for investigar.
  return "dados_invalidos";
}

/**
 * O log do servidor — único lugar onde o detalhe técnico aparece.
 *
 * O corpo da resposta NÃO entra aqui. Se um endpoint um dia ecoar o que
 * recebeu, o eco poderia trazer o `X-V2G-Token` de volta, e ele iria
 * direto para o log. Só o que é seguro: rota, método, status, categoria.
 */
export function registrarErroBackend(
  contexto: string,
  info: {
    metodo?: string;
    caminho?: string;
    status?: number;
    categoria: CategoriaErro;
    /** `err.cause.code` do Node: ENOTFOUND, ECONNREFUSED, DEPTH_ZERO_... */
    codigo?: string;
  },
): void {
  console.error(
    `[backend:${contexto}] ${info.metodo ?? "-"} ${info.caminho ?? "-"} ` +
      `status=${info.status ?? "-"} categoria=${info.categoria}` +
      (info.codigo ? ` codigo=${info.codigo}` : ""),
  );
}

/**
 * Classifica a exceção do `fetch`.
 *
 * O Node embrulha a causa real em `err.cause.code`, e sem olhar ali todo
 * problema de conexão vira "rede" — foi assim que um certificado
 * autoassinado passou por instabilidade de rede na primeira tentativa.
 */
export function categoriaDaExcecao(erro: unknown): { categoria: CategoriaErro; codigo?: string } {
  if (erro instanceof Error && erro.name === "TimeoutError") {
    return { categoria: "tempo_esgotado" };
  }
  const codigo =
    erro instanceof Error && typeof (erro.cause as { code?: unknown })?.code === "string"
      ? ((erro.cause as { code: string }).code)
      : undefined;

  // Os códigos de TLS do OpenSSL que aparecem aqui na prática. A lista é
  // curta de propósito: qualquer coisa que comece com esses prefixos é
  // problema de certificado, não de rede.
  const ehCertificado =
    codigo !== undefined &&
    (codigo.includes("CERT") || codigo.includes("SELF_SIGNED") || codigo.startsWith("ERR_TLS"));

  return { categoria: ehCertificado ? "certificado" : "rede", codigo };
}
