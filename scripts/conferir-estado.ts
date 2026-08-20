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
    pecasProntas: 0,
    pecasParaAprovar: 0,
    campanhaCriadaEm: null,
    publicacaoFalhou: false,
    publicadaEm: null,
    temNumero: false,
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

console.log(
  `\n${falhas === 0 ? "TUDO CERTO" : `${falhas} FALHA(S)`} — ${testes} conferências`,
);
process.exit(falhas === 0 ? 0 : 1);
