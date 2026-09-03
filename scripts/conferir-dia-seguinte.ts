/**
 * Confere a camada do "dia seguinte" — a pergunta diária e o consolidado.
 *
 * POR QUE ESTE CONFERIDOR EXISTE. Três coisas aqui são invisíveis para o
 * build e para o typecheck, e as três apagam ou inventam dado do cliente:
 *
 *  - **`null` virando zero.** O contrato distingue "não sabemos" de
 *    "respondeu que foi zero", e zero venda num dia é sinal forte. Um
 *    `?? 0` em qualquer ponto transforma silêncio em fato;
 *  - **o upsert que SUBSTITUI a linha inteira.** Corrigir só as vendas
 *    apaga a receita que já estava lá. É o erro mais fácil de cometer no
 *    contrato inteiro, e o próprio contrato diz isso;
 *  - **`Decimal` virando float.** A Meta atribui conversão parcial por
 *    modelo de atribuição; converter para guardar perde precisão.
 *
 * TESTA OS DOIS LADOS DE CADA CORTE. Um teste que só olha o lado em que
 * nada acontece passa sem provar nada.
 *
 * O §0 é controle negativo: se a asserção não pegar erro, todo o verde
 * abaixo é verde sem valor.
 *
 * ============================================================
 * ESTE CONFERIDOR NÃO ESCREVE NADA, NUNCA.
 *
 * `POST /resposta-do-dono` grava no banco de produção e não tem desfazer
 * — a chave é `(execução, dia)` e a escrita é upsert, então um teste que
 * "só experimenta" sobrescreveria a resposta real de um cliente. O que
 * se confere aqui é o CORPO que seria mandado, não o mandar.
 * ============================================================
 *
 * A parte de rede é opt-in: só roda com `V2G_BUSINESS_DE_TESTE` no
 * ambiente, e só faz GET. Sem ela, o conferidor cobre o que importa e
 * avisa alto o que não cobriu.
 *
 * Roda com `pnpm conferir:dia-seguinte`.
 */

import {
  validarConsolidado,
  validarConsolidadoDoNegocio,
  validarExecucaoDoNegocio,
} from "../lib/dia-seguinte/validar.ts";
import {
  jaRespondeu,
  montarRespostaDoDono,
  NADA_A_RESPONDER,
  respostaConfiavelSobre,
} from "../lib/dia-seguinte/resposta.ts";
import type { Consolidado } from "../lib/dia-seguinte/tipos.ts";
import { diaDeOntemEmSaoPaulo, diaEmSaoPaulo, diasAntesDe } from "../lib/dia-seguinte/dia.ts";
import {
  diaPodeSerRespondido,
  diasAtrasados,
  DIAS_DE_MEMORIA,
} from "../lib/dia-seguinte/dias-em-aberto.ts";
import {
  centavosDeDigitos,
  centavosDoQueFoiDigitado,
  centavosNoCampo,
  PERGUNTA_GRAVADA,
  vendasDoQueFoiDigitado,
} from "../lib/dia-seguinte/pergunta.ts";
import {
  AINDA_NAO_SABEMOS,
  contagemOuAusencia,
  dinheiroOuAusencia,
  frasePorRealInvestido,
} from "../lib/dia-seguinte/exibir.ts";
import { dinheiroDeCentavos } from "../lib/formato.ts";

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

secao("0. controle negativo — a asserção pega erro?");
{
  const antes = falhas;
  ok(1 + 1 === 3, "ESTA LINHA TEM QUE FALHAR (se ela passar, ignore o resto)");
  const pegou = falhas === antes + 1;
  falhas = antes;
  testes -= 1;
  if (!pegou) {
    console.log("\nO MECANISMO DE ASSERÇÃO NÃO PEGA ERRO. Nada abaixo vale.");
    process.exit(1);
  }
  console.log("  (pegou — o placar abaixo vale)");
}

// ---------------------------------------------------------------- §1

secao("1. a porta de entrada — `GET /negocios/{id}/execucao`");
{
  const bom = {
    id_execucao: "98447192-3968-4fb1-8062-b14d6a8751ae",
    business_id: "1c0f0000-0000-0000-0000-000000000000",
    status: "aguardando_fotos",
    andamento: "Precisamos das suas fotos para continuar",
    pede_acao: true,
    atualizado_em: "2026-09-14T11:04:00Z",
  };
  const v = validarExecucaoDoNegocio(bom);
  ok(v !== null, "corpo bem formado passa");
  ok(v?.idExecucao === bom.id_execucao, "snake_case vira camelCase na fronteira");
  ok(v?.pedeAcao === true, "`pede_acao` chega como booleano");

  // `pede_acao` SEM DEFAULT, e é decisão: ausente aqui seria a tela
  // decidindo sozinha se a bola é do cliente.
  ok(
    validarExecucaoDoNegocio({ ...bom, pede_acao: undefined }) === null,
    "`pede_acao` ausente REPROVA — a tela não inventa de quem é a bola",
  );
  ok(
    validarExecucaoDoNegocio({ ...bom, pede_acao: "true" }) === null,
    "`pede_acao` como string reprova",
  );
  ok(validarExecucaoDoNegocio({ ...bom, andamento: "" }) === null, "`andamento` vazio reprova");
  ok(validarExecucaoDoNegocio({ ...bom, id_execucao: null }) === null, "sem id reprova");
  ok(validarExecucaoDoNegocio(null) === null, "null reprova");
  ok(validarExecucaoDoNegocio([bom]) === null, "array no lugar de objeto reprova");
}

