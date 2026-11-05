// Percurso LOCAL: actions e páginas reais; Auth/DB/Storage substituídos em memória.
// Não comprova RLS, sessão HTTPS, URL assinada real, QA ou produção.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import * as crypto from 'node:crypto';
import * as revisao from '../lib/criativos/revisao.ts';
import * as intencao from '../lib/criativos/intencao-envio.ts';
import * as paginacao from '../lib/criativos/paginacao.ts';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const P = '33333333-3333-4333-8333-333333333333';
const Q = '44444444-4444-4444-8444-444444444444';
const OP = '55555555-5555-4555-8555-555555555555';
const OUTRO = '66666666-6666-4666-8666-666666666666';
const ID = '77777777-7777-4777-8777-777777777777';
const ID_B = '88888888-8888-4888-8888-888888888888';
const bytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');

function carregar(arquivo, deps, env) {
  const exports = {};
  const codigo = ts.transpileModule(readFileSync(arquivo, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  }}).outputText;
  vm.runInNewContext(codigo, { exports, Date, Intl, Map, Set, Uint8Array, File, FormData, Blob,
    process: { env }, console: { error() {} },
    fetch() { throw Error('Rede proibida neste ensaio'); },
    require(nome) { if (!(nome in deps)) throw Error(`Import não previsto: ${nome}`); return deps[nome]; },
  });
  return exports;
}

