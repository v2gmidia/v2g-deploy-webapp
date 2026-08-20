/**
 * Confere as regras da VERBA e do ALCANCE — o lote QA-3.
 *
 * POR QUE ESTE CONFERIDOR EXISTE. Os dois defeitos que ele cobre são
 * invisíveis para o build e para o typecheck:
 *
 *  - o piso e o teto da verba só apareceriam com alguém digitando R$ 5,00
 *    numa sessão real, e em DUAS telas diferentes (`/verba` e
 *    `/meu-negocio`), que até este lote discordavam entre si;
 *  - o estado do alcance dependia de um `if/else` de dois ramos onde
 *    existem três, e o ramo errado ACUSAVA o cliente. Em 20/08/2026 as
 *    quatro linhas de `businesses` caíam nesse ramo.
 *
 * TESTA OS DOIS LADOS DE CADA CORTE, sempre. Um teste que só olha o lado
 * em que nada acontece passa sem provar nada — já aconteceu quatro vezes
 * neste projeto.
 *
 * O §0 é controle negativo: se o mecanismo de asserção não estiver pegando
 * erro, todo o verde abaixo é verde sem valor.
 *
 * Roda com `pnpm conferir:verba`. Não toca no banco e não precisa de rede.
 */

import { converterValor } from "../lib/perfil/valores.ts";
import { CAMPOS_DO_CLIENTE } from "../lib/perfil/catalogo-cliente.ts";
import {
  DIAS,
  PISO_MENSAL_DA_CASA,
  TETO_DIARIO_ABSOLUTO_CENTAVOS,
  TETO_MENSAL_DA_CASA,
} from "../lib/verba/limites.ts";
import { cidadeParaTela, estadoDoAlcance } from "../lib/verba/alcance.ts";

let falhas = 0;
let testes = 0;

function ok(condicao: boolean, rotulo: string) {
  testes += 1;
  if (condicao) {
    console.log(`  ok    ${rotulo}`);
  } else {
    falhas += 1;
    console.log(`  FALHA ${rotulo}`);
  }
}

function secao(titulo: string) {
  console.log(`\n${titulo}`);
}

// ---------------------------------------------------------------- §0

secao("0. controle negativo — a asserção pega erro quando existe");
{
  const antes = falhas;
  ok(false, "esta linha TEM que falhar (se ela passar, o resto não vale nada)");
  const pegou = falhas === antes + 1;
  falhas = antes;
  testes -= 1;
  ok(pegou, "`ok(false, …)` conta como falha — o placar abaixo vale alguma coisa");
}

// ---------------------------------------------------------------- §1

secao("1. os limites são UM número só, não uma cópia por tela");
{
  ok(PISO_MENSAL_DA_CASA === 150, `piso da casa = R$ ${PISO_MENSAL_DA_CASA},00/mês`);
  ok(PISO_MENSAL_DA_CASA / DIAS === 5, "que dá R$ 5,00 por dia");
  ok(
    TETO_MENSAL_DA_CASA === (TETO_DIARIO_ABSOLUTO_CENTAVOS * DIAS) / 100,
    "o teto mensal é derivado do teto diário, não escrito duas vezes",
  );
  ok(
    TETO_MENSAL_DA_CASA === 30_000,
    `teto = R$ ${TETO_MENSAL_DA_CASA.toLocaleString("pt-BR")},00/mês`,
  );
}

// ---------------------------------------------------------------- §2

secao("2. a `/meu-negocio` grava a verba com as MESMAS regras da `/verba`");

const campoVerba = CAMPOS_DO_CLIENTE.find((c) => c.chave === "businesses.monthly_budget");
const campoTicket = CAMPOS_DO_CLIENTE.find((c) => c.chave === "businesses.avg_ticket_min");

{
  ok(campoVerba !== undefined, "o campo da verba existe no catálogo do cliente");
  ok(campoTicket !== undefined, "e o do ticket também, para o controle do §2.3");
}

/** Os dois lados de cada corte, e os valores exatos do relato do QA. */
const CASOS: Array<{ entrada: string; aceita: boolean; nota: string }> = [
  // ---- o piso, dos dois lados
  { entrada: "5", aceita: false, nota: "R$ 5,00 — o valor do QA, que dava R$ 0,17 por dia" },
  { entrada: "149,99", aceita: false, nota: "R$ 149,99 — um centavo abaixo do piso" },
  { entrada: "150", aceita: true, nota: "R$ 150,00 — exatamente o piso, e ele PASSA" },
  { entrada: "150,01", aceita: true, nota: "R$ 150,01 — um centavo acima" },
  // ---- o teto, dos dois lados
  { entrada: "29.999,99", aceita: true, nota: "R$ 29.999,99 — um centavo abaixo do teto" },
  { entrada: "30.000", aceita: true, nota: "R$ 30.000,00 — exatamente o teto, e ele PASSA" },
  { entrada: "30.000,01", aceita: false, nota: "R$ 30.000,01 — um centavo acima" },
  {
    entrada: "999999999",
    aceita: false,
    nota: "R$ 999.999.999,00 — o outro valor do QA, que era aceito",
  },
  // ---- o que já era recusado antes deste lote, e continua sendo
  { entrada: "0", aceita: false, nota: "zero continua recusado (campo em branco tem outro caminho)" },
  { entrada: "-1", aceita: false, nota: "negativo continua recusado" },
  { entrada: "abc", aceita: false, nota: "letra continua recusada" },
];

