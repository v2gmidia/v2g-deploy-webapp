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
 * ============================================================
 * A FIXTURE É RESPOSTA CRUA DE PRODUÇÃO, E É O QUE MUDOU EM 10/09/2026.
 *
 * Até aqui este arquivo montava o payload à mão, em camelCase, com um
 * ajudante `dia({ moeda })` que punha a moeda em cada LINHA. A API nunca
 * fez isso — a moeda vem no TOPO — e por isso a suíte ficava verde
 * enquanto a camada agrupava por um campo que não existia e somava tudo
 * num bloco só, sem símbolo de moeda.
 *
 * **Fixture inventada concorda consigo mesma para sempre.** Agora o
 * caminho conferido é o de verdade, ponta a ponta:
 *
 *   scripts/fixtures/consolidado-*-producao.json   (curl, 10/09/2026)
 *        ↓ validarConsolidado / validarConsolidadoDoNegocio
 *        ↓ resultadoParaTela
 *   o que a tela mostra
 *
 * Para atualizar a fixture:
 *
 *   curl -s -H "X-V2G-Token: $TOK" \
 *     https://api.v2gmidia.com.br/execucoes/<id>/consolidado | python -m json.tool
 * ============================================================
 *
 * Puro: não toca rede nem banco. As fixtures são arquivo em disco.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resultadoParaTela, dinheiroDaMoeda, AINDA_NAO_SABEMOS } from "../lib/resultado/ler.ts";
import { NIVEIS, ehNivel } from "../lib/resultado/nivel.ts";
import {
  validarConsolidado,
  validarConsolidadoDoNegocio,
} from "../lib/dia-seguinte/validar.ts";
import type { ConsolidadoBase } from "../lib/resultado/tipos.ts";

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

function fixture(nome: string): unknown {
  return JSON.parse(readFileSync(resolve(RAIZ, "scripts/fixtures", nome), "utf8"));
}

// ---------------------------------------------------------------- §0

secao("0. controle negativo — a asserção pega erro quando existe");
ok(true, "`ok(true, …)` conta como acerto");
{
  let pegou = false;
  const antes = falhou;
  ok(1 + 1 === 3, "(esperado FALHAR) dois mais dois são cinco");
  pegou = falhou === antes + 1;
  falhou = antes;
  passou++;
  console.log("  ok    a falha acima foi contada e descontada — a asserção funciona");
  if (!pegou) {
    console.log("  FALHA o controle negativo não pegou");
    falhou++;
  }
}

// ---------------------------------------------------------------- fixtures

const CRU_EXECUCAO = fixture("consolidado-execucao-producao.json");
const CRU_NEGOCIO = fixture("consolidado-negocio-producao.json");

const execucao = validarConsolidado(CRU_EXECUCAO);
const negocio = validarConsolidadoDoNegocio(CRU_NEGOCIO);

// ---------------------------------------------------------------- §1

secao("1. o payload REAL atravessa o validador — os campos que morriam nele");
{
  ok(execucao !== null, "a resposta crua da rota da execução valida");
  ok(negocio !== null, "a resposta crua da rota do negócio valida");

  if (!execucao || !negocio) {
    console.log("  (sem payload válido, o resto não tem o que conferir)");
    process.exitCode = 1;
  } else {
    ok(execucao.moeda === "BRL", "`moeda` chega — e é BRL, não `null` por descarte");
    ok(execucao.nivel === "sem_alvo", "`nivel` chega, cru");
    ok(
      typeof execucao.nivelFrase === "string" && execucao.nivelFrase.length > 20,
      "`nivelFrase` chega, escrita pelo backend",
    );
    ok(execucao.cliques === 64, "`cliques` chega — 64, medido em 10/09/2026");
    ok(execucao.impressoes === 1657, "`impressoes` chega — 1657");
    ok(execucao.investiuCentavos === 1025, "`investiuCentavos` chega — R$ 10,25 em centavos");
    ok(
      execucao.pessoasQueChegaramMedido === null,
      "`pessoasQueChegaramMedido` chega como `null` — e `null` não é `false`",
    );
    ok(negocio.moedas.length === 1 && negocio.moedas[0] === "BRL", "`moedas` chega");
    ok(negocio.porExecucao.length === 2, "`porExecucao` chega, com as duas execuções");
    ok(negocio.execucoesSomadas === 2, "`execucoesSomadas` bate com o tamanho de `porExecucao`");
  }
}