// ---------------------------------------------------------------- §2

const CONSOLIDADO_CRU = {
  id_execucao: "98447192-3968-4fb1-8062-b14d6a8751ae",
  desde: "2026-09-01",
  ate: "2026-09-30",
  dias: [
    {
      dia: "2026-09-14",
      investiu_centavos: 34000,
      pessoas_que_chegaram: "12",
      viraram_venda: 3,
      voltou_centavos: 160000,
    },
  ],
  investiu_centavos: 34000,
  voltou_centavos: 160000,
  pessoas_que_chegaram: "12",
  vendas: 3,
  retorno_por_real: "4.71",
  dias_com_os_dois_lados: 1,
  tem_dado_da_plataforma: true,
  respondeu_hoje: false,
  dia_da_pergunta: "2026-09-14",
  respondeu_no_dia: true,
};

/** O acumulado do negócio = o núcleo + a identificação + a auditoria da soma. */
const ACUMULADO_CRU = {
  ...CONSOLIDADO_CRU,
  id_execucao: undefined,
  business_id: "a85c37a9-0000-0000-0000-000000000000",
  execucoes_somadas: 2,
  dias_com_resposta_de_mais_de_uma_execucao: 0,
};

secao("2. o consolidado — e `null` NUNCA virando zero");
{
  const v = validarConsolidado(CONSOLIDADO_CRU);
  ok(v !== null, "corpo bem formado passa");
  ok(v?.dias[0]?.investiuCentavos === 34000, "centavos chegam inteiros, sem virar reais");
  ok(v?.retornoPorReal === "4.71", "`retorno_por_real` continua STRING");
  ok(v?.pessoasQueChegaram === "12", "`pessoas_que_chegaram` continua STRING");

  // ---- o corte que este conferidor existe para guardar ----
  const semPlataforma = validarConsolidado({
    ...CONSOLIDADO_CRU,
    investiu_centavos: null,
    pessoas_que_chegaram: null,
    retorno_por_real: null,
    tem_dado_da_plataforma: false,
  });
  ok(semPlataforma?.investiuCentavos === null, "`null` continua `null` — NÃO vira 0");
  ok(semPlataforma?.retornoPorReal === null, "retorno nulo continua nulo");
  ok(
    semPlataforma?.temDadoDaPlataforma === false,
    "`tem_dado_da_plataforma: false` é o estado NORMAL hoje, e passa",
  );

  // O outro lado: zero é resposta, não ausência.
  const zerado = validarConsolidado({
    ...CONSOLIDADO_CRU,
    vendas: 0,
    voltou_centavos: 0,
  });
  ok(zerado?.vendas === 0, "zero venda passa como 0, e não como null");
  ok(zerado?.voltouCentavos === 0, "receita zero idem");

  // ---- o que TEM que reprovar ----
  ok(
    validarConsolidado({ ...CONSOLIDADO_CRU, tem_dado_da_plataforma: undefined }) === null,
    "`tem_dado_da_plataforma` ausente reprova (a tela decidiria sozinha)",
  );
  ok(
    validarConsolidado({ ...CONSOLIDADO_CRU, respondeu_hoje: undefined }) === null,
    "`respondeu_hoje` AUSENTE reprova (contrato mudado)",
  );
  // ============================================================
  // MAS `null` PASSA, E ISSO DERRUBOU A PERGUNTA DIÁRIA EM 01/09.
  //
  // `null` significa "hoje está FORA da janela consultada" — medido contra
  // a rota real: com `desde=ate=ontem` vem `null`, sem janela vem `false`.
  // E `desde=ate=ontem` é exatamente o que a Server Action faz para ler o
  // que já está gravado. Exigindo booleano, o corpo era reprovado e a
  // pergunta nunca gravava.
  // ============================================================
  const foraDaJanela = validarConsolidado({ ...CONSOLIDADO_CRU, respondeu_hoje: null });
  ok(
    foraDaJanela !== null && foraDaJanela.respondeuHoje === null,
    "`respondeu_hoje: null` PASSA — é 'hoje fora da janela', não 'não respondeu'",
  );
  ok(
    validarConsolidado({ ...CONSOLIDADO_CRU, respondeu_hoje: "false" }) === null,
    "mas string continua reprovando",
  );
  ok(
    validarConsolidado({ ...CONSOLIDADO_CRU, vendas: 2.5 }) === null,
    "contagem fracionária reprova — o contrato promete inteiro",
  );
  ok(
    validarConsolidado({ ...CONSOLIDADO_CRU, investiu_centavos: -1 }) === null,
    "centavos negativos reprovam",
  );
  ok(
    validarConsolidado({ ...CONSOLIDADO_CRU, desde: "01/09/2026" }) === null,
    "data fora de `YYYY-MM-DD` reprova",
  );
  ok(validarConsolidado({ ...CONSOLIDADO_CRU, dias: {} }) === null, "`dias` não-array reprova");

  // Tudo ou nada: um dia torto derruba o consolidado inteiro, e não some
  // da lista — senão o total não bate com a soma dos dias na tela, e o
  // dono conferindo no caderno dele descobre antes da gente.
  ok(
    validarConsolidado({
      ...CONSOLIDADO_CRU,
      dias: [CONSOLIDADO_CRU.dias[0], { dia: "sem-formato" }],
    }) === null,
    "um dia malformado reprova o CONSOLIDADO INTEIRO, não some da lista",
  );
}

