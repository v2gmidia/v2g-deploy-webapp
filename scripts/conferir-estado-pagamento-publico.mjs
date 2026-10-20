import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { estadoPagamentoPublico, ehEstadoPagamentoPublico, mensagemEstadoPagamento } from '../lib/contratacao/estado-pagamento-publico.ts';
import { consultarEstadoPagamento } from '../lib/contratacao/consultar-estado-pagamento.ts';
import { temaDoCookie } from '../lib/tema.ts';

test('mover utilitario do layout preserva normalizacao de tema', () => {
  for (const valor of [undefined, '', 'sistema', 'invalido']) assert.equal(temaDoCookie(valor), 'sistema');
  assert.equal(temaDoCookie('claro'), 'claro');
  assert.equal(temaDoCookie('escuro'), 'escuro');
});

const ocorrencias = (...tipos) => tipos.map(event_type => ({ event_type }));
const pedido = { id: 'pedido-ficticio', status: 'payment_approved', provider_charge_id: 'pay_inicial' };
function banco(data = [], error = null) {
  const chamadas = [];
  const query = {};
  for (const metodo of ['select', 'eq', 'in', 'order']) query[metodo] = (...args) => {
    chamadas.push([metodo, ...args]); return query;
  };
  query.limit = async n => { chamadas.push(['limit', n]); return { data, error }; };
  return { chamadas, from: tabela => { chamadas.push(['from', tabela]); return query; } };
}
test('pedido historicamente aprovado nao encobre estorno integral, parcial ou em andamento', () => {
  assert.equal(estadoPagamentoPublico('payment_approved', []), 'payment_approved');
  assert.equal(estadoPagamentoPublico('payment_approved', ocorrencias('PAYMENT_REFUNDED')), 'refunded');
  assert.equal(estadoPagamentoPublico('payment_approved', ocorrencias('PAYMENT_PARTIALLY_REFUNDED')), 'partially_refunded');
  assert.equal(estadoPagamentoPublico('payment_approved', ocorrencias('PAYMENT_REFUND_IN_PROGRESS')), 'refund_in_progress');
});
test('estorno concluido prevalece sobre eventos tardios e ordem de chegada', () => {
  for (const lista of [
    ['PAYMENT_REFUNDED', 'PAYMENT_REFUND_IN_PROGRESS'],
    ['PAYMENT_REFUND_IN_PROGRESS', 'PAYMENT_REFUNDED'],
    ['PAYMENT_PARTIALLY_REFUNDED', 'PAYMENT_REFUNDED'],
  ]) assert.equal(estadoPagamentoPublico('payment_approved', ocorrencias(...lista)), 'refunded');
  assert.equal(estadoPagamentoPublico('cancelled', ocorrencias('PAYMENT_REFUNDED')), 'refunded');
});
test('recusa, falha 3DS e contestacao pedem revisao sem prometer pagamento ou acesso', () => {
  for (const tipo of ['PAYMENT_CHARGEBACK_REQUESTED', 'PAYMENT_CHARGEBACK_DISPUTE',
    'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED', 'PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED']) {
    const estado = estadoPagamentoPublico('payment_approved', ocorrencias(tipo));
    assert.equal(estado, 'payment_review');
    assert.doesNotMatch(mensagemEstadoPagamento(estado), /já pode criar|confirmado pelo Asaas/);
  }
});
test('consulta fica restrita ao pedido E cobranca inicial; nao mistura outro ciclo', async () => {
  const db = banco(ocorrencias('PAYMENT_REFUNDED'));
  assert.equal(await consultarEstadoPagamento(db, pedido), 'refunded');
  assert.ok(db.chamadas.some(c => c[0] === 'eq' && c[1] === 'order_id' && c[2] === pedido.id));
  assert.ok(db.chamadas.some(c => c[0] === 'eq' && c[1] === 'provider_charge_id' && c[2] === pedido.provider_charge_id));
  assert.deepEqual(db.chamadas.find(c => c[0] === 'select'), ['select', 'event_type']);
});
test('falha, consulta parcial e aprovacao sem cobranca nao viram sucesso', async () => {
  assert.equal(await consultarEstadoPagamento(banco(null, { message: 'falha' }), pedido), 'verification_unavailable');
  assert.equal(await consultarEstadoPagamento(banco(Array(100).fill({ event_type: 'PAYMENT_REFUND_IN_PROGRESS' })), pedido), 'verification_unavailable');
  assert.equal(await consultarEstadoPagamento({ from() { throw Error('rede'); } }, pedido), 'verification_unavailable');
  assert.equal(await consultarEstadoPagamento(banco(), { ...pedido, provider_charge_id: null }), 'verification_unavailable');
  assert.equal(await consultarEstadoPagamento(banco(), { ...pedido, status: 'awaiting_payment', provider_charge_id: null }), 'awaiting_payment');
});
test('estados recebidos por polling sao uma lista fechada', () => {
  assert.equal(ehEstadoPagamentoPublico('refunded'), true);
  assert.equal(ehEstadoPagamentoPublico('PAYMENT_REFUNDED'), false);
  assert.equal(ehEstadoPagamentoPublico(null), false);
  assert.equal(ehEstadoPagamentoPublico('<script>'), false);
});

// Renderiza o componente real TSX sem servidor Next e sem rede. Nao e prova HTTPS.
const require = createRequire(import.meta.url);
const arquivo = readFileSync(new URL('../app/contratar/pagamento/EstadoPagamento.tsx', import.meta.url), 'utf8');
const compilado = ts.transpileModule(arquivo, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
const modulo = { exports: {} };
const resolver = nome => nome === 'next/link'
  ? { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) }
  : nome === '@/lib/contratacao/estado-pagamento-publico'
    ? { ehEstadoPagamentoPublico, mensagemEstadoPagamento } : require(nome);
new Function('require', 'module', 'exports', compilado)(resolver, modulo, modulo.exports);
test('componente real remove CTA de cadastro e explica cada ocorrencia em texto', () => {
  for (const estado of ['refunded', 'partially_refunded', 'refund_in_progress', 'verification_unavailable', 'payment_review', 'cancelled']) {
    const html = renderToStaticMarkup(React.createElement(modulo.exports.EstadoPagamento, { referencia: 'ref-ficticia', inicial: estado }));
    assert.ok(html.includes('role="status"'));
    assert.ok(html.includes(mensagemEstadoPagamento(estado)));
    assert.doesNotMatch(html, /Criar meu acesso|modo=cadastro/);
  }
  const html = renderToStaticMarkup(React.createElement(modulo.exports.EstadoPagamento, { referencia: 'ref-ficticia', inicial: 'payment_approved' }));
  assert.match(html, /Criar meu acesso/);
});
test('pagina e API usam a mesma consulta; API nao entrega payload ou contato', () => {
  const page = readFileSync(new URL('../app/contratar/pagamento/page.tsx', import.meta.url), 'utf8');
  const api = readFileSync(new URL('../app/api/contratar/status/route.ts', import.meta.url), 'utf8');
  assert.match(page, /await consultarEstadoPagamento\(admin, pedido\)/);
  assert.match(api, /await consultarEstadoPagamento\(admin, pedido\)/);
  assert.match(api, /NextResponse.json\(\{ status \}/);
  assert.doesNotMatch(page, /Criar meu acesso/);
  assert.match(arquivo, /controller.abort\(\)/);
  assert.match(arquivo, /visibilityState/);
});
