/** Interface real + actions isoladas. Só fixtures; nenhuma chamada de rede. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ambienteTs } from './test-utils/ts-isolado.mjs';

const fonte = arquivo => readFileSync(new URL('../' + arquivo, import.meta.url), 'utf8');
const mensagem = ambienteTs().load('lib/auth-errors.ts').MENSAGEM_CADASTRO_NEUTRA;
const valores = ['Pessoa Fictícia', '11999990000', 'pessoa@example.invalid', '00000000191',
  'Teste-Local-Ficticio-2026!', 'Teste-Local-Ficticio-2026!', false, false];

function montar(estado = {}, pending = false, modo = 'cadastro') {
  let indice = 0, acao = 0, chamadas = 0;
  const refs = [], effects = [], reducers = [];
  const env = ambienteTs({ ports: {
    react: { ...React,
      useState: inicial => [valores[indice++] ?? inicial, () => {}],
      useRef: inicial => { const ref = { current: inicial }; refs.push(ref); return ref; },
      useEffect: fn => effects.push(fn),
      useActionState: (reducer, inicial) => {
        reducers.push(reducer);
        return acao++ === 0 ? [estado, () => {}, pending] : [inicial, () => {}, false];
      },
    },
    '@/components/ui/EntradaEditorial': { EntradaEditorial: ({ children }) => React.createElement('main', null, children) },
  } });
  const tree = env.load('app/(public)/entrar/TelaEntrada.tsx').TelaEntrada({
    mode: modo, next: '/inicio?origem=teste', adicionar: true,
    signUpAction: async () => { chamadas++; return { message: mensagem }; },
    signInAction: async () => ({}),
  });
  const nodes = [];
  function visitar(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visitar); return; }
    nodes.push(node); visitar(node.props?.children);
  }
  visitar(tree);
  return { html: renderToStaticMarkup(tree), nodes, refs, effects, reducers, chamadas: () => chamadas };
}

test('retorno neutro substitui formulário e CTA por confirmação e próximo passo', () => {
  const { html, nodes } = montar({ message: mensagem });
  assert.match(html, /Confira seu e-mail\./);
  assert.match(html, /caixa de entrada e spam/);
  assert.match(html, /Após confirmar pelo link/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-describedby="cadastro-orientacao cadastro-proximo-passo"/);
  assert.doesNotMatch(html, /<form|Criar minha conta|Primeiro acesso|Reenviar|Conta criada|E-mail enviado/i);
  assert.doesNotMatch(html, /pessoa@example|00000000191|Teste-Local/);
  const entrar = nodes.find(node => node.type === 'a' && node.props.children === 'Ir para entrar');
  const url = new URL(entrar.props.href, 'https://example.invalid');
  assert.equal(url.searchParams.get('next'), '/inicio?origem=teste');
  assert.equal(url.searchParams.get('adicionar'), '1');
  assert.equal(url.searchParams.get('modo'), 'login');
});

test('confirmação recebe foco e é trazida para a área visível', () => {
  const tela = montar({ message: mensagem });
  const eventos = [];
  tela.refs[1].current = { focus: () => eventos.push('foco'), parentElement: { scrollIntoView: () => eventos.push('visivel') } };
  tela.effects.forEach(fn => fn());
  assert.deepEqual(eventos, ['foco', 'visivel']);
});

test('erro mantém os seis campos, seus valores e o botão para tentar novamente', () => {
  const tela = montar({ error: 'Confira os dados antes de tentar novamente.' });
  assert.match(tela.html, /role="alert"/);
  assert.match(tela.html, /<form/);
  assert.match(tela.html, /Criar minha conta/);
  assert.doesNotMatch(tela.html, /entrada-confirmacao-icone/);
  const inputs = tela.nodes.filter(node => node.type === 'input' && node.props.type !== 'hidden');
  assert.deepEqual(inputs.map(node => node.props.value), valores.slice(0, 6));
  const eventos = [];
  tela.refs[2].current = { focus: () => eventos.push('foco'), scrollIntoView: () => eventos.push('visivel') };
  tela.effects.forEach(fn => fn());
  assert.deepEqual(eventos, ['foco', 'visivel']);
});

test('envio pendente desabilita CTA, sinaliza ocupado e recusa nova submissão', () => {
  const tela = montar({}, true);
  assert.match(tela.html, /aria-busy="true"/);
  assert.match(tela.html, /<button[^>]*disabled=""[^>]*>Enviando solicitação…/);
  const form = tela.nodes.find(node => node.type === 'form');
  let bloqueados = 0;
  form.props.onSubmit({ preventDefault: () => bloqueados++ });
  assert.equal(bloqueados, 1);
});

test('trava síncrona bloqueia dez envios no mesmo render e libera após falha', () => {
  const tela = montar({ error: 'Falha de teste' });
  const form = tela.nodes.find(node => node.type === 'form');
  let bloqueados = 0;
  const evento = { preventDefault: () => bloqueados++ };
  for (let i = 0; i < 10; i++) form.props.onSubmit(evento);
  assert.equal(bloqueados, 9);
  tela.effects.forEach(fn => fn());
  form.props.onSubmit(evento);
  assert.equal(bloqueados, 9);
});

test('ação enfileirada após conclusão não repete chamada; falha permite tentar', async () => {
  const tela = montar();
  const dados = new FormData();
  const sucesso = { message: mensagem };
  assert.equal(await tela.reducers[0](sucesso, dados), sucesso);
  assert.equal(tela.chamadas(), 0);
  await tela.reducers[0]({ error: 'Falha' }, dados);
  assert.equal(tela.chamadas(), 1);
});

test('erro tem precedência em um retorno conflitante; login não vira conclusão', () => {
  assert.match(montar({ error: 'Falha', message: mensagem }).html, /<form/);
  const login = montar({ message: mensagem }, false, 'login').html;
  assert.match(login, /Bom te ver de novo/);
  assert.doesNotMatch(login, /entrada-confirmacao-icone/);
});

test('sem pedido, conta existente e confirmação pendente preservam mesma resposta', async () => {
  const resultados = [];
  for (const caso of ['sem-pedido', 'existente', 'confirmar']) {
    let chamadas = 0;
    const query = { select: () => query, eq: () => query, not: () => query, limit: () => query,
      maybeSingle: async () => ({ data: caso === 'sem-pedido' ? null : { id: 'pedido-ficticio' }, error: null }) };
    const env = ambienteTs({ env: { NEXT_PUBLIC_SITE_URL: 'https://example.invalid' }, ports: {
      'next/navigation': { redirect: () => { throw Error('Não redirecionar sem sessão'); } },
      '@/lib/supabase/admin': { createAdminClient: () => ({ from: () => query }) },
      '@/lib/supabase/server': { createClient: async () => ({ auth: { signUp: async () => {
        chamadas++; return { data: { session: null }, error: caso === 'existente' ? { code: 'user_already_exists' } : null };
      } } }) },
      '@/lib/contratacao/vincular': { vincularComprasAprovadas: async () => { throw Error('Não vincular sem sessão'); } },
    } });
    const dados = new FormData();
    ['nome', 'whatsapp', 'email', 'cnpj', 'senha', 'confirmarSenha'].forEach((campo, i) => dados.set(campo, valores[i]));
    const resultado = await env.load('app/(public)/entrar/actions.ts').signUpAction({}, dados);
    assert.equal(resultado.message, mensagem);
    assert.equal(chamadas, caso === 'sem-pedido' ? 0 : 1);
    resultados.push(montar(resultado).html);
  }
  assert.equal(resultados[0], resultados[1]);
  assert.equal(resultados[1], resultados[2]);
});

test('bancada é dev-only, usa a tela real e não importa actions de execução', () => {
  assert.match(fonte('app/exemplo/cadastro/page.tsx'), /process.env.NODE_ENV !== "production" \? await import/);
  assert.match(fonte('app/exemplo/cadastro/page.tsx'), /if \(!modulo\) notFound\(\)/);
  const previa = fonte('app/exemplo/_cadastro/Previa.tsx');
  assert.match(previa, /<TelaEntrada/);
  assert.doesNotMatch(previa, /import \{.*(?:signUpAction|signInAction)|fetch\(|createClient\(/);
  assert.match(fonte('app/(public)/entrar/page.tsx'), /<TelaEntrada/);
});
