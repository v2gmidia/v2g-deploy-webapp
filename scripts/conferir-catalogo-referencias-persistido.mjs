import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
import {fixtureContextoV2,BIZ,PERFIL,IDS} from './test-utils/contexto-referencia-v2.mjs';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
const puro=ambienteTs(),{hashRegistroContexto:hash}=puro.load('lib/criativos/geracao/contexto-referencia-publica.ts');
const {hashDoPedido}=puro.load('lib/criativos/pedido-imagem.ts');
const fixture=()=>fixtureContextoV2({hashRegistroContexto:hash,hashDoPedido});
function harness() {
  const s={perfil:PERFIL,ativo:BIZ,dono:PERFIL,nicho:'Barbearia',rows:[fixture().catalogo],erro:false,admin:0,consultas:0};
  const env={V2G_CREATIVE_REFERENCE_PILOT_ENABLED:'true'};
  const a=ambienteTs({env,ports:{
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>({status:'selecionado',negocio:{id:s.ativo}})},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:s.perfil?{id:s.perfil}:null},error:null})},from(t){
      assert.equal(t,'businesses');const filtros={};const q={select(c){for(const k of ['id','profile_id','niche'])assert.ok(c.split(', ').includes(k));return q;},
        eq(k,v){filtros[k]=v;return q;},async maybeSingle(){assert.equal(filtros.id,BIZ);assert.equal(filtros.profile_id,PERFIL);
          return {error:null,data:{id:BIZ,profile_id:s.dono,niche:s.nicho}};}};return q;}})},
    '@/lib/supabase/admin':{createAdminClient:()=>{s.admin++;return {from(t){assert.equal(t,'creative_reference_catalog');const q={select(c){
      for(const k of ['public_reference_id','version','manifest','manifest_sha256','human_state','reviewed_by','reviewed_at','valid_until','revoked_at','created_at'])assert.ok(c.split(', ').includes(k));return q;},
      order(){return q;},async limit(n){assert.equal(n,41);s.consultas++;return s.erro?{error:{message:'SQL PRIVADO'},data:null}:{error:null,data:s.rows};}};return q;}};}},
  }});
  return {s,env,ler:()=>a.load('lib/jev/referencias-aprovadas-da-sessao.ts').carregarReferenciasAprovadasDaSessao(BIZ,fixture().agora)};
}

test('catalogo persistente entrega so metadados uteis; revisao nao vira consentimento nem imagem',async()=>{
  const h=harness(),r=await h.ler();assert.equal(r.estado,'disponivel');assert.equal(r.referencias.length,1);
  assert.equal(r.referencias[0].idPublico,fixture().pedido.payload.referenciaId);
  assert.ok(!JSON.stringify(r).includes('approved_by'));assert.ok(!JSON.stringify(r).includes('storage_path'));
  assert.equal(h.s.admin,1);assert.equal(h.s.consultas,1);
});
test('OFF nao abre sessao/admin/fonte',async()=>{const h=harness();h.env.V2G_CREATIVE_REFERENCE_PILOT_ENABLED='false';assert.equal((await h.ler()).estado,'desligado');assert.equal(h.s.admin,0);});
test('sem sessao, outro negocio, dono divergente ou outro ramo negam antes de admin',async()=>{
  for(const patch of [{perfil:null},{ativo:IDS[0]},{dono:IDS[0]},{nicho:'Manicure'}]){const h=harness();Object.assign(h.s,patch);assert.equal((await h.ler()).estado,'acesso_recusado');assert.equal(h.s.admin,0);}
});
test('tabela/fonte indisponivel nao se apresenta como catalogo vazio nem usa lista estatica',async()=>{
  const h=harness();h.s.erro=true;const r=await h.ler();assert.equal(r.estado,'indisponivel');assert.ok(!JSON.stringify(r).includes('SQL'));
});
test('catalogo pendente, expirado, revogado e sem direcao nao entra em aprovados',async()=>{
  for(const patch of [{human_state:'pending'},{human_state:'rejected'},{revoked_at:fixture().agora},{valid_until:fixture().agora}]) {
    const h=harness();Object.assign(h.s.rows[0],patch);const r=await h.ler();assert.equal(r.estado,'disponivel');assert.equal(r.referencias.length,0);
  }
  const h=harness();h.s.rows[0].manifest.direcao_visual_abstrata=null;assert.equal((await h.ler()).referencias.length,0);
});
test('nova revisao revogada nao ressuscita referencia da versao anterior',async()=>{
  const h=harness();const old=fixture().catalogo,newer=structuredClone(old);newer.version=2;newer.human_state='revoked';newer.revoked_at=fixture().agora;
  h.s.rows=[newer,old];assert.equal((await h.ler()).referencias.length,0);
});
test('resultado limitado sinaliza corte; nenhuma leitura de arquivo ou URL externa',async()=>{
  const h=harness();h.s.rows=Array.from({length:41},(_,i)=>{const r=fixture().catalogo;r.public_reference_id=String(700155112131034n+BigInt(i));
    r.manifest.id_publico=r.public_reference_id;r.manifest.url=`https://www.facebook.com/ads/library/?id=${r.public_reference_id}`;
    r.manifest_sha256=hash(r.manifest);return r;});const r=await h.ler();assert.equal(r.truncado,true);assert.equal(r.referencias.length,40);
});
test('seletor publico continua util sozinho e explica que escolha nao autoriza geracao',()=>{
  const a=ambienteTs({ports:{'./referencias-do-nicho.module.css':{default:{}}}});
  const {ReferenciasDoNicho}=a.load('app/(protected)/criativos/ReferenciasDoNicho.tsx');
  const html=renderToStaticMarkup(React.createElement(ReferenciasDoNicho,{valor:'',escolher(){}}));
  assert.equal((html.match(/href="https:\/\/www.facebook.com\/ads\/library\/\?id=/g)||[]).length,10);
  assert.match(html,/guarda sua preferência/);assert.match(html,/sem resultado de vendas comprovado/);
  assert.match(html,/identidade autorizada/);assert.match(html,/rel="noopener noreferrer"/);
  assert.match(html,/aria-label="Usar referência do anúncio 700155112131034"/);
});
