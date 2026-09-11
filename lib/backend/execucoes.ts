import "server-only";
import { obter, TIMEOUTS } from "./cliente";
import { falha, registrarErroBackend, type Resultado } from "./erros";

/**
 * `GET /execucoes-em-revisao` — a fila do gate de confiança.
 *
 * READ-ONLY. Devolve as execuções com `requer_revisao = true`.
 *
 * ============================================================
 * O QUE A RESPOSTA **NÃO** TRAZ — medido, não suposto.
 *
 * O schema declarado em `/openapi.json` é `RespostaExecucao`, e ele tem
 * exatamente nove campos:
 *
 *   id_execucao, cliente_id, status, nicho, requer_revisao,
 *   motivos_revisao, confianca_minima, resultados, aprovacoes
 *
 * 1. ~~NÃO EXISTE NOME DE NEGÓCIO~~ — **VENCIDO. Medido em 10/09/2026:**
 *    `RespostaExecucao` passou de nove para DEZESSETE campos e agora tem
 *    `nome_negocio`, `criado_em`, `atualizado_em`, `canal_confirmado`,
 *    `google_customer_id`, `tagueamento_possivel`, `explicacao_revisao` e
 *    `motivos_estruturados`.
 *
 *    O que **continua** verdadeiro é a distinção: `nome_negocio` é o nome
 *    do NEGÓCIO daquela rodada, e o nome da CAMPANHA gerada mora em
 *    `resultados["estruturar-campanha"]`, só em algumas execuções. São
 *    coisas diferentes e a tela não pode apresentar uma como a outra —
 *    ver `fichaDaExecucao()` no fim deste arquivo.
 *
 * 2. ~~NÃO EXISTE NENHUM CAMPO DE TEMPO~~ — **VENCIDO na mesma medição.**
 *    `criado_em` e `atualizado_em` estão no schema publicado.
 *
 * 3. `cliente_id` VEIO NULO NAS 29 EXECUÇÕES da fila real. O campo
 *    existe no schema; o dado, não.
 *
 * 4. `motivos_revisao` vem preenchido em 28 das 29 execuções da fila
 *    real, no formato `"<agente>: confianca 0.52"`. A única exceção é a
 *    execução legada de status `gerado`. Ainda assim `agentesQueTravaram`
 *    é derivado dos próprios agentes: ele funciona quando `motivos` falta,
 *    e os dois juntos dão a resposta completa de "o que travou".
 *
 * 5. **DUAS ESCALAS DE CONFIANÇA CONVIVEM.** `confianca_minima` é sempre
 *    0–1 (medido: 27 valores, de 0 a 0,8). As confianças POR AGENTE também
 *    são 0–1 — exceto na mesma execução legada `gerado`, onde vêm 75, 65 e
 *    45, ou seja 0–100.
 *
 *    Mostrar "0,52" e "75" na mesma coluna faria o primeiro parecer
 *    catástrofe e o segundo parecer ótimo, quando 0,52 é MELHOR que 0,45.
 *    Por isso existe `formatarConfianca`, que detecta a escala por valor.
 * ============================================================
 */

/** Uma confiança declarada por um agente. */
export interface ConfiancaDeAgente {
  agente: string;
  valor: number;
}

export interface ExecucaoEmRevisao {
  id: string;
  status: string;
  /** `null` na fila real inteira, mas o campo existe no schema. */
  clienteId: string | null;
  requerRevisao: boolean;
  /** Formato `"<agente>: confianca 0.52"`. Vazio só na execução legada. */
  motivosRevisao: string[];
  /** `null` quando o backend não calculou. */
  confiancaMinima: number | null;
  quantasAprovacoes: number;

  // ---------- derivados, com o que os agentes reportaram ----------
  /** Nome da CAMPANHA gerada, não do negócio. `null` quando não há. */
  nomeCampanha: string | null;
  /** `nicho_nome` do classificador, mais legível que o slug. */
  nichoLegivel: string | null;
  /** Agentes que marcaram `requer_revisao: true` em si mesmos. */
  agentesQueTravaram: string[];
  /** Confiança de cada agente que reportou uma. */
  confiancas: ConfiancaDeAgente[];
  /** Nomes dos agentes que rodaram, na ordem em que vieram. */
  agentesQueRodaram: string[];
}

