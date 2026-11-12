import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const A='11111111-1111-4111-8111-111111111111',F='22222222-2222-4222-8222-222222222222';
const U='33333333-3333-4333-8333-333333333333',V='44444444-4444-4444-8444-444444444444';
const R='55555555-5555-4555-8555-555555555555',S='66666666-6666-4666-8666-666666666666';
const css={default:new Proxy({},{get:(_,k)=>k})};
const load=ambienteTs().load;
const {conferirVinculos,ampliarCarteiraQa,raizDaAgencia}=load('lib/agencia/vinculos.ts');
const {contextoDoAnuncianteVinculado}=load('lib/agencia/contexto.ts');
const links=()=>[A,F].map((id,i)=>({agency_business_id:A,advertiser_business_id:id,owner_profile_id:U,advertiser_name:i?'FamFire de ensaio':'Dúú de ensaio',legacy_shared_business:!i,revoked_at:null}));
const businesses=()=>[A,F].map((id,i)=>({id,profile_id:U,name:i?'FamFire de ensaio':'Agência de ensaio',monthly_budget:i?null:3000,
  created_at:i?'2026-11-10T00:00:00Z':'2026-10-01T00:00:00Z',onboarding:{versao:2,respostas:{
    nome:{texto:i?'FamFire de ensaio':'Dúú de ensaio'},contratante:{texto:'Agência de ensaio'},operador:{texto:'Uma agência ou gestor opera para o anunciante'},
    ...(!i?{praca:{texto:'Praça exclusiva Dúú'},ramo:{texto:'Bebidas'}}:{}),
  }}}));
const contextos=()=>businesses().map((b,i)=>contextoDoAnuncianteVinculado(b,U,links()[i],'Agência de ensaio'));

test('duas relações explícitas preservam a ponte histórica e não copiam dados operacionais',()=>{
  const l=links(),b=businesses(),antes=JSON.stringify(b);assert.equal(conferirVinculos(l,U).length,2);
  assert.equal(raizDaAgencia(l,F),A);const cs=contextos();
  assert.equal(cs[0].praca,'Praça exclusiva Dúú');assert.equal(cs[0].verbaMensal,3000);
  assert.equal(cs[1].praca,null);assert.equal(cs[1].ramo,null);assert.equal(cs[1].verbaMensal,null);
  assert.equal(cs[1].agencyBusinessId,A);assert.equal(JSON.stringify(b),antes);
});
for(const [nome,mudar]of [
  ['outro titular',l=>l[1].owner_profile_id=V],['revogação',l=>l[1].revoked_at='2026-11-10'],
  ['duplicidade',l=>l.push({...l[1]})],['pai forjado',l=>l[1].agency_business_id='nome parecido'],
  ['auto vínculo não declarado',l=>l[0].legacy_shared_business=false],['ciclo',l=>l[0]={...l[0],agency_business_id:F,legacy_shared_business:false}],
  ['nome vazio',l=>l[1].advertiser_name=' '],['limite incompleto',l=>l.push(...Array(500).fill(l[1]))],
])test('relações inválidas fecham o acesso: '+nome,()=>{const l=links();mudar(l);assert.equal(conferirVinculos(l,U),null);});

test('elegibilidade de preparação exige pai piloto ainda liberado, filho próprio e ausência de pedido',()=>{
  const base={negocios:businesses(),liberados:[{id:A,name:'Agência de ensaio'}],vinculos:links(),paisPiloto:[A],negociosComPedido:[]};
  assert.deepEqual(ampliarCarteiraQa(base).map(b=>b.id),[A,F]);
  for(const x of [{paisPiloto:[]},{negociosComPedido:[F]},{vinculos:[]},{negocios:[businesses()[0]]}])
    assert.deepEqual(ampliarCarteiraQa({...base,...x}).map(b=>b.id),[A]);
  assert.deepEqual(ampliarCarteiraQa({...base,liberados:[]}).map(b=>b.id),[]);
});

