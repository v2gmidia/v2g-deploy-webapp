/** QA HTTPS da Etapa 01. Somente fixtures; nunca chama Asaas nem aprova pagamento. */
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

const dbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(dbUrl, 'https://zskpijnqgkqwxksqmzmf.supabase.co', 'Somente Supabase QA');
const appUrl = 'https://v2g-webapp-qa.vercel.app';
const admin = createClient(dbUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(dbUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const nonce = randomUUID();
const email = `qa-etapa01-${nonce}@example.invalid`;
const ipHash = createHash('sha256').update(nonce).digest('hex');
const users = [];
let leadId;
let cookie;
let logout;
const checks = [];
const decode = (value) => value.replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const visibleText = (html) => decode(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '')
  .replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ''));
function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w$:-]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]));
}
async function page(path, authCookie) {
  const response = await fetch(appUrl + path, {
    redirect: 'manual', headers: authCookie ? { cookie: authCookie } : {},
  });
  return { status: response.status, location: response.headers.get('location'), html: await response.text() };
}
async function createAccount(operator) {
  const created = await admin.auth.admin.createUser({
    email: `qa-etapa01-${operator ? 'operador' : 'cliente'}-${nonce}@example.invalid`,
    password: randomBytes(32).toString('base64url'), email_confirm: true,
    app_metadata: { ...(operator ? { papel: 'operador' } : {}), qa_etapa01: nonce },
  });
  assert.ifError(created.error);
  const user = created.data.user;
  users.push(user.id);
  const profile = await admin.from('profiles').upsert({ id: user.id, full_name: 'QA Etapa 01 Temporario' });
  assert.ifError(profile.error);
  // A API gera o link em memoria; o OTP nunca e impresso nem enviado por e-mail.
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email: user.email });
  assert.ifError(link.error);
  const jar = new Map();
  const client = createServerClient(dbUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (values) => values.forEach(({ name, value }) => jar.set(name, value)),
  } });
  const login = await client.auth.verifyOtp({ type: 'magiclink', token_hash: link.data.properties.hashed_token });
  assert.ifError(login.error);
  return { id: user.id, client, cookie: [...jar].map(([name, value]) => `${name}=${encodeURIComponent(value)}`).join('; ') };
}

