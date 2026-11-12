/** Ensaio descartavel. Sem .env, conexao remota, navegador ou provedor financeiro. */
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PGlite,read,base,baseState,restoreBase,captureState,newColumns,newFunctions,tableNames,engineModule} from './modelo.mjs';
const apply=read('aplicar-local-revisavel.sql'),undo=read('retornar-se-nao-usado.sql');
const expected=JSON.parse(read('estado-pos-esperado.json'));
const results=[],dbs=[];let engineVersion;
const create=async()=>{const db=new PGlite();dbs.push(db);await restoreBase(db);return db;};
const scalar=async(db,sql,args=[])=>Object.values((await db.query(sql,args)).rows[0])[0];
const execute=async(db,sql)=>{try{await db.exec(sql);}catch(e){await db.exec('rollback');throw e;}};
const test=async(name,fn)=>{try{await fn();results.push({name,pass:true});console.log('PASS '+name);}catch(e){results.push({name,pass:false,error:e.message.slice(0,1800)});throw Error(name+': '+e.message.slice(0,1800));}};
async function seed(db){
 const a=randomUUID(),b=randomUUID(),operator=randomUUID();
 for(const id of [a,b,operator]){
  await db.query('insert into auth.users(id,raw_app_meta_data) values($1,$2)',[id,id===operator?{papel:'operador'}:{}]);
  await db.query('insert into profiles(id) values($1)',[id]);
 }
 const businessA=await scalar(db,"insert into businesses(name,profile_id,claim_email,onboarding) values('Legado A Ficticio',$1,'a@example.invalid','{\"preservar\":true}') returning id",[a]);
 const businessB=await scalar(db,"insert into businesses(name,profile_id,claim_email) values('Legado B Ficticio',$1,'b@example.invalid') returning id",[b]);
 // Inclui CNPJ legado de formato aceito, mas sem digitos verificadores validos.
 const old=await scalar(db,"select registrar_pedido_pix_assistido($1,'legado@example.invalid','Legado Ficticio','00000000000000',1,'monthly')",[randomUUID()]);
 await db.query('update commercial_orders set buyer_profile_id=$2 where id=$1',[old,a]);
 const approved=await scalar(db,"select registrar_pedido_pix_assistido($1,'pago@example.invalid','Pago Ficticio','11222333000181',1,'annual_upfront')",[randomUUID()]);
 await db.query("update commercial_orders set buyer_profile_id=$2,proof_reference='prova-ficticia-local',proof_received_at=now(),proof_received_by=$3,status='proof_received' where id=$1",[approved,b,operator]);
 await scalar(db,'select aprovar_pix_assistido($1,$2)',[approved,operator]);
 for(const table of ['execucoes','criativos'])await db.query(`insert into ${table}(id,nota) values($1,'sentinela-local-preservada')`,[randomUUID()]);
 return {a,b,operator,businessA,businessB,old,approved};
}
async function oldRows(db){
 const out={};for(const table of ['businesses','commercial_orders','commercial_order_units','commercial_events','execucoes','criativos','profiles','ad_accounts','meta_connections']){
  const rows=(await db.query(`select to_jsonb(t) as row from ${table} t order by id`)).rows.map(r=>r.row);
  if(table==='commercial_orders')for(const row of rows)for(const name of newColumns)delete row[name];
  out[table]=rows;
 }return out;
}
const service=async(db,fn)=>{await db.exec('set role service_role');try{return await fn();}finally{await db.exec('reset role');}};
const order=async(db,{ref=randomUUID(),email='comprador@example.invalid',doc='00000000191',period='annual_upfront',method='asaas_pix',units=1}={})=>{
 const id=await service(db,()=>scalar(db,"select registrar_pedido_self_service($1,$2,'Pessoa Ficticia','11999990000','Negocio Ficticio',$3,$4,$5,$6)",[ref,email,doc,units,period,method]));
 return {id,ref};
};
try{
 const db=await create(),ids=await seed(db),before=await oldRows(db);
 await test('clone corresponde aos quatro objetos comerciais e quatro funcoes observados',async()=>assert.deepEqual(await captureState(db),baseState));
 await test('preflight de somente leitura reconhece o clone antes da aplicacao',async()=>{
  const rows=await db.exec(read('verificar-pre.sql'));const result=rows.find(r=>r.rows?.[0]?.verificacao)?.rows[0].verificacao;
  assert.equal(result.read_only,'on');assert.equal(result.base_corresponde,true);assert.equal(result.pacote_ja_presente,false);
 });
 await test('aplicacao real do SQL gerado preserva integralmente as colunas anteriores e sentinelas',async()=>{
  await execute(db,apply);assert.deepEqual(await oldRows(db),before);assert.deepEqual(await captureState(db),expected);
 });
 await test('readiness estrutural passa sob service_role, sem abrir funcoes ao publico',async()=>{
  assert.equal(await service(db,()=>scalar(db,'select checkout_producao_schema_v1()')),1);
  for(const f of expected.functions.filter(f=>newFunctions.includes(f.name)))for(const role of ['anon','authenticated'])
   assert.equal(await scalar(db,'select has_function_privilege($1,$2,\'EXECUTE\')',[role,'public.'+f.signature]),false,f.signature+':'+role);
 });
 await test('reaplicacao e no-op exato de schema e dados',async()=>{
  const pre=await oldRows(db);await execute(db,apply);assert.deepEqual(await oldRows(db),pre);assert.deepEqual(await captureState(db),expected);
 });
 await test('retorno antes de uso restaura base e dados; segunda repeticao e segura',async()=>{
  await execute(db,undo);assert.deepEqual(await captureState(db),baseState);assert.deepEqual(await oldRows(db),before);
  await execute(db,undo);assert.deepEqual(await oldRows(db),before);await execute(db,apply);
 });
 await test('cada uma das 23 permissoes DML e exigida individualmente',async()=>{
  const required={businesses:['SELECT','INSERT','UPDATE'],commercial_orders:['SELECT','INSERT','UPDATE'],commercial_order_units:['SELECT','INSERT','UPDATE'],
   commercial_events:['SELECT','INSERT'],commercial_payment_events:['SELECT','INSERT'],commercial_payment_email_outbox:['SELECT','INSERT','UPDATE'],
   checkout_3ds_context:['SELECT','INSERT','UPDATE','DELETE'],checkout_security_attempts:['SELECT','INSERT','DELETE']};
  let count=0;
  for(const [table,permissions] of Object.entries(required))for(const privilege of permissions){
   await db.exec('begin');try{
    await db.exec(`revoke ${privilege} on public.${table} from service_role`);
    assert.equal(await service(db,()=>scalar(db,'select checkout_producao_schema_v1()')),0,table+':'+privilege);count++;
   }finally{await db.exec('rollback');}
  }assert.equal(count,23);
 });
 await test('36 variantes de grant por coluna fecham readiness, inclusive herdadas de PUBLIC',async()=>{
  for(const table of tableNames){const column=table==='commercial_payment_events'?'provider_event_id':table==='checkout_3ds_context'?'order_id':'id';
   for(const role of ['anon','authenticated','public'])for(const privilege of ['SELECT','INSERT','UPDATE']){
    await db.exec('begin');try{await db.exec(`grant ${privilege}(${column}) on ${table} to ${role}`);
     assert.equal(await service(db,()=>scalar(db,'select checkout_producao_schema_v1()')),0);
    }finally{await db.exec('rollback');}
   }
  }
 });
 await test('RLS separa pedidos e negocios A/B; tabelas financeiras negam leitura direta',async()=>{
  for(const [user,onlyOrder] of [[ids.a,ids.old],[ids.b,ids.approved]]){
   await db.query("select set_config('test.uid',$1,false)",[user]);await db.exec('set role authenticated');
   try{assert.deepEqual((await db.query('select id from commercial_orders order by id')).rows.map(r=>r.id),[onlyOrder]);
    const businesses=(await db.query('select profile_id from businesses')).rows;assert.ok(businesses.length);assert.ok(businesses.every(b=>b.profile_id===user));
   }finally{await db.exec('reset role');}
  }
  for(const role of ['anon','authenticated'])for(const table of tableNames){await db.exec('set role '+role);
   try{await assert.rejects(db.query('select * from '+table),/permission denied/);}finally{await db.exec('reset role');}
  }
 });
 await test('legado com CNPJ antigo permanece atualizavel; novos documentos invalidos sao rejeitados',async()=>{
  await service(db,()=>db.query('update commercial_orders set buyer_email=buyer_email where id=$1',[ids.old]));
  assert.equal(await scalar(db,'select cnpj from commercial_orders where id=$1',[ids.old]),'00000000000000');
  await assert.rejects(order(db,{doc:'00000000192'}),/dados do pedido invalidos/);
  const valid=await service(db,()=>scalar(db,"select registrar_pedido_pix_assistido($1,'novo-legado@example.invalid','Legado Valido','11222333000181',1,'monthly')",[randomUUID()]));assert.ok(valid);
 });
 let a,b;
 await test('referencia repetida preserva pedido; referencia nova nunca funde por email ou CPF',async()=>{
  a=await order(db);const repeated=await order(db,{ref:a.ref});assert.equal(repeated.id,a.id);
  b=await order(db);assert.notEqual(a.id,b.id);
  const businessIds=(await db.query('select business_id from commercial_orders where id=any($1::uuid[])',[ [a.id,b.id] ])).rows.map(r=>r.business_id);
  assert.equal(new Set(businessIds).size,2);
  await assert.rejects(order(db,{ref:a.ref,units:2}),/referencia ja utilizada/);
 });
 await test('semestral e anual recalculam valor; mensal Pix e valor adulterado sao recusados',async()=>{
  const semi=await order(db,{period:'semiannual_upfront',units:2});assert.equal(await scalar(db,'select total_cents from commercial_orders where id=$1',[semi.id]),570000);
  assert.equal(await scalar(db,'select total_cents from commercial_orders where id=$1',[a.id]),528000);
  await assert.rejects(order(db,{period:'monthly',method:'asaas_pix'}),/dados do pedido invalidos/);
  await assert.rejects(db.query('update commercial_orders set total_cents=1 where id=$1',[semi.id]),/commercial_orders_total_matches/);
 });
 const pay=async(id,charge,customer,event)=>service(db,async()=>{
  await db.query('update commercial_orders set provider_charge_id=$2,provider_customer_id=$3 where id=$1',[id,charge,customer]);
  return scalar(db,"select aprovar_pagamento_api_self_service($1,$2,null,$3,$4,'PAYMENT_CONFIRMED',528000,'2099-01-31')",[id,charge,customer,event]);
 });
 await test('aprovacao concilia IDs/valor; replay divergente nao altera historico',async()=>{
  await db.query("update commercial_orders set provider_charge_id='pay_PackageA',provider_customer_id='cus_PackageA' where id=$1",[a.id]);
  assert.equal(await service(db,()=>scalar(db,"select aprovar_pagamento_api_self_service($1,'pay_PackageA',null,'cus_Outro','evt_wrong','PAYMENT_CONFIRMED',528000,'2099-01-31')",[a.id])),false);
  assert.equal(await pay(a.id,'pay_PackageA','cus_PackageA','evt_package_A'),true);assert.equal(await pay(b.id,'pay_PackageB','cus_PackageB','evt_package_B'),true);
  assert.equal(await service(db,()=>scalar(db,"select registrar_evento_financeiro_asaas($1,'evt_refund_A','pay_PackageA',null,'cus_PackageA','PAYMENT_REFUNDED',528000,'2099-01-31')",[a.id])),true);
  assert.equal(await service(db,()=>scalar(db,"select registrar_evento_financeiro_asaas($1,'evt_refund_A','pay_PackageB',null,'cus_PackageB','PAYMENT_REFUNDED',528000,'2099-01-31')",[b.id])),false);
  assert.equal(await scalar(db,"select count(*)::int from commercial_payment_events where provider_event_id='evt_refund_A'"),1);
  assert.equal(await scalar(db,"select count(*)::int from commercial_payment_events where order_id=$1 and event_type='PAYMENT_REFUNDED'",[b.id]),0);
 });
 await test('3DS: autorizacao nao aprova; RECEIVED aprova e reserva recorrencia uma vez; risco bloqueia',async()=>{
  for(const risk of [false,true]){
   const item=await order(db,{period:'monthly',method:'asaas_card'}),charge='pay_Month'+(risk?'Risk':'Ok'),customer='cus_Month';
   await db.query("update commercial_orders set provider_card_flow='initial_3ds',provider_charge_id=$2,provider_customer_id=$3,provider_first_due_date='2099-01-31' where id=$1",[item.id,charge,customer]);
   const event=(id,type)=>service(db,()=>scalar(db,"select registrar_evento_inicial_3ds($1,$2,$3,$4,$5,50000,'2099-01-31')",[item.id,id,charge,customer,type]));
   assert.equal(await event('evt_auth_'+charge,'PAYMENT_AUTHORIZED'),true);
   assert.equal(await scalar(db,'select status from commercial_orders where id=$1',[item.id]),'awaiting_payment');
   if(risk)assert.equal(await event('evt_risk_'+charge,'PAYMENT_REPROVED_BY_RISK_ANALYSIS'),true);
   assert.equal(await event('evt_received_'+charge,'PAYMENT_RECEIVED'),true);
   assert.equal(await scalar(db,'select status from commercial_orders where id=$1',[item.id]),risk?'awaiting_payment':'payment_approved');
   const reserve=()=>service(db,()=>scalar(db,"select reservar_assinatura_apos_3ds($1,'2099-02-28')",[item.id]));
   assert.equal(await reserve(),!risk);assert.equal(await reserve(),false);
  }
 });
 await test('outbox e limites de seguranca mantem unicidade e bloqueio',async()=>{
  await service(db,()=>db.query("insert into commercial_payment_email_outbox(order_id,provider_charge_id,payload) values($1,'pay_PackageB','{}')",[b.id]));
  await assert.rejects(service(db,()=>db.query("insert into commercial_payment_email_outbox(order_id,provider_charge_id,payload) values($1,'pay_PackageB','{}')",[b.id])),/duplicate key/);
  for(let i=0;i<4;i++)assert.equal(await service(db,()=>scalar(db,"select consumir_limite_checkout('order',$1,$2)",['a'.repeat(64),'b'.repeat(64)])),i<3);
 });
 await test('registro de conta exige pedido aprovado e nao reutiliza unidade de outro negocio',async()=>{
  const pending=await order(db),paidBusiness=await scalar(db,'select business_id from commercial_orders where id=$1',[b.id]);
  const pendingBusiness=await scalar(db,'select business_id from commercial_orders where id=$1',[pending.id]);
  const conn=randomUUID(),other=randomUUID();
  await db.query('insert into meta_connections(id,business_id) values($1,$2),($3,$4)',[conn,paidBusiness,other,pendingBusiness]);
  const account=await scalar(db,"select registrar_conta_contratada($1,$2,'act-local-123','Conta Ficticia','BRL','page-local-123')",[paidBusiness,conn]);assert.ok(account);
  assert.equal(await scalar(db,'select count(*)::int from commercial_order_units where order_id=$1 and ad_account_id=$2',[b.id,account]),1);
  await assert.rejects(db.query("select registrar_conta_contratada($1,$2,'act-local-456','Outra','BRL','page-local-456')",[pendingBusiness,conn]),/conexao nao pertence/);
  await assert.rejects(db.query("select registrar_conta_contratada($1,$2,'act-local-456','Outra','BRL','page-local-456')",[pendingBusiness,other]),/pedido ainda nao aprovado/);
 });
 await test('retorno recusa schema em uso e preserva todos os registros',async()=>{
  const count=await scalar(db,'select count(*)::int from commercial_orders');await assert.rejects(execute(db,undo),/retorno_dados_em_uso|retorno_tabela_em_uso/);
  assert.equal(await scalar(db,'select count(*)::int from commercial_orders'),count);assert.deepEqual(await captureState(db),expected);
 });
 await test('drift anterior e objeto parcial impedem aplicacao inteira',async()=>{
  for(const drift of ['alter table businesses disable row level security','create table checkout_security_attempts(id integer)']){
   const other=await create();await other.exec(drift);const state=await captureState(other);
   await assert.rejects(execute(other,apply),/estado_divergente/);assert.deepEqual(await captureState(other),state);
   assert.equal(await scalar(other,"select to_regprocedure('public.registrar_pedido_self_service(text,text,text,text,text,text,integer,text,text)')"),null);
  }
 });
 await test('default ACL permissiva nao abre objetos novos',async()=>{
  const other=await create();await other.exec('alter default privileges in schema public grant all on tables to anon,authenticated; alter default privileges in schema public grant execute on functions to public,anon,authenticated;');
  await execute(other,apply);assert.equal(await service(other,()=>scalar(other,'select checkout_producao_schema_v1()')),1);assert.deepEqual(await captureState(other),expected);
 });
 await test('falha na conferencia posterior reverte atomicamente toda a aplicacao',async()=>{
  const other=await create();await other.exec('create role leitor_extra; alter default privileges in schema public grant select on tables to leitor_extra;');
  const pre=await captureState(other);await assert.rejects(execute(other,apply),/pos_divergente/);
  assert.deepEqual(await captureState(other),pre);assert.equal(await scalar(other,"select to_regclass('public.commercial_payment_events')"),null);
 });
 await test('retorno recusa drift posterior sem apagar schema ou dados',async()=>{
  const other=await create();await execute(other,apply);await other.exec('alter table commercial_events disable row level security');
  const pre=await captureState(other);await assert.rejects(execute(other,undo),/estado_divergente/);assert.deepEqual(await captureState(other),pre);
 });
 await test('verificacao posterior le catalogos sem aprovar falsamente objetos produtivos ausentes do clone',async()=>{
  const rows=await db.exec(read('verificar-pos.sql'));const result=rows.find(r=>r.rows?.[0]?.verificacao)?.rows[0].verificacao;
  assert.equal(result.read_only,'on');assert.equal(result.estado_pos_corresponde,true);
  // Os outros 40 objetos de producao nao foram copiados para este clone restrito.
  assert.equal(result.outros_objetos_preservados,false);assert.equal(result.funcoes_anteriores_preservadas,false);
 });
 engineVersion=await scalar(db,'select version()');
 console.log(JSON.stringify({pass:results.length,fail:0,notApplied:true,realPayments:0,localEngine:engineVersion}));
}catch(e){console.error(e.message);process.exitCode=1;}
finally{
 for(const db of dbs)await db.close();
 const engineMajor=engineVersion?Number(engineVersion.match(/PostgreSQL (\d+)/)?.[1]):null;
 writeFileSync(new URL('resultado-ensaio.json',import.meta.url),JSON.stringify({localOnly:true,notApplied:true,remoteWrites:0,realPayments:0,engineModule,engineVersion,engineMajor,productionEngineMajor:17,nativePostgres17Tested:false,pass:results.filter(r=>r.pass).length,fail:results.filter(r=>!r.pass).length,results},null,2)+'\n');
}