function banco({user={id:U},ativo=A,vinculos=links(),rows=businesses(),linkError=null,injectOther=false,ownerError=false,
  grants=[{business_id:A,profile_id:U,revoked_at:null,expires_at:new Date(Date.now()+3600000).toISOString()}],orders=[]}={}){
  const calls=[],signed=[],cookie=[],redirects=[];
  const reviews=[A,F].map((id,i)=>({id:i?S:R,business_id:id,original_name:i?'Peça só FamFire':'Peça só Dúú',file_path:`${id}/${i?S:R}`,
    sha256:(i?'b':'a').repeat(64),status:'approved_for_manual_publish',review_note:null,upload_intent:null,created_at:'2026-11-09T12:00:00Z',reviewed_at:'2026-11-09T13:00:00Z'}));
  const query=table=>{
    const filters=[];let one=false,columns='';const q={
      select(c){columns=c;return q;},eq(k,v){filters.push([k,v]);return q;},in(k,v){filters.push([k,v]);return q;},is(k,v){filters.push([k,v]);return q;},
      order(){return q;},limit(){return q;},maybeSingle(){one=true;return Promise.resolve(result());},
      gt(k,v){filters.push([k,{gt:v}]);return q;},range(){return Promise.resolve(result());},
      then(resolve,reject){return Promise.resolve(result()).then(resolve,reject);},
    };
    function result(){
      calls.push({table,columns,filters:[...filters]});let error=null;
      let data=table==='businesses'?rows:table==='agency_advertisers'?vinculos:table==='creative_review_requests'?reviews:
        table==='manager_accounts'?[{business_id:A,operator_profile_id:V}]:table==='profiles'?[{id:V,full_name:'Gestor somente Dúú'}]:
        table==='qa_pilot_access'?grants:table==='commercial_orders'?orders:table==='webapp_legacy_access'?[{profile_id:U,granted_at:'2026-10-06T00:00:00Z'}]:[];
      if(table==='agency_advertisers')error=linkError;
      if(table==='businesses'&&ownerError)error={code:'57014'};
      data=data.filter(r=>filters.every(([k,v])=>Array.isArray(v)?v.includes(r[k]):v&&typeof v==='object'&&'gt'in v?r[k]>v.gt:r[k]===v));
      if(injectOther&&table==='creative_review_requests')data=[...data,...reviews.filter(r=>!data.includes(r))];
      return {data:one?data[0]??null:data,error};
    }return q;
  };
  const supabase={auth:{getUser:async()=>({data:{user},error:null})},from:query};
  const admin={from:query,storage:{from:bucket=>({createSignedUrls:async paths=>{signed.push(...paths.map(path=>({bucket,path})));return {data:paths.map(path=>({path,signedUrl:'https://private.invalid/'+encodeURIComponent(path)})),error:null};}})}};
  const access={status:'selecionado',negocio:{id:ativo},negocios:rows.map(({id,name})=>({id,name}))};
  const ports={react:{...React,cache:fn=>fn},'@/lib/supabase/server':{createClient:async()=>supabase},'@/lib/supabase/admin':{createAdminClient:()=>admin},
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>access,COOKIE_NEGOCIO_ATIVO:'v2g_negocio_ativo'},
    '@/lib/piloto-qa/acesso':{pilotoQaHabilitado:()=>true},
    'next/headers':{cookies:async()=>({get:()=>({value:ativo}),set:(...args)=>cookie.push(args)})},'next/cache':{revalidatePath:()=>{}},
    'next/navigation':{redirect:href=>{redirects.push(href);throw Error('REDIRECT');}},
  };
  return {calls,signed,access,cookie,redirects,ports,mod:ambienteTs({ports}),reviews};
}

test('carteira autenticada carrega dois anunciantes e gestor é conferido por negócio',async()=>{
  for(const ativo of [A,F]){
    const db=banco({ativo});const r=await db.mod.load('lib/agencia/da-sessao.ts').carregarAgenciaDaSessao();
    assert.equal(r.status,'agencia');assert.equal(r.agencyBusinessId,A);assert.equal(r.contexto.businessId,ativo);
    assert.equal(r.clientes.length,2);assert.equal(r.clientes.find(c=>c.businessId===A).gestor,'Gestor somente Dúú');
    assert.equal(r.clientes.find(c=>c.businessId===F).gestor,null);
    for(const q of db.calls.filter(q=>q.table==='businesses'))assert.ok(q.filters.some(([k,v])=>k==='profile_id'&&v===U));
  }
});

