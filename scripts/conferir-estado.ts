/**
 * Confere a cadeia do "o que falta" — `lib/estado/frases.ts`.
 *
 * POR QUE ESTE CONFERIDOR EXISTE. Os cortes de tempo da cadeia (2 dias para
 * a peça, 2 para a publicação, 4 para os números) só aparecem em tela
 * depois de dois ou quatro dias. Um corte que só dá para ver esperando é um
 * corte que ninguém confere — e foi por isso que `montarEtapas` recebe
 * `agora` como parâmetro em vez de chamar `new Date()` lá dentro.
 *
 * TESTA OS DOIS LADOS DE CADA CORTE, sempre: antes do prazo e depois. Um
 * teste que só olha o lado em que nada acontece passa sem provar nada —
 * isso já aconteceu quatro vezes neste projeto.
 *
 * O §0 é controle negativo: se o próprio mecanismo de asserção não estiver
 * pegando erro, todo o resto abaixo é verde sem valor.
 *
 * Roda com `pnpm conferir:estado`. Não toca no banco e não precisa de rede.
 */

import { resumirPendencias } from "../lib/cadastro/pendencias.ts";
import type { Pendencia } from "../lib/cadastro/montar.ts";
import {
  blocosDaTrilha,
  estadoNaLista,
  montarEtapas,
  posicoesDaCadeia,
  DIAS_ATE_ADMITIR_NUMEROS,
  DIAS_ATE_ADMITIR_PECA,
  type Etapa,
  type MedidaDoCliente,
} from "../lib/estado/frases.ts";
import {
  andamentoDaExecucao,
  type ExecucaoDoCliente,
} from "../lib/pipeline/relogios.ts";

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

// ---------------------------------------------------------------- fixtures

const T0 = new Date("2026-08-19T23:31:49.646Z");
const maisDias = (dias: number) => new Date(T0.getTime() + dias * 86_400_000);

const SEM_PENDENCIA = resumirPendencias([], T0);

function pendencia(motivo: Pendencia["motivo"], desde?: string): Pendencia {
  return {
    campo: "lucro_desejado_por_cliente",
    rotulo: "Quanto você quer que fique com você",
    motivo,
    onde: "/onboarding/contas",
    ...(desde ? { desde } : {}),
  };
}

/** A base: cadastro fechado, conta conectada, nada mais aconteceu. */
function base(): MedidaDoCliente {
  return {
    temNegocio: true,
    cadastro: SEM_PENDENCIA,
    conexaoAtiva: true,
    cadastroEnviadoEm: T0.toISOString(),
    // Sem execução legível — quem nunca disparou, e o que a cadeia dizia
    // ANTES do lote F. As seções 1 a 9 rodam nesta base de propósito: elas
    // são a prova de que a leitura nova é ADIÇÃO, não troca.
    execucao: null,
    pecasProntas: 0,
    pecasParaAprovar: 0,
    campanhaCriadaEm: null,
    publicacaoFalhou: false,
    publicadaEm: null,
    temNumero: false,
  execucaoDoBackend: null,
  execucaoIlegivel: false,
  };
}

/**
 * Uma execução como o `execucaoDoCliente()` a devolveria.
 *
 * `andamento` sai do `andamentoDaExecucao` DE VERDADE, e não de um literal
 * escrito à mão: é ele quem sabe quais status são espera do cliente, e um
 * valor chapado aqui faria este conferidor concordar com uma regra que o
 * código não tem.
 */
function execucao(
  status: string,
  atualizadoEm: string | null,
  agora: Date = T0,
): ExecucaoDoCliente {
  return {
    status,
    atualizadoEm,
    andamento: andamentoDaExecucao(status, atualizadoEm, agora),
  };
}

const proximo = (m: MedidaDoCliente, agora: Date): Etapa | undefined =>
  montarEtapas(m, agora).find((e) => !e.concluida);

// ------------------------------------------------------------------ testes

secao("0. controle negativo — a asserção pega erro quando existe");
{
  // Roda `ok` com o console e os contadores desviados, para o controle não
  // sujar a saída nem o placar. Se `ok(false, ...)` NÃO incrementar as
  // falhas, todo o verde abaixo é verde sem valor.
  const guardaFalhas = falhas;
  const guardaTestes = testes;
  const guardaLog = console.log;
  console.log = () => {};
  ok(1 + 1 === 3, "controle");
  console.log = guardaLog;
  const pegou = falhas === guardaFalhas + 1;
  falhas = guardaFalhas;
  testes = guardaTestes;
  ok(pegou, "`ok(false, …)` conta como falha — o placar abaixo vale alguma coisa");
}

