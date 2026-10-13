import assert from "node:assert/strict";
import test from "node:test";
import { filtrarPortfolio, instagramParaRevisao, montarPortfolio } from "../lib/gestor/portfolio.ts";
import { filtrarCompras, selecionarPedidosDaFila, periodoDaCompra, situacaoDaCompra, situacaoDaNota, situacaoDoContrato } from "../lib/gestor/compras.ts";
import { ultimoDocumentoPorPedido } from "../lib/contratacao/documentos.ts";
import { proximasAcoesDoGestor } from "../lib/gestor/proximas-acoes.ts";
import { descricaoDaTarefaDeRevisao, idDaTarefaDeRevisao } from "../lib/gestor/revisao-pendente.ts";
import { negociosSemResponsavel, proximaAcaoConfiavel, resumoDoTrabalhoDaConta } from "../lib/gestor/limites-carteira.ts";

test("fila não oferece assumir conta quando atribuições atingem o limite", () => {
  const negocios = [{ id: "a", name: "A" }, { id: "b", name: "B" }];
  const retornadas = [{ business_id: "a" }];
  assert.deepEqual(negociosSemResponsavel(negocios, retornadas, false), [negocios[1]]);
  assert.deepEqual(negociosSemResponsavel(negocios, retornadas, true), []);
});

test("carteira não transforma consulta truncada em ausência de gestor ou de tarefas", () => {
  const base = { operadorId: "gestor-a", responsavelId: undefined,
    atribuicoesParciais: false, tarefasAbertasRetornadas: 0, tarefasParciais: false };
  assert.equal(resumoDoTrabalhoDaConta(base),
    "Gestor responsável: não atribuído · 0 tarefa(s) aberta(s)");
  assert.equal(resumoDoTrabalhoDaConta({ ...base, atribuicoesParciais: true, tarefasParciais: true }),
    "Gestor responsável: não confirmado nesta consulta parcial · quantidade não confirmada de tarefa(s) aberta(s)");
  assert.equal(resumoDoTrabalhoDaConta({ ...base, responsavelId: "gestor-a",
    atribuicoesParciais: true, tarefasAbertasRetornadas: 2, tarefasParciais: true }),
    "Gestor responsável: você · ao menos 2 tarefa(s) aberta(s)");
  assert.equal(resumoDoTrabalhoDaConta({ ...base, responsavelId: "gestor-b" }),
    "Gestor responsável: outro operador · 0 tarefa(s) aberta(s)");
});

test("carteira não recomenda ação derivada de fonte operacional incompleta", () => {
  const acao = "Aguardar pagamento; não há compra aprovada neste negócio";
  assert.equal(proximaAcaoConfiavel(acao, false), acao);
  assert.equal(proximaAcaoConfiavel(acao, true),
    "Conferir pedidos, contas e execução nas telas específicas");
});

test("contratação não afirma ausência de contrato ou nota em consulta truncada", () => {
  assert.equal(situacaoDoContrato(undefined, false), "nenhum documento registrado");
  assert.equal(situacaoDoContrato(undefined, true), "documento não confirmado nesta consulta parcial");
  assert.equal(situacaoDoContrato("signed", true), "assinatura registrada");
  assert.equal(situacaoDaNota(undefined, false), "sem nota registrada");
  assert.equal(situacaoDaNota(undefined, true), "registro fiscal não confirmado nesta consulta parcial");
  assert.equal(situacaoDaNota("authorized", true), "último registro: nota autorizada; competência e cobertura a conferir");
});

