/** Novos adapters reais sob conn/HTTP substituidos, PostgreSQL descartavel e rede proibida. */
import assert from 'node:assert/strict';
import {before,beforeEach,after,test} from 'node:test';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {createHash,randomUUID} from 'node:crypto';
const {PGlite}=await import(pathToFileURL(process.env.V2G_PGLITE_MODULE??'C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const BA='33333333-3333-4333-8333-333333333333',BB='44444444-4444-4444-8444-444444444444';
const ID='55555555-5555-4555-8555-555555555555',LOGO='66666666-6666-4666-8666-666666666666',REF='77777777-7777-4777-8777-777777777777';
const payload={versao:1,objetivo:'Apresentar serviço',oferta:'Corte com horário marcado',acao:'WhatsApp',promocao:false,validade:null};
const sha=x=>createHash('sha256').update(x).digest('hex');
// PNG tecnico proprio; o resultado do gerador continua vindo do ClientImagemMock existente.
const fixture=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
let db,child,seq=0,controle,manifesto;const pending=new Map(),txs=new Map();
const enc=v=>v instanceof Uint8Array?{$bytes:Buffer.from(v).toString('base64')}:v instanceof Date?v.toISOString():Array.isArray(v)?v.map(enc):
 v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,enc(x)])):v;
const dec=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===1&&v.$bytes?Buffer.from(v.$bytes,'base64'):
 Array.isArray(v)?v.map(dec):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,dec(x)])):v;
const send=m=>child.stdin.write(JSON.stringify(enc(m))+'\n');
const rpc=m=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('bridge_timeout'));},20000);
 pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject});send({id,...m});});
