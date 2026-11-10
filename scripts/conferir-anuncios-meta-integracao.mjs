// Integração contratual offline: Auth, RLS e fetch substituídos; nenhuma chamada real.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import * as contrato from '../lib/anuncios/contrato-meta.ts';
import * as periodo from '../lib/inicio/periodo.ts';
import * as retorno from '../lib/anuncios/retorno-login.ts';
import { ambienteTs } from './test-utils/ts-isolado.mjs';

const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
const janela={desde:'2026-10-28',ate:'2026-10-28'};
function carregar(arquivo,deps,extras={}) {
  const exports={};
  const codigo=ts.transpileModule(readFileSync(arquivo,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,
    target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(codigo,{exports,Intl,Date,URL,URLSearchParams,AbortSignal,FormData,...extras,require:id=>{
    if(!(id in deps))throw Error(`Import não permitido: ${id}`);return deps[id];
  }});
  return exports;
}
const erros=carregar('lib/backend/erros.ts',{'server-only':{}},{console:{error(){}}});
function corpo(business=A,conta='act_9001') {
  return {versao:'e28-meta-ads-read-v1',business_id:business,conta_id:conta,id_execucao:null,
    origem_vinculo:'ad_accounts',fonte:'meta_marketing_api',periodo:{...janela},moeda:'BRL',fuso:'America/Sao_Paulo',
    coletado_em:'2026-10-29T12:00:00Z',avisos:[],campanhas:[{id:'10001',nome:'Campanha FICTÍCIA',objetivo:'OUTCOME_LEADS',
      status_configurado:'ACTIVE',status_efetivo:'IN_PROCESS',metricas:{estado:'sem_dados',gasto_centavos:null,
        impressoes:null,cliques_totais:null,cliques_no_link:null,conversas_whatsapp:null,dias_com_observacao:[],
        entrega_observada_no_periodo:null,motivos:[]},conjuntos:[]}]};
}
const conta=(business=A,id='act_9001')=>({business_id:business,external_id:id,is_active:true,status:'ok'});
function bancada(cfg={}) {
  const consultas=[],requests=[],logs=[];
  const business=cfg.business??A, idConta=business===A?'act_9001':'act_9002';
  const env={V2G_BACKEND_URL:'https://backend.test',...cfg.env};
  const transporte=carregar('lib/backend/cliente.ts',{'server-only':{},'./erros':erros},{process:{env},console:{error:(...v)=>logs.push(v)},
    fetch:async(url,opts)=>{
      requests.push({url:new URL(url),opts});
      if(cfg.networkError)throw Error('REMOTE_PRIVATE_FAILURE');
      return new Response(cfg.invalidJson?'<html>REMOTE_PRIVATE</html>':JSON.stringify(cfg.http&&cfg.http!==200?
        {detail:{mensagem:'REMOTE_PRIVATE_TOKEN'}}:(cfg.raw??corpo(business,idConta))),{status:cfg.http??200});
    }});
  function query(tabela) {
    const q={select(cols){consultas.push(['select',tabela,cols]);return q;},
      eq(k,v){consultas.push(['eq',tabela,k,v]);return q;},order(){return q;},
      async maybeSingle(){return tabela==='manager_accounts'
        ? {data:cfg.assignment===null?null:cfg.assignment??{business_id:business,operator_profile_id:cfg.user?.id??'dono'},error:cfg.assignmentError?{}:null}
        : {data:cfg.noBusiness?null:{id:business,profile_id:cfg.owner??'dono'},error:cfg.dbError?{}:null};},
      async limit(){return {data:cfg.accounts??[conta(business,idConta)],error:cfg.dbError?{}:null};}};
    return q;
  }
  const cliente={auth:{
    getSession:async()=>({data:{session:cfg.noSession?null:{access_token:'synthetic.session.signature'}},error:null}),
    getUser:async(token)=>{assert.equal(token,'synthetic.session.signature');return {data:{user:cfg.invalidUser?null:cfg.user??{id:'dono',app_metadata:{}}},error:null};}
  },from:query};
  const modulo=carregar('lib/backend/anuncios-do-negocio.ts',{'server-only':{},
    '@/lib/supabase/server':{createClient:async()=>cliente},
    '@/lib/supabase/admin':{createAdminClient:()=>{consultas.push(['admin']);return {from:query};}},
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>cfg.ativo??{status:'selecionado',negocio:{id:business}}},
    './cliente':transporte,'@/lib/anuncios/contrato-meta':contrato},{process:{env}});
  return {ler:modulo.anunciosDoNegocioSelecionado,lerGestor:modulo.anunciosDoGestorAtribuido,requests,consultas,logs,transporte};
}

test('cliente comum: consulta coleção com JWT server-only, sem token de máquina nem execução',async()=>{
  const b=bancada();const r=await b.ler(janela);assert.equal(r.ok,true);assert.equal(r.dados.campanhas.length,1);
  const {url,opts}=b.requests[0];assert.equal(url.pathname,`/negocios/${A}/meta/campanhas`);
  assert.equal(opts.method,'GET');assert.equal(opts.cache,'no-store');assert.equal(opts.headers.Authorization,'Bearer synthetic.session.signature');
  assert.equal(opts.headers['X-V2G-Token'],undefined);assert.equal(url.searchParams.get('conta_id'),'act_9001');
  assert.equal(url.searchParams.get('desde'),janela.desde);assert.equal(url.searchParams.get('ate'),janela.ate);
  assert.deepEqual([...url.searchParams.keys()].sort(),['ate','conta_id','desde']);
  assert.ok(!JSON.stringify(r).includes('synthetic.session.signature'));
  assert.ok(b.consultas.some(c=>c[0]==='eq'&&c[1]==='businesses'&&c[2]==='profile_id'&&c[3]==='dono'));
  assert.ok(!b.consultas.some(c=>c[1]==='execucoes'||c[1]==='campaigns'));
});
test('Bearer humano não carrega token de máquina mesmo quando a variável existe',async()=>{
  const b=bancada({env:{V2G_BACKEND_TOKEN:'synthetic-machine-token'}});await b.ler(janela);
  assert.equal(b.requests[0].opts.headers['X-V2G-Token'],undefined);
  assert.ok(!JSON.stringify(b.logs).includes('synthetic-machine-token'));
});
test('transporte legado mantém token de máquina, cache e normalização existentes',async()=>{
  const b=bancada({env:{V2G_BACKEND_TOKEN:'synthetic-machine-token'}});
  await b.transporte.obter('/negocios/exemplo/consolidado');
  assert.equal(b.requests[0].opts.headers['X-V2G-Token'],'synthetic-machine-token');
  assert.equal(b.requests[0].opts.headers.Authorization,undefined);assert.equal(b.requests[0].opts.cache,'no-store');
});
for(const business of [A,B]) test(`negócio selecionado ${business[0]} usa somente sua conta; campos injetados não mudam a rota`,async()=>{
  const b=bancada({business});const r=await b.ler({...janela,businessId:business===A?B:A,profileId:'invasor',id_execucao:'nao-usar'});
  assert.equal(r.ok,true);assert.equal(r.dados.businessId,business);
  assert.equal(b.requests[0].url.pathname,`/negocios/${business}/meta/campanhas`);
  assert.equal(r.dados.contaId,business===A?'act_9001':'act_9002');
});
for(const [nome,cfg,motivo] of [
  ['sem sessão',{noSession:true},'acesso'],['JWT não validado',{invalidUser:true},'acesso'],
  ['seleção inválida',{ativo:{status:'selecao_invalida'}},'escopo'],
  ['negócio inacessível',{noBusiness:true},'escopo'],['proprietário diferente',{owner:'outra-pessoa'},'escopo'],
  ['falha RLS',{dbError:true},'indisponivel'],['conta de outro negócio',{accounts:[conta(B)]},'escopo'],
  ['conta inativa',{accounts:[{...conta(),is_active:false}]},'escopo'],
  ['conta repetida',{accounts:[conta(),conta()]},'escopo'],['sem conta vinculada',{accounts:[]},'sem_conta'],
]) test(`nega antes do HTTP: ${nome}`,async()=>{
  const b=bancada(cfg);const r=await b.ler(janela);assert.equal(r.ok,false);assert.equal(r.motivo,motivo);assert.equal(b.requests.length,0);
});
test('múltiplas contas exigem escolha explícita e mantêm os números sem consultar',async()=>{
  const b=bancada({accounts:[conta(),conta(A,'act_9003')]});const r=await b.ler(janela);
  assert.equal(r.motivo,'escolher_conta');assert.equal(r.contas.length,2);assert.equal(r.contaSelecionada,null);assert.equal(b.requests.length,0);
});
test('escolha autorizada consulta exatamente a segunda conta; nenhuma preferência pela V2G',async()=>{
  const b=bancada({accounts:[conta(),conta(A,'act_9003')],raw:corpo(A,'act_9003')});
  const r=await b.ler({...janela,contaId:'act_9003'});assert.equal(r.ok,true);
  assert.equal(b.requests[0].url.searchParams.get('conta_id'),'act_9003');assert.equal(r.contaSelecionada,'act_9003');
});
test('conta adulterada/inválida e janela longa não fazem GET',async()=>{
  for(const args of [{...janela,contaId:'act_7777'},{...janela,contaId:'https://bad.test'},
    {desde:'2026-09-01',ate:'2026-10-28'}]){
    const b=bancada();assert.equal((await b.ler(args)).ok,false);assert.equal(b.requests.length,0);
  }
});
for(const [http,motivo] of [[401,'acesso'],[403,'escopo'],[404,'escopo'],[409,'escopo'],[422,'periodo'],[424,'fonte'],[502,'indisponivel'],[503,'indisponivel']])
  test(`HTTP ${http}: normaliza sem repassar detalhe ou produzir zero`,async()=>{
    const b=bancada({http});const r=await b.ler(janela);assert.equal(r.ok,false);assert.equal(r.motivo,motivo);
    assert.ok(!JSON.stringify(r).includes('REMOTE_PRIVATE'));assert.ok(!('dados'in r));
  });
for(const [nome,cfg] of [['JSON ilegível',{invalidJson:true}],['rede',{networkError:true}],['configuração ausente',{env:{V2G_BACKEND_URL:undefined}}]])
  test(`falha ${nome}: permanece indisponível`,async()=>{const b=bancada(cfg);assert.equal((await b.ler(janela)).ok,false);});
test('resposta de outro negócio/conta é recusada apesar do GET autorizado',async()=>{
  for(const raw of [corpo(B),corpo(A,'act_9999')]){const b=bancada({raw});const r=await b.ler(janela);assert.equal(r.motivo,'resposta');assert.ok(!('dados'in r));}
});
test('descoberta vazia e múltiplas campanhas são sucessos, sem somar ou usar execução',async()=>{
  for(const quantidade of [0,2]){
    const raw=corpo();raw.campanhas=quantidade?[raw.campanhas[0],{...structuredClone(raw.campanhas[0]),id:'10002',nome:'Outra FICTÍCIA'}]:[];
    const r=await bancada({raw}).ler(janela);assert.equal(r.ok,true);assert.equal(r.dados.campanhas.length,quantidade);
  }
});

const moduloTela=carregar('app/(protected)/anuncios/AnunciosMeta.tsx',{'react/jsx-runtime':jsxRuntime,
  '@/components/ui/Pill':{Pill:({children})=>React.createElement('span',{},children)},
  '@/lib/inicio/periodo':periodo,'@/lib/anuncios/contrato-meta':contrato,'@/lib/anuncios/retorno-login':retorno,
  './anuncios-meta.module.css':{__esModule:true,default:new Proxy({},{get:(_,k)=>String(k)})}});
const UI=moduloTela.InventarioDeAnunciosMeta;

for (const gestor of [false, true]) test(`login da ${gestor ? 'mesa' : 'aba de cliente'} conserva conta mesmo quando a sessão falha antes de carregá-la`, async () => {
  const cfg = gestor ? { noSession: true, owner: '33333333-3333-4333-8333-333333333333',
    user: { id: 'operador-teste', app_metadata: { papel: 'operador' } },
    env: { V2G_MANAGER_WORK_ENABLED: 'true', V2G_MANAGER_METRICS_READ_ENABLED: 'true' } } : { noSession: true };
  const b = bancada(cfg);
  const args = { ...janela, contaId: 'act_9001' };
  const resultado = gestor ? await b.lerGestor({ businessId: A, ...args }) : await b.ler(args);
  assert.equal(resultado.motivo, 'acesso'); assert.equal(resultado.contaSelecionada, null);
  assert.equal(b.requests.length, 0);
  const html = renderToStaticMarkup(React.createElement(UI, { resultado, periodo: janela,
    contaSolicitada: 'act_9001', ...(gestor ? { negocioDoGestor: A } : {}) }));
  const href = html.match(/href="([^"]+)"[^>]*>Entrar novamente/)?.[1]?.replaceAll('&amp;', '&');
  assert.ok(href); const login = new URL(href, 'https://qa.example.invalid');
  const next = new URL(login.searchParams.get('next'), login);
  assert.equal(next.pathname, gestor ? '/supergestor' : '/anuncios');
  assert.equal(next.searchParams.get('conta'), 'act_9001');
  assert.equal(next.searchParams.get('desde'), janela.desde); assert.equal(next.searchParams.get('ate'), janela.ate);
  assert.equal(next.searchParams.get('metricas'), gestor ? A : null);
  assert.equal(login.searchParams.get('adicionar'), '1');
  assert.doesNotMatch(href, /synthetic|Bearer|profile_id|business_id/);
});