secao("1. a ordem da cadeia — o primeiro elo aberto é o que vale");
{
  const m = base();
  m.cadastro = resumirPendencias([pendencia("nao_perguntado")], T0);
  m.conexaoAtiva = false;
  const p = proximo(m, T0);
  ok(p?.id === "cadastro", "sem cadastro e sem conexão, o próximo é o CADASTRO");
  ok(p?.bola === "cliente", "e a bola é do cliente");
  ok(p?.acao !== null, "e ele ganha uma ação");
}
{
  const m = base();
  m.conexaoAtiva = false;
  const p = proximo(m, T0);
  ok(p?.id === "conexao", "com cadastro fechado e sem conexão, o próximo é a CONEXÃO");
}

secao("2. a bola tem nome — e a etapa 3 é a da conta medida em 20/08");
{
  // Esta é a medida REAL de `businesses.a85c37a9-...` em 20/08/2026:
  // seis obrigatórios preenchidos, conexão `connected`, execução criada
  // em 19/08 23:31, zero campanhas, zero peças.
  const m = base();
  const p = proximo(m, maisDias(1));
  ok(p?.id === "peca", "a conta real do §0 do desenho está parada na PEÇA");
  ok(p?.bola === "nos", "e a bola é NOSSA — não é nada que o cliente tenha que fazer");
  ok(p?.acao === null, "sem ação: não há o que ele fazer, e um botão inventaria trabalho");
  ok(
    p!.corpo.includes("19 de agosto"),
    "e o corpo diz desde quando a gente está com ela",
  );
}

secao("3. o corte da peça — os DOIS lados");
{
  const m = base();

  const antes = proximo(m, maisDias(DIAS_ATE_ADMITIR_PECA - 0.1))!;
  ok(!antes.admitindo, `antes de ${DIAS_ATE_ADMITIR_PECA} dias a tela EXPLICA`);
  ok(antes.titulo.includes("montando"), "  e o título diz que a gente está montando");
  ok(antes.acao === null, "  e não há botão");

  const depois = proximo(m, maisDias(DIAS_ATE_ADMITIR_PECA))!;
  ok(depois.admitindo, `a partir de ${DIAS_ATE_ADMITIR_PECA} dias a tela ADMITE`);
  ok(depois.titulo.includes("devendo"), "  e o título admite a dívida");
  ok(depois.acao !== null, "  e aí sim há canal para cobrar");
  ok(depois.bola === "nos", "  e a bola continua nossa nos dois lados");
}
{
  // Sem data não dá para saber há quanto tempo. Ausência não é prova.
  const m = base();
  m.cadastroEnviadoEm = null;
  const p = proximo(m, maisDias(90))!;
  ok(!p.admitindo, "sem `cadastro_iniciado_em`, 90 dias depois AINDA não admite");
}

secao("4. publicação falhada não espera prazo nenhum");
{
  const m = base();
  m.pecasProntas = 1;
  m.campanhaCriadaEm = T0.toISOString();
  m.publicacaoFalhou = true;
  const p = proximo(m, maisDias(0.01))!;
  ok(p.id === "no_ar", "com peça pronta e publicação falhada, o próximo é NO AR");
  ok(p.admitindo, "  e ela admite na hora — o banco já sabe que falhou");
  ok(p.acao !== null, "  com canal para falar com a gente");
}

secao("5. os números — a bola é do Facebook, até deixar de ser");
{
  const m = base();
  m.pecasProntas = 1;
  m.publicadaEm = T0.toISOString();

  const antes = proximo(m, maisDias(DIAS_ATE_ADMITIR_NUMEROS - 0.1))!;
  ok(antes.id === "numeros", "no ar e sem número, o próximo são os NÚMEROS");
  ok(antes.bola === "facebook", "  e a bola é do FACEBOOK, não nossa nem dele");
  ok(antes.titulo.includes("aprendendo"), "  com o texto do dia zero");
  ok(antes.acao === null, "  e sem botão: não há o que cobrar de ninguém ainda");

  const depois = proximo(m, maisDias(DIAS_ATE_ADMITIR_NUMEROS))!;
  ok(depois.bola === "nos", `a partir de ${DIAS_ATE_ADMITIR_NUMEROS} dias a bola MUDA DE MÃO`);
  ok(depois.admitindo, "  e a tela admite");
}