test("fila pessoal isola contas e operadores, recupera peça sem tarefa e evita duplicata", () => {
  const peca = "018f8980-6c3e-46d5-8b39-37f19465e4ea";
  const negocio = "c9adc12e-3b40-4206-9aa4-cfda217ff376";
  const tarefaMinha = "293de644-55d6-4e3c-9c38-35816e90dffd";
  const tarefaRevisao = { id: idDaTarefaDeRevisao(peca), business_id: negocio,
    title: "Revisar criativo enviado", description: descricaoDaTarefaDeRevisao(peca, negocio),
    assigned_to: "gestor-a", due_at: null, created_at: "2026-10-10T10:00:00Z" };
  const fila = proximasAcoesDoGestor("gestor-a", new Set([negocio]), new Map([[negocio, "Loja A"]]),
    [{ id: peca, business_id: negocio, created_at: "2026-10-10T09:00:00Z" },
      { id: "peca-sem-tarefa", business_id: negocio, created_at: "2026-10-10T08:00:00Z" },
      { id: "outra-conta", business_id: "outro", created_at: "2026-10-10T07:00:00Z" }],
    [tarefaRevisao, { ...tarefaRevisao, id: tarefaMinha, title: "Conferir acesso", description: null },
      { ...tarefaRevisao, id: "tarefa-outro-gestor", assigned_to: "gestor-b" },
      { ...tarefaRevisao, id: "tarefa-outra-conta", business_id: "outro" }],
    Date.parse("2026-10-10T12:00:00Z"));
  assert.deepEqual(fila.map((a) => a.id), ["revisao:peca-sem-tarefa", `revisao:${peca}`, `tarefa:${tarefaMinha}`]);
  assert.equal(fila[1].href, `/gestor/criativos?negocio=${negocio}&peca=${peca}`);
  assert.equal(fila[2].href, `/gestor/tarefas?negocio=${negocio}&tarefa=${tarefaMinha}`);
});

test("fila pessoal prioriza tarefa vencida ou sem responsável e não inventa prazo inválido", () => {
  const negocio = "conta";
  const base = { business_id: negocio, title: "Tarefa", description: null,
    assigned_to: "gestor", created_at: "2026-10-10T10:00:00Z" };
  const fila = proximasAcoesDoGestor("gestor", new Set([negocio]), new Map(), [], [
    { ...base, id: "futura", due_at: "2026-10-12T10:00:00Z" },
    { ...base, id: "vencida", due_at: "2026-10-09T10:00:00Z" },
    { ...base, id: "sem-responsavel", assigned_to: null, due_at: null },
    { ...base, id: "prazo-invalido", due_at: "invalido" },
  ], Date.parse("2026-10-10T12:00:00Z"));
  assert.deepEqual(fila.slice(0, 2).map((a) => a.id), ["tarefa:vencida", "tarefa:sem-responsavel"]);
  assert.equal(fila.find((a) => a.id === "tarefa:prazo-invalido").situacao, "Sem prazo registrado");
});

test("tarefa de revisão aberta após sumir da fila pendente encaminha à peça para reconciliar", () => {
  const peca = "018f8980-6c3e-46d5-8b39-37f19465e4ea";
  const negocio = "c9adc12e-3b40-4206-9aa4-cfda217ff376";
  const fila = proximasAcoesDoGestor("gestor-a", new Set([negocio]), new Map([[negocio, "Loja A"]]), [], [{
    id: idDaTarefaDeRevisao(peca), business_id: negocio, title: "Revisar criativo enviado",
    description: descricaoDaTarefaDeRevisao(peca, negocio), assigned_to: "gestor-a",
    due_at: null, created_at: "2026-10-10T10:00:00Z",
  }], Date.parse("2026-10-10T12:00:00Z"));
  assert.equal(fila.length, 1);
  assert.equal(fila[0].href, `/gestor/criativos?negocio=${negocio}&peca=${peca}`);
  assert.match(fila[0].situacao, /conferir e sincronizar/);
  assert.doesNotMatch(fila[0].situacao, /aprovad|publicad|rejeitad/i);
});