test('tabela ainda não instalada conserva Dúú; erro real não vira carteira legada',async()=>{
  for(const code of ['PGRST205','42P01']){
    const db=banco({linkError:{code}});const r=await db.mod.load('lib/agencia/da-sessao.ts').carregarAgenciaDaSessao();
    assert.equal(r.status,'agencia');assert.equal(r.origem,'legado');assert.equal(r.clientes.length,1);
  }
  const db=banco({linkError:{code:'42501'}});assert.equal((await db.mod.load('lib/agencia/da-sessao.ts').carregarAgenciaDaSessao()).status,'indisponivel');
  assert.equal(db.calls.some(c=>c.table==='manager_accounts'),false);
});

test('negócio não liberado fica fora da carteira e titular divergente fecha a leitura',async()=>{
  const extra=banco({vinculos:[...links(),{...links()[1],advertiser_business_id:S}]});
  const r=await extra.mod.load('lib/agencia/da-sessao.ts').carregarAgenciaDaSessao();
  assert.equal(r.status,'agencia');assert.equal(r.clientes.some(c=>c.businessId===S),false);
  const estrangeiro=banco({rows:[businesses()[0],{...businesses()[1],profile_id:V}]});
  assert.equal((await estrangeiro.mod.load('lib/agencia/da-sessao.ts').carregarAgenciaDaSessao()).status,'indisponivel');
  const db=banco();db.access.negocios=[{id:F,name:'Filho sem pai liberado'}];
  assert.equal((await db.mod.load('lib/agencia/da-sessao.ts').carregarAgenciaDaSessao()).status,'indisponivel');
});

test('galerias reais separam nomes, hashes e assinaturas por anunciante',async()=>{
  const db=banco(),galeria=db.mod.load('lib/criativos/galeria-da-sessao.ts');
  for(const [i,id]of [A,F].entries()){
    const r=await galeria.carregarGaleriaDoNegocio(id,{revisaoHabilitada:true,geracaoHabilitada:false,contextoAgencia:contextos()[i]});
    assert.equal(r.itens.length,1);assert.equal(r.itens[0].nome,i?'Peça só FamFire':'Peça só Dúú');
    assert.match(r.itens[0].acao.href,new RegExp('cliente='+id));assert.equal(r.falhaDaGaleria,false);
    assert.ok(db.signed.at(-1).path.startsWith(id+'/'));
  }
  assert.deepEqual(db.signed.map(x=>x.path),[`${A}/${R}`,`${F}/${S}`]);
});

test('resposta cruzada não assina arquivo alheio; ausência de titular não consulta biblioteca',async()=>{
  const db=banco({injectOther:true});const r=await db.mod.load('lib/criativos/galeria-da-sessao.ts').carregarGaleriaDoNegocio(F,{revisaoHabilitada:true,geracaoHabilitada:false,contextoAgencia:contextos()[1]});
  assert.equal(r.revisaoInconsistente,true);assert.equal(r.itens.length,1);assert.ok(db.signed.every(x=>x.path.startsWith(F+'/')));
  const negado=banco({user:{id:V}});const g=await negado.mod.load('lib/criativos/galeria-da-sessao.ts').carregarGaleriaDoNegocio(F,{revisaoHabilitada:true,geracaoHabilitada:false});
  assert.equal(g.falhaDaGaleria,true);assert.equal(negado.signed.length,0);assert.equal(negado.calls.some(x=>x.table==='creative_review_requests'),false);
});

