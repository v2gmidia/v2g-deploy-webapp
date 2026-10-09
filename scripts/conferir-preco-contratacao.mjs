import assert from "node:assert/strict";
import { test } from "node:test";
import { valorDoPedidoCentavos } from "../lib/contratacao/preco.ts";

test("uma conta custa R$ 500 ao mês, R$ 2.850 no semestre e R$ 5.280 no ano", () => {
  assert.equal(valorDoPedidoCentavos(1, "monthly"), 50_000);
  assert.equal(valorDoPedidoCentavos(1, "semiannual_upfront"), 285_000);
  assert.equal(valorDoPedidoCentavos(1, "annual_upfront"), 528_000);
});

test("duas contas são duas unidades, sem desconto mensal", () => {
  assert.equal(valorDoPedidoCentavos(2, "monthly"), 100_000);
  assert.equal(valorDoPedidoCentavos(2, "semiannual_upfront"), 570_000);
  assert.equal(valorDoPedidoCentavos(2, "annual_upfront"), 1_056_000);
});

test("quantidades ausentes ou inválidas não geram pedido", () => {
  for (const quantidade of [0, -1, 1.5, Number.NaN]) {
    assert.throws(() => valorDoPedidoCentavos(quantidade, "monthly"));
  }
  assert.throws(() => valorDoPedidoCentavos(1, "invalid"));
});
