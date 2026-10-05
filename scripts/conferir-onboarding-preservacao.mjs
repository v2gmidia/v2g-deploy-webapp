// Node 24: node --test scripts/conferir-onboarding-preservacao.mjs
// Executa as actions reais com transporte, sessão e disparo substituídos.
// Nenhum cliente Supabase, Next ou backend real pode ser importado.
import assert from 'node:assert/strict';
import { test, beforeEach, after } from 'node:test';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowed = new Set([
  'app/(fluxo)/onboarding/actions.ts', 'app/(fluxo)/onboarding/perguntas.ts',
  'app/(fluxo)/onboarding/contas/actions.ts', 'app/(fluxo)/onboarding/contas/regras.ts',
  'lib/onboarding/documento.ts', 'lib/cadastro/montar.ts', 'lib/cadastro/pendencias.ts',
  'lib/formato.ts', 'lib/verba/limites.ts', 'lib/nichos/escolha.ts',
  'lib/nichos/busca.ts', 'lib/nichos/tipos.ts',
].map(p => pathToFileURL(path.join(root, p)).href));
const mocks = {
  'next/cache': 'export const revalidatePath = (...a) => globalThis.__onboardingOffline.revalidate(...a);',
  '@/lib/supabase/server': 'export const createClient = async () => globalThis.__onboardingOffline.client();',
  '@/lib/cadastro/procedencia': 'export const gravarCamposDoCliente = async a => globalThis.__onboardingOffline.fields(a);',
  '@/lib/backend': 'export const listarNichos = async () => ({ok:false});',
  '@/lib/pipeline/disparar': 'export const dispararSeCompleto = async () => globalThis.__onboardingOffline.dispatch();',
};
const fetchBefore = globalThis.fetch;
globalThis.fetch = () => { throw Error('Rede proibida neste teste offline'); };
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(mocks, specifier)) return {url: 'offline:' + specifier, shortCircuit:true};
    if (specifier.startsWith('node:')) return nextResolve(specifier, context);
    let url;
    if (specifier.startsWith('@/')) url = pathToFileURL(path.join(root, specifier.slice(2))).href;
    else if (specifier.startsWith('.')) url = new URL(specifier, context.parentURL).href;
    else if (specifier.startsWith('file:')) url = specifier;
    else throw Error('Import externo bloqueado: ' + specifier);
    if (!url.endsWith('.ts')) url += '.ts';
    if (!allowed.has(url)) throw Error('Import não autorizado no teste: ' + url);
    return {url, shortCircuit:true};
  },
  load(url, context, nextLoad) {
    if (url.startsWith('offline:')) return {format:'module', source:mocks[url.slice(8)], shortCircuit:true};
    return nextLoad(url, context);
  },
});
const actions = await import('../app/(fluxo)/onboarding/actions.ts');
const contas = await import('../app/(fluxo)/onboarding/contas/actions.ts');
const { comRespostasDoBlocoUm } = await import('../lib/onboarding/documento.ts');
const oldTime = '2026-09-01T00:00:00.000Z';
const resposta = texto => ({texto, echo:texto, origem:'texto', em:oldTime});
const documentFixture = () => ({
  versao:9, passo:2, respostas:{nome:resposta('Antes'), ramo:resposta('Serviços')},
  contas:{
    ticket:{echo:'100', calculado:100, confirmado:true, em:oldTime},
    custo:{echo:'Não sei', calculado:null, confirmado:false, naoSei:true, em:oldTime, reabertoEm:'2026-09-02T00:00:00.000Z'},
    lucro:{echo:'Calculado', calculado:0, confirmado:false, em:oldTime},
  },
  futuro:{lista:[0, null, false], ativo:false},
});
let row, events, loggedIn, fieldFailure, jsonFailure;
beforeEach(() => {
  row = {id:'negocio-fixture', profile_id:'perfil-fixture', name:'Antes', description:'Descrição anterior',
    avg_ticket_min:100, avg_ticket_max:100, avg_direct_cost:null, target_profit_per_customer:null,
    monthly_budget:null, onboarding:documentFixture(), procedencia:{}};
  events = []; loggedIn = true; fieldFailure = false; jsonFailure = false;
});
globalThis.__onboardingOffline = {
  client() {
    return {
      auth:{getUser:async () => ({data:{user:loggedIn ? {id:'perfil-fixture'} : null}})},
      from(table) {
        assert.equal(table, 'businesses');
        return {
          select() {
            const query = {
              eq(column, value) { assert.equal(column,'profile_id'); assert.equal(value,'perfil-fixture'); return query; },
              order() { return query; }, limit() { return query; },
              async maybeSingle() { return {data:structuredClone(row), error:null}; },
            };
            return query;
          },
          update(payload) {
            assert.deepEqual(Object.keys(payload), ['onboarding']);
            return {async eq(column, value) {
              assert.equal(column,'id'); assert.equal(value,row.id);
              events.push('json');
              if (jsonFailure) return {error:{message:'falha simulada'}};
              row.onboarding = structuredClone(payload.onboarding);
              return {error:null};
            }};
          },
          insert() { throw Error('Criação inesperada de negócio'); },
        };
      },
    };
  },
  async fields(args) {
    assert.equal(args.profileId,'perfil-fixture'); assert.equal(args.businessId,row.id);
    assert.equal(args.tabela,'businesses'); events.push('campos');
    if (fieldFailure) return {ok:false, erro:'Falha simulada de campo'};
    for (const {campo,valor} of args.campos) {
      row[campo] = valor; row.procedencia[campo] = {origem:'confirmado',em:oldTime};
    }
    return {ok:true, atos:[]};
  },
  revalidate(route) { events.push('revalidate:' + route); },
  dispatch() { events.push('disparo'); },
};
after(() => { hooks.deregister(); globalThis.fetch = fetchBefore; delete globalThis.__onboardingOffline; });
const save = (qid='nome', texto='Nome corrigido') => actions.salvarRespostaAction({qid,texto,origem:'texto'});

