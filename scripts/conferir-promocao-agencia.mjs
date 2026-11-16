import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { ambienteTs } from './test-utils/ts-isolado.mjs';
const load=ambienteTs().load;
const {agenciaHabilitada}=load('lib/agencia/habilitacao.ts');
const prod={flag:'true',ambiente:'production',supabaseUrl:'https://ushccxpoxjikzqnwhgfd.supabase.co'};
test('produção só habilita apresentação com flag, ambiente e banco exatos',()=>{
  assert.equal(agenciaHabilitada(prod),true);
  for(const c of [{},{...prod,flag:undefined},{...prod,flag:'false'},{...prod,ambiente:'preview'},
    {...prod,supabaseUrl:'https://ushccxpoxjikzqnwhgfd.supabase.co.fora.invalid'},
    {...prod,supabaseUrl:'http://ushccxpoxjikzqnwhgfd.supabase.co'},
    {...prod,supabaseUrl:'https://ushccxpoxjikzqnwhgfd.supabase.co/outro'},
    {...prod,supabaseUrl:'https://user@ushccxpoxjikzqnwhgfd.supabase.co'}]) assert.equal(agenciaHabilitada(c),false);
});
test('portão de QA continua preso ao banco QA e não libera produção',()=>{
  assert.equal(agenciaHabilitada({pilotoQa:'true',supabaseUrl:'https://zskpijnqgkqwxksqmzmf.supabase.co'}),true);
  assert.equal(agenciaHabilitada({pilotoQa:'true',supabaseUrl:prod.supabaseUrl}),false);
});
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',U='33333333-3333-4333-8333-333333333333',X='44444444-4444-4444-8444-444444444444';
const {raizUnicaElegivel,conferirVinculos}=load('lib/agencia/vinculos.ts');
const v={agency_business_id:A,advertiser_business_id:B,owner_profile_id:U,advertiser_name:'Dúú',legacy_shared_business:false,revoked_at:null};
test('preferência da agência não aumenta negócios elegíveis nem alcança outra carteira',()=>{
  const permitidos=[{id:A},{id:B}],antes=JSON.stringify(permitidos);
  assert.equal(raizUnicaElegivel([v],permitidos),A);
  assert.equal(raizUnicaElegivel([v],[{id:B}]),null);
  assert.equal(raizUnicaElegivel([v],[...permitidos,{id:X}]),null);
  assert.equal(JSON.stringify(permitidos),antes);
  assert.equal(conferirVinculos([{...v,owner_profile_id:X}],U),null);
  assert.equal(conferirVinculos([{...v,revoked_at:'2026-11-12T00:00:00Z'}],U),null);
});
test('uma relação não paga nem concede acesso ao filho',()=>{
  const {negociosLiberados}=load('lib/multiconta/elegibilidade.ts');
  const entrada={negocios:[{id:A,name:'Piligrin',created_at:'2026-11-12T00:00:00Z'},
    {id:B,name:'Dúú',created_at:'2026-11-12T01:00:00Z'}],pedidos:[],perfilId:U,emailVerificado:'dono@teste.invalid',
    legadoEm:'2026-10-07T00:00:00Z',operador:false,acessosContratados:[],acessosPilotoQa:[]};
  assert.deepEqual(Array.from(negociosLiberados(entrada),n=>n.id),[A]);
});
test('produção não infere agência de nome/onboarding e não transplanta concessão QA',()=>{
  const sessao=readFileSync('lib/agencia/da-sessao.ts','utf8');
  assert.match(sessao,/pilotoQaHabilitado\(\) \? contextoAgenciaDoCadastro/);
  assert.doesNotMatch(readFileSync('lib/multiconta/ativo.ts','utf8'),/ampliarCarteiraQa/);
});
test('cadastros legados mantêm o mesmo veredito e próximas ações de produção',()=>{
  const atual=load('lib/onboarding/conclusao.ts'),legado=load('lib/onboarding/conclusao-legada.ts');
  const respostas=Object.fromEntries(['nome','ramo','descricao','praca'].map(k=>[k,{texto:'Resposta completa do negócio'}]));
  const base={avg_ticket_min:null,avg_ticket_max:null,avg_direct_cost:null,target_profit_per_customer:null,
    site_url:null,onboarding:{versao:1,respostas,marca:{em:'2026-11-01T00:00:00Z',aparencia:'Azul',coresConfirmadas:[],siteNaoTenho:true},
      conclusao:{em:'2026-11-01T00:00:00Z',proximoPasso:'agendamento_pendente'}}};
  assert.equal(atual.estadoDaConclusao(base).concluido,legado.estadoDaConclusao(base).concluido);
  assert.equal(atual.pendenciaDoOnboarding(base,false).href,'/onboarding/contas');
  for(const dados of [base,{...base,avg_ticket_min:100,avg_ticket_max:100,avg_direct_cost:50,target_profit_per_customer:20}])
    assert.equal(JSON.stringify(atual.pendenciaDoOnboarding(dados,true)),JSON.stringify(legado.pendenciaDoOnboarding(dados,true)));
});
test('cadastro operacional do anunciante não transforma custo desconhecido em pendência financeira',()=>{
  const atual=load('lib/onboarding/conclusao.ts');
  const respostas=Object.fromEntries(['operador','nome','contratante','ramo','descricao','publico','praca','destino','campanha']
    .map(k=>[k,{texto:'Resposta completa do negócio'}]));
  const dados={site_url:null,onboarding:{versao:2,respostas,
    marca:{em:'2026-11-01T00:00:00Z',aparencia:'Azul',coresConfirmadas:[],siteNaoTenho:true},
    conclusao:{em:'2026-11-01T00:00:00Z',proximoPasso:'agendamento_pendente'}}};
  assert.equal(atual.estadoDaConclusao(dados).concluido,true);
});
