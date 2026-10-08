import assert from "node:assert/strict";
import test from "node:test";
import { filtrarPortfolio, montarPortfolio } from "../lib/gestor/portfolio.ts";

const negocio = (id, extra = {}) => ({
  id, name: id, description: "Servico de teste valido", avg_ticket_min: 100,
  avg_ticket_max: 100, avg_direct_cost: 0, target_profit_per_customer: 0,
  monthly_budget: 1000, cadastro_estado: "enviado", onboarding: {},
  dados_ficticios: false, created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-02T00:00:00Z", ...extra,
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
  }, cadastro_estado: "pendente" })], [], [], [{ id: "c1", business_id: "a" }]);
  assert.match(linhas[0].proximaAcao, /confirmar no Google/);
  assert.doesNotMatch(linhas[0].proximaAcao, /marcada|reservada/);
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