// ---------------------------------------------------------------- §3

secao("2.1 o acumulado do negócio — e a auditoria da soma");
{
  const v = validarConsolidadoDoNegocio(ACUMULADO_CRU);
  ok(v !== null, "corpo bem formado passa");
  ok(v?.execucoesSomadas === 2, "`execucoes_somadas` chega — é como a tela sabe que somou rodadas");
  ok(
    v?.diasComRespostaDeMaisDeUmaExecucao === 0,
    "`dias_com_resposta_de_mais_de_uma_execucao` chega",
  );

  // O NÚCLEO É O MESMO das duas rotas, e esta é a conferência que impede
  // os dois validadores de divergirem: o campo que entrar num tem que
  // entrar no outro.
  const porExecucao = validarConsolidado(CONSOLIDADO_CRU);
  ok(
    v?.respondeuHoje === porExecucao?.respondeuHoje &&
      v?.temDadoDaPlataforma === porExecucao?.temDadoDaPlataforma &&
      v?.dias.length === porExecucao?.dias.length,
    "o núcleo compartilhado lê igual nas duas rotas",
  );

  // Cada rota exige a SUA identificação, e recusa a do irmão.
  ok(
    validarConsolidadoDoNegocio(CONSOLIDADO_CRU) === null,
    "o acumulado sem `business_id` reprova (não aceita o corpo da outra rota)",
  );
  ok(
    validarConsolidado(ACUMULADO_CRU) === null,
    "e a rota por execução sem `id_execucao` também",
  );

  // Os dois campos de auditoria são obrigatórios: ausência viraria "0
  // execuções somadas", que é mentira sobre a origem do número.
  ok(
    validarConsolidadoDoNegocio({ ...ACUMULADO_CRU, execucoes_somadas: undefined }) === null,
    "`execucoes_somadas` ausente reprova — 0 rodadas somadas seria mentira",
  );
  ok(
    validarConsolidadoDoNegocio({
      ...ACUMULADO_CRU,
      dias_com_resposta_de_mais_de_uma_execucao: undefined,
    }) === null,
    "o contador de resposta duplicada ausente reprova",
  );

  // `> 0` é DEFEITO DE FLUXO, e passa no validador de propósito: quem
  // reprova um número legítimo esconde o problema em vez de mostrar.
  const comDuplicata = validarConsolidadoDoNegocio({
    ...ACUMULADO_CRU,
    dias_com_resposta_de_mais_de_uma_execucao: 3,
  });
  ok(
    comDuplicata?.diasComRespostaDeMaisDeUmaExecucao === 3,
    "duplicata de resposta PASSA no validador — é diagnóstico, não corpo inválido",
  );
}