test("fila de compras prioriza comprovante e erro ambíguo sem incluir cancelado em atenção", () => {
  const pedido = (id, status, extra = {}) => ({ id, status, legal_name: `Empresa ${id}`,
    buyer_email: `${id}@example.test`, cnpj: "12345678000195", created_at: "2026-10-08T12:00:00Z", ...extra });
  const pedidos = [pedido("cancelado", "cancelled"), pedido("aprovado", "payment_approved", { buyer_profile_id: "perfil" }),
    pedido("aguardando", "awaiting_payment"), pedido("ambiguo", "awaiting_payment", {
      payment_creation_started_at: "2026-10-08T12:00:00Z", provider_charge_id: null,
    }), pedido("comprovante", "proof_received")];
  assert.deepEqual(filtrarCompras(pedidos, "", "todas").map((p) => p.id),
    ["comprovante", "ambiguo", "aguardando", "aprovado", "cancelado"]);
  assert.deepEqual(filtrarCompras(pedidos, "", "atencao").map((p) => p.id), ["comprovante", "ambiguo"]);
  assert.deepEqual(filtrarCompras(pedidos, "EMPRESA APROVADO", "aprovadas").map((p) => p.id), ["aprovado"]);
});

test("fila preserva comprovante antigo e aprovação sem perfil além dos 200 pedidos recentes", () => {
  const recentes = Array.from({ length: 200 }, (_, i) => ({ id: `recente-${i}`, status: "cancelled",
    created_at: "2026-10-10T00:00:00Z", legal_name: "Recente", buyer_email: "r@example.test", cnpj: "123" }));
  const comprovante = { ...recentes[0], id: "comprovante-antigo", status: "proof_received",
    created_at: "2026-09-01T00:00:00Z" };
  const aprovadoSemPerfil = { ...recentes[0], id: "aprovado-antigo", status: "payment_approved",
    buyer_profile_id: null, created_at: "2026-09-02T00:00:00Z" };
  const selecao = selecionarPedidosDaFila([recentes, [comprovante], [aprovadoSemPerfil], [comprovante]]);
  assert.deepEqual(selecao.pedidos.slice(0, 2).map((pedido) => pedido.id),
    ["comprovante-antigo", "aprovado-antigo"]);
  assert.equal(selecao.pedidos.length, 200);
  assert.equal(selecao.parcial, true);
  assert.equal(selecao.pedidos.filter((pedido) => pedido.id === "comprovante-antigo").length, 1);
});

test("fila de compras distingue tentativa ambigua, comprovante e pagamento", () => {
  const base = { origin: "self_service", status: "awaiting_payment", payment_creation_started_at: "2026-10-08T12:00:00Z",
    provider_charge_id: null, provider_subscription_id: null };
  assert.equal(situacaoDaCompra(base), "Tentativa de pagamento a conciliar");
  assert.equal(situacaoDaCompra({ ...base, status: "payment_approved" }), "Pagamento confirmado pelo provedor");
  assert.equal(situacaoDaCompra({ ...base, origin: "assisted", status: "proof_received" }),
    "Comprovante recebido; aprovação pendente");
  assert.equal(periodoDaCompra("semiannual_upfront"), "Semestral à vista");
});

test("fila de compras usa estado do documento mais recente por pedido", () => {
  const estados = ultimoDocumentoPorPedido([
    { order_id: "a", status: "signed", created_at: "2026-10-01T00:00:00Z" },
    { order_id: "b", status: "authorized", created_at: "2026-10-03T00:00:00Z" },
    { order_id: "a", status: "voided", created_at: "2026-10-04T00:00:00Z" },
  ]);
  assert.equal(estados.get("a"), "voided");
  assert.equal(estados.get("b"), "authorized");
});

const negocio = (id, extra = {}) => ({
  id, name: id, description: "Servico de teste valido", avg_ticket_min: 100,
  avg_ticket_max: 100, avg_direct_cost: 0, target_profit_per_customer: 0,
  monthly_budget: 1000, cadastro_estado: "enviado", onboarding: {},
  dados_ficticios: false, created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-02T00:00:00Z", ...extra,
});

