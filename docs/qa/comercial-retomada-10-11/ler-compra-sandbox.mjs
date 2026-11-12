/** Somente GETs da compra QA existente de 27/10. Não cria nem limpa efeitos. */
const exigir = (ok, mensagem) => { if (!ok) throw new Error(mensagem); };
exigir(process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://zskpijnqgkqwxksqmzmf.supabase.co', 'Projeto QA obrigatório.');
exigir(process.env.ASAAS_ENVIRONMENT === 'sandbox', 'Asaas Sandbox obrigatório.');
exigir(Boolean(process.env.ASAAS_API_KEY), 'Credencial Sandbox não disponível ao runtime.');
const pedido = '01da0460-f12a-4c24-b1dc-ab03ed41a68f';
const charge = 'pay_zbwd79h7kzuspbrc';
const customer = 'cus_000009707805';
const subscription = 'sub_ld9rnuzpdp85m1f7';
async function ler(path) {
  const r = await fetch(`https://api-sandbox.asaas.com/v3${path}`, {
    method: 'GET', redirect: 'error',
    headers: { access_token: process.env.ASAAS_API_KEY, 'User-Agent': 'V2G-QA-Commercial-ReadOnly/1.0' },
    signal: AbortSignal.timeout(15000),
  });
  exigir(r.ok, `Consulta Sandbox não confirmada: HTTP ${r.status}.`);
  return r.json();
}
const p = await ler(`/payments/${charge}`);
exigir(p.id === charge && p.externalReference === pedido && p.customer === customer
  && p.value === 500 && p.billingType === 'CREDIT_CARD', 'Cobrança diverge do pedido QA.');
const s = await ler(`/subscriptions/${subscription}`);
exigir(s.id === subscription && s.customer === customer && s.externalReference === pedido
  && s.value === 500 && s.billingType === 'CREDIT_CARD' && s.cycle === 'MONTHLY', 'Assinatura diverge do pedido QA.');
console.log(JSON.stringify({ ambiente: 'sandbox', pedido, somenteLeitura: true,
  cobranca: { status: p.status, deleted: p.deleted === true, valor: p.value, vencimento: p.dueDate,
    estornos: Array.isArray(p.refunds) ? p.refunds.map(r => ({status:r.status,value:r.value})) : [] },
  assinatura: { status: s.status, deleted: s.deleted === true, proximoVencimento: s.nextDueDate },
}, null, 2));
