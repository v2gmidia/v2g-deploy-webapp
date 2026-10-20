/** Testa recusa sem CAPTCHA/forjado no QA. Nao cria pedido nem chama pagamento. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { encodeReply } from 'next/dist/compiled/react-server-dom-webpack/client.node.js';
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://zskpijnqgkqwxksqmzmf.supabase.co');
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const app = 'https://v2g-webapp-qa.vercel.app';
const response = await fetch(app + '/contratar');
assert.equal(response.status, 200);
const html = await response.text();
assert.ok(html.includes('cf-turnstile'), 'Widget deve estar publicado');
const form = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map(m => m[0])
  .find(value => value.includes('name="cnpj"'));
assert.ok(form, 'Formulario de contratacao deve existir');
const decode = s => s.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&');
const hidden = [...form.matchAll(/<input\b[^>]*>/g)].map(m => Object.fromEntries(
  [...m[0].matchAll(/([\w$:-]+)="([^"]*)"/g)].map(a => [a[1], decode(a[2])])
)).filter(a => a.type === 'hidden' && a.name);
const paths = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]))];
const bundles = await Promise.all(paths.map(async path => (await fetch(new URL(path, app))).text()));
const actionBundle = bundles.find(js => js.includes('iniciarCompra'));
assert.ok(actionBundle, 'Referencia da Server Action deve existir no bundle publicado');
const actionMatch = actionBundle.match(/["']([0-9a-f]{40,64})["'][^;]{0,400}["']iniciarCompra["']/);
assert.ok(actionMatch, 'ID da action iniciarCompra deve ser descoberto pelo bundle');
const actionId = actionMatch[1];
const nonce = randomUUID();
for (const token of ['', 'token-ficticio-invalido']) {
  const payload = new FormData();
  hidden.forEach(a => payload.set(a.name, a.value ?? ''));
  for (const [key, value] of Object.entries({
    referencia: randomUUID(),
    nome: 'Pessoa Ficticia QA', email: `qa-security-${nonce}@example.invalid`,
    whatsapp: '11999990001', razaoSocial: 'QA Security Ficticia', cnpj: '00000000000191',
    vendeWhatsApp: 'sim', contas: '1', periodo: 'monthly', metodo: 'asaas_card',
    'cf-turnstile-response': token,
  })) payload.set(key, value);
  const rejected = await fetch(app + '/contratar', { method: 'POST', redirect: 'manual',
    headers: { origin: app, 'Next-Action': actionId, accept: 'text/x-component' }, body: await encodeReply([{}, payload]) });
  const body = await rejected.text();
  assert.equal(rejected.status, 200);
  const message = body.match(/"erro":"([^"\n]*)"/)?.[1];
  if (message) console.log(JSON.stringify({ etapa: 'recusa', mensagem: message }));
  assert.ok(/N[aã]o foi poss[ií]vel confirmar a verifica[cç][aã]o de seguran[cç]a/.test(body),
    'Servidor deve recusar token ausente/invalido antes de criar pedido');
}
const orders = await admin.from('commercial_orders').select('id', { count: 'exact', head: true })
  .eq('buyer_email', `qa-security-${nonce}@example.invalid`);
assert.ifError(orders.error);
assert.equal(orders.count, 0);
console.log('PASS: token ausente e token forjado recusados no servidor HTTPS; nenhum pedido criado.');