secao("3. o merge por campo — só vai o que ele mexeu");
{
  const consolidado = validarConsolidado(CONSOLIDADO_CRU) as Consolidado;
  const DIA = "2026-09-14"; // já tem vendas=3 e receita=160000
  const P = "Quantas viraram venda?";

  const montar = (mexeu: Parameters<typeof montarRespostaDoDono>[0]["mexeu"], c = consolidado) =>
    montarRespostaDoDono({ dia: DIA, pergunta: P, mexeu, consolidado: c });

  // ============================================================
  // O CAMPO NÃO MEXIDO É OMITIDO, E NÃO MANDADO COMO `null`.
  //
  // Sob merge, ausente preserva e `null` APAGA. A versão anterior
  // reenviava os dois lidos do consolidado — correto enquanto a leitura
  // desse certo, e apagamento quando ela não achasse o dia. Omitir tira
  // esse caminho do mapa.
  // ============================================================
  const soVendas = montar({ vendas: 5 });
  ok(soVendas.ok && soVendas.corpo.vendas === 5, "corrigir só as vendas manda a venda nova");
  ok(
    soVendas.ok && !("receitaCentavos" in soVendas.corpo),
    "e a receita é OMITIDA do corpo — o servidor preserva a dele",
  );

  const soReceita = montar({ receitaCentavos: 200000 });
  ok(
    soReceita.ok && !("vendas" in soReceita.corpo),
    "corrigir só a receita omite as vendas — o outro lado do mesmo corte",
  );

  // ---- "não sei" é apagamento DELIBERADO, e vai explícito ----
  const naoSei = montar({ receitaCentavos: null });
  ok(
    naoSei.ok && "receitaCentavos" in naoSei.corpo && naoSei.corpo.receitaCentavos === null,
    '"não sei" manda `null` EXPLÍCITO — é a diferença entre apagar e não mexer',
  );
  ok(naoSei.ok && !("vendas" in naoSei.corpo), "e não toca nas vendas");

  // ---- zero é resposta ----
  const zero = montar({ vendas: 0 });
  ok(zero.ok && zero.corpo.vendas === 0, "zero venda vai como 0, e NÃO como null");

  // ---- não mexeu em nada: não é resposta ----
  const nada = montar({});
  ok(!nada.ok && nada.erro === NADA_A_RESPONDER, "não mexer em nada não vira requisição");

  // ============================================================
  // A CHECAGEM OLHA O RESULTADO, NÃO O PAYLOAD — como o backend em 01/09.
  //
  // `vendas: null` num dia que JÁ TEM receita é resposta válida: ele está
  // apagando as vendas e mantendo a receita. Recusar por "um campo é
  // null" olharia o payload, e o payload deixou de ser a pergunta certa.
  // ============================================================
  const apagaUmSo = montar({ vendas: null });
  ok(
    apagaUmSo.ok,
    "apagar as vendas num dia que tem receita PASSA — a checagem olha o resultado",
  );

  // O outro lado: apagar os dois esvazia o dia, e aí não é resposta.
  const apagaOsDois = montar({ vendas: null, receitaCentavos: null });
  ok(!apagaOsDois.ok, "apagar os dois esvazia o dia, e isso não é resposta");

  // Num dia SEM nada gravado, apagar um só também não deixa nada de pé.
  const diaVazio = montarRespostaDoDono({
    dia: "2026-09-20",
    pergunta: P,
    mexeu: { vendas: null },
    consolidado,
  });
  ok(!diaVazio.ok, "e num dia vazio, apagar o único campo também não é resposta");

  // ---- sem consolidado, ESCREVE ASSIM MESMO ----
  // Antes do merge, não conseguir ler impedia gravar. Agora omitir
  // preserva, e recusar a resposta do cliente por uma leitura que falhou
  // seria cobrar dele um problema nosso.
  const cego = montarRespostaDoDono({
    dia: DIA,
    pergunta: P,
    mexeu: { vendas: 5 },
    consolidado: null,
  });
  ok(cego.ok && cego.corpo.vendas === 5, "sem consolidado, a resposta PASSA");
  ok(
    cego.ok && !("receitaCentavos" in cego.corpo),
    "e a receita continua omitida — omitir preserva, mesmo às cegas",
  );

  // ---- a pergunta viaja junto, exata ----
  ok(soVendas.ok && soVendas.corpo.pergunta === P, "a pergunta exibida vai no corpo, literal");
}

secao("3.0 o ECO — sem ele o `respondeuNoDia` não é legível");
{
  const c = validarConsolidado(CONSOLIDADO_CRU) as Consolidado;
  ok(c.diaDaPergunta === "2026-09-14", "o eco chega");
  ok(
    respostaConfiavelSobre(c, "2026-09-14") === true,
    "eco batendo com o dia perguntado: a resposta serve",
  );
  // ============================================================
  // ECO DIFERENTE = RESPOSTA SOBRE OUTRO DIA. Acreditar nela mostraria o
  // card errado, ou o esconderia quando ele precisava aparecer.
  // ============================================================
  ok(
    respostaConfiavelSobre(c, "2026-09-15") === null,
    "eco de OUTRO dia: a resposta não serve, e vira null",
  );
  const semEco = validarConsolidado({
    ...CONSOLIDADO_CRU,
    dia_da_pergunta: null,
    respondeu_no_dia: null,
  }) as Consolidado;
  ok(respostaConfiavelSobre(semEco, "2026-09-14") === null, "sem eco: não pedimos, não serve");
  ok(respostaConfiavelSobre(null, "2026-09-14") === null, "sem consolidado idem");

  // Ausentes não reprovam o corpo: são campos de 01/09, e um backend mais
  // velho continua legível.
  const velho = validarConsolidado({
    ...CONSOLIDADO_CRU,
    dia_da_pergunta: undefined,
    respondeu_no_dia: undefined,
  });
  ok(velho !== null && velho.diaDaPergunta === null, "eco AUSENTE não reprova — vira null");
}

secao("3.1 `jaRespondeu` — pelos campos do dono, não pela presença do dia");
{
  const consolidado = validarConsolidado(CONSOLIDADO_CRU) as Consolidado;
  ok(jaRespondeu(consolidado, "2026-09-14"), "dia com resposta do dono conta como respondido");
  ok(!jaRespondeu(consolidado, "2026-09-15"), "dia fora da lista não conta");
  ok(!jaRespondeu(null, "2026-09-14"), "sem consolidado, não conta como respondido");

  // O CASO QUE VAI EXISTIR quando o coletor da Meta ligar: o dia aparece
  // na lista por causa do investimento, e o dono não respondeu. Perguntar
  // pela presença do dia diria que ele já respondeu.
  const soPlataforma = validarConsolidado({
    ...CONSOLIDADO_CRU,
    dias: [
      {
        dia: "2026-09-16",
        investiu_centavos: 5000,
        pessoas_que_chegaram: "4",
        viraram_venda: null,
        voltou_centavos: null,
      },
    ],
  }) as Consolidado;
  ok(
    !jaRespondeu(soPlataforma, "2026-09-16"),
    "dia que só tem dado da PLATAFORMA não conta como respondido pelo dono",
  );
}

