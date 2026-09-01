import type {
  Consolidado,
  ConsolidadoBase,
  ConsolidadoDoNegocio,
  DiaDoConsolidado,
  ExecucaoDoNegocio,
} from "./tipos";

/**
 * Ler o backend do "dia seguinte" sem confiar no formato.
 *
 * SEM `server-only`, e não é descuido: aqui não há segredo — é
 * transformação pura. Quem guarda o `X-V2G-Token` é
 * `lib/backend/dia-seguinte.ts`, que chama isto depois de receber o corpo.
 *
 * Ficar deste lado é o que deixa o `conferir:dia-seguinte` alimentar o
 * validador com os corpos tortos que um dia ruim do backend produziria.
 * Testar uma CÓPIA seria pior: cópia concorda consigo mesma para sempre.
 *
 * Mesma regra do `pre-requisitos.ts` e do `lib/nichos/validar.ts`:
 * `as Tipo` é promessa que o TypeScript acredita e o runtime não cumpre.
 */

function texto(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

/**
 * ============================================================
 * A FUNÇÃO MAIS IMPORTANTE DESTE ARQUIVO. `null` NÃO É ZERO.
 *
 * Ausente e nulo viram `null`. Um número vira número — **inclusive o
 * zero**, que é resposta legítima e sinal forte: zero venda num dia é
 * informação, não silêncio.
 *
 * Devolve `undefined` para reprovar (tipo errado), que é diferente de
 * `null` (ausência legítima). Sem essa distinção, um `"12"` que chegasse
 * como string passaria como ausência e a tela diria "não sabemos" sobre
 * um dado que veio.
 * ============================================================
 */
function inteiroOuNulo(v: unknown): number | null | undefined {
  if (v === undefined || v === null) return null;
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  // O contrato promete inteiro em centavos e em contagem. Um float aqui é
  // mudança de contrato, não arredondamento nosso.
  if (!Number.isInteger(v)) return undefined;
  if (v < 0) return undefined;
  return v;
}

/**
 * Decimal chega como string (`"12"`, `"4.71"`) e CONTINUA string.
 *
 * Aceita número também: se o backend um dia serializar sem aspas, virar
 * string aqui é melhor que reprovar a resposta inteira — o que se perde é
 * precisão que o float já tinha perdido antes de chegar.
 */
function decimalOuNulo(v: unknown): string | null | undefined {
  if (v === undefined || v === null) return null;
  if (typeof v === "string") return v.trim() === "" ? null : v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

/** `YYYY-MM-DD`, e nada além disso. */
const DIA = /^\d{4}-\d{2}-\d{2}$/;

export function validarExecucaoDoNegocio(bruto: unknown): ExecucaoDoNegocio | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const o = bruto as Record<string, unknown>;

  const idExecucao = texto(o.id_execucao);
  const businessId = texto(o.business_id);
  const status = texto(o.status);
  const andamento = texto(o.andamento);
  if (!idExecucao || !businessId || !status || !andamento) return null;

  // `pede_acao` é booleano e não tem default: ausente aqui seria a tela
  // decidindo sozinha se a bola é do cliente, que é exatamente o que este
  // campo existe para não deixar acontecer.
  if (typeof o.pede_acao !== "boolean") return null;

  const atualizadoEm = texto(o.atualizado_em);
  if (!atualizadoEm) return null;

  return {
    idExecucao,
    businessId,
    status,
    andamento,
    pedeAcao: o.pede_acao,
    atualizadoEm,
  };
}

function validarDia(bruto: unknown): DiaDoConsolidado | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const o = bruto as Record<string, unknown>;

  const dia = texto(o.dia);
  if (!dia || !DIA.test(dia)) return null;

  const investiuCentavos = inteiroOuNulo(o.investiu_centavos);
  const viraramVenda = inteiroOuNulo(o.viraram_venda);
  const voltouCentavos = inteiroOuNulo(o.voltou_centavos);
  const pessoasQueChegaram = decimalOuNulo(o.pessoas_que_chegaram);
  if (
    investiuCentavos === undefined ||
    viraramVenda === undefined ||
    voltouCentavos === undefined ||
    pessoasQueChegaram === undefined
  ) {
    return null;
  }

  return { dia, investiuCentavos, pessoasQueChegaram, viraramVenda, voltouCentavos };
}

/**
 * ============================================================
 * TUDO OU NADA, como o validador de nichos.
 *
 * Um dia malformado reprova o consolidado inteiro em vez de sumir da
 * lista. Sumir é pior do que parece: o dia descartado não vira erro em
 * lugar nenhum — vira um total que não bate com a soma dos dias na tela,
 * e o dono conferindo no caderno dele descobre antes da gente.
 * ============================================================
 *
 * O NÚCLEO É COMPARTILHADO pelas duas rotas de consolidado — a por
 * execução e a do acumulado do negócio. Dois validadores irmãos copiados
 * divergiriam no primeiro campo novo, e o campo esquecido seria
 * justamente o que ninguém lembra de testar.
 */
