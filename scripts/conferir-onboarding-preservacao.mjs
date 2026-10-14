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
  'app/(fluxo)/onboarding/marca/actions.ts', 'lib/onboarding/marca.ts', 'lib/onboarding/conclusao.ts',
  'lib/onboarding/bloco-um.ts', 'lib/onboarding/enderecos.ts', 'lib/onboarding/briefing-trafego.ts',
  'lib/onboarding/documento.ts', 'lib/onboarding/atividades.ts', 'lib/cadastro/montar.ts', 'lib/cadastro/pendencias.ts',
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
const cadastro = await import('../lib/cadastro/montar.ts');
const marcaDoc = await import('../lib/onboarding/marca.ts');
const { patchDoBlocoUm } = await import('../lib/onboarding/documento.ts');
const { buscarAtividades } = await import('../lib/onboarding/atividades.ts');
const { lerBriefingDeTrafego, NAO_SEI_BRIEFING } = await import('../lib/onboarding/briefing-trafego.ts');
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
let row, events, loggedIn, fieldFailure, fieldFailureAfter, clearFailure, jsonFailure, beforeMerge, readCount, failReadAt;
beforeEach(() => {
  row = {id:'negocio-fixture', profile_id:'perfil-fixture', name:'Antes', description:'Descrição anterior',
    avg_ticket_min:100, avg_ticket_max:100, avg_direct_cost:null, target_profit_per_customer:null,
    monthly_budget:null, site_url:null, instagram_handle:null, city:null, cep:null, radius_km:null,
    onboarding:documentFixture(), procedencia:{}};
  events = []; loggedIn = true; fieldFailure = false; fieldFailureAfter = null; clearFailure = false; jsonFailure = false; beforeMerge = null;
  readCount = 0; failReadAt = null;
});
globalThis.__onboardingOffline = {
  activeBusiness() { return loggedIn
    ? {status:'selecionado',negocio:{id:row.id,name:row.name}}
    : {status:'sem_sessao'}; },
  client() {
    return {
      auth:{getUser:async () => ({data:{user:loggedIn ? {id:'perfil-fixture'} : null}})},
      async rpc(name, args) {
        if (name === 'esvaziar_campos_do_cliente') {
          assert.equal(args.p_business_id,row.id);
          events.push('esvaziar');
          if (clearFailure) return {data:null,error:{message:'falha simulada'}};
          for (const campo of args.p_campos) { row[campo] = null; delete row.procedencia[campo]; }
          return {data:args.p_campos.length,error:null};
        }
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
              async maybeSingle() {
                readCount++;
                if (readCount === failReadAt) return {data:null,error:{message:'leitura indisponível'}};
                return {data:structuredClone(row), error:null};
              },
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
    for (const [index,{campo,valor}] of args.campos.entries()) {
      if (index === fieldFailureAfter) return {ok:false,erro:'Falha parcial simulada',gravados:[]};
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

test('site e Instagram inválidos não marcam resposta nem gravam coluna', async () => {
  const before = structuredClone(row);
  assert.equal((await save('site', 'site sem dominio')).ok, false);
  assert.equal((await save('instagram', '@usuario!')).ok, false);
  assert.deepEqual(row, before);
  assert.deepEqual(events, []);
});

test('site e Instagram válidos entram em colunas do negócio e persistem no JSON', async () => {
  assert.equal((await save('site', 'exemplo.com.br')).ok, true);
  assert.equal(row.site_url, 'https://exemplo.com.br');
  assert.equal(row.onboarding.respostas.site.texto, 'https://exemplo.com.br');
  assert.equal((await save('instagram', 'https://instagram.com/Exemplo/')).ok, true);
  assert.equal(row.instagram_handle, '@exemplo');
  assert.equal(row.onboarding.respostas.instagram.texto, '@exemplo');
});

test('declarar ausência limpa endereço anterior sem apagar outros blocos', async () => {
  row.site_url = 'https://anterior.com.br';
  row.instagram_handle = '@anterior';
  const contasAntes = structuredClone(row.onboarding.contas);
  const site = await actions.salvarRespostaAction({businessId:row.id,qid:'site',texto:'Não tenho site',origem:'chip'});
  const instagram = await actions.salvarRespostaAction({businessId:row.id,qid:'instagram',texto:'Não tenho Instagram',origem:'chip'});
  assert.equal(site.ok, true);
  assert.equal(instagram.ok, true);
  assert.equal(row.site_url, null);
  assert.equal(row.instagram_handle, null);
  assert.deepEqual(row.onboarding.contas, contasAntes);
  assert.equal(row.onboarding.respostas.site.texto, 'Não tenho site');
  assert.equal((await marca.carregarMarcaAction()).siteNaoTenhoDeclarado, true);
});

test('falha na limpeza do site exige recarregar e não marca ausência', async () => {
  row.site_url = 'https://anterior.com.br';
  clearFailure = true;
  const result = await actions.salvarRespostaAction({businessId:row.id,qid:'site',texto:'Não tenho site',origem:'chip'});
  assert.equal(result.ok, false);
  assert.equal(result.recarregar, true);
  assert.equal(row.site_url, 'https://anterior.com.br');
  assert.equal(row.onboarding.respostas.site, undefined);
});

test('CEP opcional da praça é validado e gravado no negócio selecionado', async () => {
  const invalido = await actions.salvarRespostaAction({businessId:row.id,qid:'praca',texto:'Na cidade toda',origem:'chip',cidade:'São Paulo',cep:'1234A-000'});
  assert.equal(invalido.ok, false);
  assert.deepEqual(events, []);
  const valido = await actions.salvarRespostaAction({businessId:row.id,qid:'praca',texto:'Na cidade toda',origem:'chip',cidade:'São Paulo',cep:'01310-100'});
  assert.equal(valido.ok, true);
  assert.equal(row.cep, '01310100');
  assert.equal(row.onboarding.respostas.praca.cep, '01310100');
  assert.match(row.onboarding.respostas.praca.echo, /CEP 01310-100/);
});

test('Brasil inteiro dispensa cidade e remove somente o raio da escolha local anterior', async () => {
  row.radius_km = 25;
  row.city = 'Curitiba';
  row.onboarding.respostas.praca = {texto:'Na cidade toda',origem:'chip',cidade:'Curitiba',echo:'Curitiba · Na cidade toda',em:oldTime};
  const result = await actions.salvarRespostaAction({businessId:row.id,qid:'praca',texto:'Brasil inteiro',origem:'chip'});
  assert.equal(result.ok,true);
  assert.equal(row.radius_km,null);
  assert.equal(row.city,'Curitiba');
  assert.equal(row.onboarding.respostas.praca.texto,'Brasil inteiro');
});

test('tipo de negócio com duas letras não conclui a pergunta', async () => {
  const result = await actions.salvarRespostaAction({businessId:row.id,qid:'ramo',texto:'UI',origem:'texto'});
  assert.equal(result.ok,false);
  assert.deepEqual(events,[]);
});

test('busca de atividades sugere profissões com e sem acento e aceita Outros', async () => {
  assert.deepEqual(buscarAtividades('dent'), ['Dentista']);
  assert.ok(buscarAtividades('medico').includes('Médico'));
  assert.ok(buscarAtividades('odontologia').includes('Dentista'));
  assert.deepEqual(buscarAtividades('atividade fora da lista'), []);
  const sugestao = await actions.salvarRespostaAction({businessId:row.id,qid:'ramo',texto:'Dentista',origem:'texto'});
  assert.equal(sugestao.ok,true);
  assert.equal(row.onboarding.respostas.ramo.origem,'texto');
  const outro = await actions.salvarRespostaAction({businessId:row.id,qid:'ramo',texto:'Restauração de instrumentos musicais',origem:'texto'});
  assert.equal(outro.ok,true);
  assert.equal(row.onboarding.respostas.ramo.texto,'Restauração de instrumentos musicais');
  const forjado = await actions.salvarRespostaAction({businessId:row.id,qid:'ramo',texto:'Dentista',origem:'chip'});
  assert.equal(forjado.ok,false);
});

test('briefing de tráfego guarda público declarado e lacuna sem inventar resultado', async () => {
  const antigo = structuredClone(row.onboarding.contas);
  assert.equal((await save('descricao','Sites institucionais, produção de conteúdo e design para pequenas empresas')).ok,true);
  assert.equal((await save('oferta','x')).ok,false);
  assert.equal((await save('oferta','Site institucional com até cinco páginas e formulário de contato')).ok,true);
  assert.equal((await save('publico','Pequenas lojas que vendem pelo WhatsApp e querem responder mais rápido')).ok,true);
  assert.equal((await save('motivo','Precisam apresentar produtos e receber contatos pelo site')).ok,true);
  assert.equal((await save('resultado','bom')).ok,false);
  assert.equal((await actions.salvarRespostaAction({businessId:row.id,qid:'resultado',texto:NAO_SEI_BRIEFING,origem:'chip'})).ok,true);
  assert.equal(lerBriefingDeTrafego(row.onboarding).publico.texto,'Pequenas lojas que vendem pelo WhatsApp e querem responder mais rápido');
  assert.equal(lerBriefingDeTrafego(row.onboarding).oferta.texto,'Site institucional com até cinco páginas e formulário de contato');
  assert.equal(lerBriefingDeTrafego(row.onboarding).motivo.estado,'informado');
  assert.equal(lerBriefingDeTrafego(row.onboarding).resultado.estado,'nao_sei');
  assert.deepEqual(row.onboarding.contas,antigo);
  assert.equal((await save('resultado','A loja recebe as mensagens organizadas e responde no mesmo dia')).ok,true);
  assert.equal((await save('diferencial','O cliente acompanha cada etapa da criação do site')).ok,true);
  assert.equal((await actions.salvarRespostaAction({businessId:row.id,qid:'prova',texto:'Ainda não tenho provas para enviar',origem:'chip'})).ok,true);
  assert.equal(lerBriefingDeTrafego(row.onboarding).prova.texto,'Ainda não tenho provas para enviar');
  assert.equal(lerBriefingDeTrafego(row.onboarding).resultado.estado,'informado');
});

test('corrigir praça para texto livre limpa apenas CEP que veio da resposta anterior', async () => {
  row.cep = '01310100'; row.city = 'São Paulo'; row.radius_km = 20;
  row.onboarding.respostas.praca = {texto:'Na cidade toda',echo:'São Paulo · Na cidade toda · CEP 01310-100',origem:'chip',cidade:'São Paulo',cep:'01310100',em:oldTime};
  assert.equal((await save('praca','Atendo clientes online')).ok, true);
  assert.equal(row.cep, null);
  assert.equal(row.city, null);
  assert.equal(row.onboarding.respostas.praca.cep, undefined);
});

test('corrigir praça sem CEP preserva CEP divergente alterado em outra tela', async () => {
  row.cep = '22222222';
  row.onboarding.respostas.praca = {texto:'Na cidade toda',echo:'São Paulo · Na cidade toda · CEP 01310-100',origem:'chip',cidade:'São Paulo',cep:'01310100',em:oldTime};
  assert.equal((await save('praca','Atendo clientes online')).ok, true);
  assert.equal(row.cep, '22222222');
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
  const result = await save();
  assert.equal(result.ok,false); assert.equal(result.recarregar,true);
  assert.deepEqual(row,before); assert.deepEqual(events,['campos']);
});
test('falha JSON não retorna sucesso nem dispara; coluna já gravada permanece', async () => {
  const before = structuredClone(row.onboarding); jsonFailure = true;
  const result = await save();
  assert.equal(result.ok,false); assert.equal(result.recarregar,true);
  assert.deepEqual(row.onboarding,before); assert.equal(row.name,'Nome corrigido');
  assert.deepEqual(events,['campos','json']);
  jsonFailure = false;
  const retomado = await actions.carregarEstadoAction();
  assert.equal(retomado.respostas.nome.texto,'Antes');
  assert.equal((await save()).ok,true);
  assert.equal(row.onboarding.respostas.nome.texto,'Nome corrigido');
});
test('sem sessão não grava', async () => {
  loggedIn = false; assert.equal((await save()).ok,false); assert.deepEqual(events,[]);
});
test('entradas inválidas não gravam nem disparam', async () => {
  for (const entrada of [
    {qid:'inexistente',texto:'abc',origem:'texto'}, {qid:'nome',texto:' ',origem:'texto'},
    {qid:'descricao',texto:'curta',origem:'texto'}, {qid:'nome',texto:'forjado',origem:'chip'},
    {qid:'praca',texto:'Na cidade toda',origem:'chip'}, {qid:'ramo',texto:'forjado',origem:'chip'},
    {qid:'praca',texto:'Na cidade toda',origem:'forjada'},
  ]) assert.equal((await actions.salvarRespostaAction({businessId:row.id,...entrada})).ok,false);
  assert.deepEqual(events,[]);
});
function pracaComRaio() {
  row.onboarding.respostas.praca = {texto:'Na cidade toda',origem:'chip',cidade:'Curitiba',
    echo:'Curitiba · Na cidade toda',em:oldTime};
  row.city = 'Curitiba'; row.radius_km = 25;
  row.procedencia.city = {origem:'confirmado',em:oldTime};
  row.procedencia.radius_km = {origem:'confirmado',em:oldTime};
}
test('praça livre retira cidade e raio derivados da escolha anterior, junto com procedência', async () => {
  pracaComRaio();
  const result = await save('praca','Atendo clientes em todo o Brasil');
  assert.equal(result.ok,true);
  assert.equal(row.city,null); assert.equal(row.radius_km,null);
  assert.equal(row.procedencia.city,undefined); assert.equal(row.procedencia.radius_km,undefined);
  assert.equal(row.onboarding.respostas.praca.texto,'Atendo clientes em todo o Brasil');
  assert.deepEqual(events,['esvaziar','json','revalidate:/onboarding','disparo']);
});
test('praça livre preserva valor divergente corrigido depois em outra tela', async () => {
  pracaComRaio(); row.city = 'Pinhais'; row.radius_km = 30;
  assert.equal((await save('praca','Atendo clientes em todo o Brasil')).ok,true);
  assert.equal(row.city,'Pinhais'); assert.equal(row.radius_km,30);
  assert.equal(events.includes('esvaziar'),false);
});
test('falha de limpeza da praça impede novo texto e pode ser retomada', async () => {
  pracaComRaio(); clearFailure = true;
  const result = await save('praca','Atendo clientes em todo o Brasil');
  assert.equal(result.ok,false); assert.equal(result.recarregar,true);
  assert.equal(row.onboarding.respostas.praca.origem,'chip');
  assert.deepEqual(events,['esvaziar']);
  clearFailure = false;
  assert.equal((await save('praca','Atendo clientes em todo o Brasil')).ok,true);
  assert.equal(row.city,null); assert.equal(row.radius_km,null);
});
test('falha do JSON após limpeza da praça retoma sem inventar município', async () => {
  pracaComRaio(); jsonFailure = true;
  assert.equal((await save('praca','Atendo clientes em todo o Brasil')).ok,false);
  assert.equal(row.city,null); assert.equal(row.radius_km,null);
  assert.equal(row.onboarding.respostas.praca.origem,'chip');
  jsonFailure = false;
  assert.equal((await save('praca','Atendo clientes em todo o Brasil')).ok,true);
  assert.equal(row.onboarding.respostas.praca.origem,'texto');
  assert.equal(row.city,null); assert.equal(row.radius_km,null);
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

test('ticket aceita não sei, sem inventar valor, e bloqueia repetição ou confirmação forjada', async () => {
  row.avg_ticket_min = null; row.avg_ticket_max = null;
  delete row.onboarding.contas.ticket;
  assert.equal((await saveConta({conta:'ticket',escolha:'100',confirmando:true})).ok,false);
  assert.deepEqual(events, []);
  const result = await saveConta({conta:'ticket',escolha:'',naoSei:true});
  assert.equal(result.ok, true);
  assert.equal(row.avg_ticket_min, null);
  assert.equal(row.avg_ticket_max, null);
  assert.equal(row.onboarding.contas.ticket.naoSei, true);
  assert.equal(result.estado.leituras.ticket.estado, 'nao_sei');
  assert.equal((await saveConta({conta:'ticket',escolha:'100'})).ok, false);
});
test('ticket não transforma faixa digitada em um valor enorme', async () => {
  row.avg_ticket_min = null; row.avg_ticket_max = null;
  delete row.onboarding.contas.ticket;
  for (const escolha of ['500-600', '500 a 600', 'R$ 500 / R$ 600']) {
    const result = await saveConta({conta:'ticket',escolha});
    assert.equal(result.ok,false);
    assert.match(result.erro,/único valor/);
    assert.deepEqual(events,[]);
  }
  const result = await saveConta({conta:'ticket',escolha:'R$ 500,50'});
  assert.equal(result.ok,true);
  assert.equal(row.avg_ticket_min,500.5);
  assert.equal(row.avg_ticket_max,500.5);
});
test('ticket parcialmente gravado não vira média falsa e retoma as duas colunas', async () => {
  row.avg_ticket_min = null;
  row.avg_ticket_max = 100;
  delete row.onboarding.contas.ticket;
  fieldFailureAfter = 1;
  const primeira = await saveConta({conta:'ticket',escolha:'R$ 300 a R$ 500'});
  assert.equal(primeira.ok,false);
  assert.equal(primeira.recarregar,true);
  assert.equal(row.avg_ticket_min,300);
  assert.equal(row.avg_ticket_max,100);
  assert.equal(row.onboarding.contas.ticket.emGravacao,true);
  const retomada = await contas.carregarContasAction();
  assert.equal(retomada.ticket,null);
  assert.equal(retomada.leituras.ticket.estado,'nao_perguntado');
  assert.equal(cadastro.montarCadastro(row).pendencias.some(p => p.campo === 'ticket_medio'),true);
  fieldFailureAfter = null;
  const segunda = await saveConta({conta:'ticket',escolha:'R$ 300 a R$ 500'});
  assert.equal(segunda.ok,true);
  assert.equal(segunda.estado.ticket,400);
  assert.equal(row.onboarding.contas.ticket.emGravacao,undefined);
  assert.equal(row.avg_ticket_max,500);
});
test('faixa aberta limpa teto antigo antes de confirmar ticket', async () => {
  row.avg_ticket_min = null;
  row.avg_ticket_max = 100;
  delete row.onboarding.contas.ticket;
  const result = await saveConta({conta:'ticket',escolha:'Acima de R$ 800'});
  assert.equal(result.ok,true);
  assert.equal(row.avg_ticket_min,800);
  assert.equal(row.avg_ticket_max,null);
  assert.equal(result.estado.ticket,800);
  assert.deepEqual(events.slice(0,4),['json','campos','esvaziar','json']);
});

test('custo só pode ser confirmado após estimativa registrada, inclusive na retomada', async () => {
  delete row.onboarding.contas.custo;
  assert.equal((await saveConta({conta:'custo',escolha:'50',confirmando:true})).ok,false);
  assert.deepEqual(events,[]);
  assert.equal((await saveConta({conta:'custo',escolha:'metade'})).ok,true);
  assert.equal(row.onboarding.contas.custo.calculado,50);
  assert.equal((await saveConta({conta:'custo',escolha:'50',confirmando:true})).ok,true);
  assert.equal(row.avg_direct_cost,50);
  assert.equal(row.onboarding.contas.custo.confirmado,true);
});

test('custo digitado em reais precisa de confirmação antes de virar coluna', async () => {
  delete row.onboarding.contas.custo;
  assert.equal((await saveConta({conta:'custo',escolha:'R$ 4,00'})).ok,true);
  assert.equal(row.avg_direct_cost,null);
  assert.equal(row.onboarding.contas.custo.calculado,4);
  assert.equal(row.onboarding.contas.custo.confirmado,false);
  assert.equal((await saveConta({conta:'custo',escolha:'4',confirmando:true})).ok,true);
  assert.equal(row.avg_direct_cost,4);
});

test('confirmação e não sei simultâneos não substituem a estimativa', async () => {
  const antes = structuredClone(row.onboarding.contas.lucro);
  assert.equal((await saveConta({conta:'lucro',escolha:'0',confirmando:true,naoSei:true})).ok,false);
  assert.deepEqual(row.onboarding.contas.lucro,antes);
  assert.deepEqual(events,[]);
});

test('falha da leitura posterior não transforma resposta já gravada em falha de gravação', async () => {
  row.avg_ticket_min = null; row.avg_ticket_max = null;
  delete row.onboarding.contas.ticket;
  failReadAt = 2;
  const resultado = await saveConta({conta:'ticket',escolha:'120'});
  assert.equal(resultado.ok,true);
  assert.equal(resultado.estado,undefined);
  assert.equal(row.avg_ticket_min,120);
  assert.equal(row.onboarding.contas.ticket.confirmado,true);
  assert.deepEqual(events,['json','campos','json','revalidate:/onboarding/contas','disparo']);
});

test('falha da leitura posterior preserva reabertura gravada para recarregar', async () => {
  delete row.onboarding.contas.custo.reabertoEm;
  failReadAt = 2;
  const resultado = await reabrirConta({conta:'custo'});
  assert.equal(resultado.ok,true);
  assert.equal(resultado.estado,undefined);
  assert.ok(row.onboarding.contas.custo.reabertoEm);
  assert.deepEqual(events,['json','revalidate:/onboarding/contas']);
});
test('contas sinaliza gravação incerta quando a coluna grava e o JSON falha', async () => {
  delete row.onboarding.contas.custo;
  assert.equal((await saveConta({conta:'custo',escolha:'metade'})).ok,true);
  jsonFailure = true;
  const result = await saveConta({conta:'custo',escolha:'50',confirmando:true});
  assert.equal(result.ok,false);
  assert.equal(result.recarregar,true);
  assert.equal(row.avg_direct_cost,50);
  assert.equal(row.onboarding.contas.custo.confirmado,false);
});
test('reabertura incerta exige releitura antes de novo envio', async () => {
  delete row.onboarding.contas.custo.reabertoEm;
  jsonFailure = true;
  const result = await reabrirConta({conta:'custo'});
  assert.equal(result.ok,false);
  assert.equal(result.recarregar,true);
  assert.equal(row.onboarding.contas.custo.reabertoEm,undefined);
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

test('cores confirmadas concluem marca sem exigir descrição livre', async () => {
  contasProntas();
  const result = await marca.salvarMarcaAction({...entradaMarca(),aparencia:'',coresConfirmadas:['#123456']});
  assert.equal(result.ok,true);
  assert.deepEqual(result.estado.marca.coresConfirmadas,['#123456']);
  assert.equal(result.estado.concluido,true);
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
test('conclusão isolada não mascara marca ausente ou incompleta na retomada', async () => {
  contasProntas();
  row.onboarding.conclusao = {em:oldTime,proximoPasso:'agendamento_pendente'};
  assert.equal((await marca.carregarMarcaAction()).concluido,false);
  row.onboarding.marca = {em:oldTime,aparencia:'',aparenciaNaoSei:false,siteNaoTenho:true};
  assert.equal((await marca.carregarMarcaAction()).concluido,false);
  row.onboarding.marca.aparenciaNaoSei = true;
  row.onboarding.marca.siteNaoTenho = false;
  assert.equal((await marca.carregarMarcaAction()).concluido,false);
  row.onboarding.marca.siteNaoTenho = true;
  assert.equal((await marca.carregarMarcaAction()).concluido,true);
  row.site_url = 'https://exemplo.com.br';
  assert.equal((await marca.carregarMarcaAction()).concluido,false);
  row.onboarding.marca.siteNaoTenho = false;
  assert.equal((await marca.carregarMarcaAction()).concluido,true);
  assert.deepEqual(events,[]);
});
test('cliente recupera declaração sem site inconsistente com endereço salvo', async () => {
  contasProntas();
  row.site_url = 'https://exemplo.com.br';
  row.onboarding.marca = {em:oldTime,aparencia:'Azul',aparenciaNaoSei:false,siteNaoTenho:true};
  row.onboarding.conclusao = {em:oldTime,proximoPasso:'agendamento_pendente'};
  assert.equal((await marca.carregarMarcaAction()).concluido,false);
  const result = await marca.salvarMarcaAction({...entradaMarca(),site:'https://exemplo.com.br'});
  assert.equal(result.ok,true);
  assert.equal(result.estado.concluido,true);
  assert.equal(row.onboarding.marca.siteNaoTenho,false);
  assert.equal(row.site_url,'https://exemplo.com.br');
});
test('cliente remove site antigo e Instagram pela etapa da marca com procedência limpa', async () => {
  contasProntas();
  row.site_url = 'https://exemplo.com.br';
  row.instagram_handle = '@exemplo';
  row.procedencia.site_url = {origem:'confirmado'};
  row.procedencia.instagram_handle = {origem:'confirmado'};
  const result = await marca.salvarMarcaAction({
    ...entradaMarca(), site:'', siteNaoTenho:true, instagram:'',
  });
  assert.equal(result.ok,true);
  assert.equal(result.estado.concluido,true);
  assert.equal(row.site_url,null);
  assert.equal(row.instagram_handle,null);
  assert.equal(row.procedencia.site_url,undefined);
  assert.equal(row.procedencia.instagram_handle,undefined);
  assert.equal(row.onboarding.marca.siteNaoTenho,true);
  assert.deepEqual(events.slice(0,2),['esvaziar','json']);
});
test('site apagado no campo sem marcar ausência não retorna sucesso falso', async () => {
  contasProntas();
  row.site_url = 'https://exemplo.com.br';
  const result = await marca.salvarMarcaAction({
    ...entradaMarca(), site:'', siteNaoTenho:false,
  });
  assert.equal(result.ok,false);
  assert.match(result.erro,/site ou marque/);
  assert.equal(row.site_url,'https://exemplo.com.br');
  assert.deepEqual(events,[]);
});
test('falha ao limpar site não conclui e falha posterior do JSON permite repetição', async () => {
  contasProntas();
  row.site_url = 'https://exemplo.com.br';
  const entrada = {...entradaMarca(),site:'',siteNaoTenho:true,instagram:''};
  clearFailure = true;
  assert.equal((await marca.salvarMarcaAction(entrada)).ok,false);
  assert.equal(row.site_url,'https://exemplo.com.br');
  assert.deepEqual(events,['esvaziar']);
  clearFailure = false;
  events = [];
  jsonFailure = true;
  assert.equal((await marca.salvarMarcaAction(entrada)).ok,false);
  assert.equal(row.site_url,null);
  assert.equal((await marca.carregarMarcaAction()).concluido,false);
  jsonFailure = false;
  events = [];
  assert.equal((await marca.salvarMarcaAction(entrada)).estado.concluido,true);
  assert.equal(row.onboarding.marca.siteNaoTenho,true);
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
test('marca relata gravação parcial e permite retomar após releitura', async () => {
  contasProntas();
  jsonFailure = true;
  const primeira = await marca.salvarMarcaAction(entradaMarca());
  assert.equal(primeira.ok,false);
  assert.equal(primeira.recarregar,true);
  assert.equal(row.site_url,'https://exemplo.com.br');
  assert.equal(row.instagram_handle,'@exemplo');
  assert.equal(row.onboarding.conclusao,undefined);
  jsonFailure = false;
  const retomada = await marca.carregarMarcaAction();
  assert.equal(retomada.site,'https://exemplo.com.br');
  const segunda = await marca.salvarMarcaAction(entradaMarca());
  assert.equal(segunda.ok,true);
  assert.equal(segunda.estado.concluido,true);
});
test('marca distingue gravação concluída de erro na leitura seguinte', async () => {
  contasProntas();
  failReadAt = 2;
  const result = await marca.salvarMarcaAction(entradaMarca());
  assert.equal(result.ok,true);
  assert.equal(result.estado,undefined);
  assert.equal(row.onboarding.marca.aparencia,'Azul escuro e fotos dos produtos');
  assert.equal((await marca.carregarMarcaAction()).concluido,true);
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
