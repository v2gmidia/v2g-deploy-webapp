import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const U='33333333-3333-4333-8333-333333333333',G='44444444-4444-4444-8444-444444444444';
const R='55555555-5555-4555-8555-555555555555',sha='a'.repeat(64);
const load=ambienteTs().load;
const contexto=load('lib/agencia/contexto.ts');
const {resumirCarteira}=load('lib/agencia/resumo.ts');
const css={default:new Proxy({},{get:(_,k)=>k})};
const linha=()=>({id:A,profile_id:U,name:'Agência de teste',monthly_budget:'3000',onboarding:{versao:2,respostas:{
  operador:{texto:'Uma agência ou gestor opera para o anunciante'},nome:{texto:'Anunciante de teste'},
  contratante:{texto:'Contratante declarado'},ramo:{texto:'Bebidas'},praca:{texto:'Todo o estado do Rio de Janeiro'},
}}});
const revisao=(status='approved_for_manual_publish')=>({id:R,business_id:A,sha256:sha,status});
const publicacao=()=>({review_request_id:R,business_id:A,content_sha256:sha,ad_account_id:'act_123',ad_id:'456',published_on:'2026-11-08',
  evidence:'Declaração humana conferida para ensaio local',confirmed_by:G,confirmed_at:'2026-11-09T12:00:00Z',source:'manager_declaration'});