const form=(override={})=>{const f=new FormData();for(const[k,v]of Object.entries({cliente:F,agencia:A,area:'/criativos',busca_carteira:'foto & família',pagina_carteira:'2',...override}))f.set(k,v);return f;};
test('abrir cliente é POST autorizado: muda só preferência, destino local e conserva filtros',async()=>{
  const db=banco();const {abrirClienteAction}=db.mod.load('app/(protected)/agencia/actions.ts');
  await assert.rejects(abrirClienteAction({},form()),/REDIRECT/);
  assert.equal(db.cookie.length,1);assert.equal(db.cookie[0][1],F);assert.equal(db.cookie[0][2].httpOnly,true);
  const url=new URL(db.redirects[0],'https://qa.invalid');assert.equal(url.pathname,'/criativos');assert.equal(url.searchParams.get('cliente'),F);
  assert.equal(url.searchParams.get('busca_carteira'),'foto & família');assert.equal(url.searchParams.get('pagina_carteira'),'2');
});
test('POST forjado, cliente de outra agência e revogação não alteram cookies',async()=>{
  for(const override of [{cliente:S},{agencia:V},{area:'https://fora.invalid'},{cliente:''},{peca:'revisao-inexistente'},{peca:'peca-'+R,area:'/inicio'}]){
    const db=banco(),r=await db.mod.load('app/(protected)/agencia/actions.ts').abrirClienteAction({},form(override));assert.ok(r.erro);assert.equal(db.cookie.length,0);
  }
  const db=banco({vinculos:[links()[0]]}),r=await db.mod.load('app/(protected)/agencia/actions.ts').abrirClienteAction({},form());
  assert.ok(r.erro);assert.equal(db.cookie.length,0);
  const duplicado=banco(),f=form();f.append('cliente',A);
  assert.ok((await duplicado.mod.load('app/(protected)/agencia/actions.ts').abrirClienteAction({},f)).erro);assert.equal(duplicado.cookie.length,0);
});

test('componente de abertura mantém cliente atual como link e outro cliente como formulário validado',()=>{
  const {AbrirCliente}=ambienteTs().load('components/agencia/AbrirCliente.tsx');const action=async()=>({});
  const props={ativoId:A,retorno:{busca:'',pendentes:false,pagina:1},acao:action,children:'Abrir cliente'};
  const a=renderToStaticMarkup(React.createElement(AbrirCliente,{...props,contexto:contextos()[0]}));
  const f=renderToStaticMarkup(React.createElement(AbrirCliente,{...props,contexto:contextos()[1]}));
  assert.match(a,/<a /);assert.doesNotMatch(a,/<form/);assert.match(f,/<form/);assert.match(f,new RegExp(`name="agencia" value="${A}"`));assert.match(f,new RegExp(`name="cliente" value="${F}"`));
});

test('resolvedor real autoriza FamFire só na preparação QA e perde a preferência quando revogado',async()=>{
  const usuario={id:U,email:'ensaio@example.invalid',email_confirmed_at:'2026-10-01',app_metadata:{}};
  for(const [opts,qa,status]of [
    [{},true,'selecionado'],[{grants:[]},true,'selecao_invalida'],
    [{ativo:null},true,'selecionado'],
    [{grants:[{business_id:A,profile_id:U,revoked_at:null,expires_at:'2000-01-01T00:00:00Z'}]},true,'selecao_invalida'],
    [{user:{...usuario,email_confirmed_at:null}},true,'selecao_invalida'],
    [{user:{...usuario,email:null}},true,'selecao_invalida'],
    [{vinculos:[links()[0]]},true,'selecao_invalida'],[{linkError:{code:'42501'}},true,'falha_consulta'],
    [{linkError:{code:'PGRST205'}},true,'selecao_invalida'],[{},false,'selecao_invalida'],
    [{orders:[{id:R,business_id:F,status:'cancelled',buyer_profile_id:U,payment_method:'direct_pix',provider_charge_id:null,buyer_email:usuario.email}]},true,'selecao_invalida'],
  ]){
    const db=banco({user:usuario,ativo:F,...opts});
    const ports={...db.ports,'@/lib/piloto-qa/acesso':{pilotoQaHabilitado:()=>qa},
      '../piloto-qa/acesso':{pilotoQaHabilitado:()=>qa,acessosPilotoQa:async()=>qa?(opts.grants??[{business_id:A,profile_id:U,revoked_at:null,expires_at:new Date(Date.now()+3600000).toISOString()}]):[]},
      '../contratacao/acesso-contratado':{acessosContratadosDoPerfil:async()=>[]},
      '../contratacao/direito-por-pedido':{pedidoMantemDireito:async()=>false},
      '../contratacao/consultar-estado-pagamento':{consultarEstadoPagamento:async()=>null},
    };
    const r=await ambienteTs({ports}).load('lib/multiconta/ativo.ts').negocioAtivoDaSessao();
    assert.equal(r.status,status,JSON.stringify({opts,qa}));
    if(status==='selecionado'){assert.equal(r.negocio.id,opts.ativo===null?A:F);assert.deepEqual(Array.from(r.negocios,n=>n.id),[A,F]);}
    if(!qa)assert.equal(db.calls.some(c=>c.table==='agency_advertisers'),false);
  }
});

