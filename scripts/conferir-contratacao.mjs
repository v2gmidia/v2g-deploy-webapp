import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aplicarEvento, contratacaoInicial, permissoesDaContratacao,
} from "../lib/contratacao/estado.ts";

test("comprovante isolado não libera acesso nem campanha", () => {
  const estado = aplicarEvento(contratacaoInicial(), {
    id: "upload-1", tipo: "comprovante_pix_recebido",
  });
  assert.equal(estado.comprovantePixRecebido, true);
  assert.deepEqual(permissoesDaContratacao(estado), {
    acessoWebApp: false, primeiraCampanha: false, mostrarNotaEmitida: false,
  });
});

test("aprovação manual libera acesso; assinatura é necessária à campanha", () => {
  const inicial = contratacaoInicial();
  const pago = aplicarEvento(inicial, {
    id: "pix-1", tipo: "pix_aprovado_por_operador", operadorId: "gestor-1",
  });
  assert.deepEqual(permissoesDaContratacao(pago), {
    acessoWebApp: true, primeiraCampanha: false, mostrarNotaEmitida: false,
  });
  const assinado = aplicarEvento(pago, {
    id: "sign-1", tipo: "contrato_assinado_confirmado", documentoId: "doc-1",
  });
  assert.equal(permissoesDaContratacao(assinado).primeiraCampanha, true);
});

test("eventos repetidos e sem ID de origem não alteram estado", () => {
  const inicial = contratacaoInicial();
  const evento = { id: "asaas-1", tipo: "pagamento_asaas_confirmado", cobrancaId: "cob-1" };
  const pago = aplicarEvento(inicial, evento);
  assert.strictEqual(aplicarEvento(pago, evento), pago);
  assert.strictEqual(aplicarEvento(inicial, {
    id: "asaas-2", tipo: "pagamento_asaas_confirmado", cobrancaId: "",
  }), inicial);
});

test("nota só aparece após autorização do emissor", () => {
  const inicial = contratacaoInicial();
  assert.equal(permissoesDaContratacao(inicial).mostrarNotaEmitida, false);
  const emitida = aplicarEvento(inicial, {
    id: "nota-1", tipo: "nota_fiscal_autorizada", notaId: "nfse-1",
  });
  assert.equal(permissoesDaContratacao(emitida).mostrarNotaEmitida, true);
});