/**
 * Formata uma confiança sem esconder de qual escala ela veio.
 *
 * Valor `<= 1` é fração (0–1) e vira porcentagem. Valor `> 1` é a escala
 * 0–100 da execução legada, e aparece com o denominador dito — senão
 * "75" ao lado de "52%" leria como 75%, quando na verdade é a mesma coisa
 * por coincidência e poderia não ser.
 *
 * O caso patológico — 1 na escala 0–100, que significa 1% — seria lido
 * como 100%. Não dá para desambiguar por valor, e não vale inventar um
 * palpite: 1 exato não aparece na fila real, e se aparecer o operador vê
 * o número cru na mesma linha.
 */
export function formatarConfianca(valor: number): string {
  if (valor <= 1) return `${Math.round(valor * 100)}%`;
  return `${valor} de 100`;
}

function texto(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

function listaDeTexto(v: unknown): string[] | null {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) return null;
  return v.every((x) => typeof x === "string") ? (v as string[]) : null;
}

function validarUma(bruto: unknown): ExecucaoEmRevisao | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const o = bruto as Record<string, unknown>;

  const id = texto(o.id_execucao);
  if (!id) return null;
  if (typeof o.requer_revisao !== "boolean") return null;

  const motivos = listaDeTexto(o.motivos_revisao);
  if (motivos === null) return null;

  const resultados =
    typeof o.resultados === "object" && o.resultados !== null
      ? (o.resultados as Record<string, Record<string, unknown>>)
      : {};

  const agentesQueTravaram: string[] = [];
  const confiancas: ConfiancaDeAgente[] = [];
  for (const [agente, saida] of Object.entries(resultados)) {
    if (typeof saida !== "object" || saida === null) continue;
    // O agente de orçamento usa `requer_revisao_geral` além do
    // `requer_revisao`; qualquer um dos dois marca a etapa.
    if (saida.requer_revisao === true || saida.requer_revisao_geral === true) {
      agentesQueTravaram.push(agente);
    }
    // `confianca` na maioria; `confianca_diagnostico` no de orçamento.
    const valor = typeof saida.confianca === "number" ? saida.confianca : undefined;
    if (valor !== undefined) confiancas.push({ agente, valor });
    else if (typeof saida.confianca_diagnostico === "number") {
      confiancas.push({ agente, valor: saida.confianca_diagnostico });
    }
  }

  const estrutura = resultados["estruturar-campanha"] ?? {};
  const classificador = resultados["classificar-nicho"] ?? {};

  return {
    id,
    status: texto(o.status) ?? "(sem status)",
    clienteId: texto(o.cliente_id),
    requerRevisao: o.requer_revisao,
    motivosRevisao: motivos,
    confiancaMinima: typeof o.confianca_minima === "number" ? o.confianca_minima : null,
    quantasAprovacoes: Array.isArray(o.aprovacoes) ? o.aprovacoes.length : 0,
    // Os dois nomes aparecem: `nome` nas execuções novas e `nome_campanha`
    // nas antigas. Ler só um deixaria metade da fila sem identificação.
    nomeCampanha: texto(estrutura.nome) ?? texto(estrutura.nome_campanha),
    nichoLegivel: texto(classificador.nicho_nome) ?? texto(o.nicho),
    agentesQueTravaram,
    confiancas,
    agentesQueRodaram: Object.keys(resultados),
  };
}