test('páginas reais agregam os dois vínculos sem consultar Meta, criar execução ou alterar seleção',async()=>{
  const db=banco(),c=contextos();let meta=0,estado=0;const nada=()=>null;
  const ports={...db.ports,
    '@/lib/agencia/da-sessao':{carregarAgenciaDaSessao:async()=>({status:'agencia',agencia:c[0].agencia,businessIdAtivo:A,contexto:c[0],clientes:c,agencyBusinessId:A,origem:'vinculo'})},
    '@/lib/agencia/resumo-da-sessao':{carregarResumoDaCarteira:async id=>({situacao:id===A?'Peça aprovada':'Sem peça recebida nesta fila',temPendencia:true})},
    '@/lib/estado/cliente':{estadoDoCliente:async()=>{estado++;throw Error('estado não deve ser lido na carteira');}},
    '@/lib/backend/anuncios-do-negocio':{anunciosDoNegocioSelecionado:async()=>{meta++;throw Error('Meta não deve ser chamada na carteira');}},
    '../agencia/actions':{abrirClienteAction:async()=>({})},
    '@/lib/onboarding/pendencia-do-negocio':{lerPendenciaDoNegocio:nada,aplicarAgendaConferida:nada},
    '@/app/(fluxo)/onboarding/concluido/agenda-actions':{carregarAgendaAction:nada},
    '@/lib/criativos/pedidos-da-sessao':{carregarPedidosDaSessao:nada},
    '@/lib/jev/catalogo-da-sessao':{catalogoBarbeariaDisponivel:nada},
    '@/lib/criativos/contexto-do-negocio-da-sessao':{carregarContextoDoCriativo:nada},
    '@/components/ui/FaixaReconectar':{FaixaReconectar:nada},'./TelaDoInicio':{TelaDoInicio:nada},
    './Analisar':{Analisar:nada},'./Amostra':{AmostraDeVereditos:nada},'./PedirRevisao':{PedirRevisao:nada},'./TelaDeCriativos':{TelaDeCriativos:nada},'./PedidoDeImagem':{PedidoDeImagem:nada},
    './agencia.module.css':css,
  };
  const mod=ambienteTs({ports,env:{V2G_CREATIVE_REVIEW_ENABLED:'true'}});
  const inicio=await mod.load('app/(protected)/inicio/page.tsx').default({searchParams:Promise.resolve({})});
  assert.equal(inicio.props.clientes.length,2);
  const criativos=await mod.load('app/(protected)/criativos/page.tsx').default({searchParams:Promise.resolve({})});
  assert.equal(criativos.props.clientes.length,2);assert.equal(criativos.props.itens.length,2);
  assert.deepEqual(Array.from(criativos.props.itens,p=>p.cliente.businessId).sort(),[A,F]);
  assert.equal(meta,0);assert.equal(estado,0);assert.equal(db.cookie.length,0);
});