const ctrl=c=>rpc({control:c,reset_metrics:!!c.reset_metrics});
const op=(name,data={})=>rpc({op:name,negocio:BA,perfil:A,pedido:ID,...data});
const query=(sql,params=[])=>op('query',{sql,params});
const job=async()=> (await db.query('select * from creative_generation_jobs where request_id=$1',[ID])).rows[0];
async function sqlMessage(m){
 try{
 if(m.phase==='begin'){
   const ready=Promise.withResolvers(),done=Promise.withResolvers();const entry={done};txs.set(m.connection,entry);
   entry.completion=db.transaction(async tx=>{entry.tx=tx;ready.resolve();const result=await done.promise;if(result.rollback)throw Error('rollback_controlado');})
     .then(()=>({ok:true}),()=>({ok:false}));
   await ready.promise;send({sql_result:m.sql_id,rows:[]});return;
 }
 if(m.phase==='commit'||m.phase==='rollback'){
   const entry=txs.get(m.connection);entry.done.resolve({rollback:m.phase==='rollback'});const result=await entry.completion;txs.delete(m.connection);
   if(m.phase==='commit'&&(!result.ok||controle?.perderCommit?.test(entry.last??''))){controle.perderCommit=null;throw Error('commit_resposta_perdida');}
   send({sql_result:m.sql_id,rows:[]});return;
 }
 const entry=txs.get(m.connection);if(entry)entry.last=m.sql;
 if(controle?.falharQuery?.test(m.sql)){controle.falharQuery=null;throw Error('query_recusada_antes_commit');}
 const result=await(entry?entry.tx:db).query(m.sql,m.params);
 send({sql_result:m.sql_id,rows:result.rows,fields:result.fields});
 }catch(e){send({sql_result:m.sql_id,error:e.code??'falha_controlada'});}
}
before(async()=>{
 db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table profiles(id uuid primary key);create table businesses(id uuid primary key,profile_id uuid references profiles,dados_ficticios boolean not null,
 onboarding jsonb not null default '{}'::jsonb);create table campaigns(id uuid primary key);create table analysis_runs(id uuid primary key);
 create table local_object_store(path text primary key,bytes bytea not null,hash text not null);
 create table adapter_tx(id integer primary key,valor numeric not null check(valor>0));`);
 const init=readFileSync(new URL('../supabase/migrations/0001_init.sql',import.meta.url),'utf8');await db.exec(init.match(/create table public\.creatives \([\s\S]*?\n\);/)[0]);
 for(const f of ['0008_publicar_campanha.sql','0010_perfil_empresa.sql','0014_identidade_do_negocio.sql']){
 const s=readFileSync(new URL('../supabase/migrations/'+f,import.meta.url),'utf8');for(const m of s.matchAll(/alter table public\.creatives\s[\s\S]*?;/g)){
 if(m[0].includes('pessoa_id'))await db.exec('create table if not exists pessoas_do_negocio(id uuid primary key)');await db.exec(m[0]);}}
 await db.exec(readFileSync(new URL('../supabase/migrations/20261021001651_creative_generation_requests.sql',import.meta.url),'utf8'));
 await db.exec(readFileSync(new URL('./sql/proposta-geracao-backend-22-10.sql',import.meta.url),'utf8'));
 const raiz='C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g';
 child=spawn(raiz+'/.venv/Scripts/python.exe',['-X','utf8','-u','tests/integracao/geracao_adapters_bridge.py'],{cwd:raiz,stdio:['pipe','pipe','pipe']});
 child.stderr.on('data',()=>{});child.on('exit',code=>{for(const p of pending.values())p.reject(Error('bridge_exit_'+code));});
 createInterface({input:child.stdout}).on('line',line=>{try{const m=dec(JSON.parse(line));if(m.sql_id){void sqlMessage(m);return;}
 const p=pending.get(m.id);pending.delete(m.id);p?.resolve(m);}catch{for(const p of pending.values())p.reject(Error('bridge_protocolo'));}});
 assert.ok((await ctrl({})).body);
});
beforeEach(async()=>{
 await db.exec('truncate creative_generation_jobs,creative_generation_requests,creatives,local_object_store,businesses,profiles,adapter_tx cascade');
 await db.query('insert into profiles values($1),($2)',[A,B]);
 const marca={marca:{coresConfirmadas:['#123ABC','#FFD200'],aparenciaNaoSei:false,em:'2026-10-22T15:00:00Z'}};
 await db.query('insert into businesses values($1,$2,true,$3),($4,$5,true,$3)',[BA,A,JSON.stringify(marca),BB,B]);
 const hash=sha(JSON.stringify([payload.versao,payload.objetivo,payload.oferta,payload.acao,payload.promocao,payload.validade]));
 await db.query('insert into creative_generation_requests(id,business_id,requested_by,content_hash,payload) values($1,$2,$3,$4,$5)',[ID,BA,A,hash,JSON.stringify(payload)]);
 for(const[id,uso]of[[LOGO,'logo'],[REF,'campanha']]){const path=`${uso==='logo'?'identidade':'referencias'}/${BA}/${id}.png`;
 await db.query("insert into creatives(id,business_id,type,file_name,storage_path,uso,status) values($1,$2,'image','fixture.png',$3,$4,'draft')",[id,BA,path,uso]);
 await db.query('insert into local_object_store values($1,$2,$3)',[path,fixture,sha(fixture)]);}
 const doc={versao:'fixture-v1',conteudo:'REGRA FICTICIA: nao inventar fachada',revisado_por:'fixture',revisado_em:'2026-10-22T15:00:00Z',business_id:null,nicho_id:null};
 manifesto={business_id:BA,request_id:ID,nicho_id:'barbearia-fixture',nicho_confirmado:true,central:doc,nicho:{...doc,nicho_id:'barbearia-fixture'},cores:'#123ABC e #FFD200',
 materiais:[[LOGO,'logo'],[REF,'referencia']].map(([id,uso])=>({id,business_id:BA,caminho:`${uso==='logo'?'identidade':'referencias'}/${BA}/${id}.png`,sha256:sha(fixture),uso,
 autorizacao_id:'fixture-consent',revisado_por:'fixture',permitido:true,fonte:'fixture:propria',observado_em:'2026-10-22T15:00:00Z',condicao_de_uso:'imagem tecnica propria'})),
 destino_autorizado:'mock',politica_versao:'fixture-v1',estimativa_usd:'0',reserva_usd:'0.25',limite_usd:'1'};
 controle={};await ctrl({contexto:manifesto,calls:0,incerto:false,revogado:false,revogar_depois:false,bucket_publico:false,timeout_leitura:false,timeout_upload_antes:false,
 timeout_upload_depois:false,adulterar_na_disputa:false,reset_metrics:true});
});
after(async()=>{if(child?.exitCode===null){child.stdin.end();await new Promise(resolve=>{child.once('exit',resolve);setTimeout(()=>{child.kill();resolve();},1500).unref();});}await db?.close();});

test('adapters SQL/Storage -> gerador existente -> acervo e leitura privada server-only',async()=>{
 const r=await op('executar');assert.equal(r.body?.status,'artifact_available',JSON.stringify(r));const j=await job();
 assert.equal(sha(j.result_bytes),r.body.artifact_sha256);assert.equal((await ctrl({})).body.calls,1);
 const leitura=await op('privada',{job:j.id});assert.equal(leitura.body.sha256,j.artifact_sha256);assert.equal(leitura.body.caminho,j.artifact_path);
 assert.equal(leitura.body.simulated,true);
 assert.ok(!JSON.stringify(leitura).includes('signedURL'));const m=(await ctrl({})).body;assert.equal(m.connections,m.closed);
});
test('codec psycopg real: placeholders repetidos/fora de ordem, Decimal/JSON/bytes e valor hostil',async()=>{
 const r=await query("select $2::numeric as valor,$1::jsonb as contexto,$3::bytea as bytes,$4::text as frase,$2::numeric as repetido",
 [{a:'ação',preco:'0.010000000000000001'},'0.010000000000000001',Buffer.from([0,1,255]),"'); drop table businesses; -- $99 %"]);
 assert.equal(r.body[0].valor,'0.010000000000000001');assert.equal(r.body[0].repetido,r.body[0].valor);
 assert.deepEqual(r.body[0].contexto,{a:'ação',preco:'0.010000000000000001'});assert.deepEqual(r.body[0].bytes,Buffer.from([0,1,255]));
 assert.equal(r.body[0].frase,"'); drop table businesses; -- $99 %");
});
test('quotes/comentarios/dollar quotes/percentual nao sao parametros; multiplos statements recusados',async()=>{
 const r=await query("select '$9 100%' as literal,$q$ $8 % $q$ as dolar,$1::int as n /* $4 /* $5 */ */ -- $7\n",[3]);
 assert.equal(r.body[0].literal,'$9 100%');assert.equal(r.body[0].n,3);
 assert.equal((await query('select $1; select $2',[1,2])).error,'ValueError');
 assert.equal((await query('select $2',[1])).error,'ValueError');
});
test('rollback real do statement recusado e proxima conexao limpa',async()=>{
 const antes=(await ctrl({})).body;controle.falharQuery=/insert into public.creative_generation_jobs/;
 const r=await op('executar');assert.equal(r.error,'FalhaSqlGeracao');assert.equal(r.commit_confirmado,false);assert.equal(await job(),undefined);
 assert.equal((await op('executar')).body.status,'artifact_available');const depois=(await ctrl({})).body;
 assert.equal(depois.connections,depois.closed);assert.ok(depois.connections>antes.connections);
});
test('commit do claim confirmado no banco mas resposta perdida: nao chama provedor de novo',async()=>{
 controle.perderCommit=/insert into public.creative_generation_jobs/;const r=await op('executar');
 assert.equal(r.error,'FalhaSqlGeracao');assert.equal(r.commit_confirmado,null);assert.equal((await job()).status,'running');
 assert.equal((await op('executar')).body.status,'running');assert.equal((await ctrl({})).body.calls,0);
});
test('commit staging com resposta perdida recupera bytes sem segunda geracao',async()=>{
 controle.perderCommit=/set status='storage_pending'/;assert.equal((await op('executar')).body.status,'artifact_available');
 assert.equal((await ctrl({})).body.calls,1);
});
test('duas conexoes/execucoes disputam UNIQUE: uma geracao e objeto',async()=>{
 const rs=await Promise.all([op('executar'),op('executar')]);assert.ok(rs.every(r=>!r.error),JSON.stringify(rs));
 assert.equal((await ctrl({})).body.calls,1);assert.equal((await db.query('select count(*)::int n from creative_generation_jobs')).rows[0].n,1);
});
test('Storage timeout depois de guardar: reler o mesmo objeto, nao fazer segundo POST',async()=>{
 await ctrl({timeout_upload_depois:true});assert.equal((await op('executar')).body.status,'artifact_available');
 const m=(await ctrl({})).body;assert.equal(m.posts,1);assert.equal(m.calls,1);
});
test('Storage timeout antes de guardar: retoma armazenamento com mesmos bytes, sem novo provedor',async()=>{
 await ctrl({timeout_upload_antes:true});assert.equal((await op('executar')).body.status,'storage_pending');const h=(await job()).artifact_sha256;
 await ctrl({timeout_upload_antes:false});assert.equal((await op('executar')).body.status,'artifact_available');assert.equal((await job()).artifact_sha256,h);
 assert.equal((await ctrl({})).body.calls,1);
});
test('objeto conflitante na disputa nunca e sobrescrito ou apresentado na galeria',async()=>{
 await ctrl({adulterar_na_disputa:true});assert.equal((await op('executar')).body.status,'storage_pending');const j=await job();
 const bytes=(await db.query('select bytes from local_object_store where path=$1',[j.artifact_path])).rows[0].bytes;
 assert.notEqual(sha(bytes),j.artifact_sha256);await ctrl({adulterar_na_disputa:false});await op('executar');
 assert.equal((await ctrl({})).body.posts,1);assert.equal((await ctrl({})).body.calls,1);
});
test('bucket publico e timeout de leitura impedem upload',async()=>{
 await ctrl({bucket_publico:true});assert.equal((await op('executar')).error,'FalhaArquivoGeracao');assert.equal((await ctrl({})).body.posts,0);
 await ctrl({bucket_publico:false,timeout_leitura:true});assert.equal((await op('executar')).error,'FalhaArquivoGeracao');assert.equal((await ctrl({})).body.posts,0);
});
test('caminho cruzado/traversal/URL/attempt adulterado recusados antes do SDK',async()=>{
 await op('executar');const j=await job(),n=(await ctrl({})).body.requests;
 for(const path of [j.artifact_path.replace(BA,BB),'../'+j.artifact_path,'https://fixture.invalid/'+j.artifact_path,
 j.artifact_path.replace(j.attempt_id,randomUUID()),j.artifact_path.replace('.png','%2Epng')]){
 assert.equal((await op('ler',{path})).error,'FalhaArquivoGeracao');}
 assert.equal((await ctrl({})).body.requests,n);
});
test('objeto existente igual nao faz upload; bytes adulterados e usuario cruzado nao ganham leitura',async()=>{
 await ctrl({timeout_upload_antes:true});await op('executar');const j=await job();
 await db.query('insert into local_object_store values($1,$2,$3)',[j.artifact_path,j.result_bytes,j.artifact_sha256]);
 await ctrl({timeout_upload_antes:false});const posts=(await ctrl({})).body.posts;await op('executar');assert.equal((await ctrl({})).body.posts,posts);
 assert.equal((await op('ler',{path:j.artifact_path,perfil:B})).error,'FalhaArquivoGeracao');
 await db.query('update local_object_store set bytes=$1 where path=$2',[Buffer.from('adulterado'),j.artifact_path]);
 assert.equal((await op('ler',{path:j.artifact_path})).error,'ObjetoDivergente');
});
test('loader existente le marca/inventario mas nao inventa consentimento/documento/custo',async()=>{
 const r=await op('contexto');assert.equal(r.body.aprovado,false);assert.deepEqual(r.body.cores_confirmadas,['#123ABC','#FFD200']);
 assert.ok(r.body.materiais_ids.includes(LOGO));assert.ok(r.body.pendencias.includes('autorizacao_ia_sem_fonte_persistente'));
 const cruzado=await op('contexto',{perfil:B});assert.deepEqual(cruzado.body.pendencias,['negocio_nao_autorizado']);assert.deepEqual(cruzado.body.materiais_ids,[]);
});
test('marca parcial/invalida nao e confirmada pelo loader',async()=>{
 await db.query('update businesses set onboarding=$1 where id=$2',[JSON.stringify({marca:{coresConfirmadas:['#123ABC','cor-invalida'],aparenciaNaoSei:false,em:'2026-10-22'}}),BA]);
 const r=await op('contexto');assert.deepEqual(r.body.cores_confirmadas,[]);assert.ok(r.body.pendencias.includes('marca_sem_confirmacao_valida'));assert.equal(r.body.aprovado,false);
});
test('erro SQL de constraint faz rollback no PostgreSQL e nao deixa metade do INSERT',async()=>{
 const r=await query('insert into adapter_tx(id,valor) values($1,$2),($3,$4) returning id',[1,'1.00',2,'-1']);
 assert.equal(r.error,'FalhaSqlGeracao');assert.equal(r.fase,'transacao');assert.equal(r.commit_confirmado,false);
 assert.equal((await db.query('select count(*)::int n from adapter_tx')).rows[0].n,0);
 assert.equal((await query('insert into adapter_tx values($1,$2) returning valor',[1,'0.000000000000000001'])).body[0].valor,'0.000000000000000001');
 const m=(await ctrl({})).body;assert.equal(m.connections,m.closed);
});
test('Decimal pequeno do driver mantem DTO decimal fixo aceito pelo consumidor existente',async()=>{
 await ctrl({contexto:{...manifesto,estimativa_usd:'0.000000000000000001'}});const r=await op('executar');
 assert.equal(r.body.estimated_usd,'0.000000000000000001');assert.match(r.body.reserved_usd,/^\d+(\.\d+)?$/);
});
test('contrato privado recusa metadado que tenta transformar simulacao em imagem real',async()=>{
 await op('executar');const j=await job();await db.query("update creatives set copy=jsonb_set(copy,'{generation,simulated}','false'::jsonb) where id=$1",[j.id]);
 assert.equal((await op('privada',{job:j.id})).error,'FalhaArquivoGeracao');
});
