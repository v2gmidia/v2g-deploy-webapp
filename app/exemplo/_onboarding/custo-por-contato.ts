/**
 * QUANTO CUSTA CADA CONTATO, POR TIPO DE NEGÓCIO — e o mínimo indicado
 * que sai disso.
 *
 * ============================================================
 * AS TRÊS SIGLAS NÃO EXISTEM NA TELA. Nem aqui, fora deste aviso: o
 * cliente lê "quanto custa cada contato", e é só isso que as funções
 * abaixo escrevem. Quem procurar por CPL, CPA ou ROAS no que o dono lê
 * não vai achar.
 * ============================================================
 *
 * ============================================================
 * DE ONDE VÊM OS NÚMEROS, E DE ONDE NÃO VÊM.
 *
 * **Não vêm do backend.** Medido em 20/09/2026: o `GET /nichos` entrega
 * `nicho`, `rotulo`, `termosDeBusca` e `subTipos` — e mais nada
 * (`lib/nichos/tipos.ts:20-48`). O custo-alvo por contato existe no
 * produto como saída do agente `diagnosticar-orcamento`, e
 * `docs/contrato-do-dashboard.md:360` registra que ele **ainda não
 * existe** para nenhum cliente.
 *
 * Os três abaixo foram informados pelo Victor em 20/09/2026, no chat,
 * como números reais da operação. Estão aqui porque a alternativa era a
 * tela não ter o que mostrar em nicho nenhum — não porque o produto já os
 * sirva. **Todo nicho fora desta tabela devolve `null`, e a tela diz que
 * não sabe.** Inventar a faixa de um nicho para ele não ficar sem frase é
 * exatamente o que este arquivo existe para impedir.
 *
 * O dia em que o backend mandar a faixa, esta tabela morre e a leitura
 * passa a ser do nicho vindo da rota. Ver DUVIDAS.md, DUVIDA-ONB-4.
 * ============================================================
 */

/**
 * Quantos contatos por mês justificam o serviço.
 *
 * UM LUGAR SÓ, como pedido: é o número que vai mudar quando alguém medir
 * quantos contatos um cliente precisa para renovar.
 */
export const CONTATOS_QUE_JUSTIFICAM = 15;

/**
 * A folga sobre o custo de referência, porque leilão não entrega média.
 * 15% — o mínimo indicado não pode ser calculado no fio do valor típico,
 * senão ele erra para baixo na metade dos meses.
 */
export const FOLGA = 0.15;

/**
 * O custo típico de um contato, em reais, por nicho do backend.
 *
 * As chaves são os `nicho` de `knowledge/` (os mesmos que o `GET /nichos`
 * devolve), não rótulos de tela.
 */
/**
 * ============================================================
 * DOIS DOS TRÊS NICHOS QUE O VICTOR CITOU NÃO EXISTEM NO BACKEND.
 *
 * Medido em 21/09/2026 contra o `GET /nichos`: a lista viva tem oito
 * nichos, e `distribuidora-de-bebidas` e `agencia-de-marketing` não estão
 * entre eles. Eram nomes da lista inventada da v2.
 *
 * O que sobrou, e o que eu fiz com cada número:
 *
 *   arquitetura R$ 60   MANTIDO. O nicho existe com esse nome exato.
 *   agência R$ 30       MOVIDO para `gestao-de-trafego`, que é o nicho
 *                       real mais próximo ("Gestão de tráfego pago /
 *                       anúncios no Google e no Instagram para pequeno
 *                       negócio"). É MAPEAMENTO MEU, não do Victor, e
 *                       está marcado como tal em DUVIDAS.md.
 *   bebidas R$ 7        SEM DESTINO. Não há nicho de bebidas na lista.
 *                       O número não foi jogado em cima de outro nicho:
 *                       ficaria custo de um negócio valendo para outro.
 *
 * Os seis nichos sem custo caem no caminho "ainda não temos a média",
 * que já existe e já está capturado.
 * ============================================================
 */
const CUSTO_TIPICO: Record<string, number> = {
  // informado pelo Victor em 20/09/2026, nicho confirmado no GET /nichos
  arquitetura: 60,
  // o "agência ~R$ 30" do Victor, mapeado por mim — ver DUVIDA-ONB-13
  "gestao-de-trafego": 30,
};

/** O que a tela precisa saber para escrever a frase. Nunca inventa. */
export interface CustoDoNicho {
  /** reais por contato, típico */
  porContato: number;
  /** o mínimo indicado por mês, já com folga */
  minimoIndicado: number;
}

export function custoDoNicho(nicho: string | null): CustoDoNicho | null {
  if (!nicho) return null;
  const porContato = CUSTO_TIPICO[nicho];
  if (porContato === undefined) return null;
  return {
    porContato,
    minimoIndicado: Math.round(porContato * (1 + FOLGA) * CONTATOS_QUE_JUSTIFICAM),
  };
}

const reais = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor);

/**
 * O TEXTO VIVO DE BAIXO DO SLIDER.
 *
 * Duas formas, e a segunda não é degradação: é a verdade quando o custo
 * por contato do nicho não é conhecido. Ela diz o que sabe (o valor por
 * dia, que é divisão) e recusa a parte que exigiria um número que ninguém
 * mediu.
 *
 * O "uns" antes dos números é deliberado: são estimativas de leilão, e
 * escrever "7 contatos" cravado prometeria precisão que não existe.
 */
export function frasesDoSlider(
  mensal: number,
  custo: CustoDoNicho | null,
  /**
   * O piso operacional da casa (R$ 750). Entra aqui porque o indicado do
   * nicho pode ficar ABAIXO dele — em bebidas, com contato a R$ 7, os 15
   * contatos saem por R$ 121. Escrever "o indicado é R$ 121" numa tela
   * que não roda abaixo de R$ 750 é a tela se contradizendo sozinha.
   */
  piso: number,
): string[] {
  // TRUNCA, não arredonda: R$ 500 dão R$ 16,67 por dia, e escrever
  // "R$ 17 por dia" prometeria mais do que o dia entrega. Para baixo é o
  // lado que não frustra. (O briefing de 20/09 usa 16 no exemplo dele.)
  const porDia = Math.floor(mensal / 30);
  const abertura = `${reais(mensal)} por mês são ${reais(porDia)} por dia.`;

  if (!custo) {
    return [
      abertura,
      "Ainda não temos a média de custo por contato do seu tipo de negócio, então não dá para estimar quantos contatos isso traz.",
    ];
  }

  const contatos = Math.floor(mensal / custo.porContato);
  const fecho =
    custo.minimoIndicado >= piso
      ? `Para uns ${CONTATOS_QUE_JUSTIFICAM}, o indicado é ${reais(custo.minimoIndicado)}.`
      : // O indicado do nicho ficou abaixo do piso da casa. Quem manda é o
        // piso, e a frase diz os dois números em vez de esconder um deles.
        `Para uns ${CONTATOS_QUE_JUSTIFICAM}, ${reais(custo.minimoIndicado)} bastariam — mas ${reais(piso)} é o mínimo para a gente conseguir rodar.`;

  return [
    abertura,
    `No seu tipo de negócio, cada contato custa uns ${reais(custo.porContato)} — então dá uns ${contatos} ${contatos === 1 ? "contato" : "contatos"} no mês.`,
    fecho,
  ];
}
