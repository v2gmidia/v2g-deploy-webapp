import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { ambienteTs } from './test-utils/ts-isolado.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
// Renderizador mínimo de hooks: exercita ações reais sem DOM, rede ou sessão.
function bancada(arquivo, ports = {}) {
  const estados = [], efeitos = [], timers = new Map();
  let cursor = 0, agora = 0, id = 0;
  const react = {
    useState(inicial) { const i = cursor++; if (!(i in estados)) estados[i] = typeof inicial === 'function' ? inicial() : inicial; return [estados[i], valor => { estados[i] = typeof valor === 'function' ? valor(estados[i]) : valor; }]; },
    useRef(inicial) { const i = cursor++; return estados[i] ??= { current: inicial }; },
    useEffect(efeito) { const i = cursor++; if (!(i in estados)) { estados[i] = true; efeitos.push(efeito); } },
  };
  const module = { exports: {} };
  const isolado = ambienteTs();
  vm.runInNewContext(ts.transpileModule(readFileSync(arquivo, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText, {
    module, exports: module.exports,
    require(nome) {
      if (nome === 'react') return react;
      if (nome.endsWith('.css')) return { default: new Proxy({}, { get: (_, key) => key }) };
      if (nome in ports) return ports[nome];
      if (nome.startsWith('@/lib/')) return isolado.load(nome.replace('@/', '') + '.ts');
      return require(nome);
    },
    setTimeout(fn, atraso) { timers.set(++id, { fn, fim: agora + atraso }); return id; },
    clearTimeout(chave) { timers.delete(chave); },
  });
  return { exports: module.exports, render(fn, props) { cursor = 0; return fn(props); },
    mount() { return efeitos.splice(0).map(efeito => efeito()); },
    tick(ms) { agora += ms; for (const [chave, timer] of timers) if (timer.fim <= agora) { timers.delete(chave); timer.fn(); } }, timers };
}
function elementos(no) {
  if (!no || typeof no !== 'object') return [];
  return [no, ...[no.props?.children].flat(Infinity).flatMap(elementos)];
}

test('espera é silenciosa antes de 1 s, localizada até 10 s e depois explica sem spinner', () => {
  const b = bancada('components/ui/EsperaLocal.tsx');
  const outer = b.exports.EsperaLocal({ ativa: true, mensagem: 'Consultando', mensagemDemorada: 'Demorando' });
  assert.equal(outer.props.role, 'status');
  const { type: Relogio, props } = outer.props.children;
  assert.equal(b.render(Relogio, props), null);
  const limpezas = b.mount();
  b.tick(999); assert.equal(b.render(Relogio, props), null);
  b.tick(1); assert.equal(elementos(b.render(Relogio, props)).filter(e => e.props?.className === 'spinner').length, 1);
  b.tick(9000); const longo = b.render(Relogio, props);
  assert.equal(elementos(longo).filter(e => e.props?.className === 'spinner').length, 0);
  assert.ok(elementos(longo).some(e => e.props?.children === 'Demorando'));
  limpezas.forEach(fn => fn?.());
  assert.equal(b.timers.size, 0);
});

test('concluir rapidamente desmonta o relógio e limpa ambos os timers', () => {
  const b = bancada('components/ui/EsperaLocal.tsx');
  const { type, props } = b.exports.EsperaLocal({ ativa: true, mensagem: 'A', mensagemDemorada: 'B' }).props.children;
  b.render(type, props); const limpezas = b.mount();
  b.tick(200); limpezas.forEach(fn => fn?.());
  assert.equal(b.timers.size, 0);
  assert.equal(b.exports.EsperaLocal({ ativa: false }).props.children, false);
});

function pergunta(responder) {
  const b = bancada('app/(protected)/inicio/PerguntaDoDia.tsx', {
    './actions': { responderPerguntaDoDiaAction: () => { throw Error('ação real proibida'); }, registrarPerguntaApresentadaAction: async () => {} },
    '@/components/ui/EsperaLocal': { EsperaLocal: () => null },
  });
  const props = { vendasAtuais: null, receitaAtualCentavos: null, respondeuAlgo: false, dia: '2026-11-05', atrasados: [], valoresPorDia: {}, idExecucao: 'teste', businessId: 'teste', acoes: { responder, registrar: async () => {} } };
  const render = () => b.render(b.exports.PerguntaDoDia, props);
  const encontrar = filtro => elementos(render()).find(filtro);
  encontrar(e => e.props?.id === 'pd-vendas').props.onChange({ target: { value: '3' } });
  encontrar(e => e.props?.id === 'pd-receita').props.onChange({ target: { value: '45000' } });
  return { render, encontrar, guardar: () => encontrar(e => e.type === 'button' && e.props.children === 'Guardar') };
}

test('duplo envio faz uma chamada; erro de transporte libera campos e preserva valores para retry', async () => {
  let rejeitar, chamadas = 0;
  const p = pergunta(() => { chamadas++; return new Promise((_, reject) => { rejeitar = reject; }); });
  const botao = p.guardar();
  const pendente = botao.props.onClick();
  await botao.props.onClick();
  assert.equal(chamadas, 1);
  assert.equal(p.encontrar(e => e.props?.id === 'pd-vendas').props.disabled, true);
  rejeitar(Error('rede')); await pendente;
  assert.equal(p.guardar().props.disabled, false);
  assert.equal(p.encontrar(e => e.props?.id === 'pd-vendas').props.value, '3');
  assert.equal(p.encontrar(e => e.props?.id === 'pd-receita').props.value, '450,00');
  assert.match(p.encontrar(e => e.props?.role === 'alert').props.children, /Não conseguimos confirmar/);
  const retry = p.guardar().props.onClick(); assert.equal(chamadas, 2); rejeitar(Error('rede')); await retry;
});

test('falha declarada mantém formulário; confirmação real da ação permite resumo com os valores', async () => {
  let falhar = true;
  const p = pergunta(async () => falhar ? { ok: false, erro: 'Tente novamente' } : { ok: true });
  await p.guardar().props.onClick();
  assert.equal(p.encontrar(e => e.props?.role === 'alert').props.children, 'Tente novamente');
  falhar = false; await p.guardar().props.onClick();
  assert.equal(p.render().type, 'p');
  assert.ok(p.render().props.children.includes(3));
});
