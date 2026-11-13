import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { ambienteTs } from './test-utils/ts-isolado.mjs';
const load = ambienteTs().load;
// Fronteiras adicionais da apresentação de agência; a leitura/resumo real
// continua sendo o objeto destes testes. O calendário original mantém sua porta.
const PORTAS_AGENCIA = {
  '@/app/(protected)/inicio/SeletorDePeriodo': {SeletorDePeriodo:()=>null},
  '@/app/(protected)/inicio/AtualizarInicio': {AtualizarInicio:()=>null},
  './agencia.module.css': {default:new Proxy({},{get:(_,k)=>k})},
  './inicio-cliente.module.css': {default:new Proxy({},{get:(_,k)=>k})},
};
const {lerSerieMeta} = load('lib/inicio/serie-meta.ts');
const {resumirMeta,leituraAnteriorPermitida,chaveDoEscopo} = load('lib/inicio/resumo-meta.ts');
const {erroDoIntervalo,intervaloDoInicio} = load('lib/inicio/periodo.ts');
const periodo={desde:'2026-11-01',ate:'2026-11-03'};
const linhas=()=>[
  {dia:'2026-11-01',gasto_centavos:100,impressoes:10,cliques_totais:1},
  {dia:'2026-11-02',gasto_centavos:0,impressoes:0,cliques_totais:0},
  {dia:'2026-11-03',gasto_centavos:200,impressoes:20,cliques_totais:2},
];
const totais={gasto:300,impressoes:30,cliques:3};
const metrica=()=>({estado:'observado',...totais,conversas:null,dias:linhas().map(d=>d.dia),entregaObservada:true,serieDiaria:lerSerieMeta(linhas(),periodo,totais)});
const campanha=(id='1',m=metrica())=>({id,nome:'Fictícia',statusConfigurado:'ACTIVE',statusEfetivo:'ACTIVE',metricas:m,conjuntos:[]});
const dados=(campanhas=[campanha()])=>({businessId:'11111111-1111-4111-8111-111111111111',contaId:'act_123',periodo,moeda:'BRL',fuso:'America/Sao_Paulo',coletadoEm:'2026-11-09T03:00:00Z',campanhas});
const vazio=()=>({estado:'sem_dados',gasto:null,impressoes:null,cliques:null,conversas:null,dias:[],entregaObservada:null,serieDiaria:{estado:'disponivel',dias:[]}});

