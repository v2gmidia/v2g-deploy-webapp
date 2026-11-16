// Reconstituição local: totais/dias observados no Gerenciador do Dúú em
// 14/11, recorte 01–07/11. IDs de teste; não é um payload capturado da API.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const load=ambienteTs().load;
const {lerInventarioMeta}=load('lib/anuncios/contrato-meta.ts');
const {resumirMeta,textoCoberturaMeta}=load('lib/inicio/resumo-meta.ts');
const {formatarConversas,somarConversas,DEFINICAO_CONVERSAS}=load('lib/anuncios/conversas-meta.ts');
const negocio='11111111-1111-4111-8111-111111111111',conta='act_123';
const periodo={desde:'2026-11-01',ate:'2026-11-07'};
const esperado={businessId:negocio,contaId:conta,periodo};
const serie=[ [4514,4454,88], [2937,4161,54], [5656,3538,49], [6687,5696,112], [2876,2654,61], [2918,3188,47], [2592,2438,55] ]
 .map(([gasto_centavos,impressoes,cliques_totais],i)=>({dia:`2026-11-0${i+1}`,gasto_centavos,impressoes,cliques_totais}));
function fixture(){
 const m={estado:'observado',gasto_centavos:28180,impressoes:26129,cliques_totais:466,cliques_no_link:null,
  conversas_whatsapp:null,conversas_mensagem:'105',definicao_conversas_mensagem:DEFINICAO_CONVERSAS,
  dias_com_observacao:serie.map(d=>d.dia),serie_diaria:serie,entrega_observada_no_periodo:true,motivos:[]};
 const vazio={estado:'sem_dados',gasto_centavos:null,impressoes:null,cliques_totais:null,cliques_no_link:null,
  conversas_whatsapp:null,conversas_mensagem:null,dias_com_observacao:[],serie_diaria:[],entrega_observada_no_periodo:null,motivos:[]};
 const c=(id,metricas)=>({id,nome:'Reconstituição local',status_configurado:'PAUSED',status_efetivo:'PAUSED',metricas,conjuntos:[]});
 return {versao:'e28-meta-ads-read-v1',business_id:negocio,conta_id:conta,id_execucao:null,origem_vinculo:'ad_accounts',fonte:'meta_marketing_api',
  periodo,moeda:'BRL',fuso:'America/Sao_Paulo',coletado_em:'2026-11-14T18:00:00Z',avisos:[],
  campanhas:[c('1',m),...Array.from({length:9},(_,i)=>c(String(i+2),structuredClone(vazio)))]};
}

test('reprodução do Dúú: 105, gráfico e totais; nove sem dados não são leitura incompleta',()=>{
 const d=lerInventarioMeta(fixture(),esperado);assert.ok(d);const r=resumirMeta(d);
 assert.equal(r.conversasMensagem,'105');assert.equal(r.gasto,28180);assert.equal(r.cliques,466);assert.equal(r.impressoes,26129);
 assert.equal(r.dias.length,7);assert.equal(r.parcial,false);
 assert.equal(textoCoberturaMeta(r),'1 campanha com dados no período; 9 sem registros neste período.');
 assert.equal(d.campanhas[0].metricas.conversas,null);
});
test('zero explícito, decimal exato, ausência, valores extremos e soma de campanhas',()=>{
 assert.equal(somarConversas(['0','0']),'0');assert.equal(somarConversas(['0.1','0.2']),'0.3');
 for(const valores of [[],['1',null],['1',undefined],['NaN'],['-1'],['1e2'],['1.1234567'],['999999999999999','1']])assert.equal(somarConversas(valores),null);
 assert.equal(formatarConversas('1234.125'),'1.234,125');assert.equal(formatarConversas('0'),'0');
 assert.equal(formatarConversas(null),'Não medido');
});
test('backend antigo ou definição errada não reaproveita WhatsApp; preserva gasto válido',()=>{
 for(const mudar of [m=>{delete m.conversas_mensagem;delete m.definicao_conversas_mensagem;},m=>m.definicao_conversas_mensagem='lead',m=>m.conversas_mensagem='NaN']){
  const raw=fixture(),m=raw.campanhas[0].metricas;m.conversas_whatsapp='999';mudar(m);
  const r=resumirMeta(lerInventarioMeta(raw,esperado));assert.equal(r.conversasMensagem,null);assert.equal(r.gasto,28180);
 }
});
test('campanha observada sem conversas deixa agregado desconhecido; zero é conservado',()=>{
 const d=lerInventarioMeta(fixture(),esperado);const a=d.campanhas[0];
 d.campanhas=[a,{...a,id:'2',metricas:{...a.metricas,conversasMensagem:null}}];
 assert.equal(resumirMeta(d).conversasMensagem,null);
 d.campanhas[1].metricas.conversasMensagem='0';assert.equal(resumirMeta(d).conversasMensagem,'105');
 a.conjuntos=[{metricas:{conversasMensagem:'999'},anuncios:[{metricas:{conversasMensagem:'888'}}]}];
 assert.equal(resumirMeta(d).conversasMensagem,'105');
});
test('incompletude real permanece avisada; sem_dados contraditório é recusado',()=>{
 const d=lerInventarioMeta(fixture(),esperado);d.campanhas[0].metricas.estado='parcial';
 assert.match(textoCoberturaMeta(resumirMeta(d)),/leitura.*incompleta/);
 const raw=fixture();raw.campanhas[1].metricas.conversas_mensagem='5';raw.campanhas[1].metricas.definicao_conversas_mensagem=DEFINICAO_CONVERSAS;
 assert.equal(lerInventarioMeta(raw,esperado),null);
});
test('novas conversas não atravessam negócio, conta ou período',()=>{
 for(const alterar of [{businessId:'22222222-2222-4222-8222-222222222222'},{contaId:'act_456'},{periodo:{desde:'2026-11-02',ate:'2026-11-07'}}])
  assert.equal(lerInventarioMeta(fixture(),{...esperado,...alterar}),null);
});
test('Início real apresenta 105 com definição correta, período, gráfico e nova cobertura',()=>{
 const css={default:new Proxy({},{get:(_,k)=>k})};
 const {InicioDoCliente}=ambienteTs({ports:{'./agencia.module.css':css,'./inicio-cliente.module.css':css,
  '@/app/(protected)/inicio/SeletorDePeriodo':{SeletorDePeriodo:()=>null},'@/app/(protected)/inicio/AtualizarInicio':{AtualizarInicio:()=>null},
 }}).load('components/agencia/InicioDoCliente.tsx');
 const dados=lerInventarioMeta(fixture(),esperado);
 const html=renderToStaticMarkup(React.createElement(InicioDoCliente,{detalhe:{contexto:{businessId:negocio,agencia:'Agência de teste',anunciante:'Reconstituição Dúú',verbaMensal:3000,praca:'Todo o estado do Rio de Janeiro'},retorno:{},resumo:{temPendencia:false}},
  dados,resumo:resumirMeta(dados),resultado:{ok:true,dados,contas:[]},intervalo:periodo,pendencia:null,falhaPendencia:false,faixa:null,complemento:null}));
 assert.match(html,/Conversas por mensagem/);assert.match(html,/>105<\/dd>/);assert.match(html,/9 sem registros neste período/);
 assert.doesNotMatch(html,/Resultados parciais|Conversas no WhatsApp/);assert.match(html,/01\/11\/2026 – 07\/11\/2026/);
 assert.match(html,/Investimento ao longo do tempo/);assert.match(html,/mais de um canal/);
});
