import assert from "node:assert/strict";
import { test } from "node:test";
import { bloqueioContratualDaCampanha } from "../lib/contratacao/trava-campanha.ts";

test("negócio legado sem pedido conserva fluxo atual", () => {
  assert.equal(bloqueioContratualDaCampanha([], []), null);
});

test("pedido pendente ou contrato sem assinatura bloqueia", () => {
  assert.match(bloqueioContratualDaCampanha([{ id: "p1", status: "proof_received" }], []) ?? "", /pagamento/);
  assert.match(bloqueioContratualDaCampanha([{ id: "p1", status: "payment_approved" }], []) ?? "", /contrato/);
});

test("todas as unidades novas exigem contrato assinado", () => {
  const pedidos = [
    { id: "p1", status: "payment_approved" },
    { id: "p2", status: "payment_approved" },
  ];
  assert.ok(bloqueioContratualDaCampanha(pedidos, [{ order_id: "p1", status: "signed" }]));
  assert.equal(bloqueioContratualDaCampanha(pedidos, [
    { order_id: "p1", status: "signed" },
    { order_id: "p2", status: "signed" },
  ]), null);
});