// ---------------------------------------------------------------- §2

secao("2. `null` NÃO É ZERO — e a execução sem dado prova");
{
  const semDado = negocio?.porExecucao.find((f) => f.nivel === "sem_dado");
  ok(semDado !== undefined, "a fixture tem uma execução sem dado nenhum");
  ok(semDado?.investiuCentavos === null, "e o investido dela é `null`, não `0`");
  ok(semDado?.cliques === null, "e os cliques são `null`, não `0`");
  ok(semDado?.impressoes === null, "e as impressões são `null`, não `0`");
  ok(semDado?.moeda === null, "e a moeda é `null` — sem dado não há conta de anúncio a declarar");

  // O mesmo, do lado da tela: ausência tem TOM, e a marca é campo.
  const vazio: ConsolidadoBase = {
    desde: "2026-09-01",
    ate: "2026-09-07",
    dias: [],
    investiuCentavos: null,
    voltouCentavos: null,
    pessoasQueChegaram: null,
    vendas: null,
    retornoPorReal: null,
    diasComOsDoisLados: 0,
    temDadoDaPlataforma: false,
    respondeuHoje: null,
    diaDaPergunta: null,
    respondeuNoDia: null,
    moeda: null,
    nivel: "sem_dado",
    nivelFrase: "Ainda não recebemos os números desses dias.",
    cliques: null,
    impressoes: null,
  };
  const r = resultadoParaTela({ recorte: vazio });
  ok(r.bloco.investido.ausente === true, "investido ausente traz a marca `ausente`");
  ok(r.bloco.investido.texto === AINDA_NAO_SABEMOS, "e o texto é o recado, nunca `0,00`");
  ok(!/0,00|R\$/.test(r.bloco.investido.texto), "e não contém zero nem símbolo de moeda");
  ok(r.bloco.cliques.ausente === true, "cliques ausentes idem");
  ok(r.periodoComDado === null, "sem dia com gasto, não há período de campanha a afirmar");
  ok(r.diasComGasto === 0, "e o contador de dias com gasto é 0");
}

// ---------------------------------------------------------------- §3

secao("3. a moeda — o erro de 3x");
{
  // O SÍMBOLO É O QUE O ICU DECIDE, e em pt-BR o AUD sai `AU$`, não `A$`
  // (medido, Node com ICU 78.2 — o contrato escreveu `A$` informalmente).
  // O que esta conferência protege não é o glifo: é o AUD NÃO sair como
  // real, que é o erro de 3x.
  ok(dinheiroDaMoeda(11345, "AUD").includes("AU$"), "AUD sai com AU$");
  ok(!dinheiroDaMoeda(11345, "AUD").includes("R$"), "e em especial NÃO sai com R$");
  ok(dinheiroDaMoeda(7325, "BRL").includes("R$"), "BRL sai com R$");
  ok(
    !/R\$|A\$|\$|€/.test(dinheiroDaMoeda(11345, null)),
    "SEM moeda não se escreve símbolo nenhum — nem `R$` chutado",
  );
  ok(dinheiroDaMoeda(11345, null).includes("113,45"), "mas o número continua legível");

  if (execucao) {
    const r = resultadoParaTela({ recorte: execucao });
    ok(r.bloco.moeda === "BRL", "a moeda do bloco vem do TOPO do consolidado");
    ok(r.bloco.investido.texto.includes("R$"), "e o investido sai com o símbolo certo");
    ok(r.bloco.investido.texto.includes("10,25"), "R$ 10,25 — o número que o curl devolve");
  }
}

// ---------------------------------------------------------------- §4