for (const estado of ['zero_medido', 'observado']) test(`HTTP 200 contraditório em ${estado} não preenche números completos na tela`, async () => {
  for (const lacuna of ['cobertura', 'fuso']) {
    const raw = corpo(); const periodo = { desde: '2026-10-27', ate: '2026-10-28' };
    raw.periodo = periodo;
    Object.assign(raw.campanhas[0].metricas, { estado, gasto_centavos: 0, impressoes: 0, cliques_totais: 0,
      dias_com_observacao: lacuna === 'cobertura' ? ['2026-10-28'] : ['2026-10-27', '2026-10-28'],
      entrega_observada_no_periodo: false });
    if (lacuna === 'fuso') raw.fuso = null;
    const r = await bancada({ raw }).ler(periodo);
    assert.equal(r.ok, false); assert.equal(r.motivo, 'resposta'); assert.ok(!('dados' in r));
    const html = renderToStaticMarkup(React.createElement(UI, { resultado: r, periodo }));
    assert.doesNotMatch(html, /Zero medido neste período|R\$|Campanha FICTÍCIA/);
  }
});

const owner='33333333-3333-4333-8333-333333333333';
const operador={id:'operador-teste',app_metadata:{papel:'operador'}};
const flags={V2G_MANAGER_WORK_ENABLED:'true',V2G_MANAGER_METRICS_READ_ENABLED:'true'};
for(const business of [A,B]) test(`N26: operador atribuído ao negócio ${business[0]} usa descoberta sem executar gerador`,async()=>{
  const b=bancada({business,owner,user:operador,env:flags});
  const r=await b.lerGestor({businessId:business,...janela});assert.equal(r.ok,true);assert.equal(r.dados.businessId,business);
  assert.equal(b.requests[0].url.pathname,`/negocios/${business}/meta/campanhas`);
  assert.ok(b.consultas.findIndex(c=>c[0]==='select'&&c[1]==='manager_accounts')<b.consultas.findIndex(c=>c[0]==='select'&&c[1]==='ad_accounts'));
  assert.ok(!JSON.stringify(r).includes('synthetic.session.signature'));
});
test('N26: cliente e operador recebem os mesmos objetos, período, moeda e estado',async()=>{
  const cliente=await bancada().ler(janela);
  const gestor=await bancada({owner,user:operador,env:flags}).lerGestor({businessId:A,...janela});
  assert.equal(gestor.ok,true);assert.deepEqual(JSON.parse(JSON.stringify(gestor.dados)),JSON.parse(JSON.stringify(cliente.dados)));
  const h1=renderToStaticMarkup(React.createElement(UI,{resultado:cliente,periodo:janela}));
  const h2=renderToStaticMarkup(React.createElement(UI,{resultado:gestor,periodo:janela,negocioDoGestor:A}));
  assert.equal(h1,h2);assert.match(h2,/Moeda da conta: BRL/);
});
test('N26: mesa não usa a seleção de negócio do aplicativo do cliente',async()=>{
  const b=bancada({owner,user:operador,env:flags,ativo:{status:'selecionado',negocio:{id:B}}});
  const r=await b.lerGestor({businessId:A,...janela});assert.equal(r.ok,true);assert.equal(r.dados.businessId,A);
});
for(const estado of ['sem_dados','zero_medido','observado','parcial']) test(`N26: paridade cliente/gestor em ${estado}, inclusive moeda diferente de BRL`,async()=>{
  const raw=corpo();raw.moeda='AUD';const m=raw.campanhas[0].metricas;
  if(estado!=='sem_dados')Object.assign(m,{estado,gasto_centavos:estado==='zero_medido'?0:250,
    impressoes:estado==='zero_medido'?0:100,cliques_totais:estado==='zero_medido'?0:5,
    dias_com_observacao:['2026-10-28'],entrega_observada_no_periodo:estado!=='zero_medido'});
  const cliente=await bancada({raw}).ler(janela);
  const gestor=await bancada({raw,owner,user:operador,env:flags}).lerGestor({businessId:A,...janela});
  assert.equal(cliente.ok,true);assert.equal(gestor.ok,true);
  assert.equal(JSON.stringify(cliente.dados),JSON.stringify(gestor.dados));
  const html=renderToStaticMarkup(React.createElement(UI,{resultado:gestor,periodo:janela,negocioDoGestor:A}));
  assert.match(html,/Moeda da conta: AUD/);assert.ok(!JSON.stringify(gestor.dados.periodo).includes('businessId'));
});
test('N26: componente da mesa encaminha recorte explícito e respeita default OFF',async()=>{
  const resposta=await bancada({owner,user:operador,env:flags}).lerGestor({businessId:A,...janela});
  const chamadas=[];
  function wrapper(env,leitura=resposta){return carregar('components/gestor/leitura/LeituraDaConta.tsx',{
    'server-only':{},'react/jsx-runtime':jsxRuntime,
    '@/lib/backend/anuncios-do-negocio':{anunciosDoGestorAtribuido:async a=>{chamadas.push(a);return leitura;}},
    '@/app/(protected)/anuncios/AnunciosMeta':moduloTela,
    '@/app/(protected)/inicio/SeletorDePeriodo':{SeletorDePeriodo:()=>React.createElement('div',{},'Seletor de período')},
  },{process:{env}}).LeituraDaConta;}
  const args={businessId:A,nome:'Cliente fictício',intervalo:{...janela,hoje:'2026-11-04'},contaId:'act_9001'};
  assert.equal(await wrapper({})(args),null);assert.equal(chamadas.length,0);
  const elemento=await wrapper(flags)(args);const html=renderToStaticMarkup(elemento);
  assert.equal(chamadas[0].desde,janela.desde);assert.equal(chamadas[0].ate,janela.ate);assert.equal(chamadas[0].contaId,'act_9001');
  assert.match(html,/Cliente fictício/);assert.match(html,/Campanha FICTÍCIA/);
  const acesso={ok:false,motivo:'acesso',mensagem:'Entre novamente.',contas:[],contaSelecionada:null};
  const h=renderToStaticMarkup(await wrapper(flags,acesso)(args));
  const href=h.match(/href="([^"]+)"[^>]*>Entrar novamente/)?.[1]?.replaceAll('&amp;','&');
  assert.ok(href);const login=new URL(href,'https://qa.example.invalid');
  const next=new URL(login.searchParams.get('next'),login);
  assert.equal(next.pathname,'/supergestor');assert.equal(next.searchParams.get('conta'),'act_9001');
  assert.equal(next.searchParams.get('metricas'),A);assert.equal(next.searchParams.get('desde'),janela.desde);
  const pagina=readFileSync('app/(protected)/gestor/page.tsx','utf8');
  assert.match(pagina,/intervaloDoInicio\(parametros, diaEmSaoPaulo/);assert.doesNotMatch(pagina,/intervaloMesa\(/);
});
for(const [nome,cfg] of [
  ['sem papel',{user:{id:'operador-teste',app_metadata:{}}}],
  ['papel forjado',{user:{id:'operador-teste',app_metadata:{},user_metadata:{papel:'operador'}}}],
  ['sem atribuição',{assignment:null}],['atribuição de B',{assignment:{business_id:B,operator_profile_id:operador.id}}],
  ['atribuição de outro operador',{assignment:{business_id:A,operator_profile_id:'outro'}}],
  ['erro da atribuição',{assignmentError:true}],['flag OFF',{env:{...flags,V2G_MANAGER_METRICS_READ_ENABLED:'false'}}],
]) test(`N26: gestor ${nome} não lê contas nem chama backend`,async()=>{
  const b=bancada({owner,user:operador,env:flags,...cfg});const r=await b.lerGestor({businessId:A,...janela});
  assert.equal(r.ok,false);assert.equal(b.requests.length,0);assert.ok(!b.consultas.some(c=>c[0]==='select'&&c[1]==='ad_accounts'));
});
test('N26: identificador inválido não desvia o gestor para o caminho de cliente',async()=>{
  for(const businessId of [null,undefined,'outro']){const b=bancada();assert.equal((await b.lerGestor({businessId,...janela})).ok,false);assert.equal(b.requests.length,0);}
});
test('N26: falha da fonte afeta igualmente cliente e operador, sem números de outra leitura',async()=>{
  for(const http of [401,404,409,424,503]){
    const cliente=await bancada({http}).ler(janela);
    const gestor=await bancada({http,owner,user:operador,env:flags}).lerGestor({businessId:A,...janela});
    assert.equal(cliente.ok,false);assert.equal(gestor.motivo,cliente.motivo);assert.ok(!('dados'in gestor));
  }
});
test('N26: ACTIVE e entrega positiva no período não viram afirmação de veiculação atual',async()=>{
  const raw=corpo();raw.campanhas[0].status_efetivo='ACTIVE';Object.assign(raw.campanhas[0].metricas,{
    estado:'observado',gasto_centavos:250,impressoes:100,cliques_totais:5,dias_com_observacao:['2026-10-28'],entrega_observada_no_periodo:true});
  const r=await bancada({raw,owner,user:operador,env:flags}).lerGestor({businessId:A,...janela});assert.equal(r.ok,true);
  const html=renderToStaticMarkup(React.createElement(UI,{resultado:r,periodo:janela,negocioDoGestor:A}));
  assert.match(html,/Ativado na Meta/);assert.match(html,/R\$.*2,50/);assert.doesNotMatch(html,/>No ar</);
});
test('N26: formulário do gestor mantém negócio/período e conta inválida permite recuperação explícita',async()=>{
  const r=await bancada({accounts:[conta(),conta(A,'act_9003')],owner,user:operador,env:flags}).lerGestor({businessId:A,...janela});
  const html=renderToStaticMarkup(React.createElement(UI,{resultado:r,periodo:janela,negocioDoGestor:A}));
  assert.match(html,/action="\/supergestor"/);assert.match(html,/name="metricas"/);assert.ok(html.includes(A));assert.match(html,/name="desde"/);
  const erro=await bancada().ler({...janela,contaId:'act_9999'});
  assert.match(renderToStaticMarkup(React.createElement(UI,{resultado:erro,periodo:janela})),/Consultar conta/);
});
test('inventário sem métricas continua visível; vazio não usa zero',async()=>{
  const r=await bancada().ler(janela);const html=renderToStaticMarkup(React.createElement(UI,{resultado:r,periodo:janela}));
  assert.match(html,/Campanha FICTÍCIA/);assert.match(html,/Sem medições/);assert.match(html,/Não medido/);assert.doesNotMatch(html,/R\$/);
  const vazio=corpo();vazio.campanhas=[];const rv=await bancada({raw:vazio}).ler(janela);
  const hv=renderToStaticMarkup(React.createElement(UI,{resultado:rv,periodo:janela}));assert.match(hv,/não retornou campanhas/);
});
test('zero observado atravessa HTTP, parser e coleção sem zerar conversas desconhecidas',async()=>{
  const raw=corpo();Object.assign(raw.campanhas[0].metricas,{estado:'zero_medido',gasto_centavos:0,
    impressoes:0,cliques_totais:0,dias_com_observacao:['2026-10-28'],entrega_observada_no_periodo:false});
  const r=await bancada({raw}).ler(janela);assert.equal(r.ok,true);
  const html=renderToStaticMarkup(React.createElement(UI,{resultado:r,periodo:janela}));
  assert.match(html,/Zero medido neste período/);assert.match(html,/R\$.*0,00/);
  assert.match(html,/Conversas no WhatsApp<\/dt><dd class="ausente">Não medido/);
});
test('formulário de contas preserva somente período/conta; nenhum segredo vai para HTML',async()=>{
  const r=await bancada({accounts:[conta(),conta(A,'act_9003')]}).ler(janela);
  const html=renderToStaticMarkup(React.createElement(UI,{resultado:r,periodo:janela}));
  assert.match(html,/method="get"/);assert.match(html,/name="conta"/);assert.match(html,/act_9003/);assert.match(html,/name="desde"/);
  assert.doesNotMatch(html,/synthetic|profile_id|business_id|name="token"/);
});
test('entrega observada aceita gasto positivo com impressões desconhecidas, sem afirmar agora',()=>{
  const raw=corpo();Object.assign(raw.campanhas[0].metricas,{estado:'parcial',gasto_centavos:100,
    dias_com_observacao:['2026-10-28'],entrega_observada_no_periodo:true});
  assert.ok(contrato.lerInventarioMeta(raw,{businessId:A,contaId:'act_9001',periodo:janela}));
  raw.campanhas[0].metricas.entrega_observada_no_periodo=false;
  assert.equal(contrato.lerInventarioMeta(raw,{businessId:A,contaId:'act_9001',periodo:janela}),null);
});

async function pagina({meta,legado={estado:'sem-execucao',campanhas:[]},busca={}}) {
  const calls=[];const leve=({children})=>React.createElement('div',{},children);
  const data={id:'dono'};
  const q={select(){return q;},eq(){return q;},order:async()=>({data:[]})};
  const imports={'react/jsx-runtime':jsxRuntime,'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:data}})},from:()=>q})},
    '@/lib/piloto-qa/acesso':{pilotoQaHabilitado:()=>false},
    '@/lib/agencia/contexto':ambienteTs().load('lib/agencia/contexto.ts'),
    './HistoricoSemRodadas':carregar('app/(protected)/anuncios/HistoricoSemRodadas.tsx',{'react/jsx-runtime':jsxRuntime}),
    '@/components/ui/FaixaReconectar':{FaixaReconectar:leve},'@/components/ui/Pill':{Pill:leve},
    '@/lib/estado/cliente':{estadoDoCliente:async()=>({negocioId:A,proximo:null,melhoras:{fotos:0},veiculacao:'nao_sabemos'})},
    '@/lib/criativos/peca':{COLUNAS_DO_JULGAMENTO:'uso,status,arquivado_em',foiReprovada:()=>false},
    '@/components/ui/HeroDaEtapa':{HeroDaEtapa:leve},'@/lib/resultado/do-negocio':{resultadoDoNegocio:async a=>{calls.push(a);return legado;}},
    '@/lib/formato':{diaPorExtenso:v=>v},'@/lib/veiculacao/estado':{fraseDeVeiculacao:()=> 'Situação histórica'},
    '@/lib/titulos':{tituloDaAba:()=>({})},'./PainelDeAnuncios':{PainelDeAnuncios:({anuncios})=>React.createElement('p',{},anuncios.map(a=>a.nome).join(', '))},
    '@/lib/inicio/periodo':periodo,'@/lib/dia-seguinte/dia':{diaEmSaoPaulo:()=> '2026-10-29'},
    '../inicio/SeletorDePeriodo':{SeletorDePeriodo:leve},'./AtualizacaoDaConsulta':{AtualizacaoDaConsulta:leve},
    '@/lib/backend':{anunciosDoNegocioSelecionado:async()=>meta},'./AnunciosMeta':moduloTela};
  const modulo=carregar('app/(protected)/anuncios/page.tsx',imports);
  const elemento=await modulo.default({searchParams:Promise.resolve({...janela,business_id:B,idExecucao:'invasora',...busca})});
  return {html:renderToStaticMarkup(elemento),calls};
}
test('/anuncios sem execução mostra inventário manual e não o falso primeiro-anúncio-vazio',async()=>{
  const meta=await bancada().ler(janela);const p=await pagina({meta});assert.match(p.html,/Campanha FICTÍCIA/);
  assert.doesNotMatch(p.html,/Seu primeiro anúncio ainda não existe/);assert.equal(p.calls[0].businessId,A);assert.equal(p.calls[0].profileId,'dono');
});

test('/anuncios real passa a conta solicitada ao retorno de login mesmo sem inventário carregado', async () => {
  const meta = await bancada({ noSession: true }).ler({ ...janela, contaId: 'act_9003' });
  const p = await pagina({ meta, busca: { conta: 'act_9003' } });
  const href = p.html.match(/href="([^"]+)"[^>]*>Entrar novamente/)?.[1]?.replaceAll('&amp;', '&');
  assert.ok(href);
  const next = new URL(new URL(href, 'https://qa.example.invalid').searchParams.get('next'), 'https://qa.example.invalid');
  assert.equal(next.searchParams.get('conta'), 'act_9003');
  assert.equal(next.searchParams.get('desde'), janela.desde); assert.equal(next.searchParams.get('ate'), janela.ate);
});
test('/anuncios mantém legado quando nova leitura falha, identificado como histórico',async()=>{
  const meta=await bancada({http:503}).ler(janela);const valor={texto:'0',ausente:false};
  const legado={estado:'com-campanhas',campanhas:[{idExecucao:'exec-legada',nome:'Rodada ANTIGA',estado:'com-dado',canal:'meta',resultado:{
    periodo:janela,bloco:{investido:valor,cliques:valor,impressoes:valor,pessoas:valor},nivelFrase:'Leitura histórica'}}],
    moedasMisturadas:false,moedas:['BRL'],doDono:null};
  const p=await pagina({meta,legado});assert.match(p.html,/Rodada ANTIGA/);assert.match(p.html,/Histórico por rodada/);
  assert.match(p.html,/Não conseguimos consultar os anúncios agora/);assert.doesNotMatch(p.html,/Seu primeiro anúncio ainda não existe/);
});