test('série antiga ausente não inventa dias; medido zero permanece zero',()=>{
  assert.equal(lerSerieMeta(undefined,periodo,totais).estado,'ausente');
  const s=lerSerieMeta(linhas(),periodo,totais);
  assert.equal(s.estado,'disponivel'); assert.equal(s.dias[1].gasto,0);
});
test('lacuna do calendário permanece null, sem comprimir ou unir pontos',()=>{
  const s=lerSerieMeta([linhas()[0],linhas()[2]],periodo,totais,['2026-11-01','2026-11-03']);
  assert.equal(s.estado,'disponivel'); assert.equal(s.dias.length,3); assert.equal(s.dias[1].gasto,null);
});
test('total null permite dias conhecidos e lacunas; campo desconhecido não vira zero',()=>{
  const s=lerSerieMeta([{...linhas()[0]},{...linhas()[1],gasto_centavos:null},{...linhas()[2]}],periodo,{...totais,gasto:null});
  assert.equal(s.estado,'disponivel'); assert.equal(s.dias[0].gasto,100); assert.equal(s.dias[1].gasto,null);
});
test('total confere todos os pontos observados mesmo com lacuna de cobertura no calendário',()=>{
  const raw=[linhas()[0],linhas()[2]];
  assert.equal(lerSerieMeta(raw,periodo,{...totais,gasto:400},['2026-11-01','2026-11-03']).estado,'inconsistente');
  assert.equal(lerSerieMeta(raw,periodo,totais,['2026-11-01','2026-11-03']).estado,'disponivel');
});
test('overflow de agregado desconhecido não elimina gasto ou pontos individuais válidos',()=>{
  const raw=[{...linhas()[0],gasto_centavos:1,impressoes:Number.MAX_SAFE_INTEGER,cliques_totais:1},
    {...linhas()[1],gasto_centavos:1,impressoes:1,cliques_totais:1}];
  const s=lerSerieMeta(raw,{desde:'2026-11-01',ate:'2026-11-02'},{gasto:2,impressoes:null,cliques:2});
  assert.equal(s.estado,'disponivel'); assert.equal(s.dias[0].gasto,1);assert.equal(s.dias[1].gasto,1);
  assert.equal(s.dias[0].impressoes,Number.MAX_SAFE_INTEGER);
});
for(const [nome,mudar] of [
  ['duplicado',a=>[a[0],a[0]]],['fora do período',a=>[{...a[0],dia:'2026-11-04'}]],
  ['ordem invertida',a=>a.reverse()],['data impossível',a=>[{...a[0],dia:'2026-02-30'}]],
  ['negativo',a=>[{...a[0],gasto_centavos:-1}]],['decimal',a=>[{...a[0],impressoes:1.5}]],
  ['campo ausente',a=>[{dia:a[0].dia,gasto_centavos:100,impressoes:10}]],
  ['tipo incorreto',a=>[{...a[0],cliques_totais:'1'}]],['array inválido',()=>({})],
  ['soma completa divergente',a=>a.map(d=>({...d,gasto_centavos:0}))],
  ['soma parcial supera total',a=>[{...a[0],gasto_centavos:301}]],
  ['overflow',a=>[{...a[0],gasto_centavos:Number.MAX_SAFE_INTEGER},{...a[1],gasto_centavos:1}]],
]) test('série inconsistente: '+nome,()=>assert.equal(lerSerieMeta(mudar(linhas()),periodo,totais).estado,'inconsistente'));
test('datas observadas devem coincidir com a série',()=>{
  assert.equal(lerSerieMeta(linhas(),periodo,totais,['2026-11-01']).estado,'inconsistente');
});
test('piloto sintético 1 medida + 9 sem_dados preserva totais, série e cobertura',()=>{
  const r=resumirMeta(dados([campanha(),...Array.from({length:9},(_,i)=>campanha(String(i+2),vazio()))]));
  assert.equal(r.gasto,300); assert.equal(r.dias[0].gasto,100); assert.equal(r.dias[1].gasto,0);
  assert.equal(r.campanhasObservadas,1); assert.equal(r.campanhas,10); assert.equal(r.parcial,true);
});
test('somente nível campanha, não seus conjuntos ou anúncios',()=>{
  const c=campanha(); c.conjuntos=[{metricas:{gasto:9999},anuncios:[{metricas:{gasto:8888}}]}];
  assert.equal(resumirMeta(dados([c])).gasto,300);
});
test('duas campanhas observadas somam por dia; calendários diferentes mantêm lacunas',()=>{
  const b=metrica(); b.serieDiaria=lerSerieMeta([linhas()[0],linhas()[2]],periodo,totais);
  b.estado='parcial'; b.dias=['2026-11-01','2026-11-03'];
  const r=resumirMeta(dados([campanha(),campanha('2',b)]));
  assert.equal(r.gasto,600); assert.equal(r.dias[0].gasto,200); assert.equal(r.dias[1].gasto,null); assert.equal(r.dias[2].gasto,400);
});
test('campo null em campanha COM observação não é ignorado na soma',()=>{
  const b=metrica();b.estado='parcial';b.gasto=null;b.serieDiaria.dias[0].gasto=null;
  const r=resumirMeta(dados([campanha(),campanha('2',b)]));
  assert.equal(r.gasto,null);assert.equal(r.impressoes,60);assert.equal(r.dias[0].gasto,null);assert.equal(r.dias[1].gasto,0);
});
test('backend antigo e série inválida preservam totais e recusam gráfico',()=>{
  for(const serie of [undefined,{estado:'inconsistente',dias:[]}]){
    const m=metrica();m.serieDiaria=serie;const r=resumirMeta(dados([campanha('1',m)]));
    assert.equal(r.gasto,300);assert.equal(r.dias.length,0);
  }
});
test('inventário vazio e overflow não viram gasto zero',()=>{
  assert.equal(resumirMeta(dados([])).gasto,null);
  const a=metrica();a.gasto=Number.MAX_SAFE_INTEGER;
  assert.equal(resumirMeta(dados([campanha('1',a),campanha()])).gasto,null);
});
const escopo={businessId:dados().businessId,perfilId:'perfil-A',...periodo,conta:'act_123'};
const falha={ok:false,motivo:'indisponivel',mensagem:'Falha fictícia',contas:[{id:'act_123'}],contaSelecionada:'act_123'};
test('última leitura só reaparece no mesmo perfil/negócio/conta/período e falha transitória',()=>{
  const memoria={chave:chaveDoEscopo(escopo),dados:dados()};
  assert.ok(leituraAnteriorPermitida(falha,escopo,memoria));
  for(const patch of [{perfilId:'B'},{businessId:'B'},{conta:'act_456'},{desde:'2026-11-02'},{ate:'2026-11-02'}]) assert.equal(leituraAnteriorPermitida(falha,{...escopo,...patch},memoria),null);
  for(const motivo of ['acesso','escopo','periodo','sem_conta','escolher_conta']) assert.equal(leituraAnteriorPermitida({...falha,motivo},escopo,memoria),null);
});
test('conta implícita trocada ou lista atual indisponível não reutiliza leitura A',()=>{
  const implicito={...escopo,conta:undefined};
  const memoria={chave:chaveDoEscopo(implicito),dados:dados()};
  assert.ok(leituraAnteriorPermitida(falha,implicito,memoria));
  for(const patch of [{contaSelecionada:'act_456',contas:[{id:'act_456'}]},
    {contaSelecionada:'act_123',contas:[{id:'act_456'}]},{contaSelecionada:null,contas:[]}])
    assert.equal(leituraAnteriorPermitida({...falha,...patch},implicito,memoria),null);
});
test('31 dias aceitos, 32 recusados; atalhos antigos e repetição não consultam janela menor',()=>{
  assert.equal(erroDoIntervalo('2026-10-01','2026-10-31','2026-11-09'),null);
  assert.match(erroDoIntervalo('2026-10-01','2026-11-01','2026-11-09'),/31 dias/);
  assert.match(intervaloDoInicio({periodo:'3m'},'2026-11-09').erro,/não foi consultado/);
  assert.ok(intervaloDoInicio({desde:['2026-11-01','2026-11-02'],ate:'2026-11-03'},'2026-11-09').erro);
});

