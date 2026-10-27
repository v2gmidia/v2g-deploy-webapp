/** Harness explícito: PostgreSQL descartável + factory FastAPI 25/10. ZERO rede real. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {ambienteTs} from './ts-isolado.mjs';
import {fixtureContextoV2} from './contexto-referencia-v2.mjs';

export const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
export const BA='33333333-3333-4333-8333-333333333333', BB='44444444-4444-4444-8444-444444444444';
export const ID='55555555-5555-4555-8555-555555555555';
const LOGO='66666666-6666-4666-8666-666666666666', REF='77777777-7777-4777-8777-777777777777';
const backend='C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g';
const sha=v=>createHash('sha256').update(v).digest('hex');
const enc=v=>v instanceof Uint8Array?{$bytes:Buffer.from(v).toString('base64')}:v instanceof Date?v.toISOString():Array.isArray(v)?v.map(enc):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,enc(x)])):v;
const dec=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===1&&v.$bytes?Buffer.from(v.$bytes,'base64'):Array.isArray(v)?v.map(dec):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,dec(x)])):v;

export async function criarHarnessFila({dispatcherReal=false,pedidoV2=false}={}) {
  const {PGlite}=await import(pathToFileURL(process.env.V2G_PGLITE_MODULE??'C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
  const db=new PGlite();
  // Protocolo canônico do ensaio: SQL/JSON e consumidor leem os mesmos timestamps UTC.
  await db.exec("set timezone='UTC'");
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table profiles(id uuid primary key);create table businesses(id uuid primary key,profile_id uuid references profiles,dados_ficticios boolean not null,onboarding jsonb not null default '{}'::jsonb,niche text);
    create table campaigns(id uuid primary key);create table analysis_runs(id uuid primary key);
    create table local_object_store(path text primary key,bytes bytea not null,hash text not null);
    create table local_provider_calls(id bigint generated always as identity primary key,instruction text,input_count integer);`);
  const init=readFileSync('supabase/migrations/0001_init.sql','utf8');
  await db.exec(init.match(/create table public\.creatives \([\s\S]*?\n\);/)[0]);
  for(const f of ['0008_publicar_campanha.sql','0010_perfil_empresa.sql','0014_identidade_do_negocio.sql']) {
    const sql=readFileSync('supabase/migrations/'+f,'utf8');
    for(const m of sql.matchAll(/alter table public\.creatives\s[\s\S]*?;/g)) {
      if(m[0].includes('pessoa_id')) await db.exec('create table if not exists pessoas_do_negocio(id uuid primary key)');
      await db.exec(m[0]);
    }
  }
  for(const f of ['supabase/migrations/20261021001651_creative_generation_requests.sql','scripts/sql/proposta-geracao-backend-22-10.sql',backend+'/docs/qa/geracao/proposta-dispatch-fake-25-10.sql']) await db.exec(readFileSync(f,'utf8'));
  if(dispatcherReal)await db.exec(readFileSync(backend+'/docs/qa/geracao/proposta-dispatch-real-26-10.sql','utf8'));
  if(pedidoV2) {
    // A parte de revisão não é usada pelo ensaio: scaffold mínimo para aplicar a migration exata.
    await db.exec('create table creative_review_requests(upload_intent jsonb,constraint creative_review_upload_intent_valida check(true))');
    for(const f of ['supabase/migrations/20261026193000_referencia_publica_pedido_criativo.sql',backend+'/docs/qa/geracao/proposta-catalogo-referencias-26-10.sql',backend+'/docs/qa/geracao/proposta-fontes-persistentes-v2-26-10.sql'])await db.exec(readFileSync(f,'utf8'));
  }
  let child,seq=0,actor=A,business=BA,manifesto,fixtureV2,aprovacoesSeeded=false,alterarResposta=null,perderResposta=false,recusarDownload=false,publico=false,falhasRecibo=0,bibliotecaFalhou=false,tokenDaFixture;
  const requests=[],pending=new Map(),txs=new Map();
  const send=m=>child?.stdin.writable&&child.stdin.write(JSON.stringify(enc(m))+'\n');
  const rpc=m=>new Promise((resolve,reject)=>{const id=++seq;const timer=setTimeout(()=>reject(Error('fixture_timeout')),20000);
    pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});send({id,...m});});
  async function sqlMessage(m) {
    try {
      if(m.phase==='begin') {
        const start=Promise.withResolvers(),done=Promise.withResolvers(),entry={done};txs.set(m.connection,entry);
        entry.completion=db.transaction(async tx=>{entry.tx=tx;start.resolve();if((await done.promise).rollback)throw Error('rollback_fixture');}).then(()=>true,()=>false);
        await start.promise;send({sql_result:m.sql_id,rows:[]});return;
      }
      if(m.phase==='commit'||m.phase==='rollback') {
        const e=txs.get(m.connection);e.done.resolve({rollback:m.phase==='rollback'});const ok=await e.completion;txs.delete(m.connection);
        if(m.phase==='commit'&&!ok)throw Error('commit_fixture');send({sql_result:m.sql_id,rows:[]});return;
      }
      if(falhasRecibo>0&&m.sql.includes('insert into public.creative_generation_fake_receipts')) {
        falhasRecibo-=1;throw Error('falha_de_recibo_fixture');
      }
      const e=txs.get(m.connection);const result=await(e?.tx??db).query(m.sql,m.params);
      send({sql_result:m.sql_id,rows:result.rows,fields:result.fields});
    } catch(e) {send({sql_result:m.sql_id,error:e.code??'sql_fixture'});}
  }
  async function start() {
    child=spawn(backend+'/.venv/Scripts/python.exe',['-X','utf8','-u','tests/integracao/geracao_fila_bridge.py'],{cwd:backend,stdio:['pipe','pipe','pipe'],
      env:{SystemRoot:process.env.SystemRoot,V2G_TEST_REAL_DISPATCH:dispatcherReal?'1':'0',PYTHONIOENCODING:'utf-8'}});
    child.stderr.on('data',()=>{});child.stdin.on('error',()=>{});
    child.on('exit',code=>{for(const p of pending.values())p.reject(Error('bridge_exit_'+code));pending.clear();});
    createInterface({input:child.stdout}).on('line',line=>{const m=dec(JSON.parse(line));if(m.sql_id){void sqlMessage(m);return;}const p=pending.get(m.id);pending.delete(m.id);p?.resolve(m);});
    await rpc({control:{contexto:manifesto,revogado:false,timeout_upload_antes:false,timeout_upload_depois:false}});
  }
  async function stop() {if(child&&child.exitCode===null)await new Promise(resolve=>{
    const atual=child;const timeout=setTimeout(()=>{atual.kill();},2000);
    atual.once('exit',()=>{clearTimeout(timeout);resolve();});atual.stdin.end();
  });}
  function consulta(table,admin=false) {
    assert.ok(['businesses','creative_generation_requests','creatives','creative_generation_context_approvals','creative_generation_brand_approvals','creative_generation_reference_approvals','creative_reference_catalog'].includes(table));
    const filters={},orders=[];let limite=Infinity;
    async function rows() {
      if(!admin&&!actor)return [];
      const result=admin?await db.query(`select * from ${table}`):table==='businesses'
        ?await db.query('select * from businesses where profile_id=$1',[actor])
        :await db.query(`select t.* from ${table} t join businesses b on b.id=t.business_id where b.profile_id=$1`,[actor]);
      const rs=result.rows.filter(r=>Object.entries(filters).every(([k,v])=>r[k]===v));
      rs.sort((a,b)=>{for(const [k,asc]of orders){if(a[k]<b[k])return asc?-1:1;if(a[k]>b[k])return asc?1:-1;}return 0;});
      return rs.slice(0,limite).map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,v instanceof Date?v.toISOString():v])));
    }
    const q={select(){return q;},eq(k,v){filters[k]=v;return q;},is(k,v){filters[k]=v;return q;},order(k,{ascending=true}={}){orders.push([k,ascending]);return q;},limit(n){limite=n;return q;},
      async maybeSingle(){return {data:(await rows())[0]??null,error:null};},then(resolve,reject){return rows().then(data=>({data,error:null})).then(resolve,reject);},
      async insert(p){assert.equal(table,'creative_generation_requests');try{await db.query('insert into creative_generation_requests(id,business_id,requested_by,content_hash,payload) select $1,$2,$3,$4,$5 where exists(select 1 from businesses where id=$2 and profile_id=$3)',[p.id,p.business_id,p.requested_by,p.content_hash,JSON.stringify(p.payload)]);return {error:null};}catch(e){return {error:{code:e.code}};}}};return q;
  }
  function cliente() {return {auth:{getUser:async()=>({data:{user:actor?{id:actor}:null},error:null}),
    getSession:async()=>({data:{session:actor?{user:{id:actor},access_token:tokenDaFixture===undefined?(actor===A?'fixture-user-a':'fixture-user-b'):tokenDaFixture}:null},error:null})},from(table) {
    return consulta(table);
  }};}
  const env={V2G_CREATIVE_REQUESTS_ENABLED:'true',V2G_CREATIVE_BACKEND_ENABLED:'true',V2G_CREATIVE_APP_MODE:dispatcherReal?'real_dispatch':'fila_ficticia',
    V2G_CREATIVE_REAL_SUBMISSION_ENABLED:'false',V2G_CREATIVE_REFERENCE_PILOT_ENABLED:pedidoV2?'true':'false',V2G_BACKEND_URL:'http://fixture.invalid',V2G_BACKEND_TOKEN:'fixture-machine-local'};
  const a=ambienteTs({env,ports:{
    'next/cache':{revalidatePath(){}},
    '@/lib/supabase/server':{createClient:async()=>cliente()},
    '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>actor?{status:'selecionado',negocio:{id:business}}:{status:'sem_sessao'}},
    '@/lib/supabase/admin':{createAdminClient:()=>({from:table=>consulta(table,true),storage:{getBucket:async()=>({data:{public:publico},error:null}),from(bucket){assert.equal(bucket,'v2g-midia');return {download:async path=>{
      if(recusarDownload)return {data:null,error:{message:'FALHA PRIVADA NAO EXIBIR'}};
      const r=await db.query('select bytes from local_object_store where path=$1',[path]);return {data:r.rows[0]?new Blob([r.rows[0].bytes],{type:'image/png'}):null,error:null};}};}}})},
  },fetch:async(url,opt)=>{
    const u=new URL(url);assert.equal(u.origin,'http://fixture.invalid');requests.push({method:opt.method,path:u.pathname});
    const r=await rpc({method:opt.method,path:u.pathname+u.search,body:opt.body?JSON.parse(opt.body):undefined,
      headers:opt.headers});
    if(perderResposta&&opt.method==='POST'){perderResposta=false;throw Error('resposta_perdida_fixture');}
    if(alterarResposta)alterarResposta(r.body.body);
    return new Response(JSON.stringify(r.body.body),{status:r.body.status});
  }});
  const actions=a.load('app/(protected)/criativos/geracao-actions.ts');
  const sessao=a.load('lib/criativos/pedidos-da-sessao.ts');
  const imagem=a.load('app/(protected)/criativos/imagem-gerada/[requestId]/route.ts');
  async function preparar() {
    const f=new FormData();for(const[k,v]of Object.entries({requestId:ID,businessId:business,objetivo:'FICTICIO local',oferta:'Corte com horário fictício',acao:'WhatsApp fictício',confirmado:'on'}))f.set(k,v);
    if(pedidoV2)f.set('referenciaId',fixtureV2.pedido.payload.referenciaId);
    const r=await actions.guardarPedidoAction({},f);
    if(pedidoV2&&r.ok&&!aprovacoesSeeded) {
      // Aprovação vem DEPOIS do pedido, como o trigger exige; não retrodatá-la no reset.
      const agora=(await db.query('select now() as instante')).rows[0].instante;
      for(const k of ['marca','contexto','referencia'])fixtureV2[k].approved_at=fixtureV2[k].created_at=new Date(agora).toISOString();
      // Só no banco descartável: registros fictícios passam pelos triggers reais das propostas.
      for(const [table,row]of [['creative_reference_catalog',fixtureV2.catalogo],['creative_generation_brand_approvals',fixtureV2.marca],['creative_generation_reference_approvals',fixtureV2.referencia],['creative_generation_context_approvals',fixtureV2.contexto]]) {
        const keys=Object.keys(row);await db.query(`insert into ${table}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')})`,keys.map(k=>row[k]&&typeof row[k]==='object'?JSON.stringify(row[k]):row[k]));
      }
      aprovacoesSeeded=true;
    }
    return r;
  }
  async function reset() {
    await stop();actor=A;business=BA;tokenDaFixture=undefined;requests.length=0;perderResposta=false;alterarResposta=null;aprovacoesSeeded=false;recusarDownload=false;publico=false;falhasRecibo=0;bibliotecaFalhou=false;env.V2G_CREATIVE_BACKEND_ENABLED='true';env.V2G_CREATIVE_APP_MODE=dispatcherReal?'real_dispatch':'fila_ficticia';env.V2G_CREATIVE_REAL_SUBMISSION_ENABLED='false';
    if(pedidoV2)await db.exec('truncate creative_reference_catalog cascade');
    await db.exec('truncate creative_generation_jobs,creative_generation_requests,creatives,local_object_store,local_provider_calls,businesses,profiles cascade');
    await db.query('insert into profiles values($1),($2)',[A,B]);await db.query('insert into businesses(id,profile_id,dados_ficticios) values($1,$2,true),($3,$4,true)',[BA,A,BB,B]);
    const fixture=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
    for(const[id,uso,prefix]of[[LOGO,'logo','identidade'],...(!pedidoV2?[[REF,'campanha','referencias']]:[])]) {
      const path=`${prefix}/${BA}/${id}.png`;await db.query("insert into creatives(id,business_id,type,file_name,storage_path,uso,status) values($1,$2,'image','fixture.png',$3,$4,'draft')",[id,BA,path,uso]);
      await db.query('insert into local_object_store values($1,$2,$3)',[path,fixture,sha(fixture)]);
    }
    const doc={versao:'fixture-v1',conteudo:'FICTICIO: nao usar em cliente',revisado_por:'fixture',revisado_em:'2026-10-25T15:00:00Z',business_id:null,nicho_id:null};
    manifesto={business_id:BA,request_id:ID,nicho_id:'fixture',nicho_confirmado:true,central:doc,nicho:{...doc,nicho_id:'fixture'},cores:'#123ABC',
      materiais:[['logo',LOGO,'identidade'],['referencia',REF,'referencias']].map(([uso,id,prefix])=>({id,business_id:BA,caminho:`${prefix}/${BA}/${id}.png`,sha256:sha(fixture),uso,autorizacao_id:'FICTICIA',revisado_por:'fixture',permitido:true,fonte:'fixture',observado_em:doc.revisado_em,condicao_de_uso:'somente teste'})),
      destino_autorizado:dispatcherReal?'gpt-image-2':'mock',politica_versao:'fixture',estimativa_usd:'0.000000000000000001',reserva_usd:'1',limite_usd:'1'};
    if(pedidoV2) {
      const {hashRegistroContexto:hash}=a.load('lib/criativos/geracao/contexto-referencia-publica.ts');
      fixtureV2=fixtureContextoV2({hashRegistroContexto:hash,hashDoPedido:a.load('lib/criativos/pedido-imagem.ts').hashDoPedido});
      const observado=new Date(Date.now()-120000).toISOString(),aprovado=new Date(Date.now()-60000).toISOString(),expira=new Date(Date.now()+86400000).toISOString();
      const m=fixtureV2.marca.manifest,c=fixtureV2.contexto.manifest,cat=fixtureV2.catalogo;
      m.destino_autorizado=c.destino_autorizado=dispatcherReal?'gpt-image-2':'mock';m.logo.caminho=`identidade/${BA}/${LOGO}.png`;m.logo.sha256=sha(fixture);m.logo.observado_em=observado;
      const origem=fixtureV2.logoVigente.copy.origemMaterial;origem.sha256=m.logo.sha256;origem.registradoEm=observado;
      m.proveniencia_upload_sha256=hash(origem);m.onboarding_marca_sha256=hash(fixtureV2.onboardingMarca);
      c.central.revisado_em=c.nicho.revisado_em=observado;
      cat.manifest.data_observada=observado.slice(0,10);cat.manifest.observado_em=observado.replace(/\.(\d{3})Z$/,'.$1000Z');cat.created_at=observado;cat.reviewed_at=aprovado;cat.valid_until=expira;
      cat.manifest_sha256=hash(cat.manifest);fixtureV2.referencia.catalog_sha256=cat.manifest_sha256;
      for(const k of ['marca','contexto','referencia']){const r=fixtureV2[k];r.approved_at=r.created_at=aprovado;r.expires_at=expira;r.manifest_sha256=hash(r.manifest);}
      await db.query("update businesses set niche='Barbearia',onboarding=$1 where id=$2",[JSON.stringify({marca:fixtureV2.onboardingMarca}),BA]);
      await db.query('update creatives set copy=$1 where id=$2',[JSON.stringify({origemMaterial:origem}),LOGO]);
    }
    await start();
  }
  await reset();
  return {db,env,requests,actions,preparar,reset,load:a.load,clienteSessao:cliente,get fixtureV2(){return fixtureV2;},alterarResposta:fn=>{alterarResposta=fn;},ctrl:control=>rpc({control}),worker:()=>rpc({op:'worker'}),
    consultar:(op='consultar',biz=business,id=ID)=>actions.acompanharGeracaoAction(biz,id,op),
    pedidos:()=>sessao.carregarPedidosDaSessao(business),
    biblioteca:async()=>{
      if(bibliotecaFalhou)return {businessId:business,falhou:true,itens:[]};
      const r=await db.query(`select c.id,c.business_id,c.file_name,c.copy from creatives c join businesses b on b.id=c.business_id
        where c.business_id=$1 and b.profile_id=$2 and c.uso='campanha' and c.arquivado_em is null and c.copy->'generation' is not null`,[business,actor]);
      return {businessId:business,falhou:false,itens:r.rows.map(c=>({id:c.id,nome:c.file_name,
        imagemUrl:`/criativos/imagem-gerada/${c.copy.generation.requestId}?negocio=${c.business_id}`,
        grupo:'biblioteca',estado:'Imagem fictícia de teste',tom:'neutro',criadoEm:'Ensaio local',associacoes:[]}))};
    },
    falharBiblioteca:valor=>{bibliotecaFalhou=valor;},
    imagem:(biz=business,id=ID)=>imagem.GET(new Request(`http://fixture.invalid/criativos/imagem-gerada/${id}?negocio=${biz}`),{params:Promise.resolve({requestId:id})}),
    ator:(perfil,negocio)=>{actor=perfil;business=negocio;},
    definirTokenDeEnsaio:valor=>{tokenDaFixture=valor;},
    perderResposta:()=>{perderResposta=true;},downloadFalha:v=>{recusarDownload=v;},bucketPublico:v=>{publico=v;},
    falharProcessamento:async()=>{
      falhasRecibo=3;
      for(let i=0;i<3;i++){
        await db.exec("update creative_generation_dispatch set available_at=now()-interval '1 second' where state='queued'");
        await rpc({op:'worker'});
      }
    },
    reboot:async()=>{await stop();await start();},close:async()=>{await stop();await db.close();},
    count:async table=>{assert.ok(['creative_generation_jobs','creative_generation_dispatch','creative_generation_real_dispatch','creative_generation_fake_receipts','creatives','local_provider_calls'].includes(table));return Number((await db.query(`select count(*) n from ${table}`)).rows[0].n);},
  };
}
