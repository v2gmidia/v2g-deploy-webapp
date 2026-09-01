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
} from "../lib/dia-seguinte/resposta.ts";
import type { Consolidado } from "../lib/dia-seguinte/tipos.ts";
import { diaDeOntemEmSaoPaulo, diaEmSaoPaulo } from "../lib/dia-seguinte/dia.ts";
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
    "`respondeu_hoje` ausente reprova (a tela perguntaria de novo a quem já respondeu)",
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

secao("3. a armadilha do upsert — reenviar SUBSTITUI a linha inteira");
{
  const consolidado = validarConsolidado(CONSOLIDADO_CRU) as Consolidado;
  const DIA = "2026-09-14"; // já tem vendas=3 e receita=160000
  const P = "Quantas viraram venda?";

  const montar = (mexeu: Parameters<typeof montarRespostaDoDono>[0]["mexeu"], c = consolidado) =>
    montarRespostaDoDono({ dia: DIA, pergunta: P, mexeu, consolidado: c });

  // ============================================================
  // O CASO QUE O CONTRATO MARCA COMO "o erro mais fácil de cometer".
  // Corrigir só as vendas NÃO pode apagar a receita.
  // ============================================================
  const soVendas = montar({ vendas: 5 });
  ok(soVendas.ok && soVendas.corpo.vendas === 5, "corrigir só as vendas manda a venda nova");
  ok(
    soVendas.ok && soVendas.corpo.receitaCentavos === 160000,
    "e PRESERVA a receita que já estava gravada (era o apagamento silencioso)",
  );

  const soReceita = montar({ receitaCentavos: 200000 });
  ok(
    soReceita.ok && soReceita.corpo.vendas === 3,
    "corrigir só a receita preserva as vendas — o outro lado do mesmo corte",
  );

  // ---- "não sei" é apagamento DELIBERADO, e passa ----
  const naoSei = montar({ receitaCentavos: null });
  ok(
    naoSei.ok && naoSei.corpo.receitaCentavos === null && naoSei.corpo.vendas === 3,
    '"não sei" na receita apaga a receita e mantém as vendas',
  );

  // A distinção que faz tudo isso funcionar: `undefined` é "não mexi",
  // `null` é "não sei". Sem ela, uma das duas fica errada.
  const naoMexeu = montar({});
  ok(
    naoMexeu.ok && naoMexeu.corpo.vendas === 3 && naoMexeu.corpo.receitaCentavos === 160000,
    "não mexer em nada reenvia o que estava lá, sem apagar",
  );

  // ---- zero é resposta ----
  const zero = montar({ vendas: 0 });
  ok(zero.ok && zero.corpo.vendas === 0, "zero venda vai como 0, e NÃO como null");

  // ---- o 422 evitado antes de sair daqui ----
  const vazio = montarRespostaDoDono({
    dia: "2026-09-20",
    pergunta: P,
    mexeu: { vendas: null, receitaCentavos: null },
    consolidado,
  });
  ok(!vazio.ok, "os dois nulos não viram requisição — é ruído, e o backend devolveria 422");
  ok(!vazio.ok && vazio.erro === NADA_A_RESPONDER, "e o recado é o nosso, não o erro cru da API");

  // ---- dia novo, sem nada gravado ----
  const novo = montarRespostaDoDono({
    dia: "2026-09-20",
    pergunta: P,
    mexeu: { vendas: 2 },
    consolidado,
  });
  ok(
    novo.ok && novo.corpo.vendas === 2 && novo.corpo.receitaCentavos === null,
    "dia sem resposta anterior manda o que ele deu e `null` no resto",
  );

  // ---- sem consolidado: não inventa ----
  const cego = montarRespostaDoDono({
    dia: DIA,
    pergunta: P,
    mexeu: { vendas: 5 },
    consolidado: null,
  });
  ok(
    cego.ok && cego.corpo.vendas === 5 && cego.corpo.receitaCentavos === null,
    "sem consolidado, manda só o que ele mexeu — não inventa valor para preservar",
  );

  // ---- a pergunta viaja junto, exata ----
  ok(soVendas.ok && soVendas.corpo.pergunta === P, "a pergunta exibida vai no corpo, literal");
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
