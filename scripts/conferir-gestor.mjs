import assert from "node:assert/strict";
import test from "node:test";
import { montarPortfolio } from "../lib/gestor/portfolio.ts";

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
