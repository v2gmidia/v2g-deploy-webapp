import type { Consolidado, RespostaDoDono } from "./tipos";

/**
 * Montar o corpo do `POST /resposta-do-dono` sem apagar o que já estava lá.
 *
 * ============================================================
 * A ARMADILHA QUE ESTA FUNÇÃO EXISTE PARA FECHAR.
 *
 * A chave é `(id_execucao, dia)` e a escrita é upsert — então reenviar
 * **SUBSTITUI a linha inteira, não mescla**:
 *
 *   1ª resposta: vendas=2, receita=80000
 *   2ª resposta: vendas=5, SEM receita
 *   resultado  : vendas=5, receita=null   ← a receita foi APAGADA
 *
 * O contrato oferece duas saídas e manda escolher. Escolhemos a primeira
 * — reenviar sempre os dois campos — **com uma correção ao contrato**:
 *
 * ele diz "com os valores atuais NA TELA". Isso está errado. Uma aba
 * aberta há duas horas tem valores velhos, e reenviá-los reescreveria
 * dado novo por cima. Os valores atuais vêm do **CONSOLIDADO**, lido
 * agora, que é o estado real. A tela é memória; o servidor é fato.
 * ============================================================
 *
 * Função pura e fora do `"use server"` de propósito: a regra é sutil, e
 * regra sutil que nenhum conferidor alcança é regra em que ninguém
 * confia. Ver `conferir:dia-seguinte`.
 */

/**
 * O que o dono acabou de mexer.
 *
 * A distinção entre `undefined` e `null` **é o miolo**, e não é
 * preciosismo de tipo:
 *
 * - `undefined` — não mexeu neste campo. Vale o que está no servidor.
 * - `null` — disse "não sei". É apagamento DELIBERADO, e passa.
 * - número — o valor novo. `0` é resposta, não ausência.
 *
 * Sem essa separação, "não sei" e "não mexi" viram a mesma coisa, e uma
 * das duas fica errada: ou o botão "não sei" não apaga nada, ou abrir a
 * tela e salvar apaga o que já estava respondido.
 */
export interface OQueODonoMexeu {
  vendas?: number | null;
  receitaCentavos?: number | null;
}

export type MontagemDaResposta =
  | { ok: true; corpo: RespostaDoDono }
  | { ok: false; erro: string };

/**
 * O 422 do backend, evitado antes de sair daqui: "vendas e receita os
 * dois nulos: não é resposta, é ruído".
 *
 * Interceptar aqui não é desconfiar do backend — é não gastar um
 * round-trip para descobrir uma coisa que já dá para saber, e não
 * mostrar ao cliente um erro cru de API por uma condição que a tela
 * podia ter previsto.
 */
export const NADA_A_RESPONDER =
  "Responda pelo menos uma das duas — quantas vendas, ou quanto entrou.";

/** O que já está gravado naquele dia, segundo o consolidado. */
function doServidor(consolidado: Consolidado | null, dia: string) {
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
   * O estado real, lido agora. `null` quando não deu para ler — e aí
   * esta função **não inventa**: ver o bloco abaixo.
   */
  consolidado: Consolidado | null;
  origem?: RespostaDoDono["origem"];
}): MontagemDaResposta {
  const { dia, pergunta, mexeu, consolidado, origem } = args;

  const atual = doServidor(consolidado, dia);

  // ============================================================
  // SEM CONSOLIDADO, SÓ PASSA O QUE ELE MEXEU DE FATO.
  //
  // Não dá para "preservar" um valor que não se conseguiu ler. Mandar
  // `null` no campo não mexido seria apagar às cegas; mandar um palpite
  // seria pior. Então: se ele mexeu nos dois, a resposta é completa e
  // segue. Se mexeu num só e o outro é desconhecido, o que vai é o campo
  // mexido — e o outro é apagado pelo upsert.
  //
  // Isso é perda de dado, e é por isso que quem chama TEM que tentar ler
  // o consolidado antes. A tela de correção não deve ser oferecida sem
  // ele.
  // ============================================================
  const vendas = mexeu.vendas !== undefined ? mexeu.vendas : atual.vendas;
  const receitaCentavos =
    mexeu.receitaCentavos !== undefined ? mexeu.receitaCentavos : atual.receitaCentavos;

  if (vendas === null && receitaCentavos === null) {
    return { ok: false, erro: NADA_A_RESPONDER };
  }

  return {
    ok: true,
    corpo: {
      dia,
      vendas,
      receitaCentavos,
      pergunta,
      ...(origem ? { origem } : {}),
    },
  };
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
export function jaRespondeu(consolidado: Consolidado | null, dia: string): boolean {
  const linha = consolidado?.dias.find((d) => d.dia === dia);
  if (!linha) return false;
  return linha.viraramVenda !== null || linha.voltouCentavos !== null;
}
