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

/**
 * A data curta, para CARIMBO — `2026-09-05` vira `05/09`.
 *
 * Irmã de `diaPorExtenso`, e a diferença entre as duas é a regra do
 * `docs/padrao-visual.md` §8: data que o dono LÊ leva o dia da semana
 * ("quantas vendas na quinta?"); data que ele CONFERE, não. Um rótulo de
 * período ao lado de um número é conferência — "sexta-feira, 05/09 a
 * domingo, 07/09" gasta uma linha inteira para dizer o que dois pares de
 * dígitos dizem.
 *
 * `Date.UTC` + `timeZone: "UTC"` pelo mesmo motivo de `diaPorExtenso`:
 * sem isso, `2026-09-05` no fuso de São Paulo vira 04/09.
 */
export function diaCurto(dia: string): string {
  const p = dia.split("-").map(Number);
  return new Date(Date.UTC(p[0] ?? 1970, (p[1] ?? 1) - 1, p[2] ?? 1)).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

/**
 * O SÍMBOLO da moeda, sozinho — `"BRL"` vira `R$`.
 *
 * ============================================================
 * EXISTE PARA O CAMPO DE DINHEIRO NÃO FICAR SEM MOEDA. ITEM B4.
 *
 * O campo de receita da pergunta diária mostrava `1.600,00`, seco, com
 * `placeholder="Ex: 1.600,00"` escrito à mão. É a única superfície de
 * dinheiro do produto que não passava por função de formato nenhuma — e
 * a regra do B4 é que dinheiro sempre apareça com moeda, pela função.
 *
 * Num campo a omissão é pior que numa leitura, e é por isso que ela vale
 * uma função: o dono está DIGITANDO, e o que ele digita vira
 * `voltou_centavos` no banco. Um campo sem moeda pergunta "quanto?" sem
 * dizer em quê — e a resposta dele é justamente o número que a tela de
 * resultado vai mostrar de volta com `R$` na frente.
 *
 * SAI DO `Intl`, e não de uma tabela `{ BRL: "R$" }`. Tabela escrita à
 * mão é a lista paralela de sempre: ela envelhece calada, e a primeira
 * moeda que faltar vira string vazia sem ninguém saber. `formatToParts`
 * pergunta ao mesmo mecanismo que `dinheiro()` usa para escrever — os
 * dois não têm como divergir.
 *
 * `null` DEVOLVE STRING VAZIA, e é a mesma regra de `dinheiro()`: sem
 * moeda declarada não se escreve símbolo. Quem chama não põe nada na
 * frente do campo, em vez de pôr um `R$` chutado.
 * ============================================================
 */
export function simboloDaMoeda(moeda: Moeda | null): string {
  if (!moeda) return "";
  const partes = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: moeda,
  }).formatToParts(0);
  return partes.find((p) => p.type === "currency")?.value ?? "";
}
