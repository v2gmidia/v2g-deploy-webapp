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
  'app/(fluxo)/onboarding/marca/actions.ts', 'lib/onboarding/marca.ts',
  'lib/onboarding/bloco-um.ts',
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
  '@/lib/multiconta/ativo': 'export const negocioAtivoDaSessao = async () => globalThis.__onboardingOffline.activeBusiness();',
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
const marca = await import('../app/(fluxo)/onboarding/marca/actions.ts');
const marcaDoc = await import('../lib/onboarding/marca.ts');
const { patchDoBlocoUm } = await import('../lib/onboarding/documento.ts');
const oldTime = '2026-09-01T00:00:00.000Z';
const resposta = texto => ({texto, echo:texto, origem:'texto', em:oldTime});
const documentFixture = () => ({
  versao:9, passo:2, respostas:{nome:resposta('Antes'), ramo:resposta('Serviços'),
    descricao:resposta('Descrição completa do negócio'), praca:resposta('Na cidade toda')},
  contas:{
    ticket:{echo:'100', calculado:100, confirmado:true, em:oldTime},
    custo:{echo:'Não sei', calculado:null, confirmado:false, naoSei:true, em:oldTime, reabertoEm:'2026-09-02T00:00:00.000Z'},
    lucro:{echo:'Calculado', calculado:0, confirmado:false, em:oldTime},
  },
  futuro:{lista:[0, null, false], ativo:false},
});
let row, events, loggedIn, fieldFailure, jsonFailure, beforeMerge;
beforeEach(() => {
  row = {id:'negocio-fixture', profile_id:'perfil-fixture', name:'Antes', description:'Descrição anterior',
    avg_ticket_min:100, avg_ticket_max:100, avg_direct_cost:null, target_profit_per_customer:null,
    monthly_budget:null, site_url:null, instagram_handle:null, onboarding:documentFixture(), procedencia:{}};
  events = []; loggedIn = true; fieldFailure = false; jsonFailure = false; beforeMerge = null;
});
globalThis.__onboardingOffline = {
  activeBusiness() { return loggedIn
    ? {status:'selecionado',negocio:{id:row.id,name:row.name}}
    : {status:'sem_sessao'}; },
  client() {
    return {
      auth:{getUser:async () => ({data:{user:loggedIn ? {id:'perfil-fixture'} : null}})},
      async rpc(name, args) {
        assert.equal(name,'mesclar_blocos_onboarding');
        assert.equal(args.p_business_id,row.id);
        events.push('json');
        if (jsonFailure) return {data:null,error:{message:'falha simulada'}};
        if (beforeMerge) { const write = beforeMerge; beforeMerge = null; write(); }
        const current = row.onboarding && typeof row.onboarding === 'object' && !Array.isArray(row.onboarding)
          ? row.onboarding : {};
        const patch = structuredClone(args.p_patch);
        const next = {...current,...patch};
        if (patch.respostas) {
          const previous = {...(current.respostas ?? {})};
          for (const [oldKey,newKey] of [['0','inicio'],['1','ramo'],['3','praca']]) {
            if (Object.hasOwn(previous,oldKey) && !Object.hasOwn(previous,newKey)) previous[newKey] = previous[oldKey];
            delete previous[oldKey];
          }
          next.respostas = {...previous,...patch.respostas};
        }
        if (patch.contas) next.contas = {...(current.contas ?? {}),...patch.contas};
        row.onboarding = next;
        return {data:true,error:null};
      },
      from(table) {
        assert.equal(table, 'businesses');
        return {
          select() {
            const query = {
              eq(column, value) {
                if (column === 'id') assert.equal(value,row.id);
                else { assert.equal(column,'profile_id'); assert.equal(value,'perfil-fixture'); }
                return query;
              },
              order() { return query; }, limit() { return query; },
              async maybeSingle() { return {data:structuredClone(row), error:null}; },
            };
            return query;
          },
          update() { throw Error('Onboarding não pode substituir o JSON completo'); },
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
const save = (qid='nome', texto='Nome corrigido') => actions.salvarRespostaAction({businessId:row.id,qid,texto,origem:'texto'});
const saveConta = entrada => contas.salvarContaAction({businessId:row.id,...entrada});
const reabrirConta = entrada => contas.reabrirContaAction({businessId:row.id,...entrada});

test('aba antiga não grava após trocar de negócio', async () => {
  const before = structuredClone(row);
  const result = await actions.salvarRespostaAction({businessId:'outro-negocio',qid:'nome',texto:'Valor antigo',origem:'texto'});
  assert.equal(result.ok,false);
  assert.deepEqual(row,before);
  assert.deepEqual(events,[]);
});

test('corrigir nome preserva contas completas e propriedades irmãs', async () => {
  const before = structuredClone(row.onboarding);
  assert.equal((await save()).ok,true);
  assert.deepEqual(row.onboarding.contas,before.contas);
  assert.deepEqual(row.onboarding.futuro,before.futuro);
  assert.equal(row.onboarding.versao,1); assert.equal(row.onboarding.passo,1);
  assert.equal(row.name,'Nome corrigido'); assert.equal(row.procedencia.name.origem,'confirmado');
  assert.deepEqual(events,['campos','json','revalidate:/onboarding','disparo']);
});
test('gravação concorrente de outro bloco após a leitura não é apagada', async () => {
  const novasContas = { ticket:{echo:'200', calculado:200, confirmado:true, em:oldTime} };
  beforeMerge = () => { row.onboarding.contas = structuredClone(novasContas); };
  assert.equal((await save()).ok,true);
  assert.deepEqual(row.onboarding.contas,novasContas);
  assert.equal(row.onboarding.respostas.nome.texto,'Nome corrigido');
});
test('gravação concorrente de outra resposta no mesmo bloco é preservada', async () => {
  const outra = resposta('Escrita entre abas');
  beforeMerge = () => { row.onboarding.respostas.descricao = outra; };
  assert.equal((await save()).ok,true);
  assert.deepEqual(row.onboarding.respostas.descricao,outra);
  assert.equal(row.onboarding.respostas.nome.texto,'Nome corrigido');
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
test('patch do bloco um só contém suas três chaves', () => {
  const freeze = value => { if(value && typeof value === 'object') {Object.values(value).forEach(freeze); Object.freeze(value);} return value; };
  const doc = freeze(documentFixture()); const before = structuredClone(doc);
  const respostas = freeze({nome:resposta('Novo')});
  const result = patchDoBlocoUm(respostas);
  assert.deepEqual(doc,before); assert.equal(result.respostas,respostas);
  assert.deepEqual(Object.keys(result).sort(),['passo','respostas','versao']);
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
  ]) assert.equal((await actions.salvarRespostaAction({businessId:row.id,...entrada})).ok,false);
  assert.deepEqual(events,[]);
});
test('contas → voltar ao bloco 1 → retomar mantém não sei reaberto e lucro não confirmado', async () => {
  row.avg_ticket_min = null;
  row.avg_ticket_max = null;
  row.onboarding.contas = {lucro:documentFixture().contas.lucro};
  assert.equal((await saveConta({conta:'ticket',escolha:'120'})).ok,true);
  assert.equal((await saveConta({conta:'custo',escolha:'',naoSei:true})).ok,true);
  let estado = await contas.carregarContasAction();
  assert.equal(estado.leituras.custo.estado,'nao_sei');
  assert.equal((await reabrirConta({conta:'custo'})).ok,true);
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
test('duas abas de contas não apagam respostas diferentes', async () => {
  row.avg_ticket_min = null; row.avg_ticket_max = null;
  delete row.onboarding.contas.ticket;
  const custoNovo = {echo:'Não sei',calculado:null,confirmado:false,naoSei:true,em:oldTime};
  beforeMerge = () => { row.onboarding.contas.custo = custoNovo; };
  assert.equal((await saveConta({conta:'ticket',escolha:'120'})).ok,true);
  assert.deepEqual(row.onboarding.contas.custo,custoNovo);
  assert.equal(row.onboarding.contas.ticket.calculado,120);
});
test('zero confirmado nas colunas não vira null ou não sei na retomada', async () => {
  row.avg_direct_cost = 0; row.target_profit_per_customer = 0;
  assert.equal((await save()).ok,true);
  const estado = await contas.carregarContasAction();
  assert.deepEqual(estado.leituras.custo,{estado:'respondida',valor:0});
  assert.deepEqual(estado.leituras.lucro,{estado:'respondida',valor:0});
  assert.equal(estado.contas.custo.naoSei,true); assert.equal(estado.contas.custo.calculado,null);
});

const entradaMarca = () => ({businessId:row.id,site:'exemplo.com.br',siteNaoTenho:false,
  instagram:'@exemplo',aparencia:'Azul escuro e fotos dos produtos',aparenciaNaoSei:false});
function contasProntas() { row.avg_direct_cost = 20; row.target_profit_per_customer = 10; }

test('contas e marca de aba antiga não gravam no negócio atual', async () => {
  contasProntas();
  const antes = structuredClone(row);
  assert.equal((await contas.salvarContaAction({businessId:'outro-negocio',conta:'custo',escolha:'20'})).ok,false);
  assert.equal((await contas.reabrirContaAction({businessId:'outro-negocio',conta:'custo'})).ok,false);
  assert.equal((await marca.salvarMarcaAction({...entradaMarca(),businessId:'outro-negocio'})).ok,false);
  assert.deepEqual(row,antes);
  assert.deepEqual(events,[]);
});

test('marca exige contas fechadas e resposta visual explícita', async () => {
  assert.equal((await marca.salvarMarcaAction(entradaMarca())).ok,false);
  assert.deepEqual(events,[]);
  contasProntas();
  assert.equal((await marca.salvarMarcaAction({...entradaMarca(),aparencia:''})).ok,false);
  assert.deepEqual(events,[]);
});
test('não conclui se faltar uma resposta básica, mesmo com as contas prontas', async () => {
  contasProntas();
  delete row.onboarding.respostas.descricao;
  const before = structuredClone(row);
  const result = await marca.salvarMarcaAction(entradaMarca());
  assert.equal(result.ok,false);
  assert.deepEqual(row,before);
  assert.deepEqual(events,[]);
  const estado = await marca.carregarMarcaAction();
  assert.deepEqual(estado.faltamBasicas,['descricao']);
});
test('conclusão antiga não mascara pergunta básica ausente na retomada', async () => {
  contasProntas();
  delete row.onboarding.respostas.nome;
  row.onboarding.conclusao = {em:oldTime,proximoPasso:'agendamento_pendente'};
  const estado = await marca.carregarMarcaAction();
  assert.equal(estado.concluido,false);
  assert.deepEqual(estado.faltamBasicas,['nome']);
  assert.deepEqual(events,[]);
});
test('respostas legadas de ramo e praça contam sem apagar o histórico', async () => {
  contasProntas();
  row.onboarding.respostas['1'] = row.onboarding.respostas.ramo;
  row.onboarding.respostas['3'] = row.onboarding.respostas.praca;
  delete row.onboarding.respostas.ramo;
  delete row.onboarding.respostas.praca;
  const before = structuredClone(row.onboarding.respostas);
  const result = await marca.salvarMarcaAction(entradaMarca());
  assert.equal(result.ok,true);
  assert.deepEqual(row.onboarding.respostas,before);
  assert.equal(result.estado.respostasBasicas.ramo.texto,'Serviços');
  assert.equal(result.estado.respostasBasicas.praca.texto,'Na cidade toda');
});
test('marca retoma e preserva respostas, contas, procedência e blocos futuros', async () => {
  contasProntas(); const before = structuredClone(row.onboarding);
  const result = await marca.salvarMarcaAction(entradaMarca());
  assert.equal(result.ok,true); assert.equal(result.estado.concluido,true);
  assert.deepEqual(row.onboarding.respostas,before.respostas);
  assert.deepEqual(row.onboarding.contas,before.contas);
  assert.deepEqual(row.onboarding.futuro,before.futuro);
  assert.equal(row.procedencia.site_url.origem,'confirmado');
  assert.equal(row.procedencia.instagram_handle.origem,'confirmado');
  const retomado = await marca.carregarMarcaAction();
  assert.equal(retomado.concluido,true);
  assert.equal(retomado.marca.aparencia,'Azul escuro e fotos dos produtos');
  assert.equal(retomado.site,'https://exemplo.com.br');
  assert.equal(events.includes('disparo'),false);
});
test('conclusão preserva resposta gravada após leitura da marca', async () => {
  contasProntas();
  const respostaNova = resposta('Nova descrição entre abas');
  beforeMerge = () => { row.onboarding.respostas.descricao = respostaNova; };
  assert.equal((await marca.salvarMarcaAction(entradaMarca())).ok,true);
  assert.deepEqual(row.onboarding.respostas.descricao,respostaNova);
  assert.equal(row.onboarding.conclusao.proximoPasso,'agendamento_pendente');
});
test('sem site e sem certeza sobre a marca ficam explícitos sem campo inventado', async () => {
  contasProntas();
  const r = await marca.salvarMarcaAction({businessId:row.id,site:'',siteNaoTenho:true,instagram:'',aparencia:'',aparenciaNaoSei:true});
  assert.equal(r.ok,true); assert.equal(row.site_url,null);
  assert.equal(row.onboarding.marca.siteNaoTenho,true);
  assert.equal(row.onboarding.marca.aparenciaNaoSei,true);
  assert.equal(events.includes('campos'),false);
});
test('cliente pode trocar não sei por descrição após concluir, sem refazer a conclusão', async () => {
  contasProntas();
  const semResposta = {...entradaMarca(),site:'',siteNaoTenho:true,instagram:'',aparencia:'',aparenciaNaoSei:true};
  assert.equal((await marca.salvarMarcaAction(semResposta)).ok,true);
  const conclusao = structuredClone(row.onboarding.conclusao);
  const contasAntes = structuredClone(row.onboarding.contas);
  const respostasAntes = structuredClone(row.onboarding.respostas);
  events = [];
  const atualizada = {...semResposta,aparencia:'Azul escuro e fotos dos produtos',aparenciaNaoSei:false};
  assert.equal((await marca.salvarMarcaAction(atualizada)).ok,true);
  assert.equal(row.onboarding.marca.aparencia,atualizada.aparencia);
  assert.equal(row.onboarding.marca.aparenciaNaoSei,false);
  assert.deepEqual(row.onboarding.conclusao,conclusao);
  assert.deepEqual(row.onboarding.contas,contasAntes);
  assert.deepEqual(row.onboarding.respostas,respostasAntes);
  assert.equal(events.includes('disparo'),false);
  const gravacoes = events.length;
  assert.equal((await marca.salvarMarcaAction(atualizada)).ok,true);
  assert.equal(events.length,gravacoes);
});
test('falha ao atualizar marca concluída preserva resposta anterior para retomar', async () => {
  contasProntas();
  assert.equal((await marca.salvarMarcaAction(entradaMarca())).ok,true);
  const anterior = structuredClone(row.onboarding);
  const atualizada = {...entradaMarca(),aparencia:'Verde e fotografias dos produtos'};
  jsonFailure = true;
  assert.equal((await marca.salvarMarcaAction(atualizada)).ok,false);
  assert.deepEqual(row.onboarding,anterior);
  jsonFailure = false;
  assert.equal((await marca.salvarMarcaAction(atualizada)).ok,true);
  assert.equal(row.onboarding.marca.aparencia,atualizada.aparencia);
  assert.deepEqual(row.onboarding.conclusao,anterior.conclusao);
});
test('falhas de coluna e de JSON não marcam conclusão; repetição não duplica', async () => {
  contasProntas(); fieldFailure = true;
  assert.equal((await marca.salvarMarcaAction(entradaMarca())).ok,false);
  assert.equal(row.onboarding.conclusao,undefined);
  fieldFailure = false; jsonFailure = true;
  assert.equal((await marca.salvarMarcaAction(entradaMarca())).ok,false);
  assert.equal(row.onboarding.conclusao,undefined);
  jsonFailure = false; events = [];
  assert.equal((await marca.salvarMarcaAction(entradaMarca())).ok,true);
  const doc = structuredClone(row.onboarding); const count = events.length;
  assert.equal((await marca.salvarMarcaAction(entradaMarca())).ok,true);
  assert.deepEqual(row.onboarding,doc); assert.equal(events.length,count);
});
test('jornada de reunião impede envio automático mesmo com cadastro completo', () => {
  assert.equal(marcaDoc.fluxoAguardaReuniao(documentFixture()),true);
  assert.equal(marcaDoc.fluxoAguardaReuniao({...documentFixture(),conclusao:{em:oldTime,proximoPasso:'agendamento_pendente'}}),true);
  assert.equal(marcaDoc.fluxoAguardaReuniao({}),false);
});
test('identificador de conta desconhecido não grava nem chama o cadastro', async () => {
  const before = structuredClone(row);
  assert.equal((await saveConta({conta:'desconhecida',escolha:'100'})).ok,false);
  assert.equal((await reabrirConta({conta:'desconhecida'})).ok,false);
  assert.deepEqual(row,before);
  assert.deepEqual(events,[]);
});
test('ação repetida ou antiga não troca uma conta já fechada por não sei', async () => {
  const before = structuredClone(row);
  assert.equal((await saveConta({conta:'ticket',escolha:'',naoSei:true})).ok,false);
  assert.deepEqual(row,before);
  assert.deepEqual(events,[]);

  delete row.onboarding.contas.custo.reabertoEm;
  const depois = structuredClone(row);
  assert.equal((await saveConta({conta:'custo',escolha:'10',confirmando:true})).ok,false);
  assert.deepEqual(row,depois);
  assert.deepEqual(events,[]);
});
