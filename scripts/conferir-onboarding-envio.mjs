// Executa handlers da tela real com hooks controlados e ação sem rede.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsx from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { ambienteTs } from './test-utils/ts-isolado.mjs';

const fonte = path => readFileSync(path, 'utf8');
const caminho = 'app/(fluxo)/onboarding/Chat.tsx';
const isolado = ambienteTs();
const perguntas = isolado.load('app/(fluxo)/onboarding/perguntas.ts');
const resposta = texto => ({ texto, echo: texto, origem: 'texto', em: '2026-10-27T12:00:00Z' });
const iniciais = () => Object.fromEntries(perguntas.ORDEM.slice(0, -1).map(id => [id, resposta('Dado fictício ' + id)]));
const proximoTick = () => new Promise(resolve => setImmediate(resolve));

function montar(inicial = iniciais()) {
  let indice = 0, tree, nodes, entrada, resolver, rejeitar, foco = null, chamadas = 0;
  const slots = [], pendentes = [], timers = new Map();
  const hooks = {
    useState(inicio) {
      const i = indice++;
      if (!(i in slots)) slots[i] = typeof inicio === 'function' ? inicio() : inicio;
      return [slots[i], valor => { slots[i] = typeof valor === 'function' ? valor(slots[i]) : valor; }];
    },
    useRef(inicio) { const i = indice++; return slots[i] ??= { current: inicio }; },
    useEffect(fn, deps) {
      const i = indice++, anterior = slots[i];
      if (!anterior || deps.some((dep, n) => !Object.is(dep, anterior.deps[n]))) {
        pendentes.push(() => { anterior?.limpar?.(); slots[i] = { deps, limpar: fn() }; });
      }
    },
  };
  const modulo = { exports: {} };
  const js = ts.transpileModule(fonte(caminho), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(js, { exports: modulo.exports, module: modulo, console,
    window: { setTimeout: (fn, ms) => { timers.set(fn, ms); return fn; }, clearTimeout: fn => timers.delete(fn) },
    require: nome => {
      if (nome === 'react') return hooks;
      if (nome === 'react/jsx-runtime') return jsx;
      if (nome === './ChatConversa.module.css') return { default: new Proxy({}, { get: (_, p) => p }) };
      if (nome === './actions') return { salvarRespostaAction: () => { throw Error('Ação real proibida'); } };
      if (nome === './RespostaPorVoz') return { RespostaPorVoz: () => null };
      if (nome === '@/components/ui/SeletorDeAtividade') return { SeletorDeAtividade: () => null };
      if (nome === './perguntas') return perguntas;
      if (nome.startsWith('@/')) return isolado.load(nome.slice(2) + '.ts');
      throw Error('Import não autorizado: ' + nome);
    },
  });
  function visitar(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visitar); return; }
    nodes.push(node);
    if (node.props?.ref) node.props.ref.current = {
      focus: () => { if (!node.props.disabled) foco = node; }, scrollTo: () => {}, scrollHeight: 100,
    };
    visitar(node.props?.children);
  }
  const api = {
    render() {
      indice = 0; nodes = [];
      // Como o React, remove refs de elementos desmontados antes do commit.
      slots.forEach(s => { if (s?.current && typeof s.current.focus === 'function') s.current = null; });
      tree = modulo.exports.Chat({ businessId: 'negocio-ficticio', inicial, estadoDaVoz: 'desativada',
        salvarResposta: async dados => { chamadas++; entrada = dados; return new Promise((res, rej) => { resolver = res; rejeitar = rej; }); },
      });
      visitar(tree); pendentes.splice(0).forEach(fn => fn()); return api;
    },
    get html() { return renderToStaticMarkup(tree); },
    get nodes() { return nodes; }, get foco() { return foco; }, get chamadas() { return chamadas; },
    get campo() { return nodes.find(n => n.type === 'textarea'); },
    digitar(texto) { api.campo.props.onChange({ target: { value: texto } }); return api.render(); },
    enviar() { nodes.find(n => n.type === 'form').props.onSubmit({ preventDefault() {} }); },
    demorar() { for (const [fn, ms] of timers) { assert.equal(ms, 8000); fn(); } return api.render(); },
    async resolver(resultado) { resolver(resultado); await proximoTick(); return api.render(); },
    async sucesso() { return api.resolver({ ok: true, estado: { businessId: 'negocio-ficticio', respostas: { ...inicial, [entrada.qid]: resposta(entrada.texto) } } }); },
    async queda() { rejeitar(new Error('Rede de teste')); await proximoTick(); return api.render(); },
    get timers() { return timers.size; },
  };
  return api.render();
}

