import assert from "node:assert/strict";
import { test } from "node:test";
import { bloqueioContaContratada, bloqueioContratualDaCampanha,
  pedidosAptosParaCampanha } from "../lib/contratacao/trava-campanha.ts";

test("negócio legado sem pedido conserva fluxo atual", () => {
  assert.equal(bloqueioContratualDaCampanha([], [], "2026-10-05T00:00:00Z", "2026-10-06T00:00:00Z"), null);
  assert.match(bloqueioContratualDaCampanha([], [], "2026-10-07T00:00:00Z", "2026-10-06T00:00:00Z") ?? "", /novo/);
  assert.ok(bloqueioContratualDaCampanha([], [], "2026-10-05T00:00:00Z", null));
  assert.ok(bloqueioContratualDaCampanha([], [], "data inválida", "2026-10-06T00:00:00Z"));
  assert.match(bloqueioContratualDaCampanha(
    [{ id: "cancelado", status: "cancelled" }], [],
    "2026-10-07T00:00:00Z", "2026-10-06T00:00:00Z",
  ) ?? "", /novo/);
});

test("pedido pendente ou contrato sem assinatura bloqueia", () => {
  assert.match(bloqueioContratualDaCampanha([{ id: "p1", status: "proof_received" }], [], "", null) ?? "", /pagamento/);
  assert.match(bloqueioContratualDaCampanha([{ id: "p1", status: "payment_approved" }], [], "", null) ?? "", /contrato/);
});

test("sem pedido apto, o diagnóstico aponta assinaturas pendentes", () => {
  const pedidos = [
    { id: "p1", status: "payment_approved" },
    { id: "p2", status: "payment_approved" },
  ];
  assert.ok(bloqueioContratualDaCampanha(pedidos, [{ order_id: "p1", status: "signed" }], "", null));
  assert.equal(bloqueioContratualDaCampanha(pedidos, [
    { order_id: "p1", status: "signed" },
    { order_id: "p2", status: "signed" },
  ], "", null), null);
});

test("campanha nova usa somente a conta vinculada à unidade aprovada", () => {
  const contas = [{ external_id: "act_123" }];
  assert.equal(bloqueioContaContratada("act_123", contas), null);
  assert.match(bloqueioContaContratada("act_456", contas) ?? "", /não está vinculada/);
  assert.match(bloqueioContaContratada(null, contas) ?? "", /não informa/);
  assert.ok(bloqueioContaContratada("act_123", []));
});

test("pedido adicional pendente ou sem assinatura não trava unidade anterior apta", () => {
  const pedidos = [
    { id: "anterior", status: "payment_approved" },
    { id: "adicional", status: "proof_received" },
    { id: "mais-um", status: "payment_approved" },
  ];
  assert.deepEqual(pedidosAptosParaCampanha(pedidos, [
    { order_id: "anterior", status: "signed" },
    { order_id: "mais-um", status: "sent" },
  ]).map((pedido) => pedido.id), ["anterior"]);
  assert.deepEqual(pedidosAptosParaCampanha(pedidos, []), []);
});