secao("6. tudo pronto — nenhuma tela fala de pendência");
{
  const m = base();
  m.pecasProntas = 1;
  m.publicadaEm = T0.toISOString();
  m.temNumero = true;
  ok(proximo(m, maisDias(30)) === undefined, "cadeia inteira concluída → não há `proximo`");
}

secao("7. a trilha conta os seis obrigatórios, e o 'não sei' ACENDE");
{
  ok(blocosDaTrilha(SEM_PENDENCIA) === 6, "cadastro fechado → 6 de 6");

  const uma = resumirPendencias([pendencia("nao_perguntado")], T0);
  ok(blocosDaTrilha(uma) === 5, "uma pendência do cliente → 5 de 6");

  const naoSei = resumirPendencias([pendencia("nao_sei", T0.toISOString())], T0);
  ok(
    blocosDaTrilha(naoSei) === 6,
    "uma pendência 'não sei' → 6 de 6 (a bola é nossa, não dele)",
  );
}

secao("8. a etapa 1 DELEGA a copy — não escreve a própria");
{
  const m = base();
  const doisNaoSei = resumirPendencias(
    [pendencia("nao_sei", T0.toISOString())],
    T0,
  );
  m.cadastro = doisNaoSei;
  const p = proximo(m, T0)!;
  ok(p.titulo === doisNaoSei.titulo, "o título é o do `resumirPendencias`, letra por letra");
  ok(p.corpo === doisNaoSei.corpo, "o corpo também");
  ok(p.acao === null, "e o 'não sei' continua SEM botão de responder de novo");
  ok(p.bola === "nos", "com a bola do nosso lado");
}
{
  // Passados os 5 dias do `DIAS_ATE_TROCAR_DE_DONO`, o próprio
  // `resumirPendencias` troca de dono — e a etapa tem que acompanhar.
  const m = base();
  m.cadastro = resumirPendencias(
    [pendencia("nao_sei", T0.toISOString())],
    maisDias(5),
  );
  const p = proximo(m, maisDias(5))!;
  ok(p.admitindo, "passados 5 dias sem a ligação, a etapa 1 admite");
  ok(p.bola === "nos", "  e a bola é nossa");
}

secao("9. a lista do 'resto do caminho' — a regressão de 20/08");
{
  // A conta real do §0: cadastro fechado, conexão viva, parada na peça.
  // A lista mostrava "Já está feito" para a APROVAÇÃO, que nunca
  // aconteceu — `pecasParaAprovar === 0` é verdade vazia quando não existe
  // peça nenhuma para aprovar. E mostrava `titulo` (chamado de ação) onde
  // precisava de nome.
  const m = base();
  const etapas = montarEtapas(m, maisDias(1));
  const atual = etapas.find((e) => !e.concluida)!;
  const linhas = posicoesDaCadeia(etapas, atual);
  const por = (id: string) => linhas.find((l) => l.etapa.id === id)!;

  ok(por("cadastro").posicao === "feita", "o cadastro, antes da atual, é 'feita'");
  ok(por("conexao").posicao === "feita", "a conexão, antes da atual, é 'feita'");
  ok(por("peca").posicao === "atual", "a peça é a ATUAL");
  ok(
    por("aprovacao").etapa.concluida === true,
    "a aprovação tem `concluida === true` (verdade vazia: zero peças)",
  );
  ok(
    por("aprovacao").posicao === "ainda_nao",
    "  mas a POSIÇÃO dela é 'ainda_nao' — é a posição que manda",
  );
  ok(por("no_ar").posicao === "ainda_nao", "o no ar é 'ainda_nao'");
  ok(por("numeros").posicao === "ainda_nao", "os números são 'ainda_nao'");

  ok(
    !estadoNaLista(por("aprovacao").etapa, "ainda_nao").includes("Já está feito"),
    "  e a aprovação NÃO lê 'Já está feito'",
  );
  ok(
    estadoNaLista(por("aprovacao").etapa, "ainda_nao").includes("vai depender de você"),
    "  ela diz de quem VAI ser a vez",
  );

  // Toda etapa precisa de um nome que sirva nos três estados. String vazia
  // foi exatamente o que a linha do cadastro mostrou em tela.
  ok(
    etapas.every((e) => e.nome.trim().length > 0),
    "toda etapa tem `nome` não vazio — inclusive a concluída",
  );
  ok(
    etapas.every((e) => !e.nome.startsWith("Falta")),
    "e nenhum `nome` começa com 'Falta' — nome é substantivo, não chamado",
  );
  ok(
    por("cadastro").etapa.titulo === "",
    "o `titulo` do cadastro concluído É vazio — por isso a lista usa `nome`",
  );
}