function bancada({ trabalho = 'true', atribuicoes } = {}) {
  const env = { V2G_CREATIVE_REVIEW_ENABLED: 'true', V2G_MANAGER_WORK_ENABLED: trabalho,
    V2G_CREATIVE_AUTO_ANALYSIS_ENABLED: 'false', NODE_ENV: 'production' };
  const s = { user: { id: P, app_metadata: {} }, ativo: A, linhas: [], arquivos: new Map(),
    atribuicoes: atribuicoes ?? [{ business_id: A, operator_profile_id: OP }, { business_id: B, operator_profile_id: OUTRO }],
    consultas: [], assinados: [], baixados: [], revalidados: [], tarefas: 0, props: null,
    falhaAtribuicao: false, falhaFila: false, injetarForaDoEscopo: false };
  const donos = new Map([[A, P], [B, Q]]);
  const auth = { getUser: async () => ({ data: { user: s.user }, error: s.falhaSessao ? {} : null }) };
  function consulta(tabela, admin) {
    const filtros = [], ordens = [];
    let colunas, opcoes, limite, faixa, alteracao;
    const log = { tabela, admin, filtros }; s.consultas.push(log);
    const q = {
      select(c, o) { colunas = c; opcoes = o; log.colunas = c; return q; },
      eq(k, v) { filtros.push(['eq', k, v]); return q; },
      neq(k, v) { filtros.push(['neq', k, v]); return q; },
      in(k, v) { filtros.push(['in', k, v]); return q; },
      order(k, o) { ordens.push([k, o]); return q; },
      limit(n) { limite = n; return q; },
      range(a, b) { faixa = [a, b]; return q; },
      update(v) { alteracao = v; return q; },
      async insert(linha) {
        assert.equal(tabela, 'creative_review_requests');
        if (s.linhas.some(r => r.id === linha.id)) return { error: { code: '23505' } };
        s.linhas.push({ ...structuredClone(linha), created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        return { error: null };
      },
      async maybeSingle() { const r = executar(); return r.error ? r :
        r.data.length > 1 ? { data: null, error: {} } : { ...r, data: r.data[0] ?? null }; },
      then(ok, erro) { return Promise.resolve(executar()).then(ok, erro); },
    };
    function executar() {
      if ((tabela === 'manager_accounts' && s.falhaAtribuicao) ||
          (tabela === 'creative_review_requests' && s.falhaFila)) return { data: null, error: { message: 'ERRO_PRIVADO' } };
      let linhas = tabela === 'creative_review_requests' ? s.linhas :
        tabela === 'manager_accounts' ? s.atribuicoes :
        tabela === 'businesses' ? [{ id: A, name: 'Negócio A FICTÍCIO' }, { id: B, name: 'Negócio B FICTÍCIO' }] : [];
      // A política remota NÃO é exercitada aqui: esta restrição é uma porta fake explícita.
      if (!admin && tabela === 'creative_review_requests') linhas = linhas.filter(r => donos.get(r.business_id) === s.user?.id);
      linhas = linhas.filter(r => filtros.every(([op, k, v]) => op === 'eq' ? r[k] === v :
        op === 'neq' ? r[k] !== v : v.includes(r[k])));
      if (s.injetarForaDoEscopo && admin && tabela === 'creative_review_requests' && !alteracao)
        linhas = [...linhas, s.linhas.find(r => r.business_id === B)].filter(Boolean);
      const count = linhas.length;
      if (alteracao) linhas.forEach(r => Object.assign(r, alteracao));
      else linhas = [...linhas].sort((a, b) => {
        for (const [k, o] of ordens) { const d = String(a[k]).localeCompare(String(b[k])); if (d) return o.ascending ? d : -d; }
        return 0;
      });
      if (faixa) linhas = linhas.slice(faixa[0], faixa[1] + 1);
      if (limite !== undefined) linhas = linhas.slice(0, limite);
      const data = linhas.map(r => Object.fromEntries(colunas.split(',').map(c => [c.trim(), structuredClone(r[c.trim()])])));
      return { data, count: opcoes?.count ? count : undefined, error: null };
    }
    return q;
  }
  const storage = { from(bucket) { assert.equal(bucket, revisao.BUCKET_REVISAO); return {
    async upload(path, b) { s.arquivos.set(path, new Uint8Array(b)); return { error: null }; },
    async download(path) { s.baixados.push(path); const b = s.arquivos.get(path); return { data: b ? new Blob([b]) : null, error: null }; },
    async createSignedUrl(path) { s.assinados.push(path); return { data: { signedUrl: `https://private.test/${path}` }, error: null }; },
    async createSignedUrls(paths) { s.assinados.push(...paths); return { data: paths.map(path => ({ path, signedUrl: `https://private.test/${path}` })), error: null }; },
  }; } };
  const admin = { from: tabela => consulta(tabela, true), storage };
  const deps = {
    'react/jsx-runtime': jsxRuntime, 'node:crypto': crypto,
    'next/cache': { revalidatePath: p => s.revalidados.push(p) },
    'next/navigation': { notFound() { throw Error('NOT_FOUND'); } },
    '@/lib/supabase/server': { createClient: async () => ({ auth, from: t => consulta(t, false) }) },
    '@/lib/supabase/admin': { createAdminClient: () => admin },
    '@/lib/multiconta/ativo': { negocioAtivoDaSessao: async () => ({ status: 'selecionado', negocio: { id: s.ativo } }) },
    '@/lib/estado/cliente': { estadoDoCliente: async () => ({ negocioId: donos.get(s.ativo) === s.user?.id ? s.ativo : null,
      veiculacao: { estado: 'desconhecido' }, diaSeguinte: { execucao: null } }) },
    '@/lib/gestor/sincronizar-revisao': { sincronizarTarefaDeRevisao: async () => { s.tarefas++; } },
    '@/lib/criativos/revisao': revisao, '@/lib/criativos/intencao-envio': intencao,
    '@/lib/criativos/paginacao': paginacao,
    '@/lib/jev/catalogo-barbearia': { referenciaDaBiblioteca: () => null },
    '@/lib/jev/catalogo-da-sessao': { catalogoBarbeariaDisponivel: async () => false },
    '@/lib/titulos': { tituloDaAba: () => ({}) },
    '@/lib/criativos/contexto-do-negocio-da-sessao': { carregarContextoDoCriativo: async () => ({}) },
    '@/lib/criativos/pedidos-da-sessao': { carregarPedidosDaSessao() { throw Error('Geração fora do recorte'); } },
    '@/lib/criativos/geracao/imagem-privada': { urlImagemGerada() { throw Error('Geração fora do recorte'); } },
    '@/lib/criativos/geracao/contrato-fila': { UUID_GERACAO: /^[a-f0-9-]{36}$/ },
    './TelaDeCriativos': { TelaDeCriativos: props => { s.props = props; return React.createElement('div', null, 'Galeria real carregada'); } },
  };
  for (const [nome, exp] of [['Analisar', 'Analisar'], ['Amostra', 'AmostraDeVereditos'], ['PedirRevisao', 'PedirRevisao'],
    ['PedidoDeImagem', 'PedidoDeImagem'], ['DecidirPeca', 'DecidirPeca'], ['SincronizarTarefa', 'SincronizarTarefa']])
    deps[`./${nome}`] = { [exp]: () => null };
  const envio = carregar('app/(protected)/criativos/revisao-actions.ts', deps, env);
  const decisao = carregar('app/(protected)/gestor/criativos/actions.ts', deps, env);
  const fila = carregar('app/(protected)/gestor/criativos/page.tsx', deps, env).default;
  const cliente = carregar('app/(protected)/criativos/page.tsx', deps, env).default;
  return { s, env,
    entrar(id, papel, ativo = s.ativo) { s.user = { id, app_metadata: { papel } }; s.ativo = ativo; s.props = null; },
    async enviar(business = A, id = ID) {
      const f = new FormData();
      for (const [k, v] of Object.entries({ submissaoId: id, businessId: business, objetivo: 'whatsapp_messages',
        promocao: 'nao', validade: '', confirmado: 'sim' })) f.set(k, v);
      f.set('arquivo', new File([bytes], `N26-P3-${business === A ? 'A' : 'B'}.png`, { type: 'image/png' }));
      return envio.solicitarRevisaoAction(f);
    },
    async decidir(status = 'changes_requested', id = ID) {
      const f = new FormData(); f.set('id', id); f.set('decisao', status); f.set('nota', 'Aumentar a legibilidade da oferta.');
      return decisao.revisarPecaAction({}, f);
    },
    async fila(params = {}) { return renderToStaticMarkup(await fila({ searchParams: Promise.resolve(params) })); },
    async galeria() { renderToStaticMarkup(await cliente()); return s.props; },
  };
}

async function preparar(b) {
  assert.equal((await b.enviar()).ok, true);
  b.entrar(Q, 'cliente', B); assert.equal((await b.enviar(B, ID_B)).ok, true);
  b.entrar(OP, 'operador', A);
}

for (const trabalho of ['true', 'false']) test(`percurso A/B com tarefas ${trabalho}: enviar → fila atribuída → decisão → nova sessão do cliente`, async () => {
  const b = bancada({ trabalho }); await preparar(b);
  const hash = b.s.linhas[0].sha256;
  assert.equal(hash, sha(bytes)); assert.deepEqual(b.s.arquivos.get(`${A}/${ID}`), bytes);
  const html = await b.fila();
  assert.match(html, /N26-P3-A/); assert.doesNotMatch(html, /N26-P3-B/);
  assert.deepEqual(b.s.assinados, [`${A}/${ID}`]);
  assert.ok((await b.decidir()).ok);
  assert.equal(b.s.linhas[0].reviewed_by, OP);
  b.entrar(P, 'cliente', A); const props = await b.galeria();
  assert.equal(props.itens.length, 1); assert.equal(props.itens[0].id, `revisao-${ID}`);
  assert.match(props.itens[0].estado, /Ajustes solicitados/);
  assert.match(props.itens[0].detalhe, /Aumentar a legibilidade/);
  assert.equal(b.s.linhas[0].sha256, hash);
  b.entrar(Q, 'cliente', B); const outro = await b.galeria();
  assert.equal(outro.itens.length, 1); assert.equal(outro.itens[0].id, `revisao-${ID_B}`);
  assert.match(outro.itens[0].estado, /Recebido para revisão/);
  assert.doesNotMatch(JSON.stringify(outro.itens), /Aumentar a legibilidade/);
});

for (const status of ['approved_for_manual_publish', 'changes_requested', 'rejected']) test(`cliente recupera ${status} após nova sessão, sem estado de publicação`, async () => {
  const b = bancada(); await preparar(b); assert.ok((await b.decidir(status)).ok);
  b.entrar(P, 'cliente', A); const props = await b.galeria();
  assert.equal(props.itens[0].estado, revisao.rotuloDaRevisao(status));
  assert.doesNotMatch(props.itens[0].estado, /no ar|publicado/i);
  assert.match(props.itens[0].detalhe, /Retorno do gestor:/);
});

for (const trabalho of ['true', 'false']) test(`operador não atribuído e filtro adulterado não assinam nem decidem com tarefas ${trabalho}`, async () => {
  const b = bancada({ trabalho }); await preparar(b);
  let html = await b.fila({ negocio: B, peca: ID_B });
  assert.match(html, /não está na sua carteira/); assert.deepEqual(b.s.assinados, []);
  b.entrar('99999999-9999-4999-8999-999999999999', 'operador');
  html = await b.fila(); assert.match(html, /Nenhuma conta atribuída/);
  assert.deepEqual(b.s.assinados, []); assert.ok((await b.decidir()).erro); assert.deepEqual(b.s.baixados, []);
  assert.equal(b.s.linhas[0].status, 'awaiting_review');
});

test('falha na atribuição ou na fila aparece como indisponibilidade, sem assinatura de arquivo', async () => {
  for (const falha of ['falhaAtribuicao', 'falhaFila']) {
    const b = bancada(); await preparar(b); b.s[falha] = true;
    const html = await b.fila(); assert.match(html, /indisponível/); assert.doesNotMatch(html, /ERRO_PRIVADO|Nenhuma peça registrada/);
    assert.deepEqual(b.s.assinados, []);
  }
});

test('resposta de fila com negócio fora do filtro é recusada antes de assinar', async () => {
  const b = bancada(); await preparar(b); b.s.injetarForaDoEscopo = true;
  assert.match(await b.fila(), /indisponível/); assert.deepEqual(b.s.assinados, []);
});

test('erro de Auth ou papel de cliente nega a página antes do cliente administrativo', async () => {
  for (const falha of ['papel', 'auth']) {
    const b = bancada(); await preparar(b); b.s.consultas = [];
    if (falha === 'papel') b.entrar(P, 'cliente', A); else b.s.falhaSessao = true;
    await assert.rejects(b.fila(), /NOT_FOUND/); assert.equal(b.s.consultas.length, 0);
  }
});

test('arquivo trocado não muda a decisão nem o retorno recarregado pelo cliente', async () => {
  const b = bancada(); await preparar(b);
  b.s.arquivos.get(`${A}/${ID}`)[7] = 99;
  assert.ok((await b.decidir()).erro);
  b.entrar(P, 'cliente', A); const props = await b.galeria();
  assert.match(props.itens[0].estado, /Recebido para revisão/);
  assert.doesNotMatch(props.itens[0].detalhe, /Retorno do gestor:/);
});