secao("2.1 o piso e o teto, os dois lados de cada corte");
for (const caso of CASOS) {
  const r = converterValor(campoVerba!, caso.entrada);
  ok(r.ok === caso.aceita, `${caso.nota} → ${r.ok ? "aceito" : "recusado"}`);
}

secao("2.2 a recusa diz de QUEM é o mínimo — nosso, não do Facebook");
{
  const r = converterValor(campoVerba!, "5");
  const msg = r.ok ? "" : r.mensagem;
  ok(!r.ok && /[Nn]osso mínimo/.test(msg), "a frase chama o mínimo de NOSSO");
  ok(
    !r.ok && /Facebook é outro/.test(msg),
    "e diz explicitamente que o do Facebook é outro",
  );
  ok(
    !r.ok && !/o Facebook (não aceita|exige|pede) esse valor/i.test(msg),
    "e NÃO atribui o nosso piso ao Facebook",
  );
  // O espaço aqui é NÃO SEPARÁVEL (U+00A0), e não é detalhe: é o que o
  // `Intl` de pt-BR produz, e é por causa dele que "R$ 2.000,00" é um
  // bloco indivisível que ESTOURA a faixa em vez de quebrar linha — o
  // mecanismo do D7. A primeira versão desta asserção procurava um espaço
  // comum e falhava contra um código correto.
  ok(!r.ok && msg.includes("R$ 150,00"), "o número aparece em reais, formatado");
  ok(
    !r.ok && !msg.includes("R$ 150,00"),
    "e com o espaço não separável do `Intl`, não com um espaço comum",
  );
}

secao("2.3 controle: o piso da verba NÃO vazou para os outros campos de dinheiro");
{
  // Se a regra tivesse sido escrita contra `dinheiro` ou contra `dificil` em
  // vez da chave, um ticket de R$ 50 passaria a ser recusado — e o cliente
  // de padaria tem ticket de R$ 20. É o mesmo erro que já aconteceu neste
  // arquivo com `dificil` (ver o comentário do zero em `valores.ts`).
  const r = converterValor(campoTicket!, "50");
  ok(r.ok, "ticket de R$ 50,00 continua aceito");
  const r2 = converterValor(campoTicket!, "0");
  ok(!r2.ok, "e o zero do ticket continua recusado, como antes");
}

// ---------------------------------------------------------------- §3

secao("3. o alcance tem TRÊS estados, e o terceiro não acusa ninguém");
{
  ok(
    estadoDoAlcance({ geo_lat: -22.96037, geo_key: null }) === "ponto",
    "com coordenada → ponto (o raio que ele escolheu está valendo)",
  );
  ok(
    estadoDoAlcance({ geo_lat: null, geo_key: "BR:riodejaneiro" }) === "cidade",
    "sem coordenada e com chave de cidade → cidade inteira",
  );
  ok(
    estadoDoAlcance({ geo_lat: null, geo_key: null }) === "nao_sabemos",
    "sem nada → não sabemos — NÃO 'a página dele está sem endereço'",
  );
  ok(
    estadoDoAlcance({ geo_lat: undefined, geo_key: null }) === "nao_sabemos",
    "`undefined` (coluna ausente do select) também é não sabemos",
  );
  // O estado que a tela ANTES nunca conseguia mostrar: a cascata resolveu a
  // cidade e a tela continuava dizendo que não sabia onde o negócio ficava,
  // porque o `select` nem lia `geo_key`.
  ok(
    estadoDoAlcance({ geo_lat: null, geo_key: "BR:sorocaba" }) !== "nao_sabemos",
    "cidade resolvida não cai mais no ramo de 'não sabemos'",
  );
}

secao("3.1 as quatro linhas reais de `businesses`, como estavam em 20/08/2026");
{
  // Medidas no Supabase `V2G-SITE`. Todas com geo_lat, geo_key e
  // geo_resolved_at nulos: a cascata nunca rodou para ninguém.
  const REAIS = [
    { nome: "a85c37a9 (V2G)", geo_lat: null, geo_key: null },
    { nome: "0de3321a (legado)", geo_lat: null, geo_key: null },
    { nome: "a0328fb8 (fictício)", geo_lat: null, geo_key: null },
    { nome: "f0f0ca84 (nova)", geo_lat: null, geo_key: null },
  ];
  for (const linha of REAIS) {
    ok(
      estadoDoAlcance(linha) === "nao_sabemos",
      `${linha.nome} → não sabemos (antes: "sua página está sem endereço")`,
    );
  }
}

// ---------------------------------------------------------------- §4

secao("4. a cidade aparece na frase como cidade, não como o cliente digitou");
{
  ok(cidadeParaTela("Rio de janeiro") === "Rio de Janeiro", "o valor real da conta medida");
  ok(cidadeParaTela("SÃO PAULO") === "São Paulo", "caixa alta inteira");
  ok(cidadeParaTela("sorocaba") === "Sorocaba", "tudo minúsculo");
  ok(cidadeParaTela("  belo   horizonte ") === "Belo Horizonte", "espaço sobrando");
  ok(cidadeParaTela("santa bárbara d'oeste") === "Santa Bárbara D'oeste", "acento e apóstrofo");
  // As preposições no MEIO ficam minúsculas; a primeira palavra nunca.
  ok(cidadeParaTela("de castro") === "De Castro", "preposição na primeira posição é maiúscula");
}

// ---------------------------------------------------------------- placar

console.log(
  `\n${falhas === 0 ? "TUDO CERTO" : "TEM FALHA"} — ${testes - falhas}/${testes} conferências`,
);
process.exit(falhas === 0 ? 0 : 1);