secao("4. moedas diferentes NUNCA somam");
{
  // ============================================================
  // O CASO DE DUAS MOEDAS NÃO EXISTE NA CONTA DA V2G, e por isso é
  // construído — mas construído com a FORMA que o backend documenta: com
  // duas moedas ele manda o topo nulo de propósito e a quebra vai em
  // `por_execucao`. Ver `docs/contrato-do-dashboard.md`.
  // ============================================================
  const misturado = {
    ...(CRU_NEGOCIO as Record<string, unknown>),
    moeda: null,
    moedas: ["BRL", "AUD"],
    investiu_centavos: null,
    retorno_por_real: null,
    cliques: 86,
    impressoes: 1972,
    por_execucao: [
      { id_execucao: "aaaaaaaa-0000-0000-0000-000000000001", moeda: "BRL", investiu_centavos: 7325, cliques: 32, impressoes: 317, pessoas_que_chegaram: "0.0", nivel: "sem_alvo", nivel_frase: "…" },
      { id_execucao: "bbbbbbbb-0000-0000-0000-000000000002", moeda: "AUD", investiu_centavos: 11345, cliques: 22, impressoes: 315, pessoas_que_chegaram: "0.0", nivel: "sem_comparacao", nivel_frase: "…" },
    ],
  };
  const v = validarConsolidadoDoNegocio(misturado);
  ok(v !== null, "o corpo de duas moedas valida");
  ok(v?.moedas.length === 2, "e `moedas` diz quais são as duas");

  if (v) {
    const r = resultadoParaTela({ recorte: v });
    ok(r.bloco.moeda === null, "o bloco do topo NÃO declara moeda quando há duas");
    ok(
      r.bloco.investido.ausente === true,
      "e NÃO mostra dinheiro somado — R$ 73,25 + A$ 113,45 não é número nenhum",
    );
    ok(!/18\.670|186,70/.test(r.bloco.investido.texto), "em especial, não mostra a soma crua");
    // Clique é clique em qualquer moeda — este SOMA, e é o contrato.
    ok(r.bloco.cliques.texto === "86", "cliques somam entre moedas — clique não tem câmbio");
    ok(r.bloco.impressoes.texto === "1.972", "impressões idem");
    ok(
      v.porExecucao.every((f) => f.moeda !== null),
      "e cada ficha guarda a própria moeda, que é por onde a tela separa",
    );
  }
}

// ---------------------------------------------------------------- §5

secao("5. os CATORZE níveis do contrato — e nenhuma frase escrita aqui");
{
  ok(NIVEIS.length === 14, "são catorze níveis, não sete");

  // Os sete que faltavam até 10/09/2026, e cada um derrubava a página.
  for (const n of [
    "alerta_inicial",
    "alerta_urgente",
    "pausa_automatica",
    "em_avaliacao",
    "gargalo",
    "sem_base",
    "medicao_nao_verificada",
  ]) {
    ok(ehNivel(n), `\`${n}\` É nível — o contrato o declara`);
  }
  for (const n of ["ok", "em_aprendizado", "sem_dado", "sem_gasto", "sem_alvo", "sem_medicao", "sem_comparacao"]) {
    ok(ehNivel(n), `\`${n}\` É nível`);
  }
  ok(!ehNivel("nivel_que_nao_existe"), "e um slug inventado não é nível");

  // ============================================================
  // A PROVA DE QUE A TRADUÇÃO SAIU DAQUI: o módulo não exporta função de
  // frase nenhuma, e o arquivo não tem texto de tela.
  // ============================================================
  const fonteNivel = readFileSync(resolve(RAIZ, "lib/resultado/nivel.ts"), "utf8");
  ok(
    !/export function fraseDoNivel|export const FRASES|SEM_NIVEL/.test(fonteNivel),
    "`nivel.ts` não exporta frase — quem escreve para o dono é o backend",
  );
  ok(
    !/titulo:\s*"|corpo:\s*"/.test(fonteNivel),
    "e não há título nem corpo de tela escritos neste repositório",
  );
}

// ---------------------------------------------------------------- §6

