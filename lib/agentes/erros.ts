import "server-only";

/**
 * Erros da extração, por categoria, com mensagem em português.
 *
 * Mesma forma do `lib/backend/erros.ts`: `Resultado<T>` devolvido, não
 * exceção lançada. A tela do operador tem que continuar de pé com a API
 * fora do ar, mostrando a proposta anterior e um aviso — não uma página de
 * erro.
 *
 * Quem lê estas mensagens é gente da V2G, não o dono da padaria. Por isso
 * elas dizem o que houve de verdade, e não a versão amaciada que a gente
 * escreve para o cliente final. A distinção importa: mensagem vaga para
 * quem pode consertar é mensagem que faz alguém abrir o log à toa.
 */

export type CategoriaExtracao =
  /** Falta `ANTHROPIC_API_KEY` no ambiente. */
  | "sem_chave"
  /** Não subiu do chão: DNS, conexão recusada. */
  | "rede"
  /** Passou do tempo. */
  | "tempo_esgotado"
  /** 401 ou 403 — chave errada, revogada, sem crédito. */
  | "nao_autorizado"
  /** 429 — limite de requisições. */
  | "limite"
  /** 5xx ou 529 — do lado deles. */
  | "servidor"
  /** A resposta veio, mas não na forma combinada (inclusive truncada). */
  | "resposta_ilegivel"
  /** O modelo recusou a requisição. */
  | "recusado"
  /** A transcrição está vazia ou curta demais para extrair. */
  | "transcricao_vazia";

export interface FalhaExtracao {
  ok: false;
  categoria: CategoriaExtracao;
  mensagem: string;
  http?: number;
}

export interface SucessoExtracao<T> {
  ok: true;
  dados: T;
}

export type Resultado<T> = SucessoExtracao<T> | FalhaExtracao;

const MENSAGENS: Record<CategoriaExtracao, string> = {
  sem_chave:
    "A extração não está ligada neste ambiente: falta ANTHROPIC_API_KEY.",
  rede: "Não conseguimos falar com a API da Anthropic. Tente de novo.",
  tempo_esgotado:
    "A extração passou do tempo. A transcrição pode estar muito longa — tente de novo.",
  nao_autorizado:
    "A chave da API foi recusada. Confira ANTHROPIC_API_KEY e o crédito da conta.",
  limite: "Limite de requisições da API atingido. Espere um pouco e tente de novo.",
  servidor: "A API da Anthropic está com problema. Tente de novo em alguns minutos.",
  // "Truncada" está aqui de propósito: é a causa mais provável e a que tem
  // conserto conhecido, então nomear economiza uma investigação.
  resposta_ilegivel:
    "A resposta não veio na forma esperada — pode ter sido cortada por tamanho. Nada foi gravado.",
  recusado:
    "O modelo recusou a requisição. Confira se a transcrição tem algo fora do comum.",
  transcricao_vazia:
    "Essa entrevista não tem transcrição suficiente para extrair nada.",
};

export function falha(
  categoria: CategoriaExtracao,
  http?: number,
): FalhaExtracao {
  return { ok: false, categoria, mensagem: MENSAGENS[categoria], http };
}

/**
 * O log do servidor. A transcrição NÃO entra aqui.
 *
 * Ela é conversa de cliente sobre o próprio negócio — faturamento, sócio,
 * o que vai mal. Log de erro é o lugar mais fácil de vazar sem ninguém
 * perceber, e a política de privacidade promete que a transcrição sai em
 * 30 dias: um log que a copie não sai coisa nenhuma.
 */
export function registrarErroExtracao(
  contexto: string,
  info: {
    categoria: CategoriaExtracao;
    status?: number;
    codigo?: string;
    entrevistaId?: string;
  },
): void {
  const partes = [
    "[agentes]",
    contexto,
    "categoria=" + info.categoria,
    info.status ? "status=" + info.status : "",
    info.codigo ? "codigo=" + info.codigo : "",
    info.entrevistaId ? "entrevista=" + info.entrevistaId : "",
  ].filter(Boolean);
  console.error(partes.join(" "));
}

/** Traduz o código HTTP da API em categoria. */
export function categoriaDoStatus(status: number): CategoriaExtracao {
  if (status === 401 || status === 403) return "nao_autorizado";
  if (status === 429) return "limite";
  if (status >= 500) return "servidor";
  return "resposta_ilegivel";
}