test('agência e anunciante vêm de declaração explícita; documento original permanece intacto',()=>{
  const original=linha(),antes=JSON.stringify(original);
  const c=contexto.contextoAgenciaDoCadastro(original,U);
  assert.equal(c.agencia,'Agência de teste');assert.equal(c.anunciante,'Anunciante de teste');assert.equal(c.verbaMensal,3000);
  assert.equal(c.praca,'Todo o estado do Rio de Janeiro');assert.equal(JSON.stringify(original),antes);
});
test('nome parecido, titular estranho, UUID e cadastro incompleto não criam vínculo',()=>{
  for(const mudar of [x=>x.profile_id=G,x=>x.id='qualquer',x=>x.onboarding.respostas.operador.texto='Agência de teste',
    x=>delete x.onboarding.respostas.nome,x=>delete x.onboarding.respostas.contratante]){
    const x=linha();mudar(x);assert.equal(contexto.contextoAgenciaDoCadastro(x,U),null);
  }
});
test('contratante e anunciante não são fundidos; economia desconhecida não vira zero',()=>{
  const x=linha();x.monthly_budget=null;
  assert.equal(contexto.contextoAgenciaDoCadastro(x,U).verbaMensal,null);
  x.onboarding.respostas.operador.texto='O próprio anunciante opera os anúncios';
  assert.equal(contexto.contextoAgenciaDoCadastro(x,U),null);
});
test('query cliente não autoriza outro negócio, repetição, string vazia ou ausência de contexto',()=>{
  const c=contexto.contextoAgenciaDoCadastro(linha(),U);
  assert.equal(contexto.selecionarVisaoAgencia(c,{}),'carteira');assert.equal(contexto.selecionarVisaoAgencia(c,{cliente:A}),'cliente');
  for(const v of [B,[A,A],'',`${A}/../${B}`])assert.equal(contexto.selecionarVisaoAgencia(c,{cliente:v}),'invalido');
  assert.equal(contexto.selecionarVisaoAgencia(null,{cliente:A}),'invalido');
});
test('retorno preserva filtros sem aceitar destino externo; parâmetros repetidos são descartados',()=>{
  const r=contexto.retornoDaCarteira({busca:' Dúú & outra ',pendentes:'1',pagina:'2'});
  const href=contexto.hrefDoCliente('/inicio',A,r),u=new URL(href,'https://qa.invalid');
  assert.equal(u.searchParams.get('cliente'),A);
  const l=contexto.hrefDaCarteira('/inicio',contexto.retornoDaCarteira(Object.fromEntries(u.searchParams),true));
  assert.match(l,/busca=D%C3%BA%C3%BA/);assert.match(l,/pendentes=1/);assert.match(l,/pagina=2/);
  assert.equal(contexto.hrefDoCliente('/inicio','https://fora.invalid'),'/inicio');
  assert.deepEqual(JSON.parse(JSON.stringify(contexto.retornoDaCarteira({busca:['a','b'],pagina:'-1'}))),{busca:'',pendentes:false,pagina:1});
});
test('aprovação não confirma publicação; versão, conta e autoria são conferidas pelo leitor existente',()=>{
  assert.equal(resumirCarteira(A,[revisao()],[]).situacao,'Conferir publicação');
  assert.equal(resumirCarteira(A,[revisao()],[publicacao()]).temPendencia,false);
  for(const p of [{...publicacao(),content_sha256:'b'.repeat(64)},{...publicacao(),source:'outra'}, {...publicacao(),confirmed_by:'inválido'}])
    assert.equal(resumirCarteira(A,[revisao()],[p]).situacao,'Conferir publicação');
});
test('fila alheia, publicação alheia e falha de leitura nunca viram campanha pronta ou fila vazia',()=>{
  for(const r of [resumirCarteira(A,[{...revisao(),business_id:B}],[]),resumirCarteira(A,[revisao()],[{...publicacao(),business_id:B}]),resumirCarteira(A,[],[],true)]){
    assert.equal(r.temPendencia,null);assert.equal(r.situacao,'Conferência indisponível');assert.doesNotMatch(r.titulo,/preparada|pronta/);
  }
});
test('ajustes, espera de revisão, recusa e primeiro envio têm próximas ações próprias',()=>{
  assert.equal(resumirCarteira(A,[revisao('changes_requested')],[]).situacao,'Ajustes solicitados');
  assert.equal(resumirCarteira(A,[revisao('awaiting_review')],[]).situacao,'Peça em revisão');
  assert.equal(resumirCarteira(A,[revisao('rejected')],[]).situacao,'Peça recusada');
  assert.equal(resumirCarteira(A,[],[]).situacao,'Sem peça recebida nesta fila');
});
function sessao({habilitado=true,usuario={id:U},erroAuth=null,ativo={status:'selecionado',negocio:{id:A}},row=linha(),erroBanco=null,atribuicao={business_id:A,operator_profile_id:G}}={}){
  const consultas=[],filtros=[];let adminChamado=0;
  const consulta=(nome,dados)=>({select(c){consultas.push({nome,colunas:c});return this;},eq(k,v){filtros.push([nome,k,v]);return this;},maybeSingle:async()=>({data:dados,error:erroBanco})});
  const supabase={auth:{getUser:async()=>({data:{user:usuario},error:erroAuth})},from:nome=>{
    if(nome==='agency_advertisers'){
      const q={select(){return q;},eq(){return q;},is(){return q;},order(){return q;},limit:async()=>({data:null,error:{code:'PGRST205'}})};return q;
    }
    return consulta(nome,row);
  }};
  const admin={from:nome=>consulta(nome,nome==='manager_accounts'?atribuicao:{id:G,full_name:'Gestor de teste'})};
  const mod=ambienteTs({ports:{react:{cache:fn=>fn},'@/lib/piloto-qa/acesso':{pilotoQaHabilitado:()=>habilitado},
    '@/lib/supabase/server':{createClient:async()=>supabase},'@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>ativo},
    '@/lib/supabase/admin':{createAdminClient:()=>{adminChamado++;return admin;}},
  }}).load('lib/agencia/da-sessao.ts');
  return {run:mod.carregarAgenciaDaSessao,consultas,filtros,admin:()=>adminChamado};
}
test('servidor não consulta banco nem admin quando portão QA está desligado',async()=>{
  const s=sessao({habilitado:false});assert.equal((await s.run()).status,'desligado');assert.equal(s.consultas.length,0);assert.equal(s.admin(),0);
});
test('servidor exige Auth validado, seleção exata e titular antes de qualquer leitura administrativa',async()=>{
  for(const opts of [{usuario:null},{erroAuth:{message:'falha'}},{ativo:{status:'selecao_invalida'}},{row:{...linha(),id:B}},{row:{...linha(),profile_id:G}},{erroBanco:{message:'falha'}}]){
    const s=sessao(opts);assert.equal((await s.run()).status,'indisponivel');assert.equal(s.admin(),0);
  }
});
test('servidor limita SELECT ao cadastro exato e responsável da atribuição; nenhuma escrita disponível',async()=>{
  const s=sessao(),r=await s.run();assert.equal(r.status,'agencia');assert.equal(r.contexto.gestor,'Gestor de teste');
  assert.ok(s.filtros.some(x=>x[0]==='businesses'&&x[1]==='profile_id'&&x[2]===U));
  assert.ok(s.filtros.some(x=>x[0]==='businesses'&&x[1]==='id'&&x[2]===A));
  assert.ok(s.filtros.some(x=>x[0]==='manager_accounts'&&x[1]==='business_id'&&x[2]===A));
  assert.equal(s.consultas[0].colunas,'id, profile_id, name, onboarding, monthly_budget');
});
test('atribuição alheia não revela nome do gestor, mas mantém titular já autorizado',async()=>{
  const s=sessao({atribuicao:{business_id:B,operator_profile_id:G}}),r=await s.run();assert.equal(r.status,'agencia');assert.equal(r.contexto.gestor,null);
  assert.equal(s.consultas.some(c=>c.nome==='profiles'),false);
});
test('portão existente exige flag e host QA exato, não domínio semelhante ou produção',()=>{
  const {pilotoQaHabilitado}=load('lib/piloto-qa/acesso.ts');
  assert.equal(pilotoQaHabilitado({flag:'true',supabaseUrl:'https://zskpijnqgkqwxksqmzmf.supabase.co'}),true);
  for(const url of ['https://ushccxpoxjikzqnwhgfd.supabase.co','https://zskpijnqgkqwxksqmzmf.supabase.co.fora.invalid','http://zskpijnqgkqwxksqmzmf.supabase.co'])assert.equal(pilotoQaHabilitado({flag:'true',supabaseUrl:url}),false);
  assert.equal(pilotoQaHabilitado({flag:'false',supabaseUrl:'https://zskpijnqgkqwxksqmzmf.supabase.co'}),false);
});
test('carteira real renderiza só linhas recebidas, sem simulação ou clientes inventados',()=>{
  const {CarteiraAgencia}=ambienteTs({ports:{'./agencia.module.css':css}}).load('components/agencia/CarteiraAgencia.tsx');
  const c=contexto.contextoAgenciaDoCadastro(linha(),U);
  const html=renderToStaticMarkup(React.createElement(CarteiraAgencia,{agencia:c.agencia,clientes:[{contexto:c,resumo:resumirCarteira(A,[revisao()],[])}],retorno:{busca:'',pendentes:false,pagina:1}}));
  assert.match(html,/Anunciante de teste/);assert.match(html,/Buscar cliente na carteira/);assert.match(html,/cliente nesta carteira/);
  assert.doesNotMatch(html,/Cliente exemplo|Simular 50|Dúú Gomes|Piligrin/);
});
test('50 vínculos explícitos cabem em cinco páginas; primeira página não mistura dados fora do recorte',()=>{
  const {CarteiraAgencia}=ambienteTs({ports:{'./agencia.module.css':css}}).load('components/agencia/CarteiraAgencia.tsx');
  const c=contexto.contextoAgenciaDoCadastro(linha(),U),resumo=resumirCarteira(A,[revisao()],[]);
  const clientes=Array.from({length:50},(_,i)=>({contexto:{...c,businessId:`${String(i+10).padStart(8,'0')}-1111-4111-8111-111111111111`,anunciante:`Cliente de ensaio ${i+1}`},resumo}));
  const html=renderToStaticMarkup(React.createElement(CarteiraAgencia,{agencia:c.agencia,clientes,retorno:{busca:'',pendentes:false,pagina:2}}));
  assert.match(html,/Página 2 de 5/);
  const corpo=html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1];assert.ok(corpo);
  assert.match(corpo,/Cliente de ensaio 11/);assert.doesNotMatch(corpo,/>Cliente de ensaio 1<|>Cliente de ensaio 21</);
});
test('gráfico mantém zero real e quebra nas lacunas, com tabela acessível dos dias',()=>{
  const {caminhosDiarios,GraficoInvestimento}=ambienteTs({ports:{'./inicio-cliente.module.css':css}}).load('components/agencia/GraficoInvestimento.tsx');
  const dias=[{dia:'2026-11-01',gasto:0,impressoes:0,cliques:0},{dia:'2026-11-02',gasto:null,impressoes:null,cliques:null},{dia:'2026-11-03',gasto:300,impressoes:20,cliques:2}];
  const caminhos=caminhosDiarios(dias,1000);assert.equal(caminhos.length,2);assert.ok(caminhos.every(p=>!p.includes('L')));
  const html=renderToStaticMarkup(React.createElement(GraficoInvestimento,{dias,moeda:'BRL',inconsistente:false}));assert.match(html,/Ver valores por dia/);assert.match(html,/Não medido/);assert.match(html,/0,00/);
});