function html(resultado={ok:true,dados:dados(),contas:[{id:'act_123'}],contaSelecionada:'act_123'}) {
  const {ResumoMetaDoInicio}=ambienteTs({ports:{
    ...PORTAS_AGENCIA,
    './SeletorDePeriodo':{SeletorDePeriodo:()=>React.createElement('button',null,'Calendário')},
    './AtualizarInicio':{AtualizarInicio:()=>React.createElement('button',null,'Tentar novamente')},
    './ResumoMetaDoInicio.module.css':{default:new Proxy({},{get:(_,k)=>k})},
  }}).load('app/(protected)/inicio/ResumoMetaDoInicio.tsx');
  return renderToStaticMarkup(React.createElement(ResumoMetaDoInicio,{resultado,escopo,intervalo:{...periodo,hoje:'2026-11-09'},
    pendencia:{titulo:'Faltam informações',corpo:'Pendência fictícia',href:'/onboarding',rotulo:'Conferir'},falhaPendencia:false,faixa:null,complemento:null}));
}
test('HTML real separa cadastro de entrega histórica; sem preparação contraditória/vendas inventadas',()=>{
  const h=html();assert.match(h,/Houve entrega neste período/);assert.match(h,/Pendência do cadastro/);
  assert.doesNotMatch(h,/Sua campanha está sendo preparada|Seu negócio está em preparação/);
  assert.match(h,/Meta Marketing API/);assert.match(h,/America\/Sao_Paulo/);assert.match(h,/act_123/);
  assert.doesNotMatch(h,/<path[^>]+d=/);assert.match(h,/Ver valores por dia/);assert.doesNotMatch(h,/<dt>Vendas|<dt>Conversas/);
  assert.match(h,/conta=act_123/);
});
test('HTML da série antiga mostra totais e gráfico indisponível, não vazio falso',()=>{
  const d=dados();delete d.campanhas[0].metricas.serieDiaria;
  const h=html({ok:true,dados:d,contas:[],contaSelecionada:'act_123'});
  assert.match(h,/3,00/);assert.match(h,/distribuição diária ainda não está disponível/);assert.doesNotMatch(h,/<svg/);
});
test('HTML de falha não inventa preparação nem sucesso e oferece tentativa',()=>{
  const h=html(falha);assert.match(h,/Falha fictícia/);assert.match(h,/Tentar novamente/);assert.doesNotMatch(h,/Houve entrega|Resumo do período|R\$/);
});
test('componente real conserva consulta confirmada no refresh, mas limpa após negação de acesso',()=>{
  let memoria=null,efeito;
  const componente=ambienteTs({ports:{
    ...PORTAS_AGENCIA,
    react:{...React,useState:()=>[memoria,v=>{memoria=v;}],useEffect:f=>{efeito=f;}},
    './SeletorDePeriodo':{SeletorDePeriodo:()=>null},'./AtualizarInicio':{AtualizarInicio:()=>null},
    './ResumoMetaDoInicio.module.css':{default:new Proxy({},{get:(_,k)=>k})},
  }}).load('app/(protected)/inicio/ResumoMetaDoInicio.tsx').ResumoMetaDoInicio;
  const render=(resultado,scope=escopo)=>{
    const h=renderToStaticMarkup(componente({resultado,escopo:scope,intervalo:{...periodo,hoje:'2026-11-09'},pendencia:null,falhaPendencia:false,faixa:null,complemento:null}));
    efeito(); return h;
  };
  render({ok:true,dados:dados(),contas:[],contaSelecionada:'act_123'});
  const anterior=render(falha); assert.match(anterior,/última consulta confirmada/);assert.match(anterior,/3,00/);
  assert.doesNotMatch(render(falha,{...escopo,perfilId:'perfil-B'}),/Resumo do período|3,00/);
  assert.doesNotMatch(render({...falha,motivo:'acesso'}),/Resumo do período|3,00/);
  assert.doesNotMatch(render(falha),/Resumo do período|3,00/);
});
test('componente real não apresenta número, link ou hidden da conta A após troca implícita para B',()=>{
  let memoria=null,efeito;
  const componente=ambienteTs({ports:{
    ...PORTAS_AGENCIA,
    react:{...React,useState:()=>[memoria,v=>{memoria=v;}],useEffect:f=>{efeito=f;}},
    './SeletorDePeriodo':{SeletorDePeriodo:()=>null},'./AtualizarInicio':{AtualizarInicio:()=>null},
    './ResumoMetaDoInicio.module.css':{default:new Proxy({},{get:(_,k)=>k})},
  }}).load('app/(protected)/inicio/ResumoMetaDoInicio.tsx').ResumoMetaDoInicio;
  const scope={...escopo,conta:undefined};
  const render=resultado=>{const h=renderToStaticMarkup(componente({resultado,escopo:scope,intervalo:{...periodo,hoje:'2026-11-09'},pendencia:null,falhaPendencia:false,faixa:null,complemento:null}));efeito();return h;};
  render({ok:true,dados:dados(),contas:[{id:'act_123'}],contaSelecionada:'act_123'});
  const h=render({...falha,contaSelecionada:'act_456',contas:[{id:'act_456'}]});
  assert.doesNotMatch(h,/act_123|3,00|Resumo do período/);assert.match(h,/act_456/);assert.equal(memoria,null);
});
test('calendário recebe novo período e chave própria na navegação, sem remontar o resumo por datas',()=>{
  const Calendario=()=>null;
  const componente=ambienteTs({ports:{
    ...PORTAS_AGENCIA,
    react:{...React,useState:()=>[null,()=>{}],useEffect:()=>{}},
    './SeletorDePeriodo':{SeletorDePeriodo:Calendario},'./AtualizarInicio':{AtualizarInicio:()=>null},
    './ResumoMetaDoInicio.module.css':{default:new Proxy({},{get:(_,k)=>k})},
  }}).load('app/(protected)/inicio/ResumoMetaDoInicio.tsx').ResumoMetaDoInicio;
  function encontrar(node){if(!React.isValidElement(node))return null;if(node.type===Calendario)return node;
    for(const filho of React.Children.toArray(node.props.children)){const achado=encontrar(filho);if(achado)return achado;}return null;}
  const chaves=[];
  for(const p of [periodo,{desde:'2026-11-02',ate:'2026-11-04'}]){
    const arvore=componente({resultado:falha,escopo:{...escopo,...p},intervalo:{...p,hoje:'2026-11-09'},pendencia:null,falhaPendencia:false,faixa:null,complemento:null});
    const calendario=encontrar(arvore);assert.ok(calendario);assert.equal(calendario.props.intervalo.desde,p.desde);assert.equal(calendario.props.intervalo.ate,p.ate);chaves.push(calendario.key);
    assert.equal(arvore.key,null);
  }
  assert.notEqual(chaves[0],chaves[1]);
});
test('bancada tem guarda de produção e sentinela somente no módulo fictício',()=>{
  const p=readFileSync('app/exemplo/inicio-meta/page.tsx','utf8');
  assert.match(p,/process.env.NODE_ENV !== "production" \? await import/);assert.match(p,/if \(!modulo\) notFound\(\)/);
  assert.match(readFileSync('app/exemplo/_inicio_meta/Previa.tsx','utf8'),/V2G_INICIO_META_FICTICIO_0911/);
});
test('fixture real distingue outage após autorização de falha antes de confirmar a conta',()=>{
  let cenario='medido';const Resumo=()=>null;
  const Previa=ambienteTs({globals:{structuredClone},ports:{
    react:{...React,useState:()=>[cenario,()=>{}]},
    '@/app/(protected)/inicio/ResumoMetaDoInicio':{ResumoMetaDoInicio:Resumo},
  }}).load('app/exemplo/_inicio_meta/Previa.tsx').PreviaInicioMeta;
  function encontrar(node){if(!React.isValidElement(node))return null;if(node.type===Resumo)return node.props;
    for(const filho of React.Children.toArray(node.props.children)){const p=encontrar(filho);if(p)return p;}return null;}
  const inicial=encontrar(Previa());const memoria={chave:chaveDoEscopo(inicial.escopo),dados:inicial.resultado.dados};
  cenario='falha';const depois=encontrar(Previa());
  assert.equal(depois.resultado.contaSelecionada,'act_10001');assert.equal(depois.resultado.contas[0].id,'act_10001');
  assert.ok(leituraAnteriorPermitida(depois.resultado,depois.escopo,memoria));
  cenario='falha-sem-conta';const antes=encontrar(Previa());
  assert.equal(antes.resultado.contaSelecionada,null);assert.equal(antes.resultado.contas.length,0);
  assert.equal(leituraAnteriorPermitida(antes.resultado,antes.escopo,memoria),null);
});

