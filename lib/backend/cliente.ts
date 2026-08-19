import "server-only";
import {
  categoriaDaExcecao,
  categoriaDoStatus,
  falha,
  registrarErroBackend,
  type Resultado,
} from "./erros";

/**
 * O cliente HTTP do backend V2G (FastAPI).
 *
 * ============================================================
 * `import "server-only"` NA PRIMEIRA LINHA, E NÃO É DECORAÇÃO.
 *
 * O `X-V2G-Token` é segredo ENTRE MÁQUINAS: quem tem o token faz tudo, em
 * nome de qualquer cliente. Ele não identifica usuário — ver
 * `docs/backend-integracao.md`.
 *
 * Consequência: se este módulo entrar num bundle de cliente, o token vai
 * para o navegador de todo mundo. O `server-only` faz o BUILD QUEBRAR
 * nesse caso, o que é infinitamente melhor que descobrir depois. Não
 * remova, e não crie um atalho "só para testar no client".
 * ============================================================
 */

/** Timeout padrão. Vale para tudo que não é o pipeline de IA. */
const TIMEOUT_PADRAO_MS = 15_000;

/**
 * Os tempos que o backend realmente leva, do contrato dele. Estão aqui
 * como constantes nomeadas porque `600_000` solto numa chamada não diz a
 * ninguém por que é tão alto — e alguém "otimizaria" isso para 30s.
 *
 * ATENÇÃO: nenhum destes cabe num request de navegador. Quem chamar um
 * endpoint desses precisa do padrão dispara-e-consulta (§ do doc), não de
 * esperar a resposta com o usuário na tela.
 */
export const TIMEOUTS = {
  rapido: TIMEOUT_PADRAO_MS,
  agente: 180_000,
  compliance: 300_000,
  campanha: 300_000,
  criativoVisual: 420_000,
  copy: 600_000,
} as const;

interface Configuracao {
  base: string;
  token: string;
}

/**
 * Lê a configuração do ambiente. `null` quando falta alguma coisa.
 *
 * Devolve `null` em vez de lançar de propósito: com o backend não
 * configurado, o app tem que continuar de pé — as telas que não dependem
 * dele funcionam, e as que dependem mostram "indisponível". Lançar aqui
 * derrubaria a renderização de qualquer página que importasse isto.
 */
function configuracao(): Configuracao | null {
  const base = process.env.V2G_BACKEND_URL;
  const token = process.env.V2G_BACKEND_TOKEN;
  if (!base || !token) return null;
  // Sem barra no fim: os caminhos passados adiante começam com "/", e
  // "https://host//saude" é 404 em alguns servidores.
  return { base: base.replace(/\/+$/, ""), token };
}

/** Dá para saber se o backend está configurado sem tentar uma chamada. */
export function backendConfigurado(): boolean {
  return configuracao() !== null;
}

export interface OpcoesChamada {
  /** Milissegundos. Use as constantes de `TIMEOUTS`. */
  timeoutMs?: number;
  /** Query string. Valores `undefined` e `null` são omitidos. */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Nome curto para o log. Sem isto, erro no log não diz de onde veio. */
  contexto?: string;
}

/**
 * O miolo de toda chamada ao backend — GET e POST passam por aqui.
 *
 * UMA FUNÇÃO SÓ, e é o motivo de ela existir: enquanto havia só leitura,
 * este arquivo prometia por escrito que "quando houver POST, ele entra
 * aqui com a mesma normalização de erro, não numa função paralela que
 * esquece metade dos casos". Duas funções irmãs copiadas divergiriam no
 * primeiro caso novo — e o caso que uma esquecesse seria justamente o
 * 200-com-corpo-ilegível, que não dá erro em lugar nenhum.
 *
 * Devolve o corpo cru, ainda não validado: quem chama passa por um
 * validador (ver `pre-requisitos.ts` e `cadastro.ts`).
 */
