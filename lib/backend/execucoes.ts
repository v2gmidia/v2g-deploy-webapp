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
 * 1. NÃO EXISTE NOME DE NEGÓCIO. Nem aqui nem em `GET /execucoes/{id}`,
 *    que devolve o mesmo schema. O que existe é o nome da CAMPANHA
 *    gerada, dentro de `resultados["estruturar-campanha"]`, e só em
 *    algumas execuções. São coisas diferentes e a tela não pode
 *    apresentar uma como a outra.
 *
 * 2. NÃO EXISTE NENHUM CAMPO DE TEMPO. Sem `criado_em`, sem
 *    `atualizado_em`. Não dá para dizer há quanto tempo a execução está
 *    parada — nem estimar. O briefing do backend lista `criado_em` na
 *    tabela `execucoes`, mas o endpoint não o expõe.
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