secao("3.3 que dia é ONTEM — no fuso de São Paulo, não no do servidor");
{
  // A Vercel roda em UTC. Das 21h à meia-noite de Brasília o servidor já
  // está no dia seguinte — e é ali que o cálculo ingênuo erra.
  const asDezDaManha = new Date("2026-09-14T13:00:00Z"); // 10h em SP
  ok(diaEmSaoPaulo(asDezDaManha) === "2026-09-14", "10h de SP: hoje é 14");
  ok(diaDeOntemEmSaoPaulo(asDezDaManha) === "2026-09-13", "e ontem é 13");

  // ============================================================
  // O CASO QUE MOTIVA O ARQUIVO INTEIRO.
  // 22h de Brasília = 01h UTC do dia seguinte. Calculado no fuso do
  // servidor, "hoje" seria 15 e "ontem" seria 14 — e a resposta do dono
  // sobre o dia 13 iria para a chave do dia 14, POR CIMA do que já estava
  // lá, porque a escrita é upsert.
  // ============================================================
  const asDezDaNoite = new Date("2026-09-15T01:00:00Z"); // 22h do dia 14 em SP
  ok(
    diaEmSaoPaulo(asDezDaNoite) === "2026-09-14",
    "22h de SP ainda é dia 14, mesmo o servidor já estando no 15 (UTC)",
  );
  ok(
    diaDeOntemEmSaoPaulo(asDezDaNoite) === "2026-09-13",
    "e ontem continua 13 — o cálculo no fuso do servidor daria 14, e apagaria um dia",
  );

  // Virada de mês e de ano, que a aritmética de calendário resolve sozinha.
  ok(
    diaDeOntemEmSaoPaulo(new Date("2026-09-01T13:00:00Z")) === "2026-08-31",
    "primeiro do mês: ontem é o último do mês anterior",
  );
  ok(
    diaDeOntemEmSaoPaulo(new Date("2026-01-01T13:00:00Z")) === "2025-12-31",
    "primeiro do ano: ontem é 31/12 do ano anterior",
  );
  ok(
    diaDeOntemEmSaoPaulo(new Date("2028-03-01T13:00:00Z")) === "2028-02-29",
    "ano bissexto: ontem de 01/03/2028 é 29/02",
  );

  // Zero à esquerda: montar a string à mão erraria o dia 9.
  ok(
    diaDeOntemEmSaoPaulo(new Date("2026-09-10T13:00:00Z")) === "2026-09-09",
    "dia de um dígito vem com zero à esquerda",
  );
}

secao("3.2 dinheiro em centavos");
{
  ok(dinheiroDeCentavos(160000).includes("1.600,00"), "160000 centavos → R$ 1.600,00");
  ok(dinheiroDeCentavos(0).includes("0,00"), "zero centavos → R$ 0,00 (zero é valor)");
  ok(dinheiroDeCentavos(1).includes("0,01"), "um centavo não some no arredondamento");
}

secao("3.4 na tela — `null` NUNCA vira R$ 0,00");
{
  // ============================================================
  // É a regra 1 do contrato, no lugar onde ela é quebrada: a tela.
  // `investiu_centavos: null` significa "o coletor da Meta está
  // desligado". Mostrar R$ 0,00 diz ao dono que a campanha dele não gastou
  // nada — afirmação sobre o dinheiro dele, e falsa.
  // ============================================================
  ok(dinheiroOuAusencia(null) === AINDA_NAO_SABEMOS, "dinheiro nulo NÃO vira R$ 0,00");
  ok(dinheiroOuAusencia(0).includes("0,00"), "mas zero de verdade aparece como R$ 0,00");
  ok(dinheiroOuAusencia(34000).includes("340,00"), "e o valor aparece convertido de centavos");

  ok(contagemOuAusencia(null) === AINDA_NAO_SABEMOS, "contagem nula NÃO vira 0");
  ok(contagemOuAusencia(0) === "0", "zero venda aparece como 0 — é sinal forte, não silêncio");
  ok(contagemOuAusencia(3) === "3", "e a contagem aparece");

  // O retorno vem CALCULADO. Esta função veste de frase e não divide nada.
  ok(frasePorRealInvestido(null) === null, "retorno nulo não vira frase");
  ok(frasePorRealInvestido("nao-e-numero") === null, "retorno ilegível não vira frase");
  const f = frasePorRealInvestido("4.71");
  ok(f !== null && f.includes("4,71"), `"4.71" vira "${f}"`);
  ok(f !== null && !/ROAS|retorno sobre/i.test(f), "e a frase não tem jargão de tráfego");
}