test('corrigir nome preserva contas completas e propriedades irmãs', async () => {
  const before = structuredClone(row.onboarding);
  assert.equal((await save()).ok,true);
  assert.deepEqual(row.onboarding.contas,before.contas);
  assert.deepEqual(row.onboarding.futuro,before.futuro);
  assert.equal(row.onboarding.versao,1); assert.equal(row.onboarding.passo,1);
  assert.equal(row.name,'Nome corrigido'); assert.equal(row.procedencia.name.origem,'confirmado');
  assert.deepEqual(events,['campos','json','revalidate:/onboarding','disparo']);
});
test('descrição conserva respostas anteriores, migra legado e prefere chave atual', async () => {
  row.onboarding.respostas = {'0':resposta('Legado'), '1':resposta('Antigo'), ramo:resposta('Atual'), extra:resposta('Extra')};
  assert.equal((await save('descricao','Descrição corrigida do negócio')).ok,true);
  const r = row.onboarding.respostas;
  assert.equal(r.inicio.texto,'Legado'); assert.equal(r.ramo.texto,'Atual'); assert.equal(r.extra.texto,'Extra');
  assert.equal(r['0'],undefined); assert.equal(r['1'],undefined);
  assert.equal(r.descricao.texto,row.description);
  assert.deepEqual(row.onboarding.futuro,documentFixture().futuro);
});
test('helper não modifica o documento ou respostas recebidos', () => {
  const freeze = value => { if(value && typeof value === 'object') {Object.values(value).forEach(freeze); Object.freeze(value);} return value; };
  const doc = freeze(documentFixture()); const before = structuredClone(doc);
  const respostas = freeze({nome:resposta('Novo')});
  const result = comRespostasDoBlocoUm(doc,respostas);
  assert.notEqual(result,doc); assert.deepEqual(doc,before); assert.equal(result.respostas,respostas);
  assert.deepEqual(result.contas,before.contas);
});
for (const invalid of [null, undefined, false, 0, 'texto', [{contas:'inválido'}]]) {
  test('documento inválido vira ausente: ' + JSON.stringify(invalid), async () => {
    row.onboarding = invalid;
    assert.equal((await save()).ok,true);
    assert.deepEqual(Object.keys(row.onboarding).sort(),['passo','respostas','versao']);
    assert.equal(row.onboarding.respostas.nome.texto,'Nome corrigido');
  });
}
test('falha de campo impede JSON, revalidação e disparo', async () => {
  const before = structuredClone(row); fieldFailure = true;
  assert.equal((await save()).ok,false);
  assert.deepEqual(row,before); assert.deepEqual(events,['campos']);
});
test('falha JSON não retorna sucesso nem dispara; coluna já gravada permanece', async () => {
  const before = structuredClone(row.onboarding); jsonFailure = true;
  assert.equal((await save()).ok,false);
  assert.deepEqual(row.onboarding,before); assert.equal(row.name,'Nome corrigido');
  assert.deepEqual(events,['campos','json']);
});
test('sem sessão não grava', async () => {
  loggedIn = false; assert.equal((await save()).ok,false); assert.deepEqual(events,[]);
});
test('entradas inválidas não gravam nem disparam', async () => {
  for (const entrada of [
    {qid:'inexistente',texto:'abc',origem:'texto'}, {qid:'nome',texto:' ',origem:'texto'},
    {qid:'descricao',texto:'curta',origem:'texto'}, {qid:'nome',texto:'forjado',origem:'chip'},
    {qid:'praca',texto:'Na cidade toda',origem:'chip'}, {qid:'ramo',texto:'forjado',origem:'chip'},
  ]) assert.equal((await actions.salvarRespostaAction(entrada)).ok,false);
  assert.deepEqual(events,[]);
});
test('contas → voltar ao bloco 1 → retomar mantém não sei reaberto e lucro não confirmado', async () => {
  row.onboarding.contas = {lucro:documentFixture().contas.lucro};
  assert.equal((await contas.salvarContaAction({conta:'ticket',escolha:'120'})).ok,true);
  assert.equal((await contas.salvarContaAction({conta:'custo',escolha:'',naoSei:true})).ok,true);
  let estado = await contas.carregarContasAction();
  assert.equal(estado.leituras.custo.estado,'nao_sei');
  assert.equal((await contas.reabrirContaAction({conta:'custo'})).ok,true);
  const before = structuredClone(row.onboarding.contas);
  assert.equal((await save()).ok,true);
  assert.equal((await save('descricao','Descrição corrigida novamente')).ok,true);
  estado = await contas.carregarContasAction();
  assert.deepEqual(estado.contas,before); assert.equal(estado.ticket,120);
  assert.equal(estado.leituras.custo.estado,'reaberta');
  assert.equal(estado.leituras.lucro.estado,'calculada');
  assert.equal(estado.leituras.lucro.calculado,0);
  assert.equal((await actions.carregarEstadoAction()).respostas.nome.texto,'Nome corrigido');
});
test('zero confirmado nas colunas não vira null ou não sei na retomada', async () => {
  row.avg_direct_cost = 0; row.target_profit_per_customer = 0;
  assert.equal((await save()).ok,true);
  const estado = await contas.carregarContasAction();
  assert.deepEqual(estado.leituras.custo,{estado:'respondida',valor:0});
  assert.deepEqual(estado.leituras.lucro,{estado:'respondida',valor:0});
  assert.equal(estado.contas.custo.naoSei,true); assert.equal(estado.contas.custo.calculado,null);
});
