import type { ConsolidadoBase, RespostaDoDono } from "./tipos";

/**
 * Montar o corpo do `POST /resposta-do-dono`.
 *
 * ============================================================
 * SÓ VAI O QUE ELE MEXEU. O RESTO É OMITIDO, NÃO ZERADO.
 *
 * Desde o merge por campo (backend, 01/09/2026) o upsert deixou de
 * substituir a linha: campo ausente preserva o valor do servidor, `null`
 * explícito apaga.
 *
 * A versão anterior reenviava sempre os dois campos, lidos do
 * consolidado. Isso era correto sob as duas semânticas — mas deixou de
 * ser inócuo: **se o consolidado não achasse o dia**, o campo não mexido
 * ia como `null`, e sob merge `null` APAGA. Janela errada, backend lento,
 * qualquer motivo — e a receita do cliente sumia.
 *
 * Omitir remove esse caminho por completo. Não existe mais um jeito de
 * esta função apagar um campo que ninguém pediu para apagar.
 * ============================================================
 *
 * O QUE O CONSOLIDADO AINDA FAZ AQUI: só a conferência de que sobra
 * alguma coisa depois da mudança (ver `NADA_A_RESPONDER`). Ele deixou de
 * ser necessário para preservar dado — e por isso **não bloqueia mais a
 * escrita quando falha**. Antes, não conseguir ler impedia gravar; agora
 * só enfraquece uma checagem local que o backend refaz.
 *
 * Função pura e fora do `"use server"`: a regra é sutil, e regra sutil que
 * nenhum conferidor alcança é regra em que ninguém confia.
 */

/**
 * O que o dono acabou de mexer.
 *
 * A distinção entre `undefined` e `null` **é o miolo**:
 *
 * - `undefined` — não mexeu neste campo. É OMITIDO do corpo, e o servidor
 *   preserva o que já tinha.
 * - `null` — disse "não sei". Vai explícito, e APAGA.
 * - número — o valor novo. `0` é resposta, não ausência.
 */
export interface OQueODonoMexeu {
  vendas?: number | null;
  receitaCentavos?: number | null;
}

export type MontagemDaResposta =
  | { ok: true; corpo: RespostaDoDono }
  | { ok: false; erro: string };

/**
 * O recado de quando não sobra resposta nenhuma.
 *
 * ============================================================
 * A CHECAGEM OLHA O RESULTADO, NÃO O PAYLOAD — como o backend passou a
 * fazer em 01/09.
 *
 * `vendas: null` num dia que já tem receita **é resposta válida**: ele
 * está apagando as vendas e mantendo a receita. Recusar isso porque "um
 * dos campos é null" olharia o payload, e o payload deixou de ser a
 * pergunta certa.
 *
 * O que não é resposta é o dia ficar SEM NADA depois da mudança.
 * ============================================================
 */
export const NADA_A_RESPONDER =
  "Responda pelo menos uma das duas — quantas vendas, ou quanto entrou.";

/** O que já está gravado naquele dia, segundo o consolidado. */
function doServidor(consolidado: ConsolidadoBase | null, dia: string) {
  const linha = consolidado?.dias.find((d) => d.dia === dia);
  return {
    vendas: linha?.viraramVenda ?? null,
    receitaCentavos: linha?.voltouCentavos ?? null,
  };
}

export function montarRespostaDoDono(args: {
  dia: string;
  /** o texto EXATO que a tela mostrou — obrigatório pelo contrato */
  pergunta: string;
  mexeu: OQueODonoMexeu;
  /**
   * O estado atual, quando deu para ler.
   *
   * `null` NÃO impede mais montar o corpo: com o merge, omitir preserva, e
   * o que se perde sem ele é só a checagem local de "sobrou alguma coisa"
   * — que o backend refaz de qualquer forma.
   */
  consolidado: ConsolidadoBase | null;
  origem?: RespostaDoDono["origem"];
}): MontagemDaResposta {
  const { dia, pergunta, mexeu, consolidado, origem } = args;

  const mexeuEmAlgo =
    mexeu.vendas !== undefined || mexeu.receitaCentavos !== undefined;
  if (!mexeuEmAlgo) return { ok: false, erro: NADA_A_RESPONDER };

  // O RESULTADO depois da mudança — é sobre ele que a checagem é feita.
  // Sem consolidado não dá para saber o que fica de pé, e aí a checagem é
  // pulada: o backend a refaz, e recusar aqui por não saber seria impedir
  // uma resposta legítima por causa de uma leitura que falhou.
  if (consolidado !== null) {
    const atual = doServidor(consolidado, dia);
    const vendasFinal = mexeu.vendas !== undefined ? mexeu.vendas : atual.vendas;
    const receitaFinal =
      mexeu.receitaCentavos !== undefined ? mexeu.receitaCentavos : atual.receitaCentavos;
    if (vendasFinal === null && receitaFinal === null) {
      return { ok: false, erro: NADA_A_RESPONDER };
    }
  }

  return {
    ok: true,
    corpo: {
      dia,
      // Omitidos quando não mexeu — ver o bloco do topo. `null` explícito
      // continua passando, porque apagar é uma escolha.
      ...(mexeu.vendas !== undefined ? { vendas: mexeu.vendas } : {}),
      ...(mexeu.receitaCentavos !== undefined
        ? { receitaCentavos: mexeu.receitaCentavos }
        : {}),
      pergunta,
      ...(origem ? { origem } : {}),
    },
  };
}

/**
 * O `respondeuNoDia` do backend serve para ESTE dia?
 *
 * ============================================================
 * O ECO É A CONDIÇÃO DE LEITURA, NÃO UM ENFEITE.
 *
 * O backend devolve `dia_da_pergunta` como eco do que foi pedido. Se ele
 * não bate com o dia que a tela vai perguntar, o `respondeuNoDia` é sobre
 * OUTRO dia — e acreditar nele mostraria o card errado, ou o esconderia
 * quando ele precisava aparecer.
 *
 * `null` no eco quer dizer que não pedimos; `null` no `respondeuNoDia`
 * com eco preenchido quer dizer que o dia está fora do período
 * consultado. Nos dois casos a resposta não serve.
 * ============================================================
 */
export function respostaConfiavelSobre(
  consolidado: ConsolidadoBase | null,
  dia: string,
): boolean | null {
  if (!consolidado) return null;
  if (consolidado.diaDaPergunta !== dia) return null;
  return consolidado.respondeuNoDia;
}

/**
 * O dia já foi respondido?
 *
 * O consolidado só traz dia com PELO MENOS UM dos lados. Com o coletor da
 * Meta desligado, o único lado possível é o do dono — então "o dia está
 * na lista" é hoje equivalente a "ele respondeu".
 *
 * **Quando o coletor ligar isso deixa de valer**: um dia com investimento
 * medido e sem resposta do dono passa a aparecer na lista. Por isso a
 * pergunta é feita pelos CAMPOS do dono, e não pela presença do dia.
 */
export function jaRespondeu(consolidado: ConsolidadoBase | null, dia: string): boolean {
  const linha = consolidado?.dias.find((d) => d.dia === dia);
  if (!linha) return false;
  return linha.viraramVenda !== null || linha.voltouCentavos !== null;
}