secao("3.6 a máscara de moeda — teclado de banco");
{
  // Os cinco casos que o Victor especificou, na ordem.
  const passo = (digitado: string) => {
    const c = centavosDeDigitos(digitado);
    return c === null ? "" : centavosNoCampo(c);
  };
  ok(passo("1") === "0,01", '"1" -> 0,01');
  ok(passo("16") === "0,16", '"16" -> 0,16');
  ok(passo("160") === "1,60", '"160" -> 1,60');
  ok(passo("16050") === "160,50", '"16050" -> 160,50');
  ok(passo("200000") === "2.000,00", '"200000" -> 2.000,00 (milhar aparece sozinho)');

  // Apagar é o caminho inverso, e tem que funcionar sobre o texto JÁ
  // formatado — é o que o campo devolve no `onChange` depois do backspace.
  ok(passo("1.600,5") === "160,05", "backspace sobre o texto formatado anda uma casa");
  ok(passo("") === "", "campo vazio continua vazio, e não vira 0,00");
  ok(centavosDeDigitos("") === null, "e o valor é null, não 0");

  // Número que o JavaScript não representa direito é recusado — não é
  // teto de valor, é não mentir sobre dinheiro em silêncio.
  ok(centavosDeDigitos("9".repeat(20)) === null, "número acima do inteiro seguro é recusado");

  // ============================================================
  // A MÁSCARA NÃO SUBSTITUI O PARSER DE COLAR, E ESTE É O CORTE.
  //
  // As duas linhas abaixo parecem uma INCONSISTÊNCIA — o mesmo "1600"
  // dando dois números diferentes. Não é. São dois gestos com duas
  // origens, e é a origem que diz o significado:
  //
  //   COLAR vem de um lugar onde o valor JÁ ESTAVA FORMATADO — a nota, a
  //   planilha, o extrato. Lá "1600" já quer dizer mil e seiscentos
  //   reais, com os centavos implícitos em zero.
  //
  //   DIGITAR vem de um teclado numérico de celular, ONDE A VÍRGULA NÃO
  //   EXISTE. Ali cada tecla é um centavo entrando pela direita, e "1600"
  //   é o caminho de quem está construindo R$ 16,00.
  //
  // Se alguém "consertar" a divergência unificando os dois, quebra os
  // dois: ou colar passa a dividir por cem em silêncio, ou digitar deixa
  // de ter máscara e a vírgula volta a ser problema do dono.
  //
  // ESTA ASSERÇÃO EXISTE PARA IMPEDIR ESSE CONSERTO.
  // ============================================================
  ok(centavosDoQueFoiDigitado("1600") === 160000, "COLADO: 1600 -> R$ 1.600,00");
  ok(centavosDeDigitos("1600") === 1600, "DIGITADO: 1600 -> R$ 16,00");
  ok(
    centavosDoQueFoiDigitado("1600") !== centavosDeDigitos("1600"),
    "os dois caminhos DIVERGEM de propósito — por isso `onPaste` e `onChange` são separados",
  );
  // E onde eles concordam: valor colado já com centavos.
  ok(
    centavosDoQueFoiDigitado("1.600,50") === 160050 && centavosDeDigitos("1.600,50") === 160050,
    "com centavos explícitos os dois concordam — é o caso que esconderia o bug",
  );
}

secao("3.5 o que o dono digitou vira número — sem perder centavo");
{
  // ============================================================
  // "R$ 1.600,50" TEM QUE VIRAR 160050, E NÃO 1600.5 NEM NaN.
  //
  // Em pt-BR o ponto é separador de MILHAR. `Number("1.600,50")` é NaN, e
  // `Number("1.600")` é 1.6 — o cliente digitaria mil e seiscentos e o
  // sistema guardaria um real e sessenta.
  // ============================================================
  ok(centavosDoQueFoiDigitado("1600") === 160000, '"1600" -> 160000 centavos');
  ok(centavosDoQueFoiDigitado("1.600,00") === 160000, '"1.600,00" -> 160000');
  ok(centavosDoQueFoiDigitado("1.600,50") === 160050, '"1.600,50" -> 160050');
  ok(centavosDoQueFoiDigitado("R$ 1.600,50") === 160050, 'com "R$" na frente também');
  ok(centavosDoQueFoiDigitado("0,01") === 1, "um centavo não some");

  // O caso do ponto flutuante: 16.005 * 100 dá 1600.4999999999998.
  // Truncar perderia um centavo do cliente; arredondar devolve o que ele
  // digitou.
  ok(centavosDoQueFoiDigitado("16,005") === 1601, "arredonda em vez de truncar (16,005)");

  // Ausência é ausência, e NUNCA zero.
  ok(centavosDoQueFoiDigitado("") === null, "campo vazio vira null, não 0");
  ok(centavosDoQueFoiDigitado("   ") === null, "só espaço idem");
  ok(centavosDoQueFoiDigitado("abc") === null, "letra vira null");
  ok(centavosDoQueFoiDigitado("-5") === null, "negativo vira null");
  // E zero digitado É zero: "vendi e não entrou nada" é resposta.
  ok(centavosDoQueFoiDigitado("0") === 0, '"0" digitado vira 0, e não null');

  ok(vendasDoQueFoiDigitado("3") === 3, '"3" -> 3');
  ok(vendasDoQueFoiDigitado("0") === 0, '"0" vendas é resposta, e vira 0');
  ok(vendasDoQueFoiDigitado("") === null, "vazio vira null");
  ok(vendasDoQueFoiDigitado("umas 3") === null, '"umas 3" vira null — não se adivinha número do cliente');
  ok(vendasDoQueFoiDigitado("3,5") === null, "meia venda não existe");
  ok(vendasDoQueFoiDigitado("-1") === null, "negativo vira null");

  // A pergunta gravada tem as duas, e é a MESMA string que a tela mostra.
  ok(
    PERGUNTA_GRAVADA.includes("viraram venda") && PERGUNTA_GRAVADA.includes("quanto entrou"),
    "a pergunta gravada contém as duas que a tela faz",
  );
  ok(!/CTR|ROAS|CPM|convers(ão|ões)/i.test(PERGUNTA_GRAVADA), "e não tem jargão de tráfego");
}