test('Início real abre Anúncios com cliente, conta, período e retorno da carteira',()=>{
  const nada=()=>null;
  const {InicioDoCliente}=ambienteTs({ports:{'./agencia.module.css':css,'./inicio-cliente.module.css':css,
    './Comuns':{CabecalhoAgencia:nada,CaminhoDoCliente:nada,ProximoPassoAgencia:nada,Seta:nada},
    './GraficoInvestimento':{GraficoInvestimento:nada},
    '@/app/(protected)/inicio/SeletorDePeriodo':{SeletorDePeriodo:nada},
    '@/app/(protected)/inicio/AtualizarInicio':{AtualizarInicio:nada},
  }}).load('components/agencia/InicioDoCliente.tsx');
  const c=contexto.contextoAgenciaDoCadastro(linha(),U),periodo={desde:'2026-11-01',ate:'2026-11-07'};
  const html=renderToStaticMarkup(React.createElement(InicioDoCliente,{
    detalhe:{contexto:c,resumo:resumirCarteira(A,[revisao()],[]),retorno:{busca:'foto & cliente',pendentes:true,pagina:2}},
    dados:{contaId:'act_123',moeda:'BRL',periodo,fuso:'America/Sao_Paulo',coletadoEm:'2026-11-09T12:00:00Z'},
    resumo:{campanhas:1,entregaHistorica:true,campanhasObservadas:1,parcial:true,gasto:100,cliques:1,impressoes:2,dias:[],serieInconsistente:false},
    resultado:{ok:true,contas:[{id:'act_123'}]},intervalo:periodo,anuncios:'/anuncios?next=https://fora.invalid',
    anterior:false,pendencia:null,falhaPendencia:false,faixa:null,complemento:null,
  }));
  const href=html.match(/href="([^"]+)">Ver anúncios/)[1].replaceAll('&amp;','&'),u=new URL(href,'https://qa.invalid');
  assert.equal(u.pathname,'/anuncios');assert.equal(u.searchParams.get('cliente'),A);
  assert.equal(u.searchParams.get('conta'),'act_123');assert.equal(u.searchParams.get('desde'),periodo.desde);assert.equal(u.searchParams.get('ate'),periodo.ate);
  assert.equal(u.searchParams.get('busca_carteira'),'foto & cliente');assert.equal(u.searchParams.get('pagina_carteira'),'2');
  assert.equal(u.searchParams.get('pendentes_carteira'),'1');assert.equal(u.searchParams.has('next'),false);
});

