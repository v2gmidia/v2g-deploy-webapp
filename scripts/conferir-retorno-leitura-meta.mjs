// Proxy, formulário e action reais, com Auth/acesso substituídos. Sem rede ou credenciais.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ambienteTs } from './test-utils/ts-isolado.mjs';
import { destinoDaLeitura, entradaDaLeitura } from '../lib/anuncios/retorno-login.ts';
import { destinoLocalSeguro } from '../lib/auth-destino.ts';

const business = '11111111-1111-4111-8111-111111111111';
const janela = { desde: '2026-10-28', ate: '2026-11-01', conta: 'act_9001' };
function urlLocal(caminho) {
  const url = new URL(caminho, 'https://qa.example.invalid'); url.clone = () => new URL(url);
  return url;
}
function proxyLocal({ user = null, acesso = true, renovar = false } = {}) {
  const chamadas = [], novas = [];
  function cookies() {
    const valores = new Map();
    return { getAll: () => [...valores.values()], set(nome, valor, options) {
      const cookie = typeof nome === 'object' ? nome : { name: nome, value: valor, ...options };
      valores.set(cookie.name, cookie);
    } };
  }
  const mod = ambienteTs({ ports: {
    'next/server': { NextResponse: {
      next: () => ({ tipo: 'next', cookies: cookies() }),
      redirect: u => ({ tipo: 'redirect', url: String(u), cookies: cookies() }),
    } },
    '@supabase/ssr': { createServerClient: (_u, _k, opcoes) => ({ auth: { getUser: async () => {
      chamadas.push('auth');
      if (renovar) opcoes.cookies.setAll([{ name: 'sessao-ficticia', value: 'renovada-ficticia', options: { httpOnly: true } }]);
      return { data: { user } };
    } } }) },
    '@/lib/contratacao/acesso': { temAcessoWebApp: async () => { chamadas.push('acesso'); return acesso; } },
  } }).load('proxy.ts');
  return { chamadas, run: caminho => mod.proxy({ method: 'GET', nextUrl: urlLocal(caminho),
    cookies: { getAll: () => novas, set: (name, value) => novas.push({ name, value }) } }) };
}

function loginLocal() {
  const chamadas = [];
  const auth = { signInWithPassword: async ({ email, password }) => {
    assert.equal(email, 'teste@example.invalid'); assert.equal(password, 'valor-exclusivo-do-ensaio');
    chamadas.push('entrar'); return { data: { user: { id: 'ator-ficticio' } }, error: null };
  } };
  const mod = ambienteTs({ ports: {
    'next/navigation': { redirect: destino => { throw Object.assign(Error('redirect local'), { destino }); } },
    '@/lib/supabase/server': { createClient: async () => ({ auth }) },
    '@/lib/supabase/admin': { createAdminClient() { throw Error('Não criar acesso neste teste'); } },
    '@/lib/contratacao/vincular': { vincularComprasAprovadas: async () => chamadas.push('conferir-vinculos-fake') },
    '@/lib/contratacao/cadastro-contratado': {}, '@/lib/contratacao/cadastro-por-compra': {},
    '@/lib/contratacao/acesso-contratado': {},
  } }).load('app/(public)/entrar/actions.ts');
  return { chamadas, async run(next) {
    const f = new FormData(); f.set('email', 'teste@example.invalid'); f.set('senha', 'valor-exclusivo-do-ensaio'); f.set('next', next);
    try { await mod.signInAction({}, f); assert.fail('A action deveria redirecionar'); }
    catch (e) { if (!e.destino) throw e; return e.destino; }
  } };
}