secao("10. os SEIS estados de `EstadoExecucao` — cada um com a sua bola");
{
  // O mapa do `docs/tela-processando.md` §2.2. O que se confere aqui é que
  // a etapa 3 sabe a diferença entre uma FILA e TRABALHO ACONTECENDO — e
  // que nenhum dos seis estados cobra do cliente o que não é dele.
  const comStatus = (status: string) => {
    const m = base();
    m.execucao = execucao(status, T0.toISOString());
    return proximo(m, maisDias(0.5))!;
  };

  const naFila = comStatus("cadastro_completo");
  ok(naFila.bola === "nos", "`cadastro_completo` → a bola é NOSSA");
  ok(
    !naFila.titulo.includes("montando"),
    "  e NÃO diz 'montando': ninguém pegou a execução ainda, é fila",
  );
  ok(naFila.titulo.includes("chegou"), "  diz que o cadastro CHEGOU até a gente");
  ok(naFila.acao === null, "  e sem botão — não há o que ele fazer");

  for (const s of ["pipeline_texto_rodando", "gerando_criativo"]) {
    const p = comStatus(s);
    ok(p.bola === "nos", `\`${s}\` → a bola é NOSSA`);
    ok(p.titulo.includes("montando"), `  e aí SIM diz 'montando' — está rodando mesmo`);
  }

  for (const s of ["estrutura_pronta", "gerado"]) {
    const p = comStatus(s);
    ok(p.bola === "nos", `\`${s}\` → a bola é NOSSA (revisão do gestor)`);
    ok(p.titulo.includes("conferindo"), "  e a frase diz que a gente está conferindo");
    ok(
      p.concluida === false,
      "  e a etapa NÃO fecha: quem fecha é a peça em `creatives` (Decisão 13)",
    );
    ok(p.id === "peca", "  a cadeia continua na PEÇA, não pula para a aprovação");
  }

  // Decisão 13, dita ao contrário para o teste não ser tautológico: com
  // peça pronta em `creatives`, a etapa fecha MESMO com a execução ainda
  // em `pipeline_texto_rodando`. O artefato manda, não o status.
  {
    const m = base();
    m.execucao = execucao("pipeline_texto_rodando", T0.toISOString());
    m.pecasProntas = 1;
    m.pecasParaAprovar = 1;
    const p = proximo(m, maisDias(0.5))!;
    ok(
      p.id === "aprovacao",
      "peça pronta com execução ainda rodando → a cadeia AVANÇA (o artefato manda)",
    );
  }

  const desconhecido = comStatus("um_estado_que_o_backend_inventou");
  ok(desconhecido.bola === "nos", "status fora dos seis → a bola cai em NOSSA");
  ok(
    desconhecido.bola !== "cliente",
    "  e NUNCA em 'cliente' — errar para esse lado culpa quem não tem culpa",
  );
}

secao("11. `aguardando_fotos` — a proibição do enunciado, conferida");
{
  // A PROIBIÇÃO: a tela não pode dizer que estamos trabalhando quando a
  // espera é do cliente. Este é o único dos seis estados em que isso pode
  // acontecer, e era o que a cadeia fazia antes deste lote.
  const m = base();
  m.execucao = execucao("aguardando_fotos", T0.toISOString());
  const p = proximo(m, maisDias(0.5))!;

  ok(p.bola === "cliente", "`aguardando_fotos` → a bola é DO CLIENTE");
  ok(
    !p.corpo.includes("a gente está montando") && !p.titulo.includes("montando"),
    "  e a tela NÃO diz que a gente está montando — a espera é dele",
  );
  ok(p.acao !== null, "  ele ganha um canal");
  ok(
    p.acao!.href.startsWith("https://wa.me/"),
    "  e o canal é falar com a gente, NÃO 'subir foto': o upload da /conta " +
      "grava em creatives e não destrava a execução (buraco-fotos-execucao.md)",
  );
  ok(
    !p.acao!.rotulo.toLowerCase().includes("foto"),
    "  o rótulo não promete mandar foto — botão que não resolve é pior que silêncio",
  );

  // E ele NÃO entra no relógio: um cronômetro correndo aqui acusaria a
  // gente de uma falha que é pendência dele. Mesma disciplina do `nao_sei`.
  const velho = base();
  velho.execucao = execucao("aguardando_fotos", T0.toISOString());
  const depois = proximo(velho, maisDias(30))!;
  ok(!depois.admitindo, "30 dias em `aguardando_fotos` e a gente NÃO admite dívida");
  ok(depois.bola === "cliente", "  a bola continua dele");
}

