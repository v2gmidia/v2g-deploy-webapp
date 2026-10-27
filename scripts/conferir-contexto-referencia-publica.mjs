/** Contrato/loader reais, registros FICTICIOS; sem .env, rede, banco real ou imagem de terceiro. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
import {fixtureContextoV2,BIZ as biz,REQ as req,PERFIL as perfil,IDS} from './test-utils/contexto-referencia-v2.mjs';
const a=ambienteTs();
const modulo=a.load('lib/criativos/geracao/contexto-referencia-publica.ts');
const {prepararContextoReferenciaPublica:preparar,hashRegistroContexto:hash}=modulo;
const {hashDoPedido}=a.load('lib/criativos/pedido-imagem.ts');
const entrada=()=>fixtureContextoV2({hashRegistroContexto:hash,hashDoPedido});
function rehash(e){for(const k of ['contexto','marca','referencia','catalogo'])e[k].manifest_sha256=hash(e[k].manifest);e.referencia.catalog_sha256=e.catalogo.manifest_sha256;return e;}

test('duas fontes e cinco provas derivadas das mesmas aprovacoes, sem fabricar revisores ou copiar midia',()=>{
  const e=entrada(),r=preparar(e);assert.equal(r.ok,true,JSON.stringify(r));const m=r.manifesto;
  assert.equal(m.materiais.length,1);assert.equal(m.materiais[0].uso,'logo');
  assert.equal(m.referencia_publica.id_publico,e.pedido.payload.referenciaId);
  assert.equal(m.evidencias_persistidas.autorizado_por,perfil);
  assert.equal(m.evidencias_persistidas.contexto_revisado_por,e.contexto.approved_by);
  assert.equal(m.evidencias_persistidas.marca_revisada_por,e.marca.approved_by);
  assert.equal(m.evidencias_persistidas.referencia_revisada_por,e.referencia.approved_by);
  assert.match(m.evidencias_persistidas.aprovacoes_sha256,/^[a-f0-9]{64}$/);
  e.catalogo.manifest.direcao_visual_abstrata='MUTADO';assert.match(m.referencia_publica.direcao_visual_abstrata,/FIXTURE/);
});

test('manifesto atravessa loader persistente REAL de 07/08 e coincide campo a campo, inclusive cinco provas e hash normalizado',()=>{
  const e=entrada(),r=preparar(e);assert.equal(r.ok,true,JSON.stringify(r));
  const backend='C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g';
  const codigo=`import asyncio,json,sys
from datetime import datetime
from uuid import UUID
from src.imagem.geracao_contexto_v2 import ContextoPersistenteV2
from src.imagem.geracao_contrato import hash_do_pedido,pedido_visual
d=json.load(sys.stdin)
class Sql:
 async def query(self,sql,params):
  if 'left join public.creative_generation_context_approvals' in sql:
   return [dict(id=d['pedido']['id'],payload=d['pedido']['payload'],content_hash=d['pedido']['content_hash'],status=d['pedido']['status'],pedido_criado_em=d['pedido']['created_at'],niche='Barbearia',onboarding={'marca':d['onboardingMarca']},contexto=d['contexto'],marca=d['marca'],referencia=d['referencia'],catalogo=d['catalogo'],versao_catalogo_vigente=d['versaoCatalogoVigente'])]
  if "uso='logo'" in sql: return [d['logoVigente']]
  raise AssertionError('SQL inesperado')
async def main():
 c=await ContextoPersistenteV2(Sql(),UUID(d['profileId']),UUID(d['pedido']['id']),agora=lambda:datetime.fromisoformat(d['agora'].replace('Z','+00:00')))(UUID(d['pedido']['business_id']))
 assert c is not None,'loader recusou fixture'
 m=c.model_dump(mode='json'); s=m|{'payload':d['pedido']['payload']}
 print(json.dumps(dict(manifesto=m,hash=hash_do_pedido(d['pedido']['payload']),instrucao=pedido_visual(s,[]).instrucao)))
asyncio.run(main())`;
  const p=spawnSync(backend+'/.venv/Scripts/python.exe',['-X','utf8','-c',codigo],{cwd:backend,input:JSON.stringify(e),encoding:'utf8',timeout:15000,
    env:{SystemRoot:process.env.SystemRoot,PYTHONIOENCODING:'utf8'}});
  assert.equal(p.status,0,p.stderr);const out=JSON.parse(p.stdout);
  assert.deepEqual(out.manifesto,JSON.parse(JSON.stringify(r.manifesto)));
  assert.equal(out.hash,e.pedido.content_hash);assert.match(out.instrucao,/Nao buscar a URL, copiar foto, marca/);
});

test('sem uma das provas, com aprovador invalido ou outro negocio/pedido nao se completa contexto',()=>{
  for(const alterar of [e=>e.contexto=null,e=>e.marca=null,e=>e.referencia=null,
    e=>e.contexto.approved_by='fixture-sem-identidade',e=>e.marca.authorized_by=IDS[0],
    e=>e.referencia.business_id=IDS[0],e=>e.contexto.request_id=IDS[0],e=>e.contexto.reference_approval_id=IDS[0]]) {
    const e=entrada();alterar(e);assert.equal(preparar(e).ok,false);
  }
});

test('revogacao, expiracao exata e aprovacao futura bloqueiam cada fonte, sem fallback estatico',()=>{
  for(const k of ['contexto','marca','referencia'])for(const patch of [{revoked_at:'2026-10-26T14:30:00Z'},
    {expires_at:'2026-10-26T15:00:00Z'},{approved_at:'2026-10-27T00:00:00Z'},{manifest_sha256:'a'.repeat(64)},{version:0}]) {
    const e=entrada();Object.assign(e[k],patch);assert.equal(preparar(e).ok,false);
  }
});

test('proveniencia do upload nao e consentimento e precisa bater com logo vigente e cores',()=>{
  for(const alterar of [e=>delete e.logoVigente.copy.origemMaterial,e=>e.logoVigente.copy.origemMaterial.sha256='a'.repeat(64),
    e=>e.logoVigente.id=IDS[3],e=>e.logoVigente.arquivado_em=e.agora,e=>e.marca.manifest.ia_autorizada=false,
    e=>e.marca.manifest.request_id=IDS[0],e=>e.onboardingMarca.coresConfirmadas=['#000000'],
    e=>e.marca.manifest.destino_autorizado='outro',e=>e.marca.manifest.logo.autorizacao_id=IDS[0]]) {
    const e=entrada();alterar(e);rehash(e);assert.equal(preparar(e).ok,false);
  }
});

test('troca de referencia em pedido com hash novo nao reutiliza aprovacao anterior',()=>{
  const e=entrada();e.pedido.payload.referenciaId='1077371334754860';e.pedido.content_hash=hashDoPedido(e.pedido.payload);assert.equal(preparar(e).ok,false);
});

test('80% e apenas pertinencia: categoria vizinha, Pinterest, copia, arquivo extra e scores invalidos bloqueados',()=>{
  for(const patch of [{confianca_jev:'0.79'},{confianca_jev:'1.01'},{confianca_jev:0.8},
    {classificacao_jev:'indeterminado'},{origem:'pinterest'},{nicho_id:'beleza'},{caminho:'concorrente.png'},
    {midia_observada:'video'},{url:'https://facebook.com.evil.invalid/ads/library/'}]) {
    const e=entrada();Object.assign(e.catalogo.manifest,patch);
    if (typeof e.catalogo.manifest.confianca_jev==='string') rehash(e);
    assert.equal(preparar(e).ok,false);
  }
  for(const permite_copiar of [true,0]){const e=entrada();e.referencia.manifest.permite_copiar=permite_copiar;rehash(e);assert.equal(preparar(e).ok,false);}
});

test('catalogo novo, pendente, revogado, expirado ou sem direcao nao autoriza uso com aprovacao antiga',()=>{
  for(const alterar of [e=>e.versaoCatalogoVigente=2,e=>e.referencia.catalog_version=2,
    e=>e.catalogo.human_state='pending',e=>e.catalogo.revoked_at=e.agora,e=>e.catalogo.valid_until=e.agora,
    e=>e.catalogo.manifest.direcao_visual_abstrata=null]){const e=entrada();alterar(e);rehash(e);assert.equal(preparar(e).ok,false);}
});

test('documento alterado, contexto sem autorizacao nominal e quantidade maior nao chegam ao provedor',()=>{
  for(const alterar of [e=>e.contexto.manifest.central.conteudo='ALTERADO',e=>e.contexto.manifest.custo_autorizado=false,
    e=>e.contexto.manifest.quantidade_imagens=2,e=>e.contexto.manifest.limite_usd='0',e=>e.contexto.manifest.autorizacao_custo_id='',
    e=>e.contexto.manifest.reserva_usd='1e-2',e=>e.contexto.manifest.extra='nao permitido']) {
    const e=entrada();alterar(e);rehash(e);assert.equal(preparar(e).ok,false);
  }
});

test('canonicalizacao e hashes nao dependem de locale e preservam Unicode, sem float ambiguo',()=>{
  assert.equal(hash({z:1,A:'á',a_b:true,aB:false}),hash({aB:false,a_b:true,A:'á',z:1}));
  assert.throws(()=>hash({n:1.1}));assert.throws(()=>hash({n:undefined}));
});

test('v2 sem fonte persistida nao consulta nem serve imagem; submissao real permanece fechada',async()=>{
  const e=entrada();let chamadas=0;
  const h=ambienteTs({env:{V2G_CREATIVE_REQUESTS_ENABLED:'true',V2G_CREATIVE_BACKEND_ENABLED:'true',V2G_CREATIVE_APP_MODE:'real_dispatch',V2G_CREATIVE_REAL_SUBMISSION_ENABLED:'true'},ports:{
    'next/cache':{revalidatePath(){}},
    '@/lib/criativos/pedidos-da-sessao':{buscarPedidoDaSessao:async()=>e.pedido},
    '@/lib/criativos/geracao/backend-da-sessao':{geracaoNoAppPeloBackend:async()=>{chamadas++;throw Error('nao permitido');}},
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>({status:'selecionado',negocio:{id:biz}})},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:perfil}}})},from(){const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:e.pedido,error:null})};return q;}})},
    '@/lib/supabase/admin':{createAdminClient:()=>{chamadas++;throw Error('nao permitido');}},
  }});
  for(const op of ['submeter','consultar','cancelar'])assert.equal((await h.load('app/(protected)/criativos/geracao-actions.ts').acompanharGeracaoAction(biz,req,op)).motivo,op==='submeter'?'submissao_real_pendente':'contexto_pendente');
  assert.equal(await h.load('lib/criativos/geracao/imagem-privada.ts').lerImagemGerada(req,biz),null);assert.equal(chamadas,0);
});
