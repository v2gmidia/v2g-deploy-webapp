import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {PGlite}=await import(pathToFileURL('C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js').href);
const {parametrosContaAcessoContratado:params}=await import(pathToFileURL('C:/Users/victo/v2g-deploy/webapp-piligrin-producao/lib/contratacao/conta-acesso-contratado.ts').href);
const dir=new URL('./',import.meta.url),pkg=new URL('../piligrin-duu-12-11/',import.meta.url);
const ids=Array.from({length:10},(_,i)=>'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'));
const [owner,other,operator,business,foreignBusiness,connection,foreignConnection,evidence,grant,secondEvidence]=ids;
const mail='titular@example.test',external='act_123456',page='123456',today='2026-11-12T18:00:00Z';
let proofs=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);proofs++;};
const db=new PGlite();
const query='select public.registrar_conta_acesso_contratado($1,$2,$3,$4,$5,$6,$7,$8,$9) id';
const args=[grant,owner,mail,business,connection,external,'Cliente local','BRL',page];
const scalar=async(q,p=[])=>(await db.query(q,p)).rows[0].v;
async function attempt({change,arguments:values=args,role='service_role',error,success}={}){
 await db.exec('begin');
 try{
  if(change)await db.exec(change);
  await db.exec('set local role '+role);
  if(error){let seen=false;try{await db.query(query,values);}catch(e){seen=e.message.includes(error);}eq(seen,true,error);}
  else {const r=await db.query(query,values);await success?.(r.rows[0].id);}
 }finally{await db.exec('rollback');}
}
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema private;create schema storage;
 create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_app_meta_data jsonb,raw_user_meta_data jsonb);
 create table profiles(id uuid primary key,full_name text);
 create table businesses(id uuid primary key,profile_id uuid references profiles,name text,claim_email text,created_at timestamptz default now());
 create table meta_connections(id uuid primary key,business_id uuid unique references businesses,meta_page_id text,expires_at timestamptz);
 create table ad_accounts(id uuid primary key default gen_random_uuid(),business_id uuid references businesses,meta_connection_id uuid references meta_connections,external_id text,name text,currency text,ownership text,status text,is_active boolean,unique(business_id,external_id));
 create table commercial_orders(id uuid primary key,business_id uuid,buyer_profile_id uuid,buyer_email text,cnpj text,status text,provider_charge_id text,created_at timestamptz);
 create table commercial_order_units(id uuid primary key,order_id uuid,ad_account_id uuid,ordinal int);
 create table commercial_payment_events(order_id uuid,provider_charge_id text,event_type text);
 create table webapp_legacy_access(profile_id uuid,granted_at timestamptz);
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create function private.handle_new_user() returns trigger language plpgsql as $$begin if new.email is not null then perform 1;end if;return new;end$$;
 create function documento_contratante_valido(text) returns boolean language sql immutable as $$select $1 ~ '^[0-9]{14}$'$$;
 grant usage on schema public to service_role,anon,authenticated;
 grant select,insert,update,delete on businesses,meta_connections,ad_accounts,commercial_orders,commercial_order_units,webapp_legacy_access to service_role;`);
 for(const f of readdirSync(new URL('banco/',pkg)).sort())await db.exec(readFileSync(new URL('banco/'+f,pkg),'utf8'));
 await db.exec(readFileSync(new URL('funcao-original-producao.sql',dir),'utf8'));
 await db.exec(readFileSync(new URL('registrar-conta-acesso-contratado.sql',dir),'utf8'));
 for(const id of [owner,other,operator])await db.query('insert into profiles(id) values($1)',[id]);
 await db.query("insert into businesses(id,profile_id,name,created_at) values($1,$2,'Cliente local',now()),($3,$4,'Outro cliente local',now())",[business,owner,foreignBusiness,other]);
 await db.query('insert into meta_connections(id,business_id,expires_at) values($1,$2,now()+interval \'1 day\'),($3,$4,now()+interval \'1 day\')',[connection,business,foreignConnection,foreignBusiness]);
 await db.query("insert into webapp_legacy_access values($1,'2026-10-07T00:00:00Z')",[owner]);
 await db.query("insert into commercial_manual_evidence(id,business_id,proposed_profile_id,claimed_email,claimed_cnpj,source_system,source_reference,source_date,recorded_by,status,reviewed_by,reviewed_at,review_note) values($1,$2,$3,$4,'11222333000181','historical_contract','TESTE LOCAL - NUNCA PRODUCAO',current_date,$5,'checked',$5,now(),'Ensaio local isolado')",[evidence,business,owner,mail,operator]);
 await db.query("insert into historical_contract_access(id,evidence_id,business_id,previous_profile_id,recipient_email,contractor_document,issued_by,issue_note,accepted_by,accepted_at) values($1,$2,$3,$4,$5,'11222333000181',$6,'Ensaio local isolado',$4,now())",[grant,evidence,business,owner,mail,operator]);
 // Real installed function is incompatible even with a valid accepted historical grant.
 await db.exec('begin');let oldRejected=false;try{await db.query('select registrar_conta_contratada($1,$2,$3,$4,$5,$6)',[business,connection,external,'Cliente local','BRL',page]);}catch(e){oldRejected=e.message.includes('negocio novo sem pedido aprovado');}await db.exec('rollback');eq(oldRejected,true,'reproduce installed blocker');
 await attempt({success:async id=>{eq(typeof id,'string');eq(await scalar('select count(*)::int v from ad_accounts'),1);eq(await scalar('select meta_page_id v from meta_connections where id=$1',[connection]),page);const again=(await db.query(query,args)).rows[0].id;eq(again,id,'idempotent');eq(await scalar('select count(*)::int v from commercial_orders'),0);eq(await scalar('select count(*)::int v from creative_publication_confirmations'),0);}});
 const mod=(index,value)=>args.map((x,i)=>i===index?value:x);
 await attempt({role:'anon',error:'permission denied'});
 await attempt({role:'authenticated',error:'permission denied'});
 await attempt({arguments:mod(0,secondEvidence),error:'acesso_contratado_nao_autorizado'});
 await attempt({arguments:mod(1,other),error:'negocio_contratado_divergente'});
 await attempt({arguments:mod(2,'other@example.test'),error:'acesso_contratado_nao_autorizado'});
 await attempt({arguments:mod(3,foreignBusiness),error:'negocio_contratado_divergente'});
 await attempt({arguments:mod(4,foreignConnection),error:'conexao_nao_pertence_ao_negocio'});
 for(const [i,v] of [[0,null],[1,null],[2,null],[3,null],[4,null],[5,null],[8,null],[5,'act_not-valid'],[8,'invalid'],[7,'brl']])await attempt({arguments:mod(i,v),error:'conta_historica_dados_invalidos'});
 await attempt({change:`update historical_contract_access set accepted_by=null,accepted_at=null`,error:'acesso_contratado_nao_autorizado'});
 await attempt({change:`update historical_contract_access set revoked_by='${operator}',revoked_at=now(),revoke_note='Ensaio local'`,error:'acesso_contratado_nao_autorizado'});
 await attempt({change:`update historical_contract_access set accepted_at=now()+interval '1 day'`,error:'acesso_contratado_nao_autorizado'});
 await attempt({change:`update commercial_manual_evidence set status='pending',reviewed_by=null,reviewed_at=null,review_note=null`,error:'acesso_contratado_nao_autorizado'});
 await attempt({change:`update commercial_manual_evidence set claimed_email='other@example.test'`,error:'acesso_contratado_nao_autorizado'});
 await attempt({change:`update businesses set profile_id='${other}' where id='${business}'`,error:'negocio_contratado_divergente'});
 await attempt({change:`update meta_connections set expires_at=now()-interval '1 day' where id='${connection}'`,error:'conexao_expirada'});
 await attempt({change:`update meta_connections set meta_page_id='9999' where id='${connection}'`,error:'pagina_contratada_divergente'});
 for(const status of ['awaiting_payment','cancelled','payment_approved'])await attempt({change:`insert into commercial_orders(id,business_id,status) values(gen_random_uuid(),'${business}','${status}')`,error:'negocio_com_pedido_usar_fluxo_financeiro'});
 await attempt({change:`insert into ad_accounts(business_id,external_id,is_active) values('${business}','act_999',false)`,error:'conta_historica_ja_definida'});
 const f='public.registrar_conta_acesso_contratado(uuid,uuid,text,uuid,uuid,text,text,text,text)';
 eq(await scalar('select prosecdef v from pg_proc where oid=$1::regprocedure',[f]),false,'security invoker');
 for(const r of ['anon','authenticated','service_role'])eq(await scalar('select has_function_privilege($1,$2,\'EXECUTE\') v',[r,f]),r==='service_role');
 const base={titular:{id:owner,email:mail,email_confirmed_at:today},concessoes:[{id:grant,business_id:business,recipient_email:mail,accepted_by:owner,accepted_at:today,revoked_at:null}],businessId:business,connectionId:connection,externalId:external,name:'Cliente local',currency:'BRL',pageId:page,agora:Date.parse(today)+1};
 eq(params(base)?.p_access_id,grant);
 for(const v of [{titular:{...base.titular,email_confirmed_at:null}},{titular:{...base.titular,id:other}},{titular:{...base.titular,email:'other@example.test'}},{businessId:foreignBusiness},{concessoes:[]},{concessoes:[...base.concessoes,...base.concessoes]},{externalId:'act_invalid'},{pageId:'invalid'},{currency:'brl'}])eq(params({...base,...v}),null);
 for(const v of [{accepted_at:null},{accepted_at:'invalid'},{accepted_at:'2099-01-01'},{accepted_by:other},{revoked_at:today}])eq(params({...base,concessoes:[{...base.concessoes[0],...v}]}),null);
 eq(await scalar('select count(*)::int v from ad_accounts'),0,'all changes rolled back');
 eq(await scalar('select count(*)::int v from commercial_orders'),0,'no orders left');
 const result={proofs,installedBlockerReproduced:true,proposedSqlAndSelectorPassed:true,productionApplied:false,metaCalls:false,limits:'PostgreSQL local com dependências focadas e fixtures declaradas; não comprova OAuth, UI publicada ou concessão real.'};
 writeFileSync(new URL('validacao.json',dir),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
}finally{await db.close();}