secao("12. O RELÓGIO CONTA DO ÚLTIMO MOVIMENTO — os dois lados");
{
  // ============================================================
  // ESTA É A SEÇÃO QUE A CONTA REAL NÃO CONSEGUE PROVAR.
  //
  // Na `a85c37a9`, `cadastro_iniciado_em` e `execucoes.atualizado_em`
  // estão a 1,7 segundo um do outro — os dois relógios dão o mesmo
  // número, e um teste lá passaria COM e SEM a mudança. É o "teste verde
  // escondendo defeito" que este projeto já pagou quatro vezes.
  //
  // Aqui os dois divergem de propósito, que é o único jeito de a troca de
  // fonte ser visível.
  // ============================================================

  // Pipeline TRABALHANDO: disparou há 5 dias, mas se mexeu há 1 hora.
  // Pela fonte antiga (`cadastro_iniciado_em`) isto admitiria dívida sobre
  // um pipeline saudável. É a asserção que FALHA antes deste lote.
  {
    const m = base();
    m.cadastroEnviadoEm = T0.toISOString();
    m.execucao = execucao(
      "gerando_criativo",
      new Date(maisDias(5).getTime() - 3_600_000).toISOString(),
    );
    const p = proximo(m, maisDias(5))!;
    ok(
      !p.admitindo,
      "disparo há 5 dias + movimento há 1 hora → NÃO admite (o pipeline está andando)",
    );
    ok(p.titulo.includes("montando"), "  e a frase é a de trabalho acontecendo");
  }

  // Pipeline PARADO: nada se mexeu desde o disparo. Admite.
  {
    const m = base();
    m.execucao = execucao("cadastro_completo", T0.toISOString());
    const p = proximo(m, maisDias(DIAS_ATE_ADMITIR_PECA))!;
    ok(p.admitindo, `silêncio de ${DIAS_ATE_ADMITIR_PECA} dias → ADMITE`);
    ok(p.titulo.includes("devendo"), "  e o título admite a dívida");
  }

  // O outro lado do mesmo corte, para não ser teste de um lado só.
  {
    const m = base();
    m.execucao = execucao("cadastro_completo", T0.toISOString());
    const p = proximo(m, maisDias(DIAS_ATE_ADMITIR_PECA - 0.1))!;
    ok(!p.admitindo, "  e um décimo de dia antes, ainda não");
  }

  // Fallback: execução sem `atualizado_em` legível cai em
  // `cadastro_iniciado_em`, que é o comportamento anterior.
  {
    const m = base();
    m.execucao = execucao("cadastro_completo", null);
    const p = proximo(m, maisDias(DIAS_ATE_ADMITIR_PECA))!;
    ok(p.admitindo, "sem `atualizado_em`, o relógio cai em `cadastro_iniciado_em`");
  }

  // Nem uma coisa nem outra: sem data nenhuma, ausência não é prova.
  {
    const m = base();
    m.cadastroEnviadoEm = null;
    m.execucao = execucao("cadastro_completo", null);
    const p = proximo(m, maisDias(90))!;
    ok(!p.admitindo, "sem data nenhuma, 90 dias depois AINDA não admite");
  }
}

secao("13. a frase que veio da /processando — o dinheiro");
{
  const m = base();
  m.execucao = execucao("cadastro_completo", T0.toISOString());
  const p = proximo(m, maisDias(DIAS_ATE_ADMITIR_PECA))!;
  ok(
    p.corpo.includes("Nada foi cobrado"),
    "quando a gente admite a dívida, a tela diz que NADA FOI COBRADO",
  );
  ok(
    p.corpo.includes("nenhum anúncio foi ao ar"),
    "  e que nenhum anúncio foi ao ar",
  );
}

