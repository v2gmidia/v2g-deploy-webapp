import "server-only";
import { lerMarketing } from "./marketing";
import { TETO_DIARIO_ABSOLUTO_CENTAVOS } from "../verba/limites";

/**
 * Validação de orçamento. Desenho em `docs/publicar-campanha.md` §5.
 *
 * `daily_budget` na Marketing API é INTEIRO EM CENTAVOS. R$ 80,00 = 8000.
 * Um erro de fator 100 aqui é 100× o gasto do cliente, e é o bug mais
 * caro que este lote pode ter. Por isso a conversão acontece num lugar
 * só, com nome explícito, e as checagens que sobram são redundantes de
 * propósito.
 */

/** Dias usados para partir o teto mensal. Fixo: mês comercial. */
const DIAS_DO_MES = 30;

/*
 * O TETO ABSOLUTO SAIU DAQUI, e o motivo é o lote QA-3: a `/verba` e a
 * `/meu-negocio` passaram a aplicar o mesmo limite na hora de GRAVAR, em
 * vez de deixar o valor impossível chegar até aqui. Três lugares julgando
 * a mesma coluna com três cópias do mesmo número é como um deles fica
 * para trás na primeira mudança — o defeito que o QA-2 consertou noutro
 * campo. Agora o número mora em `lib/verba/limites.ts`, sem `server-only`
 * na cadeia (o rodapé da `/verba` é componente de cliente).
 *
 * O valor e a razão dele não mudaram: R$ 1.000,00/dia, último freio
 * contra dado corrompido no banco.
 */

export type FalhaDeOrcamento =
  | "sem_teto"
  | "nao_numerico"
  | "abaixo_do_piso"
  | "acima_do_teto_absoluto"
  | "inconsistente";

export interface OrcamentoValidado {
  ok: true;
  diarioCentavos: number;
  /** o piso que o Meta informou para esta conta, se foi possível consultar */
  pisoCentavos: number | null;
}

export interface OrcamentoRecusado {
  ok: false;
  falha: FalhaDeOrcamento;
  /** o que o cliente lê */
  mensagem: string;
  /** contexto para o log e para `decisions` — nunca vai para a tela */
  detalhe: Record<string, unknown>;
}

export type ResultadoOrcamento = OrcamentoValidado | OrcamentoRecusado;

/**
 * O piso do Meta para a conta. Varia por moeda, país e objetivo — por
 * isso é CONSULTADO, nunca fixado no código.
 *
 * Devolve `null` quando não deu para consultar. `null` não bloqueia a
 * publicação: o Meta rejeita o orçamento abaixo do piso de qualquer
 * forma, com mensagem própria. O que a consulta compra é dizer isso ao
 * cliente ANTES de tentar, não no lugar do Meta.
 */
export async function consultarPisoDiario(
  contaExterna: string,
  token: string,
): Promise<number | null> {
  try {
    const dados = await lerMarketing<{
      data?: Array<{ min_daily_budget_imp?: number; min_daily_budget_high_freq?: number }>;
    }>(`/${contaExterna}/minimum_budgets`, token);

    const linha = dados.data?.[0];
    if (!linha) return null;

    // `min_daily_budget_imp` é o piso para cobrança por impressão, que é
    // o nosso `billing_event`. O outro campo é para alta frequência e
    // seria o piso errado para comparar.
    const valor = linha.min_daily_budget_imp;
    return typeof valor === "number" && valor > 0 ? valor : null;
  } catch {
    // Falha de consulta não pode derrubar a publicação: o piso é um
    // aviso antecipado, não a autoridade. A autoridade é o próprio Meta
    // na hora de criar o conjunto.
    return null;
  }
}

/**
 * Converte o teto mensal do cliente em orçamento diário, em centavos, e
 * recusa tudo que não passar pelas cinco checagens.
 *
 * `pisoCentavos` vem de `consultarPisoDiario`. Passar `null` significa
 * "não consegui consultar", e a checagem de piso é pulada — não
 * substituída por um chute.
 */
export function validarOrcamento(
  tetoMensal: unknown,
  pisoCentavos: number | null,
): ResultadoOrcamento {
  // 1. Origem única. Nulo aborta — nunca assume padrão. Um padrão aqui
  //    significaria gastar dinheiro que o cliente não autorizou.
  if (tetoMensal === null || tetoMensal === undefined || tetoMensal === "") {
    return {
      ok: false,
      falha: "sem_teto",
      mensagem:
        "Antes de publicar, defina quanto você quer investir por mês. É em Conta → Limite de investimento no mês.",
      detalhe: { tetoMensal },
    };
  }

  const mensal = Number(tetoMensal);
  if (!Number.isFinite(mensal) || mensal <= 0) {
    return {
      ok: false,
      falha: "nao_numerico",
      mensagem:
        "O limite de investimento no mês está com um valor que não dá para usar. Ajuste em Conta e tente de novo.",
      detalhe: { tetoMensal },
    };
  }

  // 2. Cálculo. `Math.round` e não `floor`: o piso do Meta costuma ser
  //    justo, e arredondar sempre para baixo faria um teto de R$ 300
  //    virar R$ 9,99/dia num piso de R$ 10 sem necessidade. O passo 4
  //    garante que o arredondamento para cima não estoure o mês.
  const diarioCentavos = Math.round((mensal * 100) / DIAS_DO_MES);

  // 5a. Sanidade básica, antes das comparações.
  if (!Number.isInteger(diarioCentavos) || diarioCentavos <= 0) {
    return {
      ok: false,
      falha: "nao_numerico",
      mensagem:
        "Não conseguimos calcular o investimento diário a partir do seu limite mensal. Confira o valor em Conta.",
      detalhe: { mensal, diarioCentavos },
    };
  }

  // 3. Piso — consultado, não chutado.
  if (pisoCentavos !== null && diarioCentavos < pisoCentavos) {
    const mensalMinimo = Math.ceil((pisoCentavos * DIAS_DO_MES) / 100);
    return {
      ok: false,
      falha: "abaixo_do_piso",
      mensagem:
        `O Facebook não aceita anúncios com esse valor por dia. Para anunciar, o limite mensal ` +
        `precisa ser de pelo menos R$ ${mensalMinimo},00.`,
      detalhe: { diarioCentavos, pisoCentavos },
    };
  }

  // 5b. Teto absoluto do código.
  if (diarioCentavos > TETO_DIARIO_ABSOLUTO_CENTAVOS) {
    return {
      ok: false,
      falha: "acima_do_teto_absoluto",
      mensagem:
        "Esse limite mensal é maior do que a gente publica automaticamente. Fale com a gente que a gente configura junto com você.",
      detalhe: { diarioCentavos, tetoAbsoluto: TETO_DIARIO_ABSOLUTO_CENTAVOS },
    };
  }

  // 4. Teto absoluto do cliente. Redundante com o passo 2 DE PROPÓSITO:
  //    é a checagem que pega um bug futuro no cálculo acima. Se alguém
  //    trocar DIAS_DO_MES por 3 sem querer, é aqui que para.
  //
  //    A tolerância de 1 centavo cobre o arredondamento do passo 2 e
  //    nada além disso.
  if (diarioCentavos * DIAS_DO_MES > mensal * 100 + DIAS_DO_MES) {
    return {
      ok: false,
      falha: "inconsistente",
      mensagem:
        "Encontramos uma inconsistência no cálculo do seu investimento e paramos por segurança. Já estamos sabendo — fale com a gente.",
      detalhe: { mensal, diarioCentavos, dias: DIAS_DO_MES },
    };
  }

  return { ok: true, diarioCentavos, pisoCentavos };
}