const P='77777777-7777-4777-8777-777777777777';
function carteiraSemCampanha(override={}){
  const rows=[{id:P,profile_id:U,name:'Agência sem campanha própria',monthly_budget:null,onboarding:null},...businesses()];
  const vinculos=links().map(v=>({...v,agency_business_id:P,legacy_shared_business:false}));
  return {...banco({ativo:P,rows,vinculos,...override}),documentos:rows,antes:JSON.stringify(rows)};
}
test('raiz administrativa abre carteira sem onboarding, verba ou campanha própria e preserva os documentos',async()=>{
  const db=carteiraSemCampanha(),r=await db.mod.load('lib/agencia/da-sessao.ts').carregarAgenciaDaSessao();
  assert.equal(r.status,'agencia');assert.equal(r.contexto,null);assert.equal(r.agencyBusinessId,P);
  assert.equal(r.businessIdAtivo,P);assert.equal(r.agencia,'Agência sem campanha própria');
  assert.deepEqual(Array.from(r.clientes,c=>c.businessId).sort(),[A,F]);
  const {selecionarVisaoAgencia}=load('lib/agencia/contexto.ts');
  assert.equal(selecionarVisaoAgencia(r.contexto,{},true),'carteira');
  assert.equal(selecionarVisaoAgencia(r.contexto,{cliente:A},true),'invalido');
  assert.equal(db.cookie.length,0);
  assert.equal(JSON.stringify(db.documentos),db.antes);
  assert.ok(db.calls.filter(c=>c.table==='businesses').every(c=>c.filters.some(([k,v])=>k==='profile_id'&&v===U)));
});
test('da agência sem campanha, abrir Dúú exige POST próprio e nunca altera briefing ou vínculo',async()=>{
  const db=carteiraSemCampanha();
  await assert.rejects(db.mod.load('app/(protected)/agencia/actions.ts').abrirClienteAction({},form({cliente:A,agencia:P,area:'/inicio'})),/REDIRECT/);
  assert.equal(db.cookie.length,1);assert.equal(db.cookie[0][1],A);
  assert.equal(new URL(db.redirects[0],'https://qa.invalid').searchParams.get('cliente'),A);
  const selecionado=carteiraSemCampanha({ativo:A}),r=await selecionado.mod.load('lib/agencia/da-sessao.ts').carregarAgenciaDaSessao();
  assert.equal(r.contexto.businessId,A);assert.equal(r.contexto.praca,'Praça exclusiva Dúú');
  assert.equal(r.agencyBusinessId,P);
});
test('raiz, cliente e retorno são conferidos contra o titular; outro anunciante não ganha seleção',async()=>{
  for(const alteracao of [
    {user:{id:V}},
    {rows:[{id:P,profile_id:V,name:'Raiz alheia'},...businesses()]},
    {vinculos:links().map(v=>({...v,agency_business_id:P,owner_profile_id:V,legacy_shared_business:false}))},
    {linkError:{code:'42501'}},
  ]){
    const db=carteiraSemCampanha(alteracao),r=await db.mod.load('lib/agencia/da-sessao.ts').carregarAgenciaDaSessao();
    assert.notEqual(r.status,'agencia');assert.equal(db.cookie.length,0);
    assert.equal(db.calls.some(c=>c.table==='manager_accounts'),false);
  }
  for(const formulario of [form({cliente:S,agencia:P}),form({cliente:A,agencia:A}),form({cliente:P,agencia:P})]){
    const db=carteiraSemCampanha(),r=await db.mod.load('app/(protected)/agencia/actions.ts').abrirClienteAction({},formulario);
    assert.ok(r.erro);assert.equal(db.cookie.length,0);
  }
});
test('onboarding real redireciona agência antes de carregar ou criar respostas e permite cadastro do anunciante explícito',async()=>{
  for(const [db,busca,esperado]of [
    [carteiraSemCampanha(),{},'carteira'],[banco(),{},'carteira'],
    [banco(),{cliente:A},'anunciante'],[banco(),{cliente:[A,A]},'carteira'],
    [carteiraSemCampanha({ativo:A}),{},'anunciante'],
    [carteiraSemCampanha({linkError:{code:'57014'}}),{},'indisponivel'],
  ]){
    assert.equal(await db.mod.load('lib/agencia/entrada.ts').entradaDoOnboardingDaAgencia(busca),esperado);
  }
  let leituras=0;
  const db=carteiraSemCampanha();
  const mod=ambienteTs({ports:{...db.ports,
    './actions':{carregarEstadoAction:async()=>{leituras++;throw Error('Onboarding da agência não pode ser criado');}},
    './Chat':{Chat:()=>null},'./onboarding-editorial.css':{},
    '@/components/ui/Marca':{Marca:()=>null},
  }});
  await assert.rejects(mod.load('app/(fluxo)/onboarding/page.tsx').default({}),/REDIRECT/);
  await assert.rejects(mod.load('app/(fluxo)/onboarding/layout.tsx').default({children:null}),/REDIRECT/);
  assert.equal(leituras,0);
  const actions=ambienteTs({ports:{...db.ports,
    '@/lib/cadastro/procedencia':{gravarCamposDoCliente:async()=>{throw Error('Não pode gravar na raiz');}},
    '@/lib/pipeline/conferir-cadastro-operacional':{conferirCadastroOperacionalSeCompleto:async()=>{throw Error('Não pode disparar cadastro');}},
  }}).load('app/(fluxo)/onboarding/actions.ts');
  const r=await actions.carregarEstadoAction();assert.match(r.erro,/Abra um cliente/);
  const gravacao=await actions.salvarRespostaAction({businessId:P,qid:'descricao',texto:'Resposta que não pode ser gravada na agência',origem:'texto'});
  assert.equal(gravacao.ok,false);assert.match(gravacao.erro,/Abra um cliente/);
  assert.equal(JSON.stringify(db.documentos),db.antes);
});
test('carteira sem anunciante próprio rende Início e Criativos sem buscar métricas ou sugerir questionário da agência',async()=>{
  const db=carteiraSemCampanha(),nada=()=>null;let estado=0,meta=0;
  const mod=ambienteTs({ports:{...db.ports,
    '@/lib/estado/cliente':{estadoDoCliente:async()=>{estado++;throw Error('Não consultar operação da raiz');}},
    '@/lib/backend/anuncios-do-negocio':{anunciosDoNegocioSelecionado:async()=>{meta++;throw Error('Não consultar Meta da raiz');}},
    '@/lib/onboarding/pendencia-do-negocio':{lerPendenciaDoNegocio:nada,aplicarAgendaConferida:nada},
    '@/app/(fluxo)/onboarding/concluido/agenda-actions':{carregarAgendaAction:nada},
    '@/lib/criativos/pedidos-da-sessao':{carregarPedidosDaSessao:nada},
    '@/lib/jev/catalogo-da-sessao':{catalogoBarbeariaDisponivel:nada},
    '@/lib/criativos/contexto-do-negocio-da-sessao':{carregarContextoDoCriativo:nada},
    '@/components/ui/FaixaReconectar':{FaixaReconectar:nada},'./TelaDoInicio':{TelaDoInicio:nada},
    './Analisar':{Analisar:nada},'./Amostra':{AmostraDeVereditos:nada},'./PedirRevisao':{PedirRevisao:nada},'./TelaDeCriativos':{TelaDeCriativos:nada},'./PedidoDeImagem':{PedidoDeImagem:nada},
    './agencia.module.css':css,
  },env:{V2G_CREATIVE_REVIEW_ENABLED:'true'}});
  const inicio=await mod.load('app/(protected)/inicio/page.tsx').default({searchParams:Promise.resolve({})});
  assert.equal(inicio.props.agencia,'Agência sem campanha própria');assert.equal(inicio.props.ativoId,P);
  const html=renderToStaticMarkup(inicio);assert.match(html,/Abrir aplicativo/);assert.doesNotMatch(html,/Terminar meu cadastro|Sobre seu negócio/);
  const criativos=await mod.load('app/(protected)/criativos/page.tsx').default({searchParams:Promise.resolve({})});
  assert.equal(criativos.props.agencia,'Agência sem campanha própria');assert.equal(criativos.props.clientes.length,2);
  assert.equal(meta,0);assert.equal(estado,0);assert.equal(db.cookie.length,0);
});