test("preparo da reunião mostra Instagram válido sem seguir URL arbitrária", () => {
  assert.deepEqual(instagramParaRevisao("@v2gmidia"), {
    rotulo: "@v2gmidia", url: "https://www.instagram.com/v2gmidia/",
  });
  assert.equal(instagramParaRevisao("javascript:alert(1)"), null);
  assert.equal(instagramParaRevisao("https://instagram.com.evil.test/v2gmidia"), null);
  const [linha] = montarPortfolio([negocio("a", { instagram_handle: "@v2gmidia",
    description: "Venda por conversa", differentiators: ["Entrega rápida"] })], [], [], []);
  assert.equal(linha.instagram.rotulo, "@v2gmidia");
  assert.equal(linha.descricaoParaReuniao, "Venda por conversa");
  assert.deepEqual(linha.diferenciaisParaReuniao, ["Entrega rápida"]);
});

test("comprovante recebido sobe na fila sem virar pagamento aprovado", () => {
  const linhas = montarPortfolio([negocio("a"), negocio("b")], [
    { id: "pedido", business_id: "b", status: "proof_received", created_at: "2026-10-02T00:00:00Z" },
  ], [], []);
  assert.equal(linhas[0].id, "b");
  assert.match(linhas[0].proximaAcao, /Conferir comprovante/);
  assert.equal(linhas[0].pedido, "proof_received");
});

test("isolamento por negocio, ignorando pedido sem vinculo e dado ficticio", () => {
  const linhas = montarPortfolio([negocio("a"), negocio("b"), negocio("fixture", { dados_ficticios: true })], [
    { id: "p1", business_id: "a", status: "payment_approved", created_at: "2026-10-02T00:00:00Z" },
    { id: "p2", business_id: null, status: "proof_received", created_at: "2026-10-03T00:00:00Z" },
  ], [{ order_id: "p1", status: "signed" }], [{ id: "c1", business_id: "b" }]);
  assert.equal(linhas.length, 2);
  assert.equal(linhas.find((l) => l.id === "a").contas, 0);
  assert.equal(linhas.find((l) => l.id === "b").contas, 1);
  assert.equal(linhas.find((l) => l.id === "b").pedido, null);
});

test("sem contrato não afirma que o cliente deixou de assinar", () => {
  const linhas = montarPortfolio([negocio("a")], [
    { id: "p1", business_id: "a", status: "payment_approved", created_at: "2026-10-02T00:00:00Z" },
  ], [], []);
  assert.equal(linhas[0].proximaAcao, "Preparar contrato após revisão jurídica");
});

test("pedido adicional pendente não fecha acesso nem esconde contrato da compra aprovada", () => {
  const pedidos = [
    { id: "novo", business_id: "a", status: "awaiting_payment", created_at: "2026-10-04T00:00:00Z" },
    { id: "aprovado", business_id: "a", status: "payment_approved", created_at: "2026-10-02T00:00:00Z" },
  ];
  const [semAssinatura] = montarPortfolio([negocio("a")], pedidos, [], []);
  assert.equal(semAssinatura.proximaAcao, "Preparar contrato após revisão jurídica");
  assert.equal(semAssinatura.origem, "pedido");
  const [assinado] = montarPortfolio([negocio("a")], pedidos,
    [{ order_id: "aprovado", status: "signed" }], []);
  assert.match(assinado.proximaAcao, /Pedido adicional aguardando pagamento/);
  assert.doesNotMatch(assinado.proximaAcao, /acesso ainda fechado/);
  assert.equal(assinado.prioridade, 4);
  assert.equal(assinado.contrato, "signed");
  const [apenasPendente] = montarPortfolio([negocio("a")], [pedidos[0]], [], []);
  assert.match(apenasPendente.proximaAcao, /não há compra aprovada neste negócio/);
  assert.doesNotMatch(apenasPendente.proximaAcao, /acesso ainda fechado/);
});