secao("6. a frase vem do backend, INTEIRA e sem retoque");
{
  if (execucao) {
    const r = resultadoParaTela({ recorte: execucao });
    const doCurl = (CRU_EXECUCAO as Record<string, unknown>).nivel_frase as string;
    ok(r.nivelFrase === doCurl, "a `nivelFrase` da tela é idêntica à do curl, caractere a caractere");
    ok(r.nivel === "sem_alvo", "e o slug atravessa cru, para quem quiser ramificar");
    ok(r.nivelConhecido === true, "`sem_alvo` está no vocabulário conhecido");
  }
}

// ---------------------------------------------------------------- §7

secao("7. nível DESCONHECIDO mostra a frase mesmo assim — decisão do Victor, 10/09");
{
  const comNivelNovo = {
    ...(CRU_EXECUCAO as Record<string, unknown>),
    nivel: "nivel_que_o_backend_criou_ontem",
    nivel_frase: "Uma frase nova que o backend escreveu.",
  };
  const v = validarConsolidado(comNivelNovo);
  ok(v !== null, "o corpo com nível desconhecido NÃO é reprovado pelo validador");

  if (v) {
    const r = resultadoParaTela({ recorte: v });
    ok(r.nivelConhecido === false, "a camada marca que o slug é desconhecido");
    ok(
      r.nivelFrase === "Uma frase nova que o backend escreveu.",
      "e mostra a frase assim mesmo — vocabulário não é porteira",
    );
  }

  // Sem frase: a tela não escreve NADA de nível. Nunca uma frase local.
  const semFrase = validarConsolidado({
    ...(CRU_EXECUCAO as Record<string, unknown>),
    nivel: null,
    nivel_frase: null,
  });
  ok(semFrase !== null, "corpo sem nível nenhum também valida");
  if (semFrase) {
    const r = resultadoParaTela({ recorte: semFrase });
    ok(r.nivelFrase === null, "sem `nivel_frase`, a camada devolve `null`");
    ok(r.nivel === null, "e o slug também");
    // e os NÚMEROS continuam lá: falta de nível não apaga o extrato.
    ok(r.bloco.investido.texto.includes("10,25"), "e os números continuam — falta de nível não apaga o extrato");
  }
}

// ---------------------------------------------------------------- §8

secao("8. o zero que mente — `pessoas` só aparece com medição PROVADA");
{
  if (execucao) {
    ok(execucao.pessoasQueChegaram === "0.0", "o payload real traz `0.0` pessoas");
    ok(execucao.pessoasQueChegaramMedido === null, "e o medido é `null` — não dá para afirmar");

    const r = resultadoParaTela({ recorte: execucao, medido: execucao.pessoasQueChegaramMedido });
    ok(r.bloco.pessoas.ausente === true, "então a tela NÃO mostra o zero");
    ok(r.bloco.pessoas.texto !== "0", "e em especial não escreve `0`");

    const provado = resultadoParaTela({ recorte: { ...execucao, pessoasQueChegaram: "20" }, medido: true });
    ok(provado.bloco.pessoas.texto === "20", "com `medido: true`, o número aparece");
    const zeroProvado = resultadoParaTela({ recorte: execucao, medido: true });
    ok(zeroProvado.bloco.pessoas.texto === "0", "e com `medido: true` o ZERO também aparece — é resultado");

    // Omitir o medido (é o caso da rota do NEGÓCIO) esconde, não mostra.
    const semMedido = resultadoParaTela({ recorte: execucao });
    ok(semMedido.bloco.pessoas.ausente === true, "omitir o medido esconde — o lado seguro de errar");
  }
}

// ---------------------------------------------------------------- §9

secao("9. o período da campanha é o dos dias COM DADO, não o recorte pedido");
{
  if (execucao) {
    const r = resultadoParaTela({ recorte: execucao });
    ok(r.periodo.desde === "2026-08-12", "o recorte pedido é ecoado como veio");
    ok(r.periodoComDado?.desde === "2026-09-05", "mas o período da campanha começa no 1º dia com gasto");
    ok(r.periodoComDado?.ate === "2026-09-07", "e termina no último");
    ok(r.diasComGasto === 3, "são 3 dias com gasto, não os 30 do recorte");
  }
}

