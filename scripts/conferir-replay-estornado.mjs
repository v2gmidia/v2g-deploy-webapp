import assert from 'node:assert/strict';
import { test } from 'node:test';
import { replayEstornadoJaRegistrado, confirmacaoCanonicaConfere } from '../lib/contratacao/confirmacao-canonica.ts';
const evento = { eventoId: 'evt_ficticio', tipo: 'PAYMENT_CONFIRMED', cobrancaId: 'pay_fake',
  clienteId: 'cus_fake', assinaturaId: null, forma: 'CREDIT_CARD', valorCentavos: 50000, vencimento: '2099-01-21' };
const pago = { id: 'pay_fake', customer: 'cus_fake', subscription: null, billingType: 'CREDIT_CARD',
  externalReference: 'pedido-ficticio', value: 500, dueDate: '2099-01-21', status: 'REFUNDED', deleted: false };
test('replay comprovado de confirmacao estornada e historico, nunca nova aprovacao', () => {
  assert.equal(confirmacaoCanonicaConfere('pedido-ficticio', evento, pago), false);
  assert.equal(replayEstornadoJaRegistrado('pedido-ficticio', evento, pago, true), true);
  assert.equal(replayEstornadoJaRegistrado('pedido-ficticio', evento, pago, false), false);
});
test('status ou identidade divergente nao recebe aceite historico', () => {
  for (const patch of [{ status: 'PENDING' }, { status: 'CONFIRMED' }, { deleted: true },
    { id: 'pay_outro' }, { customer: 'cus_outro' }, { subscription: 'sub_outro' },
    { billingType: 'PIX' }, { externalReference: 'outro' }, { value: 501 }, { dueDate: '2099-02-21' }])
    assert.equal(replayEstornadoJaRegistrado('pedido-ficticio', evento, { ...pago, ...patch }, true), false);
  assert.equal(replayEstornadoJaRegistrado('pedido-ficticio', { ...evento, tipo: 'PAYMENT_CREATED' }, pago, true), false);
});
