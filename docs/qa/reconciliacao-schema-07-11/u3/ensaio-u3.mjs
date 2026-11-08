// Efeitos SQL reais em PostgreSQL embarcado, com dados inteiramente ficticios.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {fixture,read,M,backend} from './fixture.mjs';
import {conferirRecibos} from './comparar-recibos.mjs';
import {CAMPOS} from '../../../../lib/agentes/campos.ts';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',UA='31111111-1111-4111-8111-111111111111',UB='32222222-2222-4222-8222-222222222222';
const result={local:true,remote:false,engine:'PGlite',auth:'fixture GUC; nao e Auth real',concurrency:'sequencial; sem prova de sessoes independentes',cases:[]};
const mark=n=>{result.cases.push(n);console.log('PASS '+n);};
function seals(){let n=0;for(const prefix of ['../','../u2/'])for(const line of read(prefix+'SHA256SUMS.txt').trim().split(/\r?\n/)){const [hash,name]=line.split('  ');assert.equal(createHash('sha256').update(readFileSync(new URL(prefix+name,import.meta.url))).digest('hex'),hash,'selo '+prefix+name);n++;}assert.equal(n,30);}
const receipt=async db=>(await db.query(read('u3-preflight.sql'))).rows[0].receipt;
async function managed(db,sql,name,version){await db.transaction(async t=>{await t.exec(sql);await t.query('insert into supabase_migrations.schema_migrations values($1,$2)',[version,name]);});}
async function apply(db){await managed(db,read('u3-aplicar.sql'),M.applyName,'fixture-u3');}
async function undo(db){await managed(db,read('u3-retornar.sql'),M.returnName,'fixture-u3-return');}
async function seed(db){await db.query('insert into public.profiles(id) values($1),($2)',[UA,UB]);await db.query("insert into public.businesses(id,profile_id,name) values($1,$2,'FICTICIO A'),($3,$4,'FICTICIO B')",[A,UA,B,UB]);}
async function call(db,field,value,origin='extraido',id=A,exec=null){return (await db.query('select public.escrever_apenas_se_livre($1,$2,$3::jsonb,$4,$5,$6) as r',[id,field,value===undefined?null:JSON.stringify(value),origin,'fixture-operator',exec])).rows[0].r;}
async function proposal(db,id=A){const i=(await db.query("insert into public.entrevistas(business_id,realizada_em,conduzida_por) values($1,now(),'fixture') returning id",[id])).rows[0].id;return (await db.query("insert into public.propostas_de_perfil(business_id,entrevista_id,prompt_versao,modelo) values($1,$2,'fixture-v1','fixture-model') returning id",[id,i])).rows[0].id;}
async function item(db,p,table,field,value,decision='aceito',final=null){await db.query("insert into public.itens_da_proposta(proposta_id,tabela_alvo,campo,valor_proposto,confianca,trecho,decisao,valor_final,decidido_por,decidido_em) values($1,$2,$3,$4,'explicito','trecho FICTICIO',$5,$6,$7,$8)",[p,table,field,JSON.stringify(value),decision,final===null?null:JSON.stringify(final),decision==='pendente'?null:'fixture',decision==='pendente'?null:'2026-01-01']);}
const runProposal=async(db,p)=>(await db.query("select public.aplicar_proposta($1,'fixture-operator') r",[p])).rows[0].r;
async function withDb(fn,applied=true){const db=await fixture();try{await seed(db);if(applied)await apply(db);await fn(db);}finally{await db.close();}}
seals();mark('30 arquivos selados U1/U2 intactos antes');
assert.deepEqual(M.applyFields,CAMPOS.map(({tabela,campo,tipo})=>({tabela,campo,tipo})));
const backendSource=readFileSync('C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g/src/db/negocio.py','utf8');
const backendMapa=[...backendSource.split('MAPA: dict[str, str] = {')[1].split('}')[0].matchAll(/"[^"]+": "([^"]+)"/g)].map(m=>m[1]);
assert.equal(backendMapa.length,15);assert.ok(backendMapa.every(f=>M.writeFields.includes(f)));
mark('26 campos conferem CAMPOS real e 15 colunas conferem MAPA real');
await withDb(async db=>{
 const pre=await receipt(db);await apply(db);await db.exec(read('u3-verificar.sql'));const post=await receipt(db);assert.equal(conferirRecibos(pre,post).ok,true);
 assert.equal((await db.query('select count(*)::int n from public.businesses')).rows[0].n,2);
 await db.query("insert into public.businesses(name) values('posterior FICTICIO com colunas antigas')");
 await undo(db);const returned=await receipt(db);assert.equal(conferirRecibos(post,returned,'return').ok,true);assert.equal(returned.snapshot.ledger.length,48);
 assert.equal((await db.query('select count(*)::int n from public.businesses')).rows[0].n,3);
 for(const t of backend)assert.equal((await db.query('select count(*)::int n from public.'+t)).rows[0].n,1);
 mark('aplicacao/retorno, recibos SQL=JS, historico 46/47/48 e linhas legadas preservadas');
},false);
await withDb(async db=>{
 const pre=await receipt(db);
 await db.transaction(async t=>{await t.query('insert into supabase_migrations.schema_migrations values($1,$2)',['fixture-before-u3',M.applyName]);await t.exec(read('u3-aplicar.sql'));});
 const post=await receipt(db);assert.equal(conferirRecibos(pre,post).ok,true);
 await db.transaction(async t=>{await t.query('insert into supabase_migrations.schema_migrations values($1,$2)',['fixture-before-return',M.returnName]);await t.exec(read('u3-retornar.sql'));});
 assert.equal(conferirRecibos(post,await receipt(db),'return').ok,true);
 mark('canal com ledger nominal antes do corpo tambem aceito');
},false);
await withDb(async db=>{
 await db.exec('set role service_role');
 for(const [field,v] of [['avg_direct_cost',0],['atende_somente_no_local',false],['differentiators',['um','dois']]])assert.equal(await call(db,field,v),'gravado');
 const row=(await db.query('select avg_direct_cost,atende_somente_no_local,differentiators from public.businesses where id=$1',[A])).rows[0];assert.equal(Number(row.avg_direct_cost),0);assert.equal(row.atende_somente_no_local,false);assert.deepEqual(row.differentiators,['um','dois']);
 assert.equal(await call(db,'name',undefined),'sem_valor');assert.equal(await call(db,'name',null),'sem_valor');
 for(const origin of [null,'confirmado','invalida'])await assert.rejects(call(db,'name','X',origin),/origem invalida/);
 for(const field of ['id','profile_id','is_active','procedencia','tom_de_voz',null])await assert.rejects(call(db,field,'X'),/campo fora/);
 await assert.rejects(call(db,'name','X','manual','99999999-9999-4999-8999-999999999999'),/nao encontrado/);
 await assert.rejects(call(db,'monthly_budget','texto'),/invalid input/);
 assert.equal(await call(db,'name','anotado','manual',A,B),'gravado');
 const proc=(await db.query('select procedencia from public.businesses where id=$1',[A])).rows[0].procedencia.name;
 assert.equal(proc.origem,'manual');assert.equal(proc.execucao_id,B);assert.equal(proc.por,'fixture-operator');
 await db.exec('reset role');
 assert.equal((await db.query('select name from public.businesses where id=$1',[B])).rows[0].name,'FICTICIO B');
 mark('RPC service: 0/false/lista, nulos, origens, allowlist, coercao e procedencia real');
 const backend15=['name','description','atende_somente_no_local','business_hours','availability','delivery_time','payment_policy','guarantee','differentiators','site_url','instagram_handle','avg_direct_cost','target_profit_per_customer','monthly_budget','cep'];
 for(const f of backend15){const v=f==='atende_somente_no_local'?false:f==='differentiators'?['d']:['avg_direct_cost','target_profit_per_customer','monthly_budget'].includes(f)?0:'fixture';assert.equal(await call(db,f,v),'gravado');}
 mark('15 campos do MAPA backend continuam gravaveis');
 await db.query("select public.registrar_procedencia('businesses',$1,'name','confirmado','cliente','{}')",[A]);
 assert.equal(await call(db,'name','fixture'),'ja_igual');assert.equal(await call(db,'name','nao pode'),'pulado_confirmado');
 const log=(await db.query('select * from public.divergencias_de_cadastro')).rows;assert.equal(log.length,1);assert.equal(log[0].valor_recusado,'nao pode');assert.equal(log[0].valor_mantido,'fixture');
 assert.equal((await db.query('select name from public.businesses where id=$1',[A])).rows[0].name,'fixture');
 mark('confirmado: mesmo valor ja_igual, divergente preservado com registro');
});
await withDb(async db=>{
 const p=await proposal(db);await item(db,p,'businesses','name','nome novo');await item(db,p,'narrativa_negocio','historia','historia nova');await item(db,p,'identidade_visual','tom_de_voz','claro');
 await db.exec('set role service_role');assert.deepEqual(await runProposal(db,p),{aplicados:3});await db.exec('reset role');
 assert.equal((await db.query('select name from public.businesses where id=$1',[A])).rows[0].name,'nome novo');
 assert.equal((await db.query('select historia from public.narrativa_negocio where business_id=$1',[A])).rows[0].historia,'historia nova');
 assert.equal((await db.query('select tom_de_voz from public.identidade_visual where business_id=$1',[A])).rows[0].tom_de_voz,'claro');
 const proc=(await db.query('select procedencia from public.identidade_visual where business_id=$1',[A])).rows[0].procedencia.tom_de_voz;
 assert.equal(proc.origem,'extraido');assert.equal(proc.proposta_id,p);assert.ok(proc.item_id&&proc.entrevista_id);
 assert.equal((await db.query('select name from public.businesses where id=$1',[B])).rows[0].name,'FICTICIO B');
 await assert.rejects(runProposal(db,p),/so proposta aberta/);await assert.rejects(runProposal(db,B),/nao encontrada/);
 mark('proposta aplica 3 tabelas, rastreia IDs, isola B e recusa reaplicacao');
 const p2=await proposal(db);await item(db,p2,'businesses','name','pendente','pendente');await assert.rejects(runProposal(db,p2),/itens pendentes/);
 await db.query("update public.itens_da_proposta set decisao='descartado',decidido_por='fixture',decidido_em=now() where proposta_id=$1",[p2]);await runProposal(db,p2);
 const p3=await proposal(db);await item(db,p3,'businesses','description','nao deve persistir');await item(db,p3,'businesses','monthly_budget','numero invalido');
 await assert.rejects(runProposal(db,p3),/invalid input/);assert.equal((await db.query('select description from public.businesses where id=$1',[A])).rows[0].description,null);
 assert.equal((await db.query('select estado from public.propostas_de_perfil where id=$1',[p3])).rows[0].estado,'aberta');
 await db.query("update public.propostas_de_perfil set estado='descartada' where id=$1",[p3]);
 const p4=await proposal(db);await item(db,p4,'businesses','profile_id',B);await assert.rejects(runProposal(db,p4),/campo fora/);
 mark('pendente/descartado/forbidden e falha posterior revertem toda aplicacao');
});
await withDb(async db=>{
 const p=await proposal(db);await assert.rejects(item(db,p,'businesses','monthly_budget',10,'aceito',20),/itens_aceito_sem_override_check/);
 await item(db,p,'businesses','name','extraido');await db.query("select public.registrar_procedencia('businesses',$1,'name','confirmado','cliente','{}')",[A]);
 await assert.rejects(runProposal(db,p),/ja confirmado/);
 await db.query("update public.itens_da_proposta set decisao='corrigido',valor_final='\"correcao manual\"' where proposta_id=$1",[p]);await runProposal(db,p);
 assert.equal((await db.query('select name,procedencia from public.businesses where id=$1',[A])).rows[0].procedencia.name.origem,'manual');
 mark('ACEITO 10/20 recusado; confirmado recusa extraido e aceita correcao manual');
});
await withDb(async db=>{
 const person=(await db.query("insert into public.pessoas_do_negocio(business_id,nome) values($1,'FICTICIO A') returning id",[A])).rows[0].id;
 const interview=(await db.query("insert into public.entrevistas(business_id,realizada_em,conduzida_por) values($1,now(),'fixture') returning id",[A])).rows[0].id;
 await assert.rejects(db.query("insert into public.propostas_de_perfil(business_id,entrevista_id,prompt_versao,modelo) values($1,$2,'v','m')",[B,interview]),/foreign key/);
 await assert.rejects(db.query('insert into public.creatives(business_id,pessoa_id) values($1,$2)',[B,person]),/foreign key/);
 await db.query('insert into public.creatives(business_id,pessoa_id) values($1,$2)',[A,person]);await db.query('delete from public.pessoas_do_negocio where id=$1',[person]);
 const c=(await db.query('select business_id,pessoa_id from public.creatives')).rows[0];assert.equal(c.business_id,A);assert.equal(c.pessoa_id,null);
 mark('FKs compostas recusam cruzamento; deletar pessoa preserva business_id');
 await db.query("insert into public.pessoas_do_negocio(business_id,nome) values($1,'A'),($2,'B')",[A,B]);
 await db.query("insert into public.entrevistas(business_id,realizada_em,conduzida_por) values($1,now(),'B')",[B]);
 await db.query("select set_config('request.fixture_uid',$1,false)",[UA]);await db.exec('set role authenticated');
 assert.equal((await db.query('select count(*)::int n from public.pessoas_do_negocio')).rows[0].n,1);
 assert.equal((await db.query('select count(*)::int n from public.entrevistas')).rows[0].n,1);
 await assert.rejects(db.query("insert into public.pessoas_do_negocio(business_id,nome) values($1,'intruso')",[B]),/row-level security/);
 await db.query("insert into public.pessoas_do_negocio(business_id,nome) values($1,'proprio')",[A]);
 assert.equal((await db.query("update public.pessoas_do_negocio set nome='invadido' where business_id=$1 returning id",[B])).rows.length,0);
 assert.equal((await db.query('delete from public.pessoas_do_negocio where business_id=$1 returning id',[B])).rows.length,0);
 await db.query("update public.pessoas_do_negocio set nome='alterado' where business_id=$1",[A]);await db.query('delete from public.pessoas_do_negocio where business_id=$1',[A]);
 for(const t of ['propostas_de_perfil','itens_da_proposta','divergencias_de_cadastro'])await assert.rejects(db.query('select * from public.'+t),/permission denied/);
 for(const q of ["insert into public.entrevistas(business_id,realizada_em,conduzida_por) values('"+A+"',now(),'x')","update public.entrevistas set ferramenta='x'","delete from public.entrevistas"])await assert.rejects(db.exec(q),/permission denied/);
 await assert.rejects(call(db,'name','x'),/permission denied/);await assert.rejects(runProposal(db,B),/permission denied/);
 await db.exec('reset role;set role anon');await assert.rejects(db.query('select * from public.pessoas_do_negocio'),/permission denied/);await assert.rejects(call(db,'name','x'),/permission denied/);
 await db.exec('reset role;set role service_role');await assert.rejects(db.exec('delete from public.entrevistas'),/permission denied/);await assert.rejects(db.exec('delete from public.divergencias_de_cadastro'),/permission denied/);
 for(const t of backend){assert.equal((await db.query('select count(*)::int n from public.'+t)).rows[0].n,1);await assert.rejects(db.exec('delete from public.'+t),/permission denied/);}
 await db.exec('reset role');mark('RLS com owns_business real/UID simulado; CRUD proprio, isolamento, ACL RPC/clientes/servico/backend');
});
for(const drift of ['grant update on public.execucoes to service_role','grant maintain on public.execucoes to service_role','grant select on public.execucoes to service_role with grant option','grant select(id) on public.execucoes to service_role with grant option','grant execute on function public.registrar_procedencia(text,uuid,text,text,text,jsonb) to authenticated',"create role terceiro_fixture;alter default privileges grant execute on functions to terceiro_fixture"]){
 await withDb(async db=>{await db.exec(drift);const before=await receipt(db);await assert.rejects(apply(db));assert.deepEqual(await receipt(db),before);},false);
}mark('drift de ACL/MAINTAIN/grant options/helper/defaults aborta antes do delta');
await withDb(async db=>{await db.exec("alter table public.creatives alter column uso set default 'drift'");const before=await receipt(db);await assert.rejects(apply(db),/pais\/helpers/);assert.deepEqual(await receipt(db),before);},false);
mark('drift de definicao em pai medido recusa antes do delta');
await withDb(async db=>{await db.query("insert into public.creatives(business_id,uso) values($1,'legado-invalido')",[A]);const before=await receipt(db);await assert.rejects(apply(db),/creatives_uso_check/);assert.deepEqual(await receipt(db),before);assert.equal((await db.query('select uso from public.creatives')).rows[0].uso,'legado-invalido');},false);
mark('uso legado invalido recusa CHECK sem corrigir/apagar dados');
await withDb(async db=>{await db.exec('alter table public.execucoes add column coluna_legitima text;');const pre=await receipt(db);await apply(db);const post=await receipt(db);assert.equal(conferirRecibos(pre,post).ok,true);await undo(db);assert.equal(conferirRecibos(post,await receipt(db),'return').ok,true);},false);
mark('coluna backend legitima extra aceita e preservada; stubs nao congelam esquema QA');
for(const change of ["insert into public.pessoas_do_negocio(business_id,nome) values('"+A+"','posterior')","insert into public.entrevistas(business_id,realizada_em,conduzida_por) values('"+A+"',now(),'posterior')",'create index posterior on public.creatives(pessoa_id)',"alter table public.creatives add constraint posterior check(pessoa_id is null)",'create view public.posterior as select pessoa_id from public.creatives']){
 await withDb(async db=>{await db.exec(change);const before=await receipt(db);await assert.rejects(undo(db));assert.deepEqual(await receipt(db),before);});
}mark('retorno recusa dados posteriores, indice/CHECK novo e view dependente, sem perda');
for(const kind of ['proposta-item','divergencia'])await withDb(async db=>{
 if(kind==='proposta-item'){const p=await proposal(db);await item(db,p,'businesses','name','posterior');}
 else await db.query("insert into public.divergencias_de_cadastro(business_id,campo,valor_recusado,procedencia_mantida,origem_tentada) values($1,'name','1','confirmado','manual')",[A]);
 const before=await receipt(db);await assert.rejects(undo(db),/tabela com dados posteriores/);assert.deepEqual(await receipt(db),before);
});mark('retorno tambem recusa propostas/itens e divergencias posteriores');
await withDb(async db=>{
 const helperBefore=(await receipt(db)).snapshot.functions.filter(f=>M.helpers.includes(f.name));
 const proc=helperBefore.find(f=>f.name==='procedencia_do_campo');assert.equal(proc.definer,true);assert.equal(proc.body_md5,'7a7eacfac538a4f5a6a2869e816bf291');
 // Limite historico preservado: extras do helper legado podem sobrescrever origem.
 await db.query("select public.registrar_procedencia('businesses',$1,'city','extraido','fixture','{\"origem\":\"confirmado\"}')",[A]);
 assert.equal((await db.query('select procedencia from public.businesses where id=$1',[A])).rows[0].procedencia.city.origem,'confirmado');
 assert.equal(await call(db,'description','texto seguro','manual',A,B),'gravado');
 const p=(await db.query('select procedencia from public.businesses where id=$1',[A])).rows[0].procedencia.description;
 assert.equal(p.origem,'manual');assert.deepEqual(Object.keys(p).sort(),['em','execucao_id','origem','por']);
 assert.deepEqual((await receipt(db)).snapshot.functions.filter(f=>M.helpers.includes(f.name)),helperBefore);
 mark('helpers QA exatos preservados; limite de extras legado demonstrado, RPC nova gera extras fixos');
});
await withDb(async db=>{
 // Demonstra o limite: gravado nao cria log novo; retorno DDL nao desfaz valor legado.
 assert.equal(await call(db,'name','persistente'),'gravado');assert.equal((await db.query('select count(*)::int n from public.divergencias_de_cadastro')).rows[0].n,0);
 await undo(db);assert.equal((await db.query('select name from public.businesses where id=$1',[A])).rows[0].name,'persistente');
 mark('limite demonstrado: retorno DDL nao desfaz escrita/procedencia em tabela legada');
});
seals();mark('30 arquivos selados U1/U2 intactos depois');
result.ok=true;result.passed=result.cases.length;
writeFileSync(new URL('resultado-ensaio.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({ok:true,passed:result.passed,remote:false}));