secao("3.7 os dias em aberto — por subtração de calendário");
{
  const ONTEM = "2026-09-02";
  const comDias = (dias: Array<[string, number | null]>) =>
    validarConsolidado({
      ...CONSOLIDADO_CRU,
      dias: dias.map(([dia, vendas]) => ({
        dia,
        investiu_centavos: null,
        pessoas_que_chegaram: null,
        viraram_venda: vendas,
        voltou_centavos: null,
      })),
    }) as Consolidado;

  ok(diasAntesDe(ONTEM, 1) === "2026-09-01", "um dia antes");
  ok(diasAntesDe("2026-03-01", 1) === "2026-02-28", "virada de mês");
  ok(diasAntesDe("2026-01-01", 1) === "2025-12-31", "virada de ano");

  // ============================================================
  // O CASO QUE MOTIVA TUDO: dois dias fora do ar.
  // Respondeu 30/08, sumiu, volta em 03/09. Ontem = 02/09.
  // ============================================================
  const sumiuDoisDias = comDias([["2026-08-30", 5]]);
  const a1 = diasAtrasados({ consolidado: sumiuDoisDias, ontem: ONTEM });
  ok(
    a1.join(",") === "2026-08-31,2026-09-01",
    `os dois dias perdidos aparecem, do mais antigo para o mais novo (${a1.join(",")})`,
  );
  ok(!a1.includes(ONTEM), "e ONTEM não entra — ele é a pergunta principal, não atrasado");

  // ---- o piso: antes da primeira resposta não se pergunta ----
  ok(
    !a1.includes("2026-08-29"),
    "dia ANTERIOR à primeira resposta não entra — não há de onde tirar piso",
  );
  ok(
    diasAtrasados({ consolidado: comDias([]), ontem: ONTEM }).length === 0,
    "quem NUNCA respondeu não tem atrasado: só a pergunta de ontem",
  );

  // ---- o teto de 7 ----
  const antigo = comDias([["2026-08-01", 1]]);
  const a2 = diasAtrasados({ consolidado: antigo, ontem: ONTEM });
  ok(a2.length === DIAS_DE_MEMORIA - 1, `o teto corta em ${DIAS_DE_MEMORIA} dias (vieram ${a2.length})`);
  ok(a2[0] === diasAntesDe(ONTEM, DIAS_DE_MEMORIA - 1), "e o mais antigo é o limite da janela");

  // ---- dia já respondido não vira atrasado ----
  const comBuraco = comDias([
    ["2026-08-30", 5],
    ["2026-08-31", 2],
  ]);
  const a3 = diasAtrasados({ consolidado: comBuraco, ontem: ONTEM });
  ok(a3.join(",") === "2026-09-01", "dia respondido no meio não vira atrasado");

  // ---- sem consolidado, não inventa ----
  ok(
    diasAtrasados({ consolidado: null, ontem: ONTEM }).length === 0,
    "sem consolidado devolve vazio — 'não ofereça', e não 'está tudo respondido'",
  );

  // ============================================================
  // O SERVIDOR NÃO ACREDITA NO DIA QUE A TELA MANDOU.
  // O `dia` passou a vir do cliente com a correção de atrasado.
  // ============================================================
  const pode = (dia: string, c = sumiuDoisDias) =>
    diaPodeSerRespondido({ dia, ontem: ONTEM, consolidado: c });

  ok(pode(ONTEM), "ontem sempre pode");
  ok(pode("2026-09-01"), "atrasado da lista pode");
  ok(!pode("2026-09-03"), "HOJE não pode — a pergunta é sobre o dia que fechou");
  ok(!pode("2026-12-25"), "dia futuro não pode");
  ok(!pode("2026-08-29"), "dia anterior à primeira resposta não pode");
  ok(!pode("2026-08-30"), "dia JÁ respondido não entra pela porta do atrasado");
  ok(pode(ONTEM, null as never), "sem consolidado, só ontem passa");
  ok(!pode("2026-09-01", null as never), "e nenhum atrasado passa às cegas");
}

// ---------------------------------------------------------------- rede

const businessDeTeste = process.env.V2G_BUSINESS_DE_TESTE;
const temEnv = Boolean(
  process.env.V2G_BACKEND_URL && process.env.V2G_BACKEND_TOKEN && businessDeTeste,
);