test("comprovante de compra anterior continua na fila mesmo após pedido novo", () => {
  const [linha] = montarPortfolio([negocio("a")], [
    { id: "novo", business_id: "a", status: "awaiting_payment", created_at: "2026-10-04T00:00:00Z" },
    { id: "comprovante", business_id: "a", status: "proof_received", created_at: "2026-10-02T00:00:00Z" },
  ], [], []);
  assert.match(linha.proximaAcao, /Conferir comprovante/);
  assert.equal(linha.prioridade, 1);
});

test("documento antigo não substitui o estado do contrato mais recente", () => {
  const [linha] = montarPortfolio([negocio("a")], [
    { id: "p1", business_id: "a", status: "payment_approved", created_at: "2026-10-02T00:00:00Z" },
  ], [
    { order_id: "p1", status: "signed" },
    { order_id: "p1", status: "pending" },
  ], []);
  assert.equal(linha.contrato, "signed");
});

test("onboarding concluido não afirma reserva", () => {
  const linhas = montarPortfolio([negocio("a", { onboarding: {
    conclusao: { em: "2026-10-02T00:00:00Z", proximoPasso: "agendamento_pendente" },
    marca: { em: "2026-10-02T00:00:00Z", aparencia: "Azul", aparenciaNaoSei: false, siteNaoTenho: true },
    respostas: Object.fromEntries(["nome", "ramo", "descricao", "praca"].map((chave) =>
      [chave, { texto: "Descrição completa", echo: "Descrição completa", em: "2026-10-02T00:00:00Z" }])),
  }, cadastro_estado: "pendente" })], [], [], [{ id: "c1", business_id: "a" }]);
  assert.match(linhas[0].proximaAcao, /confirmar no Google/);
  assert.doesNotMatch(linhas[0].proximaAcao, /marcada|reservada/);
});

test("marcador de conclusão sozinho não fecha a ficha do gestor", () => {
  const [linha] = montarPortfolio([negocio("a", { onboarding: {
    conclusao: { em: "2026-10-02T00:00:00Z", proximoPasso: "agendamento_pendente" },
  } })], [], [], []);
  assert.equal(linha.onboardingConcluido, false);
  assert.doesNotMatch(linha.proximaAcao, /confirmar no Google/);
});

test("conta legada não é classificada como novo onboarding pendente", () => {
  const [linha] = montarPortfolio([negocio("legada")], [], [], []);
  assert.match(linha.proximaAcao, /Conta anterior ao fluxo de compra/);
  assert.equal(linha.origem, "operacao");
});

test("execuções são isoladas por negócio e a última usa a data da fonte", () => {
  const linhas = montarPortfolio([negocio("a"), negocio("b")], [], [], [], [
    { id: "a-antiga", business_id: "a", status: "gerado", campanha_meta: null, status_na_plataforma: null, status_lido_em: null, criado_em: "2026-10-01T00:00:00Z" },
    { id: "b-atual", business_id: "b", status: "publicado", campanha_meta: { id_campanha: "123" }, status_na_plataforma: "PAUSED", status_lido_em: "2026-10-03T00:00:00Z", criado_em: "2026-10-02T00:00:00Z" },
    { id: "a-atual", business_id: "a", status: "em_revisao", campanha_meta: null, status_na_plataforma: null, status_lido_em: null, criado_em: "2026-10-04T00:00:00Z" },
    { id: "sem-dono", business_id: null, status: "publicado", campanha_meta: {}, status_na_plataforma: null, status_lido_em: null, criado_em: "2026-10-05T00:00:00Z" },
  ]);
  const a = linhas.find((l) => l.id === "a");
  const b = linhas.find((l) => l.id === "b");
  assert.equal(a.execucoes, 2);
  assert.equal(a.ultimaExecucao.id, "a-atual");
  assert.equal(a.ultimaCampanha, null);
  assert.equal(b.execucoes, 1);
  assert.equal(b.ultimaCampanha.estadoNaPlataforma, "PAUSED");
});

