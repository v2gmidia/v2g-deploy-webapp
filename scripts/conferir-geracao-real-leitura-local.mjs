/** Protocolo REAL, dados fictícios: serializer backend real -> HTTP instrumentado -> action/arquivo. Sem modelo/rede. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const business='33333333-3333-4333-8333-333333333333',pedido='55555555-5555-4555-8555-555555555555';
const perfil='11111111-1111-4111-8111-111111111111',job='88888888-8888-4888-8888-888888888888',attempt='99999999-9999-4999-8999-999999999999';
// Bytes fictícios da função pura de teste existente, nunca saída de IA.
const raizBackend='C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g';
const bytesFixture=spawnSync(raizBackend+'/.venv/Scripts/python.exe',['-X','utf8','-c',
  'import base64; from src.imagem.mock import gerar_png; print(base64.b64encode(gerar_png(1088,1088)).decode())'],
  {cwd:raizBackend,encoding:'utf8',timeout:15000});
assert.equal(bytesFixture.status,0,bytesFixture.stderr);
const png=Buffer.from(bytesFixture.stdout.trim(),'base64');
const sha=createHash('sha256').update(png).digest('hex');
const row={version:1,id:job,request_id:pedido,business_id:business,attempt_id:attempt,status:'artifact_available',simulated:false,
  snapshot_hash:'a'.repeat(64),artifact_sha256:sha,currency:'USD',estimated_usd:'0.000000000000000001',reserved_usd:'1',billed_usd:null};
function serializerReal() {
  const backend='C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g';
  const p=spawnSync(backend+'/.venv/Scripts/python.exe',['-X','utf8','-c',
    'import json,sys; from src.imagem.geracao_jobs import GeradorDuravel; print(json.dumps(GeradorDuravel.dto(json.loads(sys.stdin.read()))))'],
    {cwd:backend,input:JSON.stringify(row),encoding:'utf8',timeout:15000});
  assert.equal(p.status,0,p.stderr);return JSON.parse(p.stdout);
}
const realDto=serializerReal();
function harness() {
  const s={profile:perfil,business,off:false,dto:structuredClone(realDto),http:200,corromper:false,donoDoPedido:perfil,simuladoNoArquivo:false,chamadas:[]};
  const env={V2G_CREATIVE_REQUESTS_ENABLED:'true',V2G_CREATIVE_BACKEND_ENABLED:'true',V2G_BACKEND_URL:'http://fixture.invalid',V2G_BACKEND_TOKEN:'fixture-token'};
  const a=ambienteTs({env,ports:{
    'next/cache':{revalidatePath(){}},
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>({status:'selecionado',negocio:{id:s.business}})},
    '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:s.profile?{id:s.profile}:null},error:null}),
      getSession:async()=>({data:{session:s.profile?{user:{id:s.profile},access_token:'fixture-jwt'}:null},error:null})},from(table){
      assert.ok(['creatives','creative_generation_requests'].includes(table));const filtros={};const q={select(colunas){
        for(const coluna of (table==='creatives'?['id','business_id','type','uso','storage_path','copy','arquivado_em']:['id','business_id','requested_by']))assert.ok(colunas.split(', ').includes(coluna));return q;
      },eq(k,v){filtros[k]=v;return q;},async maybeSingle(){return {error:null,data:table==='creative_generation_requests'
        ? {id:pedido,business_id:business,requested_by:s.donoDoPedido}
        : {id:job,business_id:business,type:'image',uso:'campanha',arquivado_em:null,storage_path:`geracao/${business}/${job}/${attempt}.png`,
          copy:{generation:{version:1,requestId:pedido,jobId:job,attemptId:attempt,snapshotHash:row.snapshot_hash,artifactHash:sha,simulated:s.simuladoNoArquivo}}}};}};return q;
    }})},
    '@/lib/supabase/admin':{createAdminClient:()=>({storage:{getBucket:async()=>({error:null,data:{public:false}}),from:()=>({download:async()=>({error:null,data:new Blob([s.corromper?Buffer.from('ALTERADO'):png])})})}})},
  },fetch:async(url,opt)=>{assert.equal(new URL(url).origin,'http://fixture.invalid');assert.equal(opt.headers.Authorization,'Bearer fixture-jwt');s.chamadas.push({method:opt.method,url});
    if(s.off)throw Error('conexao_fixture');return new Response(JSON.stringify(s.http===200?s.dto:{detail:'SQL PRIVADO'}),{status:s.http});}});
  return {s,env,load:a.load,acao:(operacao='consultar')=>a.load('app/(protected)/criativos/geracao-actions.ts').acompanharGeracaoAction(business,pedido,operacao),
    arquivo:()=>a.load('lib/criativos/geracao/imagem-privada.ts').lerImagemGerada(pedido,business)};
}
test('DTO real do serializer atual atravessa action e não inventa zero de cobrança ou marca fictícia',async()=>{
  const h=harness(),r=await h.acao();assert.equal(r.ok,true);assert.equal(r.simulada,false);assert.equal(r.status,'artifact_available');assert.equal(r.consultarEm,null);
  assert.ok(!JSON.stringify(r).includes('billed'));assert.ok(!JSON.stringify(r).includes('snapshot_hash'));assert.ok(h.s.chamadas.every(c=>c.method==='GET'));
  assert.equal(h.load('lib/criativos/geracao/contrato-fila.ts').rotuloDoAndamento(r.status,r.simulada),'Imagem criada');
});
test('submeter/cancelar reais são bloqueados mesmo com flags gerais ON; não abrem HTTP',async()=>{
  const h=harness();for(const op of ['submeter','cancelar'])assert.equal((await h.acao(op)).motivo,'submissao_real_pendente');assert.equal(h.s.chamadas.length,0);
});
test('404 não libera botão de gerar teste em modo real/leitura',async()=>{
  const h=harness();h.s.http=404;const r=await h.acao();assert.equal(r.motivo,'nao_iniciado');assert.equal(r.podeSubmeter,false);assert.equal(h.s.chamadas.length,1);
});
test('retomada consulta mesmo pedido e reconciliação real para o polling sem nova tentativa',async()=>{
  const h=harness();h.s.dto.status='reconciliation_required';h.s.dto.artifact_sha256=null;
  for(let i=0;i<2;i++){const r=await h.acao();assert.equal(r.requestId,pedido);assert.equal(r.consultarEm,null);assert.equal(r.status,'reconciliation_required');}
  assert.ok(h.s.chamadas.every(c=>c.method==='GET'));
});
test('estado real em execução ou Storage pendente permanece apenas consultável',async()=>{
  for(const status of ['running','storage_pending']){const h=harness();h.s.dto.status=status;const r=await h.acao();assert.equal(r.status,status);assert.equal(r.consultarEm,2000);assert.equal(r.imagemUrl,null);}
});
test('arquivo real exige registro, autoria, simulação coerente, PNG e hash',async()=>{
  const h=harness();const bytes=await h.arquivo();assert.equal(Buffer.from(bytes).readUInt32BE(16),1088);
  h.s.donoDoPedido=job;assert.equal(await h.arquivo(),null);h.s.donoDoPedido=perfil;
  h.s.simuladoNoArquivo=true;assert.equal(await h.arquivo(),null);h.s.simuladoNoArquivo=false;
  h.s.corromper=true;assert.equal(await h.arquivo(),null);assert.ok(h.s.chamadas.every(c=>c.method==='GET'));
});
test('outro negócio/sessão e fonte indisponível nunca abrem arquivo ou retry',async()=>{
  const h=harness();h.s.business=job;assert.equal((await h.acao()).motivo,'negocio_mudou');assert.equal(await h.arquivo(),null);assert.equal(h.s.chamadas.length,0);
  h.s.business=business;h.s.profile=null;assert.equal(await h.arquivo(),null);h.s.profile=perfil;
  h.s.off=true;assert.equal((await h.acao()).ok,false);assert.equal(h.s.chamadas.length,1);assert.ok(h.s.chamadas.every(c=>c.method==='GET'));
});
test('custos float/expoente, contexto errado e fake não passam como execução real',async()=>{
  for(const patch of [{estimated_usd:0.1},{reserved_usd:'1e-5'},{business_id:job},{request_id:job},{simulated:true},{billed_usd:0}]){
    const h=harness();Object.assign(h.s.dto,patch);assert.equal((await h.acao()).ok,false);
  }
});
test('ausência de configuração desliga leitura antes de abrir sessão/HTTP',async()=>{
  const h=harness();delete h.env.V2G_CREATIVE_BACKEND_ENABLED;assert.equal((await h.acao()).motivo,'indisponivel');assert.equal(h.s.chamadas.length,0);
});
