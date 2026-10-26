/** FICTICIO: fronteira TS -> cliente HTTP existente -> FastAPI/Python -> SQL PostgreSQL real via stdio. */
import assert from 'node:assert/strict';
import {before, beforeEach, after, test} from 'node:test';
import {registerHooks} from 'node:module';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {randomUUID, createHash} from 'node:crypto';
import ts from 'typescript';

const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
const BA='33333333-3333-4333-8333-333333333333', BB='44444444-4444-4444-8444-444444444444';
const ID='55555555-5555-4555-8555-555555555555';
const LOGO='66666666-6666-4666-8666-666666666666', REF='77777777-7777-4777-8777-777777777777';
let estado, db, child, seq=0;const pending=new Map();
const envKeys=['NODE_ENV','V2G_CREATIVE_REQUESTS_ENABLED','V2G_CREATIVE_BACKEND_ENABLED','V2G_BACKEND_URL','V2G_BACKEND_TOKEN'];
const anteriores=Object.fromEntries(envKeys.map(k=>[k,process.env[k]]));const fetchAnterior=globalThis.fetch;
const mocks={'server-only':'export {};','next/cache':'export const revalidatePath=()=>{};',
 '@/lib/supabase/server':'export const createClient=async()=>globalThis.__geracaoBridge.cliente();',
 '@/lib/multiconta/ativo':'export const negocioAtivoDaSessao=async()=>globalThis.__geracaoBridge.ativo();'};
const hooks=registerHooks({resolve(s,c,next){
 if(Object.hasOwn(mocks,s))return {url:`bridge-mock:${s}`,shortCircuit:true};
 let u;if(s.startsWith('@/'))u=new URL(`../${s.slice(2)}`,import.meta.url);
 else if(s.startsWith('.')&&c.parentURL?.startsWith('file:'))u=new URL(s,c.parentURL);
 if(u)for(const suffix of ['', '.ts']){const f=new URL(u.href+suffix);if(existsSync(f)&&f.pathname.endsWith('.ts'))return {url:f.href,shortCircuit:true};}
 return next(s,c);},load(u,c,next){if(u.startsWith('bridge-mock:'))return {format:'module',source:mocks[u.slice(12)],shortCircuit:true};
 if(u.startsWith('file:')&&u.endsWith('.ts'))return {format:'module',shortCircuit:true,source:ts.transpileModule(readFileSync(fileURLToPath(u),'utf8'),
 {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText};return next(u,c);}});
const {PGlite}=await import(pathToFileURL(process.env.V2G_PGLITE_MODULE??'C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
const {guardarPedidoAction}=await import('../app/(protected)/criativos/geracao-actions.ts');
const {geracaoPeloBackend}=await import('../lib/criativos/geracao/backend-da-sessao.ts');
const {pngSimulado}=await import('../lib/criativos/geracao/png-local.ts');
const sha=b=>createHash('sha256').update(b).digest('hex');
const encode=v=>v instanceof Uint8Array?{$bytes:Buffer.from(v).toString('base64')}:v instanceof Date?v.toISOString():
 Array.isArray(v)?v.map(encode):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encode(x)])):v;
const decode=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===1&&v.$bytes?Buffer.from(v.$bytes,'base64'):
 Array.isArray(v)?v.map(decode):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,decode(x)])):v;
const send=v=>child.stdin.write(JSON.stringify(encode(v))+'\n');
const rpc=m=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('bridge_timeout'));},20000);
 pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject});send({id,...m});});
const control=(c={},restart=false)=>rpc({control:c,restart});
const raw=(method,path,body,headers={'X-V2G-Token':'fixture-machine-local'})=>rpc({method,path,body,headers});
const call=(operacao='executar',requestId=ID,businessId=BA)=>geracaoPeloBackend({requestId,businessId,operacao});
const row=async()=> (await db.query('select * from creative_generation_jobs where request_id=$1',[ID])).rows[0];

function cliente(){return {auth:{getUser:async()=>({data:{user:estado.profile?{id:estado.profile}:null},error:null}),
 getSession:async()=>({data:{session:estado.profile?{user:{id:estado.profile},access_token:'fixture-sessao'}:null},error:null})},from(t){
 assert.equal(t,'creative_generation_requests');const filtros={};const q={select(){return q;},eq(k,v){filtros[k]=v;return q;},
 async maybeSingle(){const r=await db.query('select * from creative_generation_requests where id=$1 and business_id=$2 and requested_by=$3',
 [filtros.id,filtros.business_id,estado.profile]);return {data:r.rows[0]??null,error:null};},
 async insert(p){try{await db.query('insert into creative_generation_requests(id,business_id,requested_by,content_hash,payload) values($1,$2,$3,$4,$5)',
 [p.id,p.business_id,p.requested_by,p.content_hash,JSON.stringify(p.payload)]);return {error:null};}catch(e){return {error:{code:e.code}};}}};return q;}};}
