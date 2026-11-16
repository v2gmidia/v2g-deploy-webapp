import assert from 'node:assert/strict';
import test from 'node:test';
import { ambienteTs } from './test-utils/ts-isolado.mjs';
const load=ambienteTs().load;
const {dividirPeriodo,reunirInventarios}=load('lib/anuncios/intervalo-amplo.ts');
const {resumirMeta}=load('lib/inicio/resumo-meta.ts');
const periodo={desde:'2026-01-01',ate:'2026-03-31'};
const janelas=dividirPeriodo(periodo);
const metrica=dia=>({estado:'parcial',gasto:100,impressoes:10,cliques:1,conversas:null,conversasMensagem:'0.1',
  dias:[dia],entregaObservada:true,serieDiaria:{estado:'disponivel',dias:[{dia,gasto:100,impressoes:10,cliques:1}]}});
function partes(){return janelas.map((p,i)=>({businessId:'a',contaId:'act_1',moeda:'BRL',fuso:'America/Sao_Paulo',periodo:p,
  coletadoEm:`2026-11-16T12:00:0${i}Z`,campanhas:[{id:'1',nome:'Exemplo',statusConfigurado:'ACTIVE',statusEfetivo:'ACTIVE',metricas:metrica(p.desde),
    conjuntos:[{id:'2',campanhaId:'1',metricas:metrica(p.desde),anuncios:[{id:'3',campanhaId:'1',conjuntoId:'2',metricas:metrica(p.desde)}]}]}]}));}

test('janeiro a março: janelas inclusivas, 90 dias exatos, sem sobreposição',()=>{
  assert.equal(JSON.stringify(janelas),JSON.stringify([{desde:'2026-01-01',ate:'2026-01-31'},{desde:'2026-02-01',ate:'2026-03-03'},{desde:'2026-03-04',ate:'2026-03-31'}]));
  for(const p of janelas) assert.ok((Date.parse(p.ate)-Date.parse(p.desde))/86400000<31);
});
test('bissexto e virada de ano não duplicam nem pulam dias',()=>{
  for(const p of [{desde:'2024-02-01',ate:'2024-03-31'},{desde:'2025-12-15',ate:'2026-02-20'}]){
    const j=dividirPeriodo(p);assert.equal(j[0].desde,p.desde);assert.equal(j.at(-1).ate,p.ate);
    for(let i=1;i<j.length;i++)assert.equal(Date.parse(j[i].desde)-Date.parse(j[i-1].ate),86400000);
  }
});
test('agrega por identidade e nível; soma decimal exata; mantém série de 90 dias',()=>{
  const d=reunirInventarios(partes(),periodo);const r=resumirMeta(d);
  assert.equal(d.campanhas.length,1);assert.equal(r.gasto,300);assert.equal(r.conversasMensagem,'0.3');
  assert.equal(d.campanhas[0].conjuntos[0].anuncios[0].metricas.gasto,300);
  assert.equal(r.dias.length,90);assert.equal(r.dias[1].gasto,null);assert.equal(r.dias.at(-1).dia,'2026-03-31');
  assert.equal(d.coletadoEm,partes()[0].coletadoEm);assert.equal(r.parcial,true);
});
test('campo desconhecido em trecho observado não vira parcela zero',()=>{
  const p=partes();p[1].campanhas[0].metricas.gasto=null;
  assert.equal(resumirMeta(reunirInventarios(p,periodo)).gasto,null);
});
test('campanha ausente em uma janela mantém medição parcial e não ganha status atual',()=>{
  const p=partes();p[2].campanhas=[];const d=reunirInventarios(p,periodo);
  assert.equal(d.campanhas[0].statusEfetivo,null);assert.equal(d.campanhas[0].metricas.estado,'parcial');
  assert.equal(resumirMeta(d).gasto,200);assert.equal(resumirMeta(d).dias.at(-1).gasto,null);
});
test('janela faltante/duplicada, conta, negócio, moeda ou fuso diferente invalidam tudo',()=>{
  assert.equal(reunirInventarios(partes().slice(0,2),periodo),null);
  for(const chave of ['businessId','contaId','moeda','fuso']){const p=partes();p[1][chave]='outra';assert.equal(reunirInventarios(p,periodo),null);}
  const p=partes();p[1].periodo=p[0].periodo;assert.equal(reunirInventarios(p,periodo),null);
});
test('mudança de hierarquia não duplica o mesmo anúncio no total',()=>{
  const p=partes();p[1].campanhas[0].conjuntos[0].id='outro';
  assert.equal(reunirInventarios(p,periodo),null);
});
test('overflow recusa número; inventário vazio não fabrica zero',()=>{
  const p=partes();p[0].campanhas[0].metricas.gasto=Number.MAX_SAFE_INTEGER;
  assert.equal(resumirMeta(reunirInventarios(p,periodo)).gasto,null);
  const v=partes().map(p=>({...p,campanhas:[]}));assert.equal(resumirMeta(reunirInventarios(v,periodo)).gasto,null);
});