for (const caminho of ['/anuncios', '/supergestor', '/gestor']) test(`sem sessão preserva o recorte de ${caminho} até o login`, async () => {
  const busca = new URLSearchParams({ ...janela, ...(caminho === '/anuncios' ? {} : { metricas: business }) });
  const c = proxyLocal({ renovar: true });
  const r = await c.run(`${caminho}?${busca}`); assert.equal(r.tipo, 'redirect');
  const entrada = urlLocal(r.url); assert.equal(entrada.pathname, '/entrar');
  const next = entrada.searchParams.get('next'); const retorno = urlLocal(next);
  assert.equal(retorno.pathname, caminho);
  for (const [k, v] of busca) assert.equal(retorno.searchParams.get(k), v);
  assert.deepEqual([...entrada.searchParams.keys()], ['next']);
  assert.equal(r.cookies.getAll()[0].value, 'renovada-ficticia');
  // Página de login real recebe next; TelaEntrada é uma porta de observação.
  let props;
  const page = ambienteTs({ ports: {
    // CarregandoAcesso e a página continuam reais; CSS não executa nesta VM.
    './espera-local.css': {},
    'next/navigation': { useSearchParams: () => entrada.searchParams },
    '@/components/ui/EntradaEditorial': { EntradaEditorial: ({ children }) => React.createElement('div', {}, children) },
    './TelaEntrada': { TelaEntrada: p => { props = p; return React.createElement('div', {}, 'formulário fictício'); } },
    './actions': { signInAction: async () => ({}), signUpAction: async () => ({}) },
  } }).load('app/(public)/entrar/page.tsx').default;
  renderToStaticMarkup(React.createElement(page)); assert.equal(props.next, next);
  // Action real retorna para o mesmo caminho; Auth e conciliação são fakes.
  const login = loginLocal(); assert.equal(await login.run(props.next), next);
  assert.deepEqual(login.chamadas, ['entrar', 'conferir-vinculos-fake']);
});

test('retorno de leitura descarta identidade declarada, token e next externos', () => {
  const busca = new URLSearchParams({ ...janela, business_id: 'outro', profile_id: 'outro',
    token: 'VALOR-FICTICIO-NAO-REPASSAR', next: 'https://fora.example', metricas: business });
  const next = destinoDaLeitura('/anuncios', busca); assert.equal(destinoLocalSeguro(next), next);
  assert.doesNotMatch(next, /business_id|profile_id|token|fora.example|metricas|VALOR/);
  assert.equal(destinoDaLeitura('//fora.example', busca), null);
  assert.equal(destinoDaLeitura('/criativos', busca), null);
});

test('parâmetros repetidos e inválidos continuam visíveis à validação após o login', () => {
  const busca = new URLSearchParams('desde=invalida&ate=2026-11-01&conta=act_9001&conta=act_9002');
  const next = urlLocal(destinoDaLeitura('/anuncios', busca));
  assert.deepEqual(next.searchParams.getAll('conta'), ['act_9001', 'act_9002']);
  assert.equal(next.searchParams.get('desde'), 'invalida');
});

test('entrar novamente abre formulário explícito mesmo com sessão ainda presente no navegador', async () => {
  const href = entradaDaLeitura('/supergestor', new URLSearchParams({ ...janela, metricas: business }));
  const entrada = urlLocal(href); assert.equal(entrada.searchParams.get('adicionar'), '1');
  const c = proxyLocal({ user: { id: 'operador', app_metadata: { papel: 'operador' } } });
  assert.equal((await c.run(href)).tipo, 'next');
  const next = entrada.searchParams.get('next'); assert.equal(urlLocal(next).pathname, '/supergestor');
  assert.equal(await loginLocal().run(next), next);
});

test('login recusa destino externo e mantém proteção contra redirecionamento aberto', async () => {
  for (const next of ['https://fora.example', '//fora.example', '/\\fora.example', '/entrar?next=/anuncios'])
    assert.equal(await loginLocal().run(next), '/inicio');
});

test('contexto restaurado não concede papel nem acesso comercial', async () => {
  const path = `/supergestor?${new URLSearchParams({ ...janela, metricas: business })}`;
  const cliente = proxyLocal({ user: { id: 'cliente', app_metadata: {}, user_metadata: { papel: 'operador' } } });
  assert.equal(urlLocal((await cliente.run(path)).url).pathname, '/inicio');
  const semAcesso = proxyLocal({ user: { id: 'operador', app_metadata: { papel: 'operador' } }, acesso: false });
  assert.equal(urlLocal((await semAcesso.run(path)).url).pathname, '/acesso-pendente');
  const operador = proxyLocal({ user: { id: 'operador', app_metadata: { papel: 'operador' } } });
  assert.equal((await operador.run(path)).tipo, 'next');
});

test('outras rotas e redirecionamento normal do login preservam comportamento anterior', async () => {
  const c = proxyLocal(); const r = urlLocal((await c.run('/inicio?desde=2026-10-01')).url);
  assert.equal(r.searchParams.get('next'), '/inicio'); assert.equal(r.searchParams.get('desde'), '2026-10-01');
  const logado = proxyLocal({ user: { id: 'cliente', app_metadata: {} } });
  assert.equal(urlLocal((await logado.run('/entrar')).url).pathname, '/inicio');
});
