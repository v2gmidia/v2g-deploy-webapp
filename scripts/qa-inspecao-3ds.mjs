/** Inspecao exclusivamente de leitura, em fixture ja estornada. Nunca imprime token. */
import assert from 'node:assert/strict';
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://zskpijnqgkqwxksqmzmf.supabase.co');
assert.equal(process.env.ASAAS_ENVIRONMENT, 'sandbox');
const response = await fetch('https://api-sandbox.asaas.com/v3/payments/pay_advkkug76x8r7vxr', {
  headers: { access_token: process.env.ASAAS_API_KEY, 'User-Agent': 'V2G-QA-Inspecao/1.0' },
  signal: AbortSignal.timeout(15000),
});
assert.equal(response.ok, true);
const payment = await response.json();
assert.equal(payment.externalReference, 'f480515b-0149-4d31-9869-482f3c0612c0');
assert.equal(payment.value, 500);
console.log(JSON.stringify({ scope: 'Leitura Asaas Sandbox', status: payment.status,
  tokenConsultavel: typeof payment.creditCard?.creditCardToken === 'string',
  nenhumaEscrita: true }));