// ---------------------------------------------------------------- §10

secao("10. o que a camada e as TELAS se recusam a fazer");
{
  // ============================================================
  // Lido do CÓDIGO, não da intenção. Uma regra escrita só no comentário é
  // uma regra que a próxima pessoa não vê.
  //
  // A lista cobre as TELAS desde 10/09/2026. Antes cobria só
  // `lib/resultado/`, que nenhuma tela importava — a proibição estava
  // verde exatamente onde ninguém podia quebrá-la, enquanto a `/anuncios`
  // imprimia "R$ X por conversa" e a `/inicio` tinha `?? 0` em dinheiro.
  // ============================================================
  const ARQUIVOS = [
    "lib/resultado/ler.ts",
    "lib/resultado/nivel.ts",
    "lib/resultado/tipos.ts",
    "lib/resultado/do-negocio.ts",
    "app/(protected)/anuncios/page.tsx",
    "app/(protected)/inicio/page.tsx",
    "app/(protected)/vendas/page.tsx",
  ];
  const fonte = ARQUIVOS.map((f) => readFileSync(resolve(RAIZ, f), "utf8")).join("\n");

  // ============================================================
  // COMENTÁRIO **E TEXTO DE TELA** SAEM ANTES DA BUSCA.
  //
  // A primeira versão acusava "não existe nota nem semáforo" por causa da
  // frase do `sem_alvo`: "não dá para dizer se o preço está bom". A copy
  // legítima usa as mesmas palavras que o código proibido usaria.
  // ============================================================
  // Só comentários fora; as strings de tela ficam. É o que deixa procurar
  // promessa de prazo no TEXTO sem tropeçar no comentário que explica por
  // que ela saiu.
  const semTexto = fonte.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  const semComentario = fonte
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(new RegExp(String.raw`"(?:[^"\\]|\\.)*"`, "g"), '""')
    .replace(new RegExp(String.raw`'(?:[^'\\]|\\.)*'`, "g"), "''")
    .replace(new RegExp(String.raw`\`(?:[^\`\\]|\\.)*\``, "g"), "``");

  ok(
    !/\bcpc\b|custo_por_clique|custoPorClique|porClique|custoPorConversa|porConversa/i.test(semComentario),
    "não existe custo por clique nem por conversa — é derivável e convida a comparar com número de terceiro",
  );
  ok(
    !/investi\w*\s*\/\s*\w*(clique|conversa|pessoa)/i.test(semComentario.replace(/\n/g, " ")),
    "e nada divide investimento por cliques, conversas ou pessoas",
  );
  ok(
    !/\bnota\b|semaforo|semáforo|\bscore\b/i.test(semComentario),
    "não existe nota nem semáforo — opinião fingindo ser medida",
  );
  ok(
    !/\?\?\s*0\b/.test(semComentario),
    "não existe `?? 0` — é como ausência vira zero sem ninguém perceber",
  );
  // Comentário pode explicar a remoção; texto de tela, não. Por isso esta
  // roda sobre a fonte COM as strings de tela intactas mas SEM comentário
  // — ver `semTexto` abaixo.
  ok(
    !/48\s*horas|48h/i.test(semTexto),
    "não existe a promessa de 48 horas — ninguém mede quando a plataforma entrega",
  );
  // O COMENTÁRIO PODE FALAR DELA; O CÓDIGO, NÃO. Os três arquivos
  // explicam por escrito por que a fonte mudou, e apagar essa explicação
  // para agradar um grep seria perder a razão da mudança.
  ok(
    !/metrics_daily/.test(semComentario),
    "nenhuma das três telas LÊ `metrics_daily` — a fonte é o consolidado do backend",
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
  "\nISTO CONFERE O CAMINHO INTEIRO: resposta crua de produção →\n" +
    "validador → camada de leitura. A fixture é `curl` de 10/09/2026,\n" +
    "e atualizá-la é o jeito de conferir o contrato de novo.\n",
);
