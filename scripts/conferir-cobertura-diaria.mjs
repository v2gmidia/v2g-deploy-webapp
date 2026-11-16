import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const load = ambienteTs().load;
const {lerInventarioMeta} = load('lib/anuncios/contrato-meta.ts');
const {resumirMeta} = load('lib/inicio/resumo-meta.ts');
const {reunirInventarios} = load('lib/anuncios/intervalo-amplo.ts');
const esperado = {businessId:'11111111-1111-4111-8111-111111111111',contaId:'act_123',periodo:{desde:'2026-11-01',ate:'2026-11-03'}};
function fixture(hoje='2026-11-04') {
  return {versao:'e28-meta-ads-read-v1',business_id:esperado.businessId,conta_id:esperado.contaId,
    id_execucao:null,origem_vinculo:'ad_accounts',fonte:'meta_marketing_api',periodo:esperado.periodo,
    moeda:'BRL',fuso:'America/Sao_Paulo',coletado_em:hoje+'T12:00:00Z',avisos:[],
    campanhas:[{id:'1',nome:'Fictícia',status_configurado:'PAUSED',status_efetivo:'PAUSED',conjuntos:[],metricas:{
      estado:'parcial',gasto_centavos:2500,impressoes:1400,cliques_totais:20,cliques_no_link:null,
      conversas_whatsapp:null,conversas_mensagem:'2',definicao_conversas_mensagem:'onsite_conversion.messaging_conversation_started_7d',
      entrega_observada_no_periodo:true,dias_com_observacao:['2026-11-01'],motivos:['cobertura_ou_campos_incompletos'],
      serie_diaria:[{dia:'2026-11-01',gasto_centavos:2500,impressoes:1400,cliques_totais:20}],
      cobertura_diaria:{versao:'meta-dias-fechados-v1',dias_sem_veiculacao:['2026-11-02','2026-11-03'].filter(d=>d<hoje),dia_em_atualizacao:hoje<='2026-11-03'?hoje:null},
    }}]};
}
const metrica = raw => raw.campanhas[0].metricas;
const resumo = raw => resumirMeta(lerInventarioMeta(raw,esperado));
test('período fechado: série completa, zeros confirmados e totais preservados',()=>{
  const r=resumo(fixture());
  assert.deepEqual(Array.from(r.dias,d=>d.gasto),[2500,0,0]);
  assert.equal(r.dias[1].situacao,'sem_veiculacao');
  assert.equal(r.gasto,2500); assert.equal(r.impressoes,1400); assert.equal(r.conversasMensagem,'2');
  assert.equal(r.parcial,false); assert.equal(r.diaEmAtualizacao,null);
});
test('hoje sem linha continua desconhecido e apenas hoje recebe atualização',()=>{
  const r=resumo(fixture('2026-11-03'));
  assert.deepEqual(Array.from(r.dias,d=>d.gasto),[2500,0,null]);
  assert.equal(r.dias[2].situacao,'atualizando');assert.equal(r.diaEmAtualizacao,'2026-11-03');assert.equal(r.parcial,false);
});
test('backend antigo e falhas de campo não se tornam zeros ou resultados completos',()=>{
  const raw=fixture();delete metrica(raw).cobertura_diaria;
  assert.equal(resumo(raw).dias[1].gasto,null);assert.equal(resumo(raw).parcial,true);
  const falha=fixture('2026-11-03');metrica(falha).serie_diaria[0].gasto_centavos=null;metrica(falha).gasto_centavos=null;
  assert.equal(resumo(falha).dias[0].gasto,null);assert.equal(resumo(falha).parcial,true);
});
test('prova inválida, sobreposição, futuro, fuso e dia aberto errado são recusados',()=>{
  for(const mudar of [
    c=>c.dias_sem_veiculacao.push('2026-11-01'),c=>c.dias_sem_veiculacao.push('2026-11-03'),
    c=>c.dias_sem_veiculacao.push('2026-11-04'),c=>c.dias_sem_veiculacao=[],
    c=>c.dia_em_atualizacao='2026-11-02',c=>c.versao='desconhecida',
  ]){const raw=fixture('2026-11-03');mudar(metrica(raw).cobertura_diaria);assert.equal(lerInventarioMeta(raw,esperado),null);}
  const raw=fixture();raw.fuso=null;assert.equal(lerInventarioMeta(raw,esperado),null);
});
test('período inteiro sem veiculação é zero confirmado; inventário vazio permanece desconhecido',()=>{
  const raw=fixture(),m=metrica(raw);
  Object.assign(m,{estado:'sem_dados',gasto_centavos:null,impressoes:null,cliques_totais:null,conversas_mensagem:null,entrega_observada_no_periodo:null,dias_com_observacao:[],serie_diaria:[]});
  m.cobertura_diaria.dias_sem_veiculacao=['2026-11-01','2026-11-02','2026-11-03'];
  assert.equal(resumo(raw).gasto,0);assert.equal(resumo(raw).conversasMensagem,'0');assert.equal(resumo(raw).parcial,false);
  raw.campanhas=[];assert.equal(resumo(raw).gasto,null);assert.equal(resumo(raw).dias.length,0);
});
test('campanhas com entregas em dias diferentes somam zeros confirmados sem apagar dias',()=>{
  const raw=fixture(),outra=structuredClone(raw.campanhas[0]);outra.id='2';
  outra.metricas.dias_com_observacao=['2026-11-02'];outra.metricas.serie_diaria[0].dia='2026-11-02';
  outra.metricas.cobertura_diaria.dias_sem_veiculacao=['2026-11-01','2026-11-03'];raw.campanhas.push(outra);
  assert.deepEqual(Array.from(resumo(raw).dias,d=>d.gasto),[2500,2500,0]);assert.equal(resumo(raw).gasto,5000);
});
test('composição de meses preserva atualização sem esconder parcela incompleta',()=>{
  const outubro=fixture();outubro.periodo={desde:'2026-10-01',ate:'2026-10-31'};
  metrica(outubro).dias_com_observacao=['2026-10-01'];metrica(outubro).serie_diaria[0].dia='2026-10-01';
  metrica(outubro).cobertura_diaria.dias_sem_veiculacao=Array.from({length:30},(_,i)=>`2026-10-${String(i+2).padStart(2,'0')}`);
  const um=lerInventarioMeta(outubro,{...esperado,periodo:outubro.periodo}),dois=lerInventarioMeta(fixture('2026-11-03'),esperado);
  let r=resumirMeta(reunirInventarios([um,dois],{desde:'2026-10-01',ate:'2026-11-03'}));
  assert.equal(r.parcial,false);assert.equal(r.diaEmAtualizacao,'2026-11-03');
  assert.equal(r.dias.length,34);assert.equal(r.dias[0].gasto,2500);assert.equal(r.dias[31].gasto,2500);assert.equal(r.dias[32].gasto,0);
  um.campanhas[0].metricas.leituraIncompleta=true;
  r=resumirMeta(reunirInventarios([um,dois],{desde:'2026-10-01',ate:'2026-11-03'}));assert.equal(r.parcial,true);
});
test('campanhas sem entrega não apagam conversas observadas em outra campanha',()=>{
  const raw=fixture('2026-11-03'),outra=structuredClone(raw.campanhas[0]);outra.id='2';
  Object.assign(outra.metricas,{estado:'sem_dados',gasto_centavos:null,impressoes:null,cliques_totais:null,conversas_mensagem:null,
    entrega_observada_no_periodo:null,dias_com_observacao:[],serie_diaria:[]});
  outra.metricas.cobertura_diaria.dias_sem_veiculacao=['2026-11-01','2026-11-02'];raw.campanhas.push(outra);
  assert.equal(resumo(raw).conversasMensagem,'2');assert.equal(resumo(raw).gasto,2500);assert.equal(resumo(raw).parcial,false);
});
test('hoje com valor conserva a medição e avisa somente sua atualização',()=>{
  const raw=fixture('2026-11-03'),m=metrica(raw);
  m.dias_com_observacao.push('2026-11-03');m.serie_diaria.push({dia:'2026-11-03',gasto_centavos:100,impressoes:10,cliques_totais:1});
  m.gasto_centavos+=100;m.impressoes+=10;m.cliques_totais+=1;
  const r=resumo(raw);assert.equal(r.dias[2].gasto,100);assert.equal(r.dias[2].situacao,'atualizando');assert.equal(r.parcial,false);
});
test('gráfico informa sem veiculação e atualização na data certa',()=>{
  const {GraficoDiario}=ambienteTs({ports:{'./ResumoMetaDoInicio.module.css':{default:new Proxy({},{get:(_,k)=>k})}}}).load('app/(protected)/inicio/GraficoDiario.tsx');
  const r=resumo(fixture('2026-11-03'));
  const html=renderToStaticMarkup(React.createElement(GraficoDiario,{dias:r.dias,moeda:'BRL',inconsistente:false,diaEmAtualizacao:r.diaEmAtualizacao}));
  assert.match(html,/Hoje, 03\/11 · em atualização/);assert.match(html,/Sem veiculação/);assert.match(html,/Aguardando atualização/);
});