test('assinatura legada recusa namespace alheio, travessia, URL e caminho codificado',()=>{
  const {caminhoDaPecaPertenceAoCliente:confere}=load('lib/agencia/caminho-da-peca.ts');
  assert.equal(confere(A,`${A}/imagem.jpg`),true);
  for(const p of [`${B}/imagem.jpg`,`${A}/../${B}/imagem.jpg`,`${A}/%2e%2e/foto.jpg`,`${A}//foto.jpg`,`https://fora.invalid/${A}/foto.jpg`,null])assert.equal(confere(A,p),false);
});
test('peça solicitada ausente não seleciona outra versão silenciosamente',()=>{
  const {CriativosDoCliente}=ambienteTs({ports:{'./agencia.module.css':css}}).load('components/agencia/CriativosDoCliente.tsx');
  const c=contexto.contextoAgenciaDoCadastro(linha(),U);
  const html=renderToStaticMarkup(React.createElement(CriativosDoCliente,{contexto:c,retorno:{busca:'',pendentes:false,pagina:1},
    itens:[{id:'revisao-'+R,nome:'Arquivo permitido de outra peça',imagemUrl:'https://imagem.invalid/privada',grupo:'biblioteca',estado:'Peça aprovada',tom:'positivo',criadoEm:'Enviado no ensaio'}],
    falhou:false,pecaSolicitada:'revisao-estranha',envio:null,criacao:null,analise:null}));
  assert.match(html,/Não foi possível abrir a peça solicitada/);assert.doesNotMatch(html,/<img|imagem.invalid|Arquivo permitido de outra peça/);
});
test('volta da fila preserva etapa, busca e cliente filtrado, sem usar filtro como autorização',()=>{
  const r=contexto.retornoDaCarteira({busca:'foto',etapa:'aprovado',filtro_cliente:A});
  const p=new URL(contexto.hrefDoCliente('/criativos',A,r),'https://qa.invalid').searchParams;
  const volta=contexto.hrefDaCarteira('/criativos',contexto.retornoDaCarteira(Object.fromEntries(p),true));
  assert.match(volta,/etapa=aprovado/);assert.match(volta,/filtro_cliente=/);assert.match(volta,/busca=foto/);
  const c=contexto.contextoAgenciaDoCadastro(linha(),U);assert.equal(contexto.selecionarVisaoAgencia(c,{cliente:B,filtro_cliente:A}),'invalido');
});
test('menu real mantém cliente e retorno apenas no vínculo exato; query repetida volta à agência',()=>{
  const c=contexto.contextoAgenciaDoCadastro(linha(),U);
  function menu(query){
    const {NavegacaoAgencia}=ambienteTs({ports:{
      'next/navigation':{usePathname:()=>'/inicio',useSearchParams:()=>new URLSearchParams(query)},
      'next/link':{default:({href,children,prefetch,...p})=>React.createElement('a',{href,...p},children)},
    }}).load('components/agencia/ContextoNoCasco.tsx');
    return renderToStaticMarkup(React.createElement(NavegacaoAgencia,{businessId:c.businessId,inicio:null,criativos:null}));
  }
  assert.match(menu(`cliente=${A}&busca_carteira=teste`),/criativos\?cliente=.*busca_carteira=teste/);
  assert.doesNotMatch(menu(`cliente=${B}`),/\?cliente/);
  assert.doesNotMatch(menu(`cliente=${A}&cliente=${A}`),/\?cliente/);
});