async function chamar(
  metodo: "GET" | "POST",
  caminho: string,
  corpo: unknown | undefined,
  opcoes: OpcoesChamada,
): Promise<Resultado<unknown>> {
  const cfg = configuracao();
  const contexto = opcoes.contexto ?? caminho;

  if (!cfg) {
    // Não loga como erro: backend não configurado é estado esperado em
    // desenvolvimento, e poluir o log com isso treina todo mundo a
    // ignorar o log.
    return falha("indisponivel");
  }

  const url = new URL(cfg.base + caminho);
  for (const [chave, valor] of Object.entries(opcoes.params ?? {})) {
    if (valor === undefined || valor === null) continue;
    url.searchParams.set(chave, String(valor));
  }

  const timeoutMs = opcoes.timeoutMs ?? TIMEOUT_PADRAO_MS;

  let resposta: Response;
  try {
    resposta = await fetch(url, {
      method: metodo,
      headers: {
        "X-V2G-Token": cfg.token,
        Accept: "application/json",
        ...(corpo !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(corpo !== undefined ? { body: JSON.stringify(corpo) } : {}),
      // `AbortSignal.timeout` em vez de um AbortController à mão: ele
      // rejeita com `TimeoutError`, que dá para distinguir de um abort
      // provocado por outra coisa.
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (erro) {
    const { categoria, codigo } = categoriaDaExcecao(erro);
    registrarErroBackend(contexto, { metodo, caminho, categoria, codigo });
    return falha(categoria);
  }

  // `resposta.ok` cobre 200–299, e é por isso que o 201 do `POST
  // /cadastro` passa sem caso especial. Uma checagem `status === 200`
  // escrita por reflexo recusaria todo cadastro criado com sucesso.
  if (!resposta.ok) {
    const categoria = categoriaDoStatus(resposta.status);
    registrarErroBackend(contexto, {
      metodo,
      caminho,
      status: resposta.status,
      categoria,
    });
    return falha(categoria, resposta.status);
  }

  try {
    return { ok: true, dados: await resposta.json() };
  } catch {
    // 200 com corpo que não é JSON: acontece quando um proxy devolve
    // página de erro com status 200. É ilegível, não é sucesso.
    registrarErroBackend(contexto, {
      metodo,
      caminho,
      status: resposta.status,
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel", resposta.status);
  }
}

/** Uma chamada GET ao backend. */
export async function obter(
  caminho: string,
  opcoes: OpcoesChamada = {},
): Promise<Resultado<unknown>> {
  return chamar("GET", caminho, undefined, opcoes);
}

/**
 * Uma chamada POST ao backend, com corpo JSON.
 *
 * ============================================================
 * ISTO ESCREVE. Diferente de tudo que veio antes neste diretório.
 *
 * Uma chamada que falha na volta pode ter funcionado na ida: o recurso
 * nasce do lado de lá e a resposta se perde. Por isso NENHUM chamador
 * pode tratar `tempo_esgotado` como "não aconteceu" — ver
 * `docs/disparo-pipeline.md` §5.2, e a reconciliação em
 * `lib/pipeline/disparar.ts`.
 *
 * E por isso não existe retry aqui dentro. Uma função que cria recurso
 * não se repete sozinha; quem decide repetir é quem sabe se o recurso
 * já existe.
 * ============================================================
 */
export async function enviar(
  caminho: string,
  corpo: unknown,
  opcoes: OpcoesChamada = {},
): Promise<Resultado<unknown>> {
  return chamar("POST", caminho, corpo, opcoes);
}

/**
 * `GET /saude` — o único endpoint sem autenticação.
 *
 * Serve para diagnóstico nosso, não para tela. Não manda o token: se um
 * dia o `/saude` for exposto por engano num proxy público, não queremos
 * ter mandado credencial para ele.
 */
export async function saude(): Promise<Resultado<unknown>> {
  const cfg = configuracao();
  if (!cfg) return falha("indisponivel");

  try {
    const resposta = await fetch(`${cfg.base}/saude`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!resposta.ok) return falha(categoriaDoStatus(resposta.status), resposta.status);
    return { ok: true, dados: await resposta.json() };
  } catch (erro) {
    const { categoria, codigo } = categoriaDaExcecao(erro);
    registrarErroBackend("saude", { metodo: "GET", caminho: "/saude", categoria, codigo });
    return falha(categoria);
  }
}
