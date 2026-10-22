/** Diagnóstico somente leitura; imprime exclusivamente campos operacionais. */
import assert from 'node:assert/strict';
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://zskpijnqgkqwxksqmzmf.supabase.co');
assert.equal(process.env.ASAAS_ENVIRONMENT, 'sandbox');
const response = await fetch('https://api-sandbox.asaas.com/v3/webhooks?limit=100', {
  headers: { access_token: process.env.ASAAS_API_KEY, 'User-Agent': 'V2G-QA-ReadOnly/1.0' },
  signal: AbortSignal.timeout(20000),
});
assert.equal(response.ok, true, `HTTP ${response.status}`);
const body = await response.json();
console.log(JSON.stringify({hasMore: body.hasMore, webhooks: (body.data ?? []).map(item => ({
  id: item.id, enabled: item.enabled, interrupted: item.interrupted, sendType: item.sendType,
  destinoQa: item.url === 'https://v2g-webapp-qa.vercel.app/api/webhooks/asaas-payment',
  recebeEstorno: item.events?.includes('PAYMENT_REFUNDED'),
}))}));