try {
  const operator = await createAccount(true);
  cookie = operator.cookie;
  logout = operator.client;
  if (process.argv.includes('--verificar-estorno')) {
    const manager = await page('/gestor/compras?negocio=ee1a2572-020c-49ae-8617-a5c73d995811', cookie);
    assert.equal(manager.status, 200);
    const text = visibleText(manager.html);
    assert.ok(text.includes('QA Etapa 01 Seguranca FICTICIA'));
    assert.ok(text.includes('Ocorrência financeira: PAYMENT_REFUNDED'));
    assert.ok(text.includes('pay_hhcjxx7c3ytmt48x'));
    assert.ok(text.includes('o registro não cancela automaticamente o acesso'));
    checks.push('Gestor autenticado mostra estorno da cobranca autorizada e limite da decisao de acesso');
  } else {
  const formPage = await page('/pedidos', cookie);
  assert.equal(formPage.status, 200, 'Operador precisa abrir /pedidos');
  assert.ok(/ID do lead da LP/.test(formPage.html), 'Campo do lead deve estar publicado');
  assert.ok(!/N[aã]o foi poss[ií]vel consultar os pedidos agora/.test(formPage.html), 'Consulta de pedidos disponivel');
  const form = [...formPage.html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)]
    .map((m) => m[0]).find((html) => html.includes('sourceLeadId'));
  assert.ok(form, 'Formulario assistido com vinculo ativo');
  const hidden = [...form.matchAll(/<input\b[^>]*>/g)].map((m) => attrs(m[0]))
    .filter((input) => input.type === 'hidden' && input.name);
  assert.ok(hidden.some((input) => input.name.startsWith('$ACTION_')), 'Server Action publicada');
  checks.push('Operador autenticado abre formulario com ID do lead');

  const capture = await anon.rpc('inserir_lead_lp', {
    p_nome: 'QA Etapa 01 Ficticio', p_whatsapp: '11999990001', p_email: email,
    p_negocio: 'QA Etapa 01 Ficticia', p_nicho: 'servicos_locais', p_nicho_outro: null,
    p_instagram: 'qa_etapa01', p_perfil: 'dono', p_vende_whatsapp: true,
    p_investe_anuncios: false, p_faixa_investimento: null, p_site: null,
    p_consentimento_texto: 'Consentimento ficticio para ensaio HTTPS controlado.',
    p_utm_source: 'qa-https', p_utm_medium: 'ensaio', p_utm_campaign: nonce,
    p_utm_content: 'etapa01', p_pagina_origem: 'https://qa.invalid/etapa01',
    p_ip_hash: ipHash, p_cnpj: '00000000000191',
  });
  assert.ifError(capture.error);
  assert.equal(capture.data?.ok, true);
  const lead = await admin.from('leads_lp').select('id').eq('email', email).eq('ip_hash', ipHash).single();
  assert.ifError(lead.error);
  leadId = lead.data.id;
  checks.push('RPC da LP grava lead ficticio no QA');

  async function submit(overrides = {}) {
    const payload = new FormData();
    hidden.forEach((input) => payload.set(input.name, input.value ?? ''));
    for (const [name, value] of Object.entries({ vinculoLead: 'v2g_site', sourceLeadId: String(leadId),
      legalName: 'QA Etapa 01 Ficticia', cnpj: '00000000000191', email,
      whatsapp: '11999990001', unitCount: '2', billingPeriod: 'monthly',
      declaresCnpj: 'yes', sellsByWhatsApp: 'yes', ...overrides })) payload.set(name, value);
    const response = await fetch(appUrl + '/pedidos', { method: 'POST', redirect: 'manual',
      headers: { cookie, origin: appUrl }, body: payload });
    return { status: response.status, location: response.headers.get('location'), html: await response.text() };
  }
  const [first, repeat] = await Promise.all([submit(), submit()]);
  for (const response of [first, repeat]) {
    assert.equal(response.status, 303, 'Criacao/reenvio precisa redirecionar apos sucesso');
    assert.match(response.location ?? '', /pedidos\?registro=criado/);
  }
  const orders = await admin.from('commercial_orders').select('*').eq('source_system', 'v2g_site').eq('source_lead_id', leadId);
  assert.ifError(orders.error);
  assert.equal(orders.data.length, 1, 'Duas requisicoes concorrentes devem gerar apenas um pedido');
  const order = orders.data[0];
  assert.equal(order.buyer_email, email);
  assert.equal(order.status, 'awaiting_payment');
  assert.equal(order.buyer_profile_id, null);
  assert.equal(order.provider_charge_id, null);
  assert.equal(order.payment_approved_at, null);
  assert.equal(order.total_cents, 100000);
  assert.equal(order.source_lead_utm_campaign, nonce);
  assert.equal(order.source_lead_consent_text, 'Consentimento ficticio para ensaio HTTPS controlado.');
  const mark = await admin.from('businesses').update({ dados_ficticios: true }).eq('id', order.business_id).eq('claim_email', email);
  assert.ifError(mark.error);
  const events = await admin.from('commercial_events').select('event_type,actor_profile_id').eq('order_id', order.id);
  assert.ifError(events.error);
  assert.equal(events.data.length, 1);
  assert.equal(events.data[0].event_type, 'lead_convertido_em_pedido');
  assert.equal(events.data[0].actor_profile_id, operator.id);
  checks.push('Dois POSTs concorrentes geram um pedido e um evento; nenhum pagamento ou acesso');

  for (const overrides of [{ cnpj: '00000000000272' }, { whatsapp: '11999990002' },
    { email: `outro-${nonce}@example.invalid` }, { unitCount: '3' }]) {
    const rejected = await submit(overrides);
    assert.equal(rejected.status, 200);
    assert.ok(/N[aã]o foi poss[ií]vel registrar/.test(visibleText(rejected.html)), 'Divergencia precisa aparecer na tela');
  }
  checks.push('Tela recusa divergencia de CNPJ, WhatsApp, e-mail e quantidade');
  const assisted = await page('/pedidos', cookie);
  assert.equal(assisted.status, 200);
  assert.ok(visibleText(assisted.html).includes(`lead #${leadId}`), 'Lista assistida precisa mostrar lead');
  assert.ok(assisted.html.includes(nonce));
  assert.ok(visibleText(assisted.html).includes('Consentimento registrado em'), 'Lista assistida precisa mostrar consentimento');
  const manager = await page(`/gestor/compras?negocio=${order.business_id}`, cookie);
  assert.equal(manager.status, 200);
  assert.ok(visibleText(manager.html).includes(`Lead #${leadId}`), 'Gestor precisa mostrar lead');
  assert.ok(manager.html.includes(nonce));
  assert.ok(visibleText(manager.html).includes('consentimento'), 'Gestor precisa mostrar consentimento');
  checks.push('Pedidos e Contratacoes mostram lead, origem, UTMs e consentimento');
  const client = await createAccount(false);
  for (const route of ['/pedidos', '/gestor/compras']) {
    const denied = await page(route, client.cookie);
    assert.notEqual(denied.status, 200, 'Cliente nao pode acessar pedidos do operador');
    const anonymous = await page(route);
    assert.notEqual(anonymous.status, 200, 'Anonimo nao pode acessar pedidos do operador');
  }
  await client.client.auth.signOut();
  checks.push('Cliente e anonimo barrados das duas telas internas');
  }
  console.log(JSON.stringify({ ok: true, scope: 'QA HTTPS', checks }, null, 2));
} finally {
  if (logout) await logout.auth.signOut();
  if (leadId) {
    const orders = await admin.from('commercial_orders').select('id,business_id,buyer_email,status,provider_charge_id')
      .eq('source_system', 'v2g_site').eq('source_lead_id', leadId);
    assert.ifError(orders.error);
    for (const order of orders.data ?? []) {
      assert.equal(order.buyer_email, email);
      assert.equal(order.status, 'awaiting_payment');
      assert.equal(order.provider_charge_id, null);
      for (const table of ['commercial_events', 'commercial_order_units']) {
        const result = await admin.from(table).delete().eq('order_id', order.id);
        assert.ifError(result.error);
      }
      const removeOrder = await admin.from('commercial_orders').delete().eq('id', order.id);
      assert.ifError(removeOrder.error);
      const removeBusiness = await admin.from('businesses').delete().eq('id', order.business_id).eq('claim_email', email);
      assert.ifError(removeBusiness.error);
    }
    const removeLead = await admin.from('leads_lp').delete().eq('id', leadId).eq('email', email).eq('ip_hash', ipHash);
    assert.ifError(removeLead.error);
  }
  for (const id of users) {
    const user = await admin.auth.admin.getUserById(id);
    assert.ifError(user.error);
    assert.equal(user.data.user.app_metadata.qa_etapa01, nonce);
    const removed = await admin.auth.admin.deleteUser(id);
    assert.ifError(removed.error);
  }
  console.log('Fixtures exclusivas da Etapa 01 removidas; usuarios existentes preservados.');
}
