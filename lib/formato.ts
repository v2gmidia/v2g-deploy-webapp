/**
 * Formatação de número e dinheiro em pt-BR.
 *
 * Existe como módulo porque /campanhas e /inicio mostram os mesmos
 * valores com as mesmas regras — e uma delas é sutil o bastante para
 * não querer duas versões: o retorno por real investido é sempre
 * ARREDONDADO PARA BAIXO.
 *
 * O protótipo dizia, na explicação do cálculo: "é uma estimativa
 * honesta: pode faltar venda aqui, nunca sobrar. Na dúvida,
 * arredondamos pra baixo". Arredondar para cima transformaria essa
 * frase em mentira na terceira casa decimal.
 *
 * ============================================================
 * A MOEDA É PARÂMETRO OBRIGATÓRIO, E É POR ISSO QUE 31 CHAMADAS MUDARAM.
 *
 * Até 10/09/2026 `dinheiro()` tinha `currency: "BRL"` cravado, e era a
 * única função de dinheiro que as telas vivas usavam. Com a Byond Colour
 * cobrando em dólar australiano no mesmo banco, isso é um erro de fator
 * de câmbio esperando o primeiro cliente estrangeiro: "A$ 113,45" e
 * "R$ 113,45" são o mesmo pixel e a diferença entre eles é de mais de
 * três para um.
 *
 * Podia ter virado parâmetro opcional com `"BRL"` de padrão. Não virou,
 * de propósito: padrão é o que ninguém revisa, e o chamador que herdasse
 * o padrão errado não apareceria em lugar nenhum. **Obrigatório força
 * cada chamada a declarar de que moeda está falando** — e as que falam de
 * dinheiro que o próprio cliente digitou em reais (verba, ticket médio)
 * passam `"BRL"` porque é verdade, não porque é o padrão.
 *
 * `null` sai SEM SÍMBOLO. É a regra que já valia em
 * `lib/resultado/ler.ts::dinheiroDaMoeda` e agora vale aqui: sem saber a
 * moeda, escrever um símbolo é escrever um número errado com aparência
 * de certo.
 * ============================================================
 */

/** O código ISO da moeda, como o backend manda. `BRL`, `AUD`. */
export type Moeda = string;

export function dinheiro(valor: number, moeda: Moeda | null): string {
  if (!moeda) {
    return valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: moeda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function numero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

/**
 * Retorno por real investido, arredondado para baixo em 2 casas.
 * `null` quando não houve investimento — dividir por zero aqui daria
 * `Infinity`, que apareceria na tela como um número absurdo.
 */
export function retornoPorReal(receita: number, investido: number): number | null {
  if (!investido || investido <= 0) return null;
  return Math.floor((receita / investido) * 100) / 100;
}

/**
 * Dinheiro que chegou em CENTAVOS inteiros.
 *
 * O backend do "dia seguinte" fala centavos ("centavos inteiros, nunca
 * float"), e o `dinheiro()` acima fala reais. A conversão acontece **na
 * hora de exibir**, aqui, e não na fronteira de rede: dividir por 100 ao
 * receber jogaria fora a garantia de inteiro logo na porta.
 *
 * `null` NÃO VIRA R$ 0,00. Quem chama decide o que escrever no lugar —
 * "não sabemos" e "não gastou nada" são coisas diferentes, e a tela que
 * as confunde mente sobre o dinheiro do cliente.
 */
export function dinheiroDeCentavos(centavos: number, moeda: Moeda | null): string {
  return dinheiro(centavos / 100, moeda);
}

/**
 * `2026-08-31` vira `sábado, 31/08`.
 *
 * ============================================================
 * DATA PARA O DONO LER LEVA O DIA DA SEMANA NA FRENTE. É PADRÃO.
 *
 * Ele lembra por dia da semana — "quantas vendas na quinta" —, não por
 * número do mês. Uma data crua sozinha obriga ele a traduzir de cabeça
 * antes de conseguir responder, e o custo dessa tradução aparece
 * exatamente onde a gente menos pode pagar: na hora de pedir um número.
 *
 * Nasceu no card da pergunta diária, em 03/09/2026, e o Victor definiu
 * como padrão no mesmo dia. Vale para toda data que o DONO lê. NÃO vale
 * para carimbo de auditoria — "você conferiu isso em 12/08" é registro,
 * não convite, e ali o dia da semana só faz ruído.
 *
 * As telas que ainda usam `toLocaleDateString` direto são anteriores a
 * esta regra: `/alertas`, `/meu-negocio`, `Saudacao`, `revisar-perfil`.
 * Migrar cada uma exige decidir, caso a caso, se aquela data é para ler
 * ou para conferir — e por isso não foi feito em massa.
 * ============================================================
 *
 * Montada com `Date.UTC` e lida em UTC de propósito: a string já é o dia
 * certo em São Paulo (ver `lib/dia-seguinte/dia.ts`), e passá-la por fuso
 * de novo poderia deslocá-la um dia.
 */
export function diaPorExtenso(dia: string): string {
  const [ano, mes, d] = dia.split("-").map(Number) as [number, number, number];
  const data = new Date(Date.UTC(ano, mes - 1, d));
  const semana = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: "UTC",
  }).format(data);
  return `${semana}, ${String(d).padStart(2, "0")}/${String(mes).padStart(2, "0")}`;
}