test("campanha anterior continua visível mesmo após execução nova", () => {
  const [linha] = montarPortfolio([negocio("a")], [], [], [], [
    { id: "nova", business_id: "a", status: "em_revisao", campanha_meta: null, status_na_plataforma: null, status_lido_em: null, criado_em: "2026-10-04T00:00:00Z" },
    { id: "campanha", business_id: "a", status: "gerado", campanha_meta: { id_campanha: "123" }, status_na_plataforma: "PAUSED", status_lido_em: "2026-10-03T00:00:00Z", criado_em: "2026-10-02T00:00:00Z" },
  ]);
  assert.equal(linha.ultimaExecucao.id, "nova");
  assert.equal(linha.ultimaCampanha.idExecucao, "campanha");
  assert.equal(filtrarPortfolio([linha], "", "campanhas").length, 1);
});

test("busca e filtros não misturam negócios nem inventam campanha", () => {
  const linhas = montarPortfolio([negocio("Oficina Águia"), negocio("Loja B")], [], [], [], [
    { id: "e1", business_id: "Loja B", status: "gerado", campanha_meta: {}, status_na_plataforma: null, status_lido_em: null, criado_em: "2026-10-04T00:00:00Z" },
  ]);
  assert.deepEqual(filtrarPortfolio(linhas, "águia", "todos").map((l) => l.id), ["Oficina Águia"]);
  assert.deepEqual(filtrarPortfolio(linhas, "", "campanhas").map((l) => l.id), ["Loja B"]);
  assert.deepEqual(filtrarPortfolio(linhas, "águia", "campanhas"), []);
  assert.deepEqual(filtrarPortfolio(linhas, "", "minhas", new Set(["Loja B"]))
    .map((l) => l.id), ["Loja B"]);
  assert.deepEqual(filtrarPortfolio(linhas, "", "minhas"), [],
    "Sem atribuições confirmadas, o filtro não pode mostrar outra conta");
});

test("unidade aprovada identifica só a conta do mesmo negócio", () => {
  const linhas = montarPortfolio([negocio("a"), negocio("b")], [
    { id: "pa", business_id: "a", status: "payment_approved", created_at: "2026-10-02T00:00:00Z" },
    { id: "pb", business_id: "b", status: "awaiting_payment", created_at: "2026-10-02T00:00:00Z" },
  ], [], [
    { id: "ca", business_id: "a", external_id: "act_1", name: "Conta A", is_active: true },
    { id: "cb", business_id: "b", external_id: "act_2", name: "Conta B", is_active: false },
  ], [], [
    { order_id: "pa", ad_account_id: "ca" },
    { order_id: "pa", ad_account_id: "cb" },
    { order_id: "pb", ad_account_id: null },
  ]);
  const a = linhas.find((l) => l.id === "a");
  const b = linhas.find((l) => l.id === "b");
  assert.equal(a.contasDetalhe[0].vinculo, "pedido_aprovado");
  assert.equal(a.contasDetalhe[0].identificador, "act_1");
  assert.equal(b.contasDetalhe[0].vinculo, "sem_unidade_aprovada");
  assert.equal(b.contasDetalhe[0].ativa, false);
  assert.equal(b.unidadesAprovadasLivres, 0);
  assert.deepEqual(filtrarPortfolio(linhas, "", "contas").map((l) => l.id), ["b"]);
});

test("unidade livre de pedido aprovado fica visível sem inventar conta", () => {
  const [linha] = montarPortfolio([negocio("a")], [
    { id: "pa", business_id: "a", status: "payment_approved", created_at: "2026-10-02T00:00:00Z" },
  ], [], [], [], [{ order_id: "pa", ad_account_id: null }]);
  assert.equal(linha.contas, 0);
  assert.equal(linha.unidadesAprovadasLivres, 1);
  assert.equal(filtrarPortfolio([linha], "", "contas").length, 1);
});