test('dez submissões antes do render fazem uma chamada; rascunho aparece só no histórico durante envio', async () => {
  const tela = montar().digitar('Tenho fotos fictícias para conferir.');
  for (let i = 0; i < 10; i++) tela.enviar();
  tela.render();
  assert.equal(tela.chamadas, 1);
  assert.equal(tela.campo.props.value, '');
  assert.equal(tela.campo.props.disabled, true);
  assert.match(tela.html, /Salvando sua resposta… Aguarde a confirmação/);
  assert.equal(tela.html.split('Tenho fotos fictícias para conferir.').length - 1, 1);
  assert.match(tela.html, /aria-busy="true"/);
  assert.doesNotMatch(tela.html, /Escrevendo|Resposta salva/);
  assert.match(tela.html, /aria-valuenow="8"/);
  await tela.sucesso();
  assert.equal(tela.timers, 0);
  assert.match(tela.html, /Resposta salva\./);
  assert.match(tela.html, /aria-valuenow="9"/);
  assert.match(tela.html, /Continuar para as contas/);
  assert.equal(tela.campo, undefined);
  assert.match(tela.foco.props.children, /Suas respostas estão guardadas/);
});

test('demora informa espera sem inventar sucesso ou permitir novo envio', async () => {
  const tela = montar().digitar('Rascunho demorado'); tela.enviar(); tela.render().demorar();
  assert.match(tela.html, /Ainda aguardando a confirmação/);
  assert.doesNotMatch(tela.html, /Resposta salva|Escrevendo/);
  tela.enviar(); assert.equal(tela.chamadas, 1);
  await tela.sucesso(); assert.equal(tela.timers, 0);
});

test('falha conhecida restaura rascunho, foca aviso e permite uma nova tentativa', async () => {
  const tela = montar().digitar('Texto exato com acentos, emoji 📝 e\nsegunda linha.');
  tela.enviar(); tela.render();
  await tela.resolver({ ok: false, erro: 'Confira os dados e tente novamente.' });
  assert.equal(tela.campo.props.value, 'Texto exato com acentos, emoji 📝 e\nsegunda linha.');
  assert.equal(tela.campo.props.disabled, false);
  assert.equal(tela.campo.props.readOnly, false);
  assert.equal(tela.foco.props.id, 'erro-envio-onboarding');
  assert.equal(tela.campo.props['aria-describedby'], 'erro-envio-onboarding');
  assert.match(tela.html, /aria-valuenow="8"/);
  tela.enviar(); tela.render(); assert.equal(tela.chamadas, 2);
  await tela.sucesso();
});

for (const caso of ['recarregar', 'sem-estado', 'rede']) {
  test(`retorno ${caso} preserva texto copiável e bloqueia repetição`, async () => {
    const tela = montar().digitar('Rascunho que não pode sumir'); tela.enviar(); tela.render();
    if (caso === 'rede') await tela.queda();
    else await tela.resolver(caso === 'recarregar' ? { ok: false, recarregar: true } : { ok: true });
    assert.equal(tela.campo.props.value, 'Rascunho que não pode sumir');
    assert.equal(tela.campo.props.disabled, false);
    assert.equal(tela.campo.props.readOnly, true);
    assert.equal(tela.foco.props.id, 'erro-envio-onboarding');
    assert.match(tela.html, /Recarregar/);
    assert.doesNotMatch(tela.html, /Resposta salva/);
    tela.enviar(); assert.equal(tela.chamadas, 1);
  });
}

test('corrigir a nona resposta preserva a antiga até confirmação e não duplica histórico', async () => {
  const todas = { ...iniciais(), prova: resposta('Resposta antiga confirmada') };
  const tela = montar(todas);
  tela.nodes.filter(n => n.type === 'button' && n.props.children === 'Corrigir').at(-1).props.onClick();
  tela.render().digitar('Nova versão da nona resposta'); tela.enviar(); tela.render();
  assert.match(tela.html, /Resposta antiga confirmada/);
  assert.equal(tela.campo.props.value, '');
  await tela.sucesso();
  assert.doesNotMatch(tela.html, /Resposta antiga confirmada/);
  assert.equal(tela.html.split('Nova versão da nona resposta').length - 1, 1);
  assert.equal(tela.campo, undefined);
});

test('pergunta intermediária só avança quando salva e transfere foco para próxima resposta', async () => {
  const inicial = iniciais(); delete inicial.diferencial;
  const tela = montar(inicial).digitar('Minha diferença fictícia'); tela.enviar(); tela.render();
  await tela.sucesso();
  assert.equal(tela.campo.props.value, '');
  assert.equal(tela.campo.props.disabled, false);
  assert.equal(tela.foco.props.id, 'resposta-onboarding');
  assert.match(tela.html, /Exemplos e depoimentos disponíveis/);
});

test('bancada é exclusiva de desenvolvimento, sem chamada real na simulação', () => {
  const pagina = fonte('app/exemplo/envio-onboarding/page.tsx');
  assert.match(pagina, /process.env.NODE_ENV !== "production" \? await import/);
  assert.match(pagina, /if \(!modulo\) notFound\(\)/);
  const previa = fonte('app/exemplo/_envio-onboarding/Previa.tsx');
  assert.match(previa, /salvarResposta=\{simular\}/);
  assert.doesNotMatch(previa, /fetch\(|createClient\(|salvarRespostaAction\(/);
});