export async function listarEmRevisao(): Promise<Resultado<ExecucaoEmRevisao[]>> {
  const resposta = await obter("/execucoes-em-revisao", {
    contexto: "execucoes-em-revisao",
    timeoutMs: TIMEOUTS.rapido,
  });
  if (!resposta.ok) return resposta;

  if (!Array.isArray(resposta.dados)) {
    registrarErroBackend("execucoes-em-revisao", {
      metodo: "GET",
      caminho: "/execucoes-em-revisao",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }

  const validadas: ExecucaoEmRevisao[] = [];
  let recusadas = 0;
  for (const item of resposta.dados) {
    const v = validarUma(item);
    if (v) validadas.push(v);
    else recusadas += 1;
  }

  // Um item malformado no meio de 29 não deve apagar a fila inteira — mas
  // também não pode passar em silêncio, senão a tela mostra 28 e ninguém
  // sabe que faltou um. Descarta o item e registra a perda.
  if (recusadas > 0) {
    registrarErroBackend("execucoes-em-revisao", {
      metodo: "GET",
      caminho: `/execucoes-em-revisao (${recusadas} de ${resposta.dados.length} itens recusados)`,
      categoria: "resposta_ilegivel",
    });
  }

  return { ok: true, dados: validadas };
}

/**
 * `GET /execucoes/{id_execucao}` — a identificação de UMA rodada.
 *
 * ============================================================
 * ESTA ROTA NÃO TEM `profile_id`. O ID VEM DE DENTRO, NUNCA DA URL.
 *
 * `/negocios/{id}/consolidado` e `/negocios/{id}/execucao` conferem o dono
 * (perfil errado devolve 404, medido em 10/09/2026). **Esta aqui não
 * confere nada**: quem tem o `X-V2G-Token` — e o servidor do Next tem —
 * lê qualquer execução de qualquer cliente.
 *
 * Por isso o único chamador legítimo é `lib/resultado/do-negocio.ts`, que
 * só pergunta por id que veio do `porExecucao` do consolidado do negócio
 * da sessão — e esse consolidado JÁ passou pelo `profile_id`. A lista é a
 * autorização.
 *
 * **Nunca chame isto com id de `searchParams`, de `params` de rota ou de
 * formulário.** Um id na URL viraria "troque o uuid e veja a campanha do
 * vizinho". `pnpm conferir:campanha-da-sessao` trava isso.
 * ============================================================
 *
 * O QUE ELA DÁ, e o que não dá — medido em 10/09/2026 nas duas execuções
 * da V2G:
 *
 *   nome_negocio       "TESTE-DADOS-REAIS (V2G)" · "V2G"
 *   status             "cadastro_completo" · "aguardando_fotos"
 *   canal_confirmado   `null` nas duas — o campo existe, o dado não
 */
export interface FichaDeExecucao {
  idExecucao: string;
  /**
   * O nome do NEGÓCIO daquela rodada, que é o que o backend guarda.
   *
   * **Não é o nome da campanha na plataforma.** Esse não existe em rota
   * nenhuma — o que há é `resultados["estruturar-campanha"].nome`, que é o
   * nome que a IA propôs, não o que está no Gerenciador de Anúncios.
   */
  nomeNegocio: string | null;
  /** chave para ramificar. NÃO renderize — ver `lib/dia-seguinte/tipos.ts`. */
  status: string | null;
  /**
   * `meta` ou `google`. **`null` nas duas execuções da V2G, medido.**
   *
   * `null` não vira "meta" por palpite: a tela não escreve canal nenhum.
   */
  canal: string | null;
}

export async function fichaDaExecucao(args: {
  /** **de `porExecucao`, nunca de URL.** Ver o bloco acima. */
  idExecucao: string;
}): Promise<Resultado<FichaDeExecucao>> {
  const resposta = await obter(`/execucoes/${encodeURIComponent(args.idExecucao)}`, {
    contexto: "ficha-da-execucao",
    timeoutMs: TIMEOUTS.rapido,
  });
  if (!resposta.ok) return resposta;

  const bruto = resposta.dados;
  if (typeof bruto !== "object" || bruto === null) {
    registrarErroBackend("ficha-da-execucao", {
      metodo: "GET",
      caminho: "/execucoes/{id}",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }
  const o = bruto as Record<string, unknown>;

  const idExecucao = texto(o.id_execucao);
  if (!idExecucao) {
    registrarErroBackend("ficha-da-execucao", {
      metodo: "GET",
      caminho: "/execucoes/{id}",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }

  return {
    ok: true,
    dados: {
      idExecucao,
      nomeNegocio: texto(o.nome_negocio),
      status: texto(o.status),
      canal: texto(o.canal_confirmado),
    },
  };
}