async function paginaDeInicio(busca,{alvo=A,qa=true}={}){
  let fonte=0,estadoLido=0;
  const q={select(){return this;},eq(){return this;},in(){return this;},order(){return this;},limit(){return this;},maybeSingle:async()=>({data:null,error:null})};
  const c=contexto.contextoAgenciaDoCadastro(linha(),U);
  const mod=ambienteTs({env:{NODE_ENV:'production'},ports:{
    'next/navigation':{redirect:()=>{throw Error('redirect inesperado');}},
    '@/lib/piloto-qa/acesso':{pilotoQaHabilitado:()=>qa},
    '@/lib/agencia/da-sessao':{carregarAgenciaDaSessao:async()=>({status:'agencia',contexto:c})},
    '@/lib/agencia/resumo-da-sessao':{carregarResumoDaCarteira:async()=>resumirCarteira(A,[revisao()],[])},
    '../agencia/actions':{abrirClienteAction:async()=>({erro:'Ensaio sem troca de sessão'})},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:U}},error:null})},from:()=>q})},
    '@/components/ui/FaixaReconectar':{FaixaReconectar:()=>null},
    '@/lib/estado/cliente':{estadoDoCliente:async()=>{estadoLido++;return {temNegocio:true,negocioId:alvo,diaSeguinte:{execucao:null,acumulado:null}};}},
    '@/lib/backend/anuncios-do-negocio':{anunciosDoNegocioSelecionado:async()=>{fonte++;return {ok:false,motivo:'indisponivel',mensagem:'Ensaio',contas:[],contaSelecionada:null};}},
    '@/lib/onboarding/pendencia-do-negocio':{lerPendenciaDoNegocio:async()=>({pendencia:null,reserva:null,falha:false}),aplicarAgendaConferida:x=>x},
    '@/app/(fluxo)/onboarding/concluido/agenda-actions':{carregarAgendaAction:async()=>{throw Error('agenda não esperada');}},
    '@/lib/dia-seguinte/dias-em-aberto':{diasAtrasados:async()=>[]},
    './TelaDoInicio':{TelaDoInicio:()=>null},'./agencia.module.css':css,
  }}).load('app/(protected)/inicio/page.tsx');
  return {elemento:await mod.default({searchParams:Promise.resolve(busca)}),fonte,estadoLido};
}
test('página real da carteira não chama Meta; detalhe estranho é recusado antes da fonte',async()=>{
  const carteira=await paginaDeInicio({});assert.equal(carteira.fonte,0);assert.equal(carteira.estadoLido,0);
  const estranho=await paginaDeInicio({cliente:B});assert.equal(estranho.fonte,0);assert.equal(estranho.estadoLido,0);
  const trocado=await paginaDeInicio({cliente:A},{alvo:B});assert.equal(trocado.fonte,0);
  const correto=await paginaDeInicio({cliente:A});assert.equal(correto.fonte,1);assert.equal(correto.elemento.props.detalheAgencia.contexto.businessId,A);
});
test('fora da QA a página conserva o percurso anterior e não ativa o modelo de agência',async()=>{
  const r=await paginaDeInicio({cliente:B},{qa:false});assert.equal(r.fonte,1);assert.equal(r.elemento.props.detalheAgencia,undefined);
});
