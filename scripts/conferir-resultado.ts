/**
 * A camada de leitura do resultado — `pnpm conferir:resultado`
 *
 * ============================================================
 * ELA MOSTRA DINHEIRO DO CLIENTE, E ERRO AQUI É AFIRMAÇÃO FALSA SOBRE
 * O DINHEIRO DELE.
 *
 * Três formas de errar, e as três já foram catalogadas:
 *
 *   `null` virando zero        "você não gastou nada" quando a verdade é
 *                              "o coletor está desligado"
 *   moeda ausente virando R$   "R$ 113,45" para uma conta que cobra em
 *                              dólar australiano — erro de 3x
 *   soma entre moedas          R$ 73,25 + A$ 113,45 = um número que não
 *                              existe em lugar nenhum
 * ============================================================
 *
 * Puro: não toca rede nem banco.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resultadoParaTela, dinheiroDaMoeda, AINDA_NAO_SABEMOS } from "../lib/resultado/ler.ts";
import { NIVEIS, fraseDoNivel, SEM_NIVEL, ehNivel } from "../lib/resultado/nivel.ts";
import type { ConsolidadoCru, LinhaCrua } from "../lib/resultado/tipos.ts";

const RAIZ = resolve(import.meta.dirname, "..");

let passou = 0;
let falhou = 0;

function ok(condicao: boolean, rotulo: string) {
  if (condicao) {
    passou++;
    console.log("  ok   ", rotulo);
  } else {
    falhou++;
    console.log("  FALHA", rotulo);
  }
}

function secao(t: string) {
  console.log("\n" + t);
}

console.log("\nA camada de leitura do resultado\n" + "=".repeat(64));

// ---------------------------------------------------------------- §0

secao("0. controle negativo — a asserção pega erro quando existe");
ok(true, "`ok(true, …)` conta como acerto");
{
  const antes = falhou;
  ok(false, "ESTA LINHA TEM QUE FALHAR (se ela passar, ignore o resto)");
  const pegou = falhou === antes + 1;
  falhou = antes;
  ok(pegou, "e a falha foi contada — o placar abaixo vale alguma coisa");
}

// ---------------------------------------------------------------- fixtures

const dia = (p: Partial<LinhaCrua> & { dia: string }): LinhaCrua => ({
  investiuCentavos: null,
  pessoasQueChegaram: null,
  viraramVenda: null,
  voltouCentavos: null,
  ...p,
});

const consolidado = (dias: LinhaCrua[], extra: Partial<ConsolidadoCru> = {}): ConsolidadoCru => ({
  desde: "2026-08-12",
  ate: "2026-09-10",
  dias,
  investiuCentavos: null,
  voltouCentavos: null,
  pessoasQueChegaram: null,
  vendas: null,
  retornoPorReal: null,
  diasComOsDoisLados: 0,
  temDadoDaPlataforma: false,
  ...extra,
});

// ---------------------------------------------------------------- §1

secao("1. `null` NÃO É ZERO — do lado da leitura, como já é do lado da resposta");
{
  const r = resultadoParaTela({ recorte: consolidado([dia({ dia: "2026-09-01" })]) });
  const b = r.blocos[0]!;

  ok(b.investido.ausente, "investido sem dado vem marcado como ausente");
  ok(b.investido.texto === AINDA_NAO_SABEMOS, `e o texto é "${AINDA_NAO_SABEMOS}"`);
  ok(!/0|R\$|zero/i.test(b.investido.texto), "e não contém zero nem cifrão");

  // ============================================================
  // A REGRA QUE O BACKEND ESCREVEU COM TODAS AS LETRAS:
  // nada de "0 pessoas chegaram" enquanto o medido for null.
  // ============================================================
  ok(b.pessoas.ausente, "pessoas sem dado é AUSENTE, nunca `0`");
  ok(!/^0$/.test(b.pessoas.texto), 'e o texto nunca é o literal "0"');

  const comZero = resultadoParaTela({
    recorte: consolidado([dia({ dia: "2026-09-01", pessoasQueChegaram: "0", viraramVenda: 0 })]),
  });
  const z = comZero.blocos[0]!;
  ok(!z.pessoas.ausente && z.pessoas.texto === "0", "zero MEDIDO aparece como 0 — é resposta");
  ok(!z.vendas.ausente && z.vendas.texto === "0", "e zero venda também: é sinal forte, não silêncio");
}

// ---------------------------------------------------------------- §2

secao("2. a moeda — o erro de 3x");
{
  ok(dinheiroDaMoeda(11345, "AUD").includes("113,45"), "AUD formata o número");

  // ============================================================
  // `AU$`, E NÃO `A$`. O briefing escreve "A$ 113,45", que é como um
  // australiano lê. Quem lê esta tela é brasileiro, e o `pt-BR` do próprio
  // ICU escreve `AU$ 113,45` — medido, não escolhido por mim.
  //
  // E NÃO se usa `currencyDisplay: "narrowSymbol"`, que daria só `$ 113,45`
  // — indistinguível de dólar americano. Num campo que fala do dinheiro do
  // cliente, o símbolo ambíguo é pior que o símbolo comprido.
  // ============================================================
  ok(dinheiroDaMoeda(11345, "AUD").includes("AU$"), "e marca `AU$` — o pt-BR do dólar australiano");
  ok(dinheiroDaMoeda(7325, "BRL").includes("R$"), "BRL sai com R$");
  ok(
    dinheiroDaMoeda(11345, "AUD") !== dinheiroDaMoeda(11345, "BRL"),
    "A$ 113,45 e R$ 113,45 NÃO saem iguais — é o buraco que motivou o campo",
  );

  // ============================================================
  // O CASO DE HOJE: a moeda não vem. Chutar R$ seria escrever número
  // errado com aparência de certo.
  // ============================================================
  const semMoeda = dinheiroDaMoeda(11345, null);
  ok(!/R\$|A\$|\$/.test(semMoeda), "SEM moeda, não sai símbolo nenhum");
  ok(semMoeda.includes("113,45"), "mas o número continua legível");
}

// ---------------------------------------------------------------- §3

secao("3. moedas diferentes NUNCA somam — decisão do Victor, 10/09");
{
  const r = resultadoParaTela({
    recorte: consolidado([
      dia({ dia: "2026-09-01", investiuCentavos: 7325, moeda: "BRL" }),
      dia({ dia: "2026-09-02", investiuCentavos: 11345, moeda: "AUD" }),
    ]),
  });

  ok(r.moedasMisturadas, "duas moedas no recorte são ANUNCIADAS");
  ok(r.blocos.length === 2, "e viram dois blocos, não um total");

  const aud = r.blocos.find((b) => b.moeda === "AUD")!;
  const brl = r.blocos.find((b) => b.moeda === "BRL")!;
  ok(aud.investido.texto.includes("113,45"), "o bloco AUD tem só o valor AUD");
  ok(brl.investido.texto.includes("73,25"), "o bloco BRL tem só o valor BRL");
  ok(
    !r.blocos.some((b) => b.investido.texto.includes("186")),
    "e 73,25 + 113,45 = 186,70 NÃO aparece em lugar nenhum",
  );

  const uma = resultadoParaTela({
    recorte: consolidado([
      dia({ dia: "2026-09-01", investiuCentavos: 1000, moeda: "BRL" }),
      dia({ dia: "2026-09-02", investiuCentavos: 2500, moeda: "BRL" }),
    ]),
  });
  ok(!uma.moedasMisturadas, "moeda única não é misturada");
  ok(uma.blocos[0]!.investido.texto.includes("35,00"), "e aí SOMA: 10,00 + 25,00 = 35,00");
}

// ---------------------------------------------------------------- §4

secao("4. a soma preserva a ausência");
{
  const r = resultadoParaTela({
    recorte: consolidado([
      dia({ dia: "2026-09-01" }),
      dia({ dia: "2026-09-02", investiuCentavos: 1000, moeda: "BRL" }),
    ]),
  });
  ok(!r.blocos[0]!.investido.ausente, "um dia com dado entre vazios: o total existe");
  ok(r.blocos[0]!.investido.texto.includes("10,00"), "e é a soma do que tem dado");

  const nada = resultadoParaTela({
    recorte: consolidado([dia({ dia: "2026-09-01" }), dia({ dia: "2026-09-02" })]),
  });
  ok(nada.blocos[0]!.investido.ausente, "TODOS os dias sem dado: o total é ausente, não zero");
}

// ---------------------------------------------------------------- §5

secao("5. as sete frases da escada");
{
  ok(NIVEIS.length === 7, `são sete níveis (${NIVEIS.length})`);
  for (const n of NIVEIS) {
    const f = fraseDoNivel(n);
    ok(f.titulo.length > 0 && f.corpo.length > 0, `\`${n}\` tem título e corpo`);
  }

  // ============================================================
  // NENHUMA PODE SOAR COMO ERRO — é o pedido literal do lote. E nenhuma
  // pode ter jargão, que é a regra do CLAUDE.md.
  // ============================================================
  const JARGAO = /\bCTR\b|\bROAS\b|\bCPM\b|\bCPA\b|\bCPC\b|convers(ão|ões)|otimiza|impress(ão|ões)|lead\b/i;
  const SOA_COMO_ERRO = /\berro\b|\bfalha\b|\binválid|\bproblema\b|\bnão foi possível\b|\bimpossível\b/i;
  const DIMINUTIVO = /inh[ao]s?\b|zinh[ao]s?\b/i;

  for (const n of [...NIVEIS, "SEM_NIVEL"] as const) {
    const f = n === "SEM_NIVEL" ? SEM_NIVEL : fraseDoNivel(n as (typeof NIVEIS)[number]);
    const texto = `${f.titulo} ${f.corpo}`;
    ok(!JARGAO.test(texto), `\`${n}\` sem jargão de tráfego`);
    ok(!SOA_COMO_ERRO.test(texto), `\`${n}\` não soa como erro`);
    ok(!DIMINUTIVO.test(texto), `\`${n}\` sem diminutivo`);
  }

  // A do aprendizado precisa dizer para não mexer: pausar no dia 3 é o
  // comportamento mais destrutivo do cliente ansioso.
  ok(
    /não mexa|nao mexa/i.test(fraseDoNivel("em_aprendizado").corpo),
    "`em_aprendizado` pede explicitamente para NÃO mexer na campanha",
  );

  ok(!ehNivel("alerta_urgente"), "`alerta_urgente` não é nível — é o que sai no lugar de sem_medicao");
  ok(ehNivel("sem_medicao"), "e `sem_medicao` está declarado, mesmo inalcançável hoje");
}

// ---------------------------------------------------------------- §6

secao("6. o nível vem da janela CANÔNICA, não do recorte");
{
  const recorte = consolidado([dia({ dia: "2026-09-09" })], {
    nivel: "ok",
    desde: "2026-09-09",
    ate: "2026-09-09",
  });
  const canonico = consolidado([dia({ dia: "2026-08-12" })], { nivel: "em_aprendizado" });

  const r = resultadoParaTela({ recorte, canonico });
  ok(
    r.titulo === fraseDoNivel("em_aprendizado").titulo,
    "com os dois, quem manda é o CANÔNICO — o recorte não muda o diagnóstico",
  );
  ok(r.periodo.desde === "2026-09-09", "mas o período mostrado é o do RECORTE");

  const so = resultadoParaTela({ recorte });
  ok(so.titulo === fraseDoNivel("ok").titulo, "sem canônico, cai no recorte");
}

// ---------------------------------------------------------------- §7

secao("7. o estado de HOJE: sem nível, degrada sem inventar");
{
  const r = resultadoParaTela({ recorte: consolidado([dia({ dia: "2026-09-01", viraramVenda: 10 })]) });
  ok(!r.nivelVeio, "sem `nivel` no payload, `nivelVeio` é falso");
  ok(r.titulo === SEM_NIVEL.titulo, "e a frase é a de degradação");
  ok(
    !NIVEIS.some((n) => fraseDoNivel(n).titulo === r.titulo),
    "que NÃO é nenhuma das sete — não se deduz nível por conta própria",
  );
}

// ---------------------------------------------------------------- §8

secao("8. o que a camada se RECUSA a fazer");
{
  // ============================================================
  // Lido do CÓDIGO, não da intenção. Uma regra escrita só no comentário é
  // uma regra que a próxima pessoa não vê.
  // ============================================================
  const fonte = ["lib/resultado/ler.ts", "lib/resultado/nivel.ts", "lib/resultado/tipos.ts"]
    .map((f) => readFileSync(resolve(RAIZ, f), "utf8"))
    .join("\n");
  // ============================================================
  // COMENTÁRIO **E TEXTO DE TELA** SAEM ANTES DA BUSCA.
  //
  // A primeira versão acusava "não existe nota nem semáforo" por causa da
  // frase do `sem_alvo`: "não dá para dizer se o preço está bom". A copy
  // legítima usa as mesmas palavras que o código proibido usaria.
  //
  // Este conferidor confere CÓDIGO. Quem confere a copy é o §5, e lá as
  // strings são justamente o que se lê.
  // ============================================================
  const semComentario = fonte
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(new RegExp(String.raw`"(?:[^"\\]|\\.)*"`, "g"), '""')
    .replace(new RegExp(String.raw`'(?:[^'\\]|\\.)*'`, "g"), "''")
    .replace(new RegExp(String.raw`\`(?:[^\`\\]|\\.)*\``, "g"), "``");

  ok(
    !/\bcpc\b|custo_por_clique|custoPorClique|porClique/i.test(semComentario),
    "não existe custo por clique — é derivável e convida a comparar com número de terceiro",
  );
  ok(
    !/\/\s*cliques|cliques\s*\)|investido\s*\/\s/.test(semComentario.replace(/\n/g, " ")) ||
      !/investi\w*\s*\/\s*\w*clique/i.test(semComentario),
    "e nada divide investimento por cliques",
  );
  ok(
    !/\bbom\b|\bruim\b|\bnota\b|semaforo|semáforo|\bverde\b|\bvermelho\b|\bscore\b/i.test(semComentario),
    "não existe nota nem semáforo — opinião fingindo ser medida",
  );
  ok(
    !/\?\?\s*0\b/.test(semComentario.replace(/cliques \?\? null/g, "")),
    "não existe `?? 0` — é como ausência vira zero sem ninguém perceber",
  );
}

// ---------------------------------------------------------------- placar

console.log("\n" + "=".repeat(64));
if (falhou === 0) {
  console.log(`TUDO CERTO — ${passou}/${passou} conferências`);
} else {
  console.log(`TEM FALHA — ${passou}/${passou + falhou} conferências`);
  process.exitCode = 1;
}
console.log(
  "\nISTO CONFERE A CAMADA, NÃO A TELA — que ainda não existe. E não\n" +
    "confere o contrato: `moeda`, `nivel` e `cliques` não estavam na API\n" +
    "em 10/09/2026, então o que está verde é a DEGRADAÇÃO deles.\n",
);
