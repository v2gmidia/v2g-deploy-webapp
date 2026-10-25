/** LOCAL/SIMULADO: action/serviços reais, PostgreSQL descartável, Auth e Storage instrumentados. */
import assert from 'node:assert/strict';
import { before, beforeEach, after, test } from 'node:test';
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import ts from 'typescript';

const mocks = {
  'server-only': 'export {};',
  'next/cache': 'export const revalidatePath = () => {};',
  '@/lib/supabase/server': 'export const createClient = async () => globalThis.__geracaoOffline.cliente();',
  '@/lib/multiconta/ativo': 'export const negocioAtivoDaSessao = async () => globalThis.__geracaoOffline.ativo();',
};
const hooks = registerHooks({
  resolve(s,c,next) {
    if (Object.hasOwn(mocks,s)) return {url:`geracao-mock:${s}`,shortCircuit:true};
    let url;
    if (s.startsWith('@/')) url=new URL(`../${s.slice(2)}`,import.meta.url);
    else if(s.startsWith('.') && c.parentURL?.startsWith('file:')) url=new URL(s,c.parentURL);
    if(url) for(const suffix of ['', '.ts']) {
      const file=new URL(url.href+suffix);
      if(existsSync(file) && file.pathname.endsWith('.ts')) return {url:file.href,shortCircuit:true};
    }
    return next(s,c);
  },
  load(u,c,next) {
    if(u.startsWith('geracao-mock:')) return {format:'module',source:mocks[u.slice(13)],shortCircuit:true};
    if(u.startsWith('file:') && u.endsWith('.ts')) return {format:'module',shortCircuit:true,
      source:ts.transpileModule(readFileSync(fileURLToPath(u),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText};
    return next(u,c);
  },
});
const {PGlite}=await import(pathToFileURL(process.env.V2G_PGLITE_MODULE
  ?? 'C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
const {guardarPedidoAction}=await import('../app/(protected)/criativos/geracao-actions.ts');
const {carregarPedidosDaSessao}=await import('../lib/criativos/pedidos-da-sessao.ts');
const {RepositorioGeracaoLocal}=await import('../lib/criativos/geracao/repositorio-local.ts');
const {executarGeracaoLocal,carregarBibliotecaGeradaLocal}=await import('../lib/criativos/geracao/servico-local.ts');
const {criarProvedorSimulado,FalhaDoProvedor}=await import('../lib/criativos/geracao/provedor.ts');
const {congelarContexto,sha256,canonico}=await import('../lib/criativos/geracao/contexto.ts');
const {conferirPngLocal}=await import('../lib/criativos/geracao/png-local.ts');
let db=new PGlite();
const A='11111111-1111-4111-8111-111111111111', B='22222222-2222-4222-8222-222222222222';
const BA='33333333-3333-4333-8333-333333333333', BB='44444444-4444-4444-8444-444444444444';
const ID='55555555-5555-4555-8555-555555555555';
const antes={node:process.env.NODE_ENV,flag:process.env.V2G_CREATIVE_REQUESTS_ENABLED,fetch:globalThis.fetch};
globalThis.fetch=()=>{throw Error('REDE PROIBIDA NESTE ENSAIO');};
let estado;
const sql={destino:'postgres_descartavel',query:(s,p)=>db.query(s,p)};
const repo=()=>new RepositorioGeracaoLocal(sql);
const consultar=(s,p)=>db.query(s,p);
const contar=async table=>Number((await consultar(`select count(*) as n from ${table}`)).rows[0].n);
const erro={data:null,error:{code:'teste_sql'}};

async function como(perfil,acao,role='authenticated') {
  return db.transaction(async tx=>{
    assert.ok(['authenticated','anon','service_role'].includes(role));
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[perfil]);
    return acao(tx);
  });
}
function cliente() {
  return {auth:{getUser:async()=>({data:{user:estado.profile?{id:estado.profile}:null},error:null})},from(table){
    assert.equal(table,'creative_generation_requests');
    const filtros={};
    const selecionar=async limite=>{
      const entradas=Object.entries(filtros);assert.ok(entradas.every(([k])=>['id','business_id'].includes(k)));
      const where=entradas.map(([k],i)=>`${k}=$${i+1}`).join(' and ');
      try {
        const r=await como(estado.profile,tx=>tx.query(`select id,business_id,requested_by,content_hash,payload,status,created_at
          from creative_generation_requests ${where?'where '+where:''} order by created_at desc limit ${limite}`,entradas.map(([,v])=>v)));
        const rows=r.rows.map(r=>({...r,created_at:new Date(r.created_at).toISOString()}));
        return {data:rows,error:null};
      } catch {return erro;}
    };
    const q={select(c){assert.equal(c,'id, business_id, requested_by, content_hash, payload, status, created_at');return q;},
      eq(k,v){filtros[k]=v;return q;},order(){return q;},limit:n=>selecionar(n),
      async maybeSingle(){const r=await selecionar(1);return {...r,data:r.data?.[0]??null};},
      async insert(p){
        try {await como(estado.profile,tx=>tx.query(`insert into creative_generation_requests
          (id,business_id,requested_by,content_hash,payload) values($1,$2,$3,$4,$5)`,
        [p.id,p.business_id,p.requested_by,p.content_hash,JSON.stringify(p.payload)]));return {error:null};}
        catch(e){return {error:{code:e.code}};}
      }};return q;
  }};
}
globalThis.__geracaoOffline={cliente,ativo:async()=>estado.profile?{status:'selecionado',negocio:{id:estado.business}}:{status:'sem_sessao'}};

function contexto() {
  const campo=valor=>({valor,estado:'confirmado_cliente',origem:'fixture_local',registradoEm:'2026-10-22T12:00:00Z'});
  const doc=(tipo,nichoId)=>({tipo,nichoId,versao:'fixture-v1',conteudo:`REGRA FICTICIA ${tipo}: nao inventar fachada.`,
    revisadoPor:'fixture-revisor',revisadoEm:'2026-10-22T12:00:00Z'});
  return {
    prevoo:{marca:{businessId:BA,logoId:'logo-fixture',usarFachada:false,fachadaId:null,
      linhas:[{id:'logo-fixture',business_id:BA,uso:'logo',storage_path:`identidade/${BA}/logo.png`,
        created_at:'2026-10-22T12:00:00Z',arquivado_em:null,copy:{}}],
      autorizacoesConferidas:[{imagemId:'logo-fixture',businessId:BA,finalidade:'geracao_imagem',
        autorizadoEm:'2026-10-22T12:00:00Z',autorizadoPor:A,revogadoEm:null}]},
    contexto:{businessId:BA,objetivo:campo('Apresentar serviço'),oferta:campo('Corte com horário marcado'),
      acaoDesejada:campo('Chamar no WhatsApp'),promocao:false,coresConfirmadas:campo('Azul e amarelo'),
      usarFachada:false,nichoId:'barbearia-fixture',nichoConfirmadoNoCatalogo:true,
      documentoCentralVersao:'fixture-v1',documentoNichoVersao:'fixture-v1',referencias:[{id:'ref-fixture',tipo:'imagem',
        origem:'fixture_local',localizadorFonte:'fixture:imagem-propria',observadaEm:'2026-10-22T12:00:00Z',
        condicaoDeUso:'material integralmente ficticio e proprio do ensaio',padrao:'hierarquia simples',
        revisadaPorHumano:true,revisadaPor:'fixture-revisor',usoComoInspiracaoPermitido:true}]},
    documentos:{central:doc('central',null),nicho:doc('nicho','barbearia-fixture')},
    custo:{businessId:BA,tipo:'inicial',historicoCompleto:true,tentativas:[],limiteTotalCentavos:100,tetoDaProximaTentativaCentavos:20}},
    escopoDocumentos:{central:null,nicho:BA},hashesMateriais:{'logo-fixture':sha256('logo-ficticio')},
    hashesReferencias:{'ref-fixture':sha256('referencia-ficticia')},estimativaMinorSimulada:10,
  };
}
function portas() {
  const provedor=criarProvedorSimulado();
  return {habilitado:true,sessao:async()=>estado.profile?{profileId:estado.profile,businessId:estado.business}:null,
    carregarContexto:async()=>structuredClone(estado.contexto),autorizarSnapshot:async()=>estado.autorizado,
    repositorio:repo(),agora:()=>new Date(estado.agora),
    provedor:{...provedor,async gerar(p){estado.chamadas++;return provedor.gerar(p);}},
    storage:{
      async guardarSeAusente(path,bytes,hash){
        estado.uploads++;
        if(estado.falhaStorage) throw Error('falha-storage-nao-vazar');
        await consultar(`insert into local_object_store(path,bytes,hash) values($1,$2,$3) on conflict(path) do nothing`,[path,bytes,hash]);
        const r=(await consultar('select hash from local_object_store where path=$1',[path])).rows[0];
        if(r.hash!==hash) throw Error('objeto-divergente');
        if(estado.respostaStoragePerdida){estado.respostaStoragePerdida=false;throw Error('resposta-perdida');}
      },
      async ler(path){const r=(await consultar('select bytes from local_object_store where path=$1',[path])).rows[0];if(!r)throw Error('ausente');return r.bytes;},
    }};
}
function formulario(id=ID) {
  const f=new FormData();for(const [k,v] of Object.entries({requestId:id,businessId:BA,objetivo:'Apresentar serviço',
    oferta:'Corte com horário marcado',acao:'Chamar no WhatsApp',confirmado:'on'})) f.set(k,v);return f;
}
async function preparar(id=ID) {assert.equal((await guardarPedidoAction({},formulario(id))).ok,true);return {requestId:id,businessId:BA};}
const atual=()=>repo().buscar(ID,BA,A);

before(async()=>{
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;grant usage on schema auth to authenticated;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table profiles(id uuid primary key);create table businesses(id uuid primary key,profile_id uuid references profiles);
    alter table businesses enable row level security;grant select on businesses to authenticated;
    create policy propria on businesses for select to authenticated using(profile_id=(select auth.uid()));
    create table campaigns(id uuid primary key);create table analysis_runs(id uuid primary key);
    create table local_object_store(path text primary key,bytes bytea not null,hash text not null);`);
  const init=readFileSync(new URL('../supabase/migrations/0001_init.sql',import.meta.url),'utf8');
  await db.exec(init.match(/create table public\.creatives \([\s\S]*?\n\);/)[0]);
  // Aplicar os ALTERs reais de creatives, não as migrations amplas e seus outros objetos.
  for(const f of ['0008_publicar_campanha.sql','0010_perfil_empresa.sql','0014_identidade_do_negocio.sql']) {
    const sql=readFileSync(new URL('../supabase/migrations/'+f,import.meta.url),'utf8');
    for(const m of sql.matchAll(/alter table public\.creatives\s[\s\S]*?;/g)) {
      if(m[0].includes('pessoa_id')) {
        await db.exec('create table if not exists pessoas_do_negocio(id uuid primary key)');
      }
      await db.exec(m[0]);
    }
  }
  await db.exec(`alter table creatives enable row level security;grant select on creatives to authenticated;
    create policy creatives_select_own on creatives for select to authenticated using(exists(
      select 1 from businesses b where b.id=business_id and b.profile_id=(select auth.uid())));`);
  await db.exec(readFileSync(new URL('../supabase/migrations/20261021001651_creative_generation_requests.sql',import.meta.url),'utf8'));
  // Defaults hostis só antes do novo SQL: provar que seu REVOKE não depende do ambiente.
  await db.exec('alter default privileges in schema public grant all on tables to public,anon,authenticated,service_role');
  await db.exec(readFileSync(new URL('./sql/proposta-geracao-local-22-10.sql',import.meta.url),'utf8'));
});
beforeEach(async()=>{
  process.env.NODE_ENV='development';process.env.V2G_CREATIVE_REQUESTS_ENABLED='true';
  await db.exec('truncate creative_generation_runs,creative_generation_requests,creatives,local_object_store,businesses,profiles cascade');
  await consultar('insert into profiles values($1),($2)',[A,B]);
  await consultar('insert into businesses values($1,$2),($3,$4)',[BA,A,BB,B]);
  estado={profile:A,business:BA,contexto:contexto(),autorizado:true,agora:'2026-10-22T15:00:00Z',chamadas:0,uploads:0,falhaStorage:false};
});
after(async()=>{
  await db.close();hooks.deregister();globalThis.fetch=antes.fetch;delete globalThis.__geracaoOffline;
  for(const [key,value] of [['NODE_ENV',antes.node],['V2G_CREATIVE_REQUESTS_ENABLED',antes.flag]])
    if(value===undefined)delete process.env[key];else process.env[key]=value;
});

test('action real → SQL → snapshot → execução → PNG → creatives → biblioteca e recarga',async()=>{
  const entrada=await preparar();const p=portas();
  assert.equal((await executarGeracaoLocal(entrada,p)).status,'artifact_available');
  const novaLeitura=await carregarBibliotecaGeradaLocal(BA,portas());
  assert.equal(novaLeitura.ok,true);assert.equal(novaLeitura.itens.length,1);
  const item=novaLeitura.itens[0];assert.equal(item.simulated,true);assert.equal(item.version,1);
  assert.match(item.nome,/SIMULADO-LOCAL/);assert.equal(item.aprovacao,null);assert.equal(item.publicado,false);
  assert.equal(item.hash,sha256(item.bytes));assert.deepEqual(conferirPngLocal(item.bytes),{largura:64,altura:64});
  assert.equal(item.custo.reservedMinor,20);assert.equal(item.custo.estimatedMinor,10);assert.equal(item.custo.billedMinor,null);
  assert.equal(item.custo.usageReported,null);assert.equal(estado.chamadas,1);
  assert.equal((await carregarPedidosDaSessao(BA)).pedidos[0].status,'awaiting_configuration');
  assert.equal(await contar('creative_generation_requests'),1);assert.equal(await contar('creatives'),1);
});
test('produção, flag ausente e provedor real negam antes de sessão ou SQL',async()=>{
  const p=portas();p.sessao=()=>{throw Error('NAO DEVE CHAMAR');};
  process.env.NODE_ENV='production';assert.equal((await executarGeracaoLocal({requestId:ID,businessId:BA},p)).motivo,'desligado');
  process.env.NODE_ENV='development';p.habilitado=false;
  assert.equal((await executarGeracaoLocal({requestId:ID,businessId:BA},p)).motivo,'desligado');
  delete p.habilitado;assert.equal((await executarGeracaoLocal({requestId:ID,businessId:BA},p)).motivo,'desligado');
  p.habilitado=true;p.provedor.modo='real';assert.equal((await executarGeracaoLocal({requestId:ID,businessId:BA},p)).motivo,'desligado');
  assert.equal((await carregarBibliotecaGeradaLocal(BA,p)).ok,false);assert.equal(estado.chamadas,0);
});
test('contexto ausente/cross-business/documento de outro nicho bloqueia antes de reserva',async()=>{
  const entrada=await preparar();
  for(const mudar of [()=>{estado.contexto=null;},()=>{estado.contexto.prevoo.contexto.businessId=BB;},
    ()=>{estado.contexto.escopoDocumentos.nicho=BB;},()=>{estado.contexto.prevoo.documentos.nicho.nichoId='outro';},
    ()=>{estado.contexto.prevoo.documentos.central=null;},()=>{estado.contexto.prevoo.marca.linhas[0].business_id=BB;}]) {
    estado.contexto=contexto();mudar();assert.equal((await executarGeracaoLocal(entrada,portas())).motivo,'contexto_bloqueado');
    assert.equal(await contar('creative_generation_runs'),0);assert.equal(estado.chamadas,0);
  }
});
test('referência sem direitos, hash ausente, oferta alterada e teto inválido não reservam',async()=>{
  const entrada=await preparar();
  for(const mudar of [c=>{c.prevoo.contexto.referencias[0].usoComoInspiracaoPermitido=false;},
    c=>{delete c.hashesMateriais['logo-fixture'];},c=>{c.prevoo.contexto.oferta.valor='Outra oferta';},
    c=>{c.prevoo.custo.tetoDaProximaTentativaCentavos=101;}]) {
    estado.contexto=contexto();mudar(estado.contexto);
    assert.equal((await executarGeracaoLocal(entrada,portas())).motivo,'contexto_bloqueado');
    assert.equal(await contar('creative_generation_runs'),0);
  }
});
test('sessão/carteira/dono cruzados são negados e biblioteca não revela o arquivo',async()=>{
  const entrada=await preparar();await executarGeracaoLocal(entrada,portas());
  estado.profile=B;estado.business=BB;
  assert.equal((await executarGeracaoLocal(entrada,portas())).motivo,'acesso_negado');
  assert.equal((await carregarBibliotecaGeradaLocal(BA,portas())).ok,false);
  assert.deepEqual((await carregarBibliotecaGeradaLocal(BB,portas())).itens,[]);
  estado.business=BA;assert.equal((await executarGeracaoLocal(entrada,portas())).motivo,'acesso_negado');
  assert.deepEqual((await carregarBibliotecaGeradaLocal(BA,portas())).itens,[]);
  assert.equal(estado.chamadas,1);
});
test('replay/duplo clique preserva uma tentativa, reserva, arquivo e item na biblioteca',async()=>{
  const entrada=await preparar();for(let i=0;i<3;i++)assert.equal((await executarGeracaoLocal(entrada,portas())).status,'artifact_available');
  assert.equal(estado.chamadas,1);assert.equal(await contar('creative_generation_runs'),1);
  assert.equal(await contar('local_object_store'),1);assert.equal(await contar('creatives'),1);
});
test('duas leituras ausentes concorrentes: UNIQUE do SQL escolhe um único gerador',async()=>{
  const entrada=await preparar();let prontos=0;let liberar;const barreira=new Promise(r=>{liberar=r;});
  const p=portas();p.carregarContexto=async()=>{if(++prontos===2)liberar();await barreira;return contexto();};
  const respostas=await Promise.all([executarGeracaoLocal(entrada,p),executarGeracaoLocal(entrada,p)]);
  assert.ok(respostas.every(r=>r.ok));assert.equal(estado.chamadas,1);
  assert.equal(await contar('creative_generation_runs'),1);assert.equal(await contar('local_object_store'),1);
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'artifact_available');
});
test('clique enquanto provedor está pendente não chama segundo gerador',async()=>{
  const entrada=await preparar();let entrar,soltar;const entrou=new Promise(r=>entrar=r),esperar=new Promise(r=>soltar=r);
  const p=portas(),gerar=p.provedor.gerar;p.provedor.gerar=async q=>{entrar();await esperar;return gerar(q);};
  const primeiro=executarGeracaoLocal(entrada,p);await entrou;
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'running');
  soltar();assert.equal((await primeiro).status,'artifact_available');assert.equal(estado.chamadas,1);
});
test('falha de Storage retoma bytes duráveis com novo serviço e sem gerar novamente',async()=>{
  const entrada=await preparar();estado.falhaStorage=true;
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'storage_pending');
  const anterior=await atual();assert.ok(anterior.result_bytes.length>0);assert.equal(await contar('creatives'),0);
  estado.falhaStorage=false;assert.equal((await executarGeracaoLocal(entrada,portas())).status,'artifact_available');
  assert.equal((await atual()).artifact_sha256,anterior.artifact_sha256);assert.equal(estado.chamadas,1);
});
test('arquivo guardado com resposta perdida retoma mesmo caminho/hash e um item',async()=>{
  const entrada=await preparar();estado.respostaStoragePerdida=true;
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'storage_pending');
  assert.equal(await contar('local_object_store'),1);
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'artifact_available');
  assert.equal(estado.chamadas,1);assert.equal(await contar('local_object_store'),1);assert.equal(await contar('creatives'),1);
});
test('staging confirmado com resposta perdida é relido e não gera de novo',async()=>{
  const entrada=await preparar();const p=portas(),receber=p.repositorio.receber.bind(p.repositorio);
  p.repositorio.receber=async(...args)=>{await receber(...args);throw Error('resposta-sql-perdida');};
  assert.equal((await executarGeracaoLocal(entrada,p)).status,'artifact_available');assert.equal(estado.chamadas,1);
});
test('falha antes de staging com bytes só em memória exige reconciliação, não retry',async()=>{
  const entrada=await preparar();const p=portas();p.repositorio.receber=async()=>{throw Error('db-indisponivel');};
  assert.equal((await executarGeracaoLocal(entrada,p)).status,'reconciliation_required');
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'reconciliation_required');
  assert.equal((await atual()).reservation_state,'retained_uncertain');assert.equal(estado.chamadas,1);
});
test('timeout ambíguo retém reserva e não repete chamada',async()=>{
  const entrada=await preparar();const p=portas();p.provedor.gerar=async()=>{estado.chamadas++;throw new FalhaDoProvedor('incerto');};
  assert.equal((await executarGeracaoLocal(entrada,p)).status,'reconciliation_required');
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'reconciliation_required');
  assert.equal((await atual()).billed_minor,null);assert.equal(estado.chamadas,1);
});
test('falha comprovadamente anterior ao envio encerra sem retry automático',async()=>{
  const entrada=await preparar();const p=portas();p.provedor.gerar=async()=>{estado.chamadas++;throw new FalhaDoProvedor('nao_enviado');};
  assert.equal((await executarGeracaoLocal(entrada,p)).status,'failed');
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'failed');assert.equal(estado.chamadas,1);
  assert.equal((await atual()).reservation_state,'closed_simulated');assert.equal((await atual()).billed_minor,null);
});
test('execução abandonada não ganha nova tentativa quando lease termina',async()=>{
  const entrada=await preparar();const pedido=await repo().pedido(ID,BA,A),snapshot=congelarContexto(pedido,contexto());
  await repo().iniciar(snapshot,randomUUID(),randomUUID(),new Date('2026-10-22T14:00:00Z'));
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'reconciliation_required');assert.equal(estado.chamadas,0);
});
test('snapshot permanece congelado mesmo com nova versão carregável; revogação atual bloqueia',async()=>{
  const entrada=await preparar();await executarGeracaoLocal(entrada,portas());const anterior=await atual();
  estado.contexto.prevoo.documentos.central.conteudo='Documento mudou depois';
  await executarGeracaoLocal(entrada,portas());assert.equal((await atual()).snapshot_hash,anterior.snapshot_hash);
  estado.autorizado=false;assert.equal((await executarGeracaoLocal(entrada,portas())).motivo,'contexto_bloqueado');
  assert.equal((await carregarBibliotecaGeradaLocal(BA,portas())).ok,false);assert.equal(estado.chamadas,1);
});
test('SQL recusa mudar snapshot/tentativa, custo faturado falso ou ressuscitar execução',async()=>{
  await executarGeracaoLocal(await preparar(),portas());const e=await atual();
  for(const [sql,params] of [
    ['update creative_generation_runs set snapshot_hash=$1 where id=$2',['f'.repeat(64),e.id]],
    ['update creative_generation_runs set attempt_id=$1 where id=$2',[randomUUID(),e.id]],
    ['update creative_generation_runs set billed_minor=0 where id=$1',[e.id]],
    ["update creative_generation_runs set status='running',reservation_state='reserved' where id=$1",[e.id]],
  ])await assert.rejects(consultar(sql,params));
});
test('RLS/ACL do SQL: somente dono lê metadados; ninguém comum grava ou lê snapshot/bytes',async()=>{
  await executarGeracaoLocal(await preparar(),portas());
  assert.equal((await como(A,tx=>tx.query('select id from creative_generation_runs'))).rows.length,1);
  assert.equal((await como(B,tx=>tx.query('select id from creative_generation_runs'))).rows.length,0);
  for(const column of ['snapshot','result_bytes','reserved_minor'])await assert.rejects(como(A,tx=>tx.query(`select ${column} from creative_generation_runs`)));
  await assert.rejects(como(A,tx=>tx.query("update creative_generation_runs set status='failed'")));
  await assert.rejects(como(A,tx=>tx.query('select id from creative_generation_runs'),'anon'));
  assert.equal((await como(B,tx=>tx.query('select id from creatives'))).rows.length,0);
  assert.equal((await consultar("select relrowsecurity from pg_class where oid='creative_generation_runs'::regclass")).rows[0].relrowsecurity,true);
});
test('arquivo inválido nunca vira entrega',async()=>{
  const entrada=await preparar();const p=portas();p.provedor.gerar=async()=>{estado.chamadas++;return {bytes:new Uint8Array([1,2,3]),mime:'image/png',simulated:true,billedMinor:null,usageReported:null};};
  assert.equal((await executarGeracaoLocal(entrada,p)).status,'reconciliation_required');assert.equal(await contar('creatives'),0);
  assert.deepEqual((await carregarBibliotecaGeradaLocal(BA,portas())).itens,[]);
});
test('corrupção dos bytes no Storage é recusada na recarga, sem gerar reposição',async()=>{
  await executarGeracaoLocal(await preparar(),portas());
  await consultar('update local_object_store set bytes=$1',[new Uint8Array([0,1,2])]);
  assert.equal((await carregarBibliotecaGeradaLocal(BA,portas())).ok,false);assert.equal(estado.chamadas,1);
});
test('fake que declara cobrança zero como se fosse real é recusado',async()=>{
  const entrada=await preparar();const p=portas(),gerar=p.provedor.gerar;
  p.provedor.gerar=async q=>({...await gerar(q),billedMinor:0});
  assert.equal((await executarGeracaoLocal(entrada,p)).status,'reconciliation_required');
  assert.equal(await contar('creatives'),0);assert.equal((await atual()).billed_minor,null);
});
test('falha de vínculo da biblioteca retoma só a persistência',async()=>{
  const entrada=await preparar();const p=portas();p.repositorio.vincularBiblioteca=async()=>{throw Error('db-falhou');};
  assert.equal((await executarGeracaoLocal(entrada,p)).status,'storage_pending');
  assert.equal(await contar('local_object_store'),1);assert.equal(await contar('creatives'),0);
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'artifact_available');
  assert.equal(estado.chamadas,1);assert.equal(await contar('creatives'),1);
});
test('consentimento revogado enquanto provedor responde impede entrega na biblioteca',async()=>{
  const entrada=await preparar();const p=portas(),gerar=p.provedor.gerar;
  p.provedor.gerar=async q=>{const r=await gerar(q);estado.autorizado=false;return r;};
  assert.equal((await executarGeracaoLocal(entrada,p)).motivo,'contexto_bloqueado');
  assert.equal((await atual()).status,'storage_pending');assert.equal(await contar('creatives'),0);
  assert.equal(estado.uploads,0);assert.equal(estado.chamadas,1);
});
test('snapshot e bytes não podem ser trocados por término atrasado da mesma tentativa',async()=>{
  await executarGeracaoLocal(await preparar(),portas());const e=await atual();
  assert.equal(await repo().receber(e,new Uint8Array([1,2]),{largura:1,altura:1}),null);
  assert.equal((await atual()).artifact_sha256,e.artifact_sha256);assert.equal(estado.chamadas,1);
});
test('metadado adulterado da peça não ganha lugar na biblioteca do ensaio',async()=>{
  await executarGeracaoLocal(await preparar(),portas());
  await consultar(`update creatives set copy=jsonb_set(copy,'{generation,attemptId}',to_jsonb($1::text))`,[randomUUID()]);
  assert.deepEqual((await carregarBibliotecaGeradaLocal(BA,portas())).itens,[]);assert.equal(estado.chamadas,1);
});
test('caminho NULL não satisfaz CHECK SQL de arquivo recuperável',async()=>{
  const entrada=await preparar();const pedido=await repo().pedido(ID,BA,A),snapshot=congelarContexto(pedido,contexto());
  const e=(await repo().iniciar(snapshot,randomUUID(),randomUUID(),new Date(estado.agora))).execucao;
  await assert.rejects(consultar(`update creative_generation_runs set status='storage_pending',
    result_bytes=$1,artifact_sha256=$2,largura=1,altura=1,artifact_path=NULL where id=$3`,
  [new Uint8Array([1]),'a'.repeat(64),e.id]));
  assert.equal((await atual()).status,'running');assert.equal(estado.chamadas,0);
});
test('restauro SQL em nova instância recupera resultado pendente sem contexto em memória',async()=>{
  const entrada=await preparar();estado.falhaStorage=true;
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'storage_pending');
  const hash=(await atual()).artifact_sha256;
  const dump=await db.dumpDataDir();await db.close();db=new PGlite({loadDataDir:dump});
  estado.contexto=null;estado.falhaStorage=false;estado.chamadas=0;
  assert.equal((await executarGeracaoLocal(entrada,portas())).status,'artifact_available');
  const biblioteca=await carregarBibliotecaGeradaLocal(BA,portas());
  assert.equal(biblioteca.itens[0].hash,hash);assert.equal(estado.chamadas,0);
  assert.equal(await contar('creative_generation_requests'),1);assert.equal(await contar('creatives'),1);
});