function validarNucleo(o: Record<string, unknown>): ConsolidadoBase | null {
  const desde = texto(o.desde);
  const ate = texto(o.ate);
  if (!desde || !ate) return null;
  if (!DIA.test(desde) || !DIA.test(ate)) return null;

  if (!Array.isArray(o.dias)) return null;
  const dias: DiaDoConsolidado[] = [];
  for (const item of o.dias) {
    const d = validarDia(item);
    if (!d) return null;
    dias.push(d);
  }

  const investiuCentavos = inteiroOuNulo(o.investiu_centavos);
  const voltouCentavos = inteiroOuNulo(o.voltou_centavos);
  const vendas = inteiroOuNulo(o.vendas);
  const pessoasQueChegaram = decimalOuNulo(o.pessoas_que_chegaram);
  const retornoPorReal = decimalOuNulo(o.retorno_por_real);
  if (
    investiuCentavos === undefined ||
    voltouCentavos === undefined ||
    vendas === undefined ||
    pessoasQueChegaram === undefined ||
    retornoPorReal === undefined
  ) {
    return null;
  }

  const diasComOsDoisLados = inteiroOuNulo(o.dias_com_os_dois_lados);
  if (diasComOsDoisLados === undefined || diasComOsDoisLados === null) return null;

  // Sem default: `false` é o estado normal hoje, mas ausência não é
  // `false` — é contrato mudado, e a tela decidiria sozinha se mostra o
  // lado da plataforma.
  if (typeof o.tem_dado_da_plataforma !== "boolean") return null;

  // ============================================================
  // `respondeu_hoje` ACEITA `null`, E ISSO NÃO É AFROUXAR A GUARDA.
  //
  // `null` tem significado: hoje está FORA da janela consultada. Medido em
  // 01/09/2026 — com `desde=ate=ontem`, a rota devolve `null`; sem janela,
  // devolve `false`.
  //
  // Exigir booleano aqui reprovava o corpo inteiro sempre que alguém
  // consultasse uma janela que não inclui hoje — que é exatamente o que a
  // Server Action da pergunta diária faz para ler o dia de ontem. A
  // pergunta não gravava, e o motivo era um `null` legítimo.
  //
  // AUSENTE continua reprovando: `undefined` é contrato mudado, `null` é
  // resposta. A distinção é a mesma do `inteiroOuNulo`.
  // ============================================================
  if (o.respondeu_hoje !== null && typeof o.respondeu_hoje !== "boolean") return null;
  if (!("respondeu_hoje" in o)) return null;

  return {
    desde,
    ate,
    dias,
    investiuCentavos,
    voltouCentavos,
    pessoasQueChegaram,
    vendas,
    retornoPorReal,
    diasComOsDoisLados,
    temDadoDaPlataforma: o.tem_dado_da_plataforma,
    respondeuHoje: o.respondeu_hoje as boolean | null,
  };
}

/** `GET /execucoes/{id}/consolidado` */
export function validarConsolidado(bruto: unknown): Consolidado | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const o = bruto as Record<string, unknown>;

  const idExecucao = texto(o.id_execucao);
  if (!idExecucao) return null;

  const nucleo = validarNucleo(o);
  if (!nucleo) return null;

  return { ...nucleo, idExecucao };
}

/**
 * `GET /negocios/{business_id}/consolidado` — o acumulado.
 *
 * Os dois campos a mais são de AUDITORIA DA SOMA, e não de tela:
 * `execucoes_somadas` diz quantas rodadas entraram, e
 * `dias_com_resposta_de_mais_de_uma_execucao` acusa defeito de FLUXO —
 * a varredura perguntou duas vezes ao mesmo dono no mesmo dia. Nenhum dos
 * dois vai para o cliente.
 */
export function validarConsolidadoDoNegocio(bruto: unknown): ConsolidadoDoNegocio | null {
  if (typeof bruto !== "object" || bruto === null) return null;
  const o = bruto as Record<string, unknown>;

  const businessId = texto(o.business_id);
  if (!businessId) return null;

  const nucleo = validarNucleo(o);
  if (!nucleo) return null;

  const execucoesSomadas = inteiroOuNulo(o.execucoes_somadas);
  const diasComRespostaDeMaisDeUmaExecucao = inteiroOuNulo(
    o.dias_com_resposta_de_mais_de_uma_execucao,
  );
  if (execucoesSomadas === undefined || execucoesSomadas === null) return null;
  if (
    diasComRespostaDeMaisDeUmaExecucao === undefined ||
    diasComRespostaDeMaisDeUmaExecucao === null
  ) {
    return null;
  }

  return { ...nucleo, businessId, execucoesSomadas, diasComRespostaDeMaisDeUmaExecucao };
}