// ------------------------------------------------- a fonte da execução

console.log("\nA. de onde a cadeia lê a execução — e o que ela diz sem conseguir ler");
{
  const execBackend = (status: string, pedeAcao: boolean) => ({
    idExecucao: "98447192-3968-4fb1-8062-b14d6a8751ae",
    businessId: "a85c37a9-0000-0000-0000-000000000000",
    status,
    andamento: "Precisamos das suas fotos para continuar",
    pedeAcao,
    atualizadoEm: T0.toISOString(),
  });

  const peca = (m: MedidaDoCliente) =>
    montarEtapas(m, maisDias(1)).find((e) => e.id === "peca")!;

  // ============================================================
  // O CASO REAL DE 02/09, QUE ESTE BLOCO EXISTE PARA NÃO REPETIR.
  //
  // Num preview sem o cliente admin, a leitura local de `execucoes` morria
  // e a `/inicio` respondia 200 dizendo "a gente está montando o seu
  // primeiro anúncio" — para um cliente cuja execução estava em
  // `aguardando_fotos`, ou seja, para quem A GENTE estava esperando.
  // ============================================================
  const semAdmin: MedidaDoCliente = {
    ...base(),
    execucao: null, // o admin não respondeu
    execucaoDoBackend: execBackend("aguardando_fotos", true),
  };
  const p1 = peca(semAdmin);
  ok(p1.bola === "cliente", "sem admin, o backend decide: a bola é do CLIENTE");
  ok(
    !/a gente está montando/i.test(p1.titulo),
    `e a frase NÃO é a otimista de antes — é "${p1.titulo}"`,
  );
  ok(p1.acao !== null, "e há o que ele fazer");

  // `pede_acao` VENCE mesmo quando o status não é o que a gente mapeia.
  const statusNovo: MedidaDoCliente = {
    ...base(),
    execucao: null,
    execucaoDoBackend: execBackend("um_estado_que_nao_existia", true),
  };
  const p2 = peca(statusNovo);
  ok(p2.bola === "cliente", "`pede_acao: true` com status desconhecido AINDA dá bola do cliente");
  ok(
    p2.titulo === "Precisamos das suas fotos para continuar",
    "e a frase vem do `andamento`, que o backend traduz — a tela não inventa",
  );

  // O outro lado: sem `pede_acao`, a bola continua sendo nossa.
  const semAcao: MedidaDoCliente = {
    ...base(),
    execucao: null,
    execucaoDoBackend: execBackend("pipeline_texto_rodando", false),
  };
  ok(peca(semAcao).bola === "nos", "`pede_acao: false` mantém a bola com a gente");

  // ---- não saber é um estado, e ele se declara ----
  const ilegivel: MedidaDoCliente = {
    ...base(),
    execucao: null,
    execucaoDoBackend: null,
    execucaoIlegivel: true,
  };
  const p3 = peca(ilegivel);
  ok(
    /não consegui carregar/i.test(p3.titulo),
    `nenhuma fonte respondeu -> a tela DIZ que não leu: "${p3.titulo}"`,
  );
  ok(
    !/admin|service_role|SUPABASE|variável/i.test(p3.titulo + p3.corpo),
    "e sem detalhe técnico — o nome da variável não ajuda o dono em nada",
  );
  ok(p3.bola === "nos", "e a bola fica com a gente, não com ele");

  // ============================================================
  // 404 NÃO É ILEGÍVEL. É resposta, e quer dizer que não há execução —
  // aí a cadeia diz o que sempre disse, e esta mudança continua sendo
  // ADIÇÃO e não troca.
  // ============================================================
  const semExecucao: MedidaDoCliente = {
    ...base(),
    execucao: null,
    execucaoDoBackend: null,
    execucaoIlegivel: false,
  };
  ok(
    /a gente está montando/i.test(peca(semExecucao).titulo),
    "404 (não há execução) continua com a frase de sempre",
  );
}

console.log(
  `\n${falhas === 0 ? "TUDO CERTO" : `${falhas} FALHA(S)`} — ${testes} conferências`,
);
process.exit(falhas === 0 ? 0 : 1);