if (!temEnv) {
  console.log("\n" + "=".repeat(68));
  console.log("PULANDO O §4 (rede): falta V2G_BACKEND_URL / V2G_BACKEND_TOKEN /");
  console.log("V2G_BUSINESS_DE_TESTE. O que está verde acima é o validador e a");
  console.log("montagem do corpo — NÃO prova que as rotas respondem.");
  console.log("=".repeat(68));
} else {
  const base = process.env.V2G_BACKEND_URL!.replace(/\/+$/, "");
  const cabecalho = {
    "X-V2G-Token": process.env.V2G_BACKEND_TOKEN!,
    Accept: "application/json",
  };

  secao("4. as rotas reais — SÓ GET, nunca POST");
  {
    const r = await fetch(
      `${base}/negocios/${encodeURIComponent(businessDeTeste!)}/execucao`,
      { headers: cabecalho, cache: "no-store" },
    );
    ok(r.status === 200 || r.status === 404, `porta de entrada responde (${r.status})`);

    if (r.status === 200) {
      const execucao = validarExecucaoDoNegocio(await r.json());
      ok(execucao !== null, "e o corpo passa no validador de fronteira");

      if (execucao) {
        const c = await fetch(
          `${base}/execucoes/${encodeURIComponent(execucao.idExecucao)}/consolidado`,
          { headers: cabecalho, cache: "no-store" },
        );
        ok(c.status === 200, `consolidado responde (${c.status})`);
        if (c.status === 200) {
          const cons = validarConsolidado(await c.json());
          ok(cons !== null, "e o consolidado por execução passa no validador");
          if (cons) {
            console.log(
              `        (janela ${cons.desde}..${cons.ate}, ${cons.dias.length} dia(s),` +
                ` plataforma=${cons.temDadoDaPlataforma}, respondeuHoje=${cons.respondeuHoje})`,
            );
          }
        }

        // ============================================================
        // A JANELA DE UM DIA — exatamente o que a Server Action da
        // pergunta diária faz. Foi aqui que o `respondeu_hoje: null`
        // apareceu e derrubou a gravação em 01/09.
        // ============================================================
        const umDia = "2026-08-31";
        const j = await fetch(
          `${base}/negocios/${encodeURIComponent(businessDeTeste!)}/consolidado` +
            `?desde=${umDia}&ate=${umDia}`,
          { headers: cabecalho, cache: "no-store" },
        );
        ok(j.status === 200, `janela de um dia responde (${j.status})`);
        if (j.status === 200) {
          const corpo = (await j.json()) as Record<string, unknown>;
          ok(corpo.desde === umDia && corpo.ate === umDia, "e a janela pedida é RESPEITADA");
          const lido = validarConsolidadoDoNegocio(corpo);
          ok(
            lido !== null,
            `o corpo da janela de um dia passa no validador (respondeu_hoje=${JSON.stringify(corpo.respondeu_hoje)})`,
          );
        }

        // O ACUMULADO — a rota que a `/inicio` usa de verdade.
        const a = await fetch(
          `${base}/negocios/${encodeURIComponent(businessDeTeste!)}/consolidado`,
          { headers: cabecalho, cache: "no-store" },
        );
        ok(a.status === 200, `acumulado do negócio responde (${a.status})`);
        if (a.status === 200) {
          const acum = validarConsolidadoDoNegocio(await a.json());
          ok(acum !== null, "e o acumulado passa no validador");
          if (acum) {
            console.log(
              `        (${acum.execucoesSomadas} execução(ões) somada(s),` +
                ` ${acum.diasComRespostaDeMaisDeUmaExecucao} dia(s) com resposta duplicada)`,
            );
            // `> 0` não reprova o corpo — é sinal de defeito de FLUXO, e
            // este conferidor é o lugar de ele aparecer.
            ok(
              acum.diasComRespostaDeMaisDeUmaExecucao === 0,
              "nenhum dia com resposta de mais de uma execução (se falhar, a varredura perguntou duas vezes)",
            );
          }
        }
      }
    } else {
      console.log("        (404 — este negócio ainda não tem execução, e isso é estado normal)");
    }

    // Sem o header: 401, não 404. Mesma armadilha do `/nichos`.
    const semHeader = await fetch(
      `${base}/negocios/${encodeURIComponent(businessDeTeste!)}/execucao`,
      { headers: { Accept: "application/json" } },
    );
    ok(semHeader.status === 401, `sem \`X-V2G-Token\` -> 401 (veio ${semHeader.status})`);
  }
}

// ---------------------------------------------------------------- placar

console.log(
  `\n${falhas === 0 ? "TUDO CERTO" : "TEM FALHA"} — ${testes - falhas}/${testes} conferências`,
);
// ============================================================
// `process.exitCode`, E NÃO `process.exit()`.
//
// Este conferidor faz várias chamadas HTTP, e o `fetch` do Node deixa
// socket keep-alive aberto depois delas. Matar o processo à força no meio
// disso derruba o libuv no Windows com
// `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` e sai com
// 3221226505 — DEPOIS de imprimir "TUDO CERTO".
//
// O estrago não é o crash: é a suíte inteira falhar com tudo verde. Falso
// alarme repetido é como se aprende a ignorar o conferidor.
//
// Marcando o código e deixando o Node fechar sozinho, os sockets ociosos
// se encerram e a saída é limpa.
// ============================================================
process.exitCode = falhas === 0 ? 0 : 1;