async function pagina(busca, sessao={data:{user:{id:'perfil-A'}},error:null}) {
  const chamadas=[];
  const c={businessId:escopo.businessId,agencia:'Agência de ensaio',anunciante:'Cliente de ensaio'};
  const q={select:()=>q,eq:()=>q,in:()=>q,order:()=>q,limit:()=>q,maybeSingle:async()=>({data:null,error:null})};
  const mod=ambienteTs({env:{NODE_ENV:'production'},ports:{
    '@/lib/agencia/habilitacao':{agenciaHabilitada:()=>true},
    '@/lib/agencia/da-sessao':{carregarAgenciaDaSessao:async()=>({status:'agencia',contexto:c,clientes:[c],agencyBusinessId:'11111111-1111-4111-8111-111111111111'})},
    '@/lib/agencia/resumo-da-sessao':{carregarResumoDaCarteira:async()=>({temPendencia:false})},
    'next/navigation':{redirect:()=>{throw Error('redirect inesperado');}},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>sessao},from:()=>q})},
    '@/components/ui/FaixaReconectar':{FaixaReconectar:()=>null},
    '@/lib/estado/cliente':{estadoDoCliente:async()=>({temNegocio:true,negocioId:escopo.businessId,diaSeguinte:{execucao:null,acumulado:null}})},
    '@/lib/backend/anuncios-do-negocio':{anunciosDoNegocioSelecionado:async args=>{chamadas.push(args);return {ok:true,dados:dados(),contas:[],contaSelecionada:'act_123'};}},
    '@/lib/onboarding/pendencia-do-negocio':{lerPendenciaDoNegocio:async()=>({pendencia:null,reserva:null,falha:false}),aplicarAgendaConferida:x=>x},
    '@/app/(fluxo)/onboarding/concluido/agenda-actions':{carregarAgendaAction:async()=>{throw Error('agenda não esperada');}},
    '@/lib/dia-seguinte/dias-em-aberto':{diasAtrasados:async()=>[]},
    './TelaDoInicio':{TelaDoInicio:()=>null},
  }}).load('app/(protected)/inicio/page.tsx');
  return {elemento:await mod.default({searchParams:Promise.resolve({...busca,cliente:escopo.businessId})}),chamadas};
}
test('página real recusa 32 dias/repetidos sem chamar fonte; 31 dias conserva recorte',async()=>{
  for(const busca of [{desde:'2026-01-01',ate:'2026-02-01'},{desde:['2026-01-01','2026-01-02'],ate:'2026-01-03'},{periodo:'3m'}]){
    const r=await pagina(busca);assert.equal(r.chamadas.length,0);assert.equal(r.elemento.props.leituraMeta.motivo,'periodo');
  }
  const r=await pagina({desde:'2026-01-01',ate:'2026-01-31',conta:'act_123',businessId:'outro'});
  assert.equal(r.chamadas.length,1);assert.equal(r.chamadas[0].desde,'2026-01-01');assert.equal(r.chamadas[0].ate,'2026-01-31');
  assert.equal(r.chamadas[0].contaId,'act_123');assert.equal(r.elemento.props.escopoMeta.businessId,escopo.businessId);
});
test('página com erro Auth e objeto user nega antes da fonte',async()=>{
  const r=await pagina({}, {data:{user:{id:'perfil-A'}},error:{message:'erro fictício'}});
  assert.equal(r.elemento,null);assert.equal(r.chamadas.length,0);
});