globalThis.__geracaoBridge={cliente,ativo:async()=>estado.profile?{status:'selecionado',negocio:{id:estado.business}}:{status:'sem_sessao'}};
const form=()=>{const f=new FormData();for(const[k,v]of Object.entries({requestId:ID,businessId:BA,objetivo:'Apresentar serviço',oferta:'Corte com horário marcado',
 acao:'Chamar no WhatsApp',confirmado:'on'}))f.set(k,v);return f;};
let manifesto;
before(async()=>{
 db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table profiles(id uuid primary key);create table businesses(id uuid primary key,profile_id uuid references profiles,dados_ficticios boolean not null);
 create table campaigns(id uuid primary key);create table analysis_runs(id uuid primary key);
 create table local_object_store(path text primary key,bytes bytea not null,hash text not null);`);
 const init=readFileSync(new URL('../supabase/migrations/0001_init.sql',import.meta.url),'utf8');
 await db.exec(init.match(/create table public\.creatives \([\s\S]*?\n\);/)[0]);
 for(const f of ['0008_publicar_campanha.sql','0010_perfil_empresa.sql','0014_identidade_do_negocio.sql']){
 const s=readFileSync(new URL('../supabase/migrations/'+f,import.meta.url),'utf8');
 for(const m of s.matchAll(/alter table public\.creatives\s[\s\S]*?;/g)){
 if(m[0].includes('pessoa_id'))await db.exec('create table if not exists pessoas_do_negocio(id uuid primary key)');await db.exec(m[0]);}}
 await db.exec(readFileSync(new URL('../supabase/migrations/20261021001651_creative_generation_requests.sql',import.meta.url),'utf8'));
 await db.exec('alter default privileges in schema public grant all on tables to public,anon,authenticated,service_role');
 await db.exec(readFileSync(new URL('./sql/proposta-geracao-backend-22-10.sql',import.meta.url),'utf8'));
 const backend='C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g';
 child=spawn(backend+'/.venv/Scripts/python.exe',['-X','utf8','-u','tests/integracao/geracao_local_bridge.py'],{cwd:backend,stdio:['pipe','pipe','pipe']});
 let stderr='';child.stderr.on('data',b=>{stderr+=b;});
 child.on('exit',code=>{for(const p of pending.values())p.reject(Error('bridge_exit_'+code));});
 createInterface({input:child.stdout}).on('line',async line=>{try{
 const m=decode(JSON.parse(line));if(m.sql_id){try{
 if(estado?.falhaStaging && m.sql.includes("set status='storage_pending'")){estado.falhaStaging=false;throw Error('staging_teste');}
 if(estado?.falhaVinculo && m.sql.includes('with permitido as')){estado.falhaVinculo=false;throw Error('vinculo_teste');}
 const r=await db.query(m.sql,m.params);
 if(estado?.perdeStaging && m.sql.includes("set status='storage_pending'")){estado.perdeStaging=false;throw Error('resposta_staging_teste');}
 send({sql_result:m.sql_id,rows:r.rows});}
 catch(e){send({sql_result:m.sql_id,error:e.code??'sql_teste'});}return;}
 const p=pending.get(m.id);pending.delete(m.id);if(p){if(m.error)p.reject(Error(m.error));else p.resolve(m);}
 }catch{for(const p of pending.values())p.reject(Error('bridge_protocolo'));}});
 globalThis.fetch=async(url,opt)=>{const u=new URL(url);assert.equal(u.origin,'http://fixture.invalid');
 const r=await raw(opt.method,u.pathname+u.search,opt.body?JSON.parse(opt.body):undefined,opt.headers);return new Response(JSON.stringify(r.body),{status:r.status});};
 process.env.NODE_ENV='development';process.env.V2G_CREATIVE_REQUESTS_ENABLED='true';process.env.V2G_CREATIVE_BACKEND_ENABLED='true';
 process.env.V2G_BACKEND_URL='http://fixture.invalid';process.env.V2G_BACKEND_TOKEN='fixture-machine-local';
 await control();
});
beforeEach(async()=>{
 await db.exec('truncate creative_generation_jobs,creative_generation_requests,creatives,local_object_store,businesses,profiles cascade');
 await db.query('insert into profiles values($1),($2)',[A,B]);await db.query('insert into businesses values($1,$2,true),($3,$4,true)',[BA,A,BB,B]);
 estado={profile:A,business:BA};
 const png=pngSimulado();
 for(const[id,uso]of[[LOGO,'logo'],[REF,'campanha']]){
 await db.query("insert into creatives(id,business_id,type,file_name,storage_path,uso,status) values($1,$2,'image','fixture.png',$3,$4,'draft')",[id,BA,'fixture/'+id,uso]);
 await db.query('insert into local_object_store values($1,$2,$3)',['fixture/'+id,png,sha(png)]);}
 const doc={versao:'fixture-v1',conteudo:'REGRA FICTICIA: nao inventar fachada.',revisado_por:'fixture-revisor',revisado_em:'2026-10-22T15:00:00Z',business_id:null,nicho_id:null};
 manifesto={business_id:BA,request_id:ID,nicho_id:'barbearia-fixture',nicho_confirmado:true,central:doc,nicho:{...doc,nicho_id:'barbearia-fixture'},cores:'Azul e amarelo',
 materiais:[[LOGO,'logo'],[REF,'referencia']].map(([id,uso])=>({id,business_id:BA,caminho:'fixture/'+id,sha256:sha(png),uso,autorizacao_id:'fixture-consent',revisado_por:'fixture-revisor',permitido:true,
 fonte:'fixture:propria',observado_em:'2026-10-22T15:00:00Z',condicao_de_uso:'material ficticio proprio'})),
 destino_autorizado:'mock',politica_versao:'fixture-v1',estimativa_usd:'0',reserva_usd:'0.25',limite_usd:'1'};
 await control({contexto:manifesto,calls:0,uploads:0,falha_storage:false,incerto:false,revogado:false,revogar_depois:false,perde_resposta_storage:false},true);
 assert.equal((await guardarPedidoAction({},form())).ok,true);
});
after(async()=>{if(child && child.exitCode===null){child.stdin.end();await new Promise(resolve=>{child.once('exit',resolve);setTimeout(()=>{child.kill();resolve();},1500).unref();});}await db?.close();hooks.deregister();delete globalThis.__geracaoBridge;
 globalThis.fetch=fetchAnterior;for(const[k,v]of Object.entries(anteriores))if(v===undefined)delete process.env[k];else process.env[k]=v;});

test('action TS -> HTTP -> FastAPI -> client mock existente -> bytes SQL -> Storage -> creatives e recarga',async()=>{
 const r=await call();assert.equal(r.ok,true);assert.equal(r.estado.status,'artifact_available');assert.equal(r.estado.simulated,true);assert.equal(r.estado.billed_usd,null);
 const j=await row();assert.equal(sha(j.result_bytes),r.estado.artifact_sha256);
 assert.equal((await db.query('select count(*)::int n from creatives where id=$1',[j.id])).rows[0].n,1);
 await control({},true);assert.deepEqual((await call('biblioteca')).estado,r.estado);assert.equal((await control()).body.calls,1);
 assert.equal(j.width,1088);assert.equal(j.height,1088);
});
test('clique concorrente/replay: uma tentativa, uma imagem, uma reserva',async()=>{
 const rs=await Promise.all([call(),call()]);assert.ok(rs.every(r=>r.ok));await call();
 assert.equal((await control()).body.calls,1);assert.equal((await db.query('select count(*)::int n from creative_generation_jobs')).rows[0].n,1);
 assert.equal((await call('biblioteca')).ok,true);
});
test('Storage falha: nova instancia retoma mesmos bytes/hash, sem gerar novamente',async()=>{
 await control({falha_storage:true});assert.equal((await call()).estado.status,'storage_pending');const j=await row();
 await control({falha_storage:false},true);assert.equal((await call()).estado.status,'artifact_available');
 assert.equal((await row()).artifact_sha256,j.artifact_sha256);assert.equal((await control()).body.calls,1);
});
test('resposta do Storage perdida nao duplica arquivo/geracao',async()=>{
 await control({perde_resposta_storage:true});assert.equal((await call()).estado.status,'storage_pending');
 assert.equal((await call()).estado.status,'artifact_available');assert.equal((await control()).body.calls,1);
 assert.equal((await db.query("select count(*)::int n from local_object_store where path like 'geracao/%'")).rows[0].n,1);
});
test('timeout ambiguo retido, custo desconhecido, sem retry ou erro privado',async()=>{
 await control({incerto:true});const r=await call();assert.equal(r.estado.status,'reconciliation_required');assert.equal(r.estado.billed_usd,null);
 await call();assert.equal((await control()).body.calls,1);assert.ok(!JSON.stringify(r).includes('privado'));
});
test('sessao/negocio divergentes negados pelo WebApp e backend, antes do provedor',async()=>{
 estado.business=BB;assert.equal((await call()).motivo,'negocio_mudou');estado.business=BA;estado.profile=B;assert.equal((await call()).ok,false);
 assert.equal((await raw('POST','/criativos/geracao/'+BB,{request_id:ID,profile_id:A})).status,409);
 assert.equal((await control()).body.calls,0);assert.equal(await row(),undefined);
});
test('token de maquina obrigatorio e payload nao aceita snapshot/direitos/teto do browser',async()=>{
 assert.equal((await raw('POST','/criativos/geracao/'+BA,{request_id:ID,profile_id:A},{})).status,401);
 assert.equal((await raw('POST','/criativos/geracao/'+BA,{request_id:ID,profile_id:A,limite_usd:999})).status,422);
 assert.equal((await control()).body.calls,0);
});
test('documento/material de outro negocio e autorizacao ausente negados antes da reserva',async()=>{
 for(const c of [{...manifesto,central:{...manifesto.central,business_id:BB}},
 {...manifesto,materiais:manifesto.materiais.map(m=>({...m,permitido:false}))},null]){
 await control({contexto:c});assert.equal((await call()).ok,false);assert.equal(await row(),undefined);}
 assert.equal((await control()).body.calls,0);
});
test('mock nao transforma negocio real em ficticio',async()=>{
 await db.query('update businesses set dados_ficticios=false where id=$1',[BA]);assert.equal((await call()).ok,false);assert.equal((await control()).body.calls,0);
});
test('revogacao durante geracao conserva bytes mas impede entrega e biblioteca',async()=>{
 await control({revogar_depois:true});assert.equal((await call()).ok,false);assert.equal((await row()).status,'storage_pending');
 assert.equal((await control()).body.uploads,0);assert.equal((await call('biblioteca')).ok,false);
});
test('SQL protege snapshot/attempt/bytes e acesso anon/auth mesmo com defaults hostis',async()=>{
 await call();await assert.rejects(db.query('update creative_generation_jobs set snapshot=$1',[JSON.stringify({})]));
 await assert.rejects(db.query('update creative_generation_jobs set attempt_id=$1',[randomUUID()]));
 await assert.rejects(db.query('update creative_generation_jobs set result_bytes=$1',[Buffer.from('adulterado')]));
 for(const role of ['anon','authenticated'])await assert.rejects(db.transaction(async tx=>{await tx.exec('set local role '+role);await tx.query('select * from creative_generation_jobs');}));
});
test('arquivo adulterado e metadado de outra tentativa nao viram biblioteca',async()=>{
 await call();const j=await row();await db.query('update local_object_store set bytes=$1 where path=$2',[Buffer.from('adulterado'),j.artifact_path]);
 assert.equal((await call('biblioteca')).ok,false);assert.equal((await call('consultar')).ok,false);assert.equal((await control()).body.calls,1);
});
test('feature flag ausente nao abre chamada nem sessao',async()=>{
 delete process.env.V2G_CREATIVE_BACKEND_ENABLED;assert.equal((await call()).motivo,'indisponivel');process.env.V2G_CREATIVE_BACKEND_ENABLED='true';
 assert.equal((await control()).body.calls,0);
});
test('staging confirmou e resposta se perdeu: consulta recupera sem novo provedor',async()=>{
 estado.perdeStaging=true;assert.equal((await call()).estado.status,'artifact_available');assert.equal((await control()).body.calls,1);
});
test('staging nao confirmou: reconciliacao e nenhuma geracao de reposicao',async()=>{
 estado.falhaStaging=true;assert.equal((await call()).estado.status,'reconciliation_required');assert.equal((await row()).result_bytes,null);
 await call();assert.equal((await control()).body.calls,1);
});
test('falha de vinculo recupera so persistencia e snapshot nao acompanha documento novo',async()=>{
 estado.falhaVinculo=true;assert.equal((await call()).estado.status,'storage_pending');const j=await row();
 await control({contexto:{...manifesto,central:{...manifesto.central,versao:'fixture-v2',conteudo:'Outra regra ficticia'}}},true);
 assert.equal((await call()).estado.status,'artifact_available');assert.equal((await row()).snapshot_hash,j.snapshot_hash);
 assert.equal((await row()).snapshot.central.versao,'fixture-v1');assert.equal((await control()).body.calls,1);
});
test('reserva insuficiente e manifesto aprovado para outro pedido nao executam',async()=>{
 for(const c of [{...manifesto,reserva_usd:'2'},{...manifesto,request_id:randomUUID()}]){
 await control({contexto:c});assert.equal((await call()).ok,false);assert.equal(await row(),undefined);}
 assert.equal((await control()).body.calls,0);
});
test('metadados adulterados da biblioteca nao conferem sucesso',async()=>{
 await call();const j=await row();await db.query("update creatives set copy=jsonb_set(copy,'{generation,attemptId}',$1) where id=$2",[JSON.stringify(randomUUID()),j.id]);
 assert.equal((await call('biblioteca')).ok,false);assert.equal((await control()).body.calls,1);
});
