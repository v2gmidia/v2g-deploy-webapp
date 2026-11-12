import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const moduleArgument=process.argv.indexOf('--pglite-module');
export const engineModule=moduleArgument<0?'C:/Users/victo/.codex/tmp/v2g-pg17-local-20261111/node_modules/@electric-sql/pglite/dist/index.js':process.argv[moduleArgument+1];
export const {PGlite}=await import(pathToFileURL(engineModule).href);
export const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
export const base=JSON.parse(read('base-catalogo.json'));
export const ident=name=>'"'+name.replaceAll('"','""')+'"';
export const literal=value=>"'"+String(value).replaceAll("'","''")+"'";
export const tableNames=['commercial_payment_events','commercial_payment_email_outbox','checkout_3ds_context','checkout_security_attempts'];
export const newFunctions=['documento_contratante_valido','conferir_documento_contratante_gravado','evento_asaas_impede_confirmacao',
 'registrar_pedido_self_service','aprovar_pagamento_api_self_service','registrar_evento_financeiro_asaas',
 'registrar_evento_inicial_3ds','reservar_assinatura_apos_3ds','consumir_limite_checkout','checkout_producao_schema_v1'];
export const newColumns=['provider_checkout_id','provider_checkout_url','checkout_creation_started_at','buyer_name','buyer_whatsapp',
 'provider_subscription_id','payment_creation_started_at','provider_first_due_date','payment_attempt_count',
 'provider_card_flow','subscription_creation_started_at','provider_subscription_first_due_date','contractor_document_type'];
const capture=read('capturar-metadados.sql');
export const captureQuery=capture.slice(capture.indexOf('select jsonb_build_object('),capture.lastIndexOf('commit;')).trim().replace(/;$/,'');
// PG18 cataloga NOT NULL tambem em pg_constraint; PG17 usa attnotnull.
// attnotnull continua comparado integralmente. Ordem textual de ACL nao muda permissoes.
const aclExpression=column=>`case when ${column} is null then null else (select '{'||string_agg(e,',' order by e collate "C")||'}' from unnest(string_to_array(trim(both '{}' from ${column}),',')) e) end`;
export const stateQuery=`select jsonb_build_object(
 'tables',(select jsonb_agg((t-'acl'-'constraints')||jsonb_build_object('acl',${aclExpression("t->>'acl'")},
 'constraints',(select jsonb_agg(k order by k->>'name') from jsonb_array_elements(coalesce(nullif(t->'constraints','null'::jsonb),'[]'::jsonb)) k where k->>'type'<>'n')) order by t->>'name') from jsonb_array_elements(x.metadata->'tables') t),
 'functions',(select jsonb_agg((f-'acl')||jsonb_build_object('acl',${aclExpression("f->>'acl'")}) order by f->>'name',f->>'signature') from jsonb_array_elements(x.metadata->'functions') f)
 ) as state from (${captureQuery}) x`;
export async function captureState(db){return (await db.query(stateQuery)).rows[0].state;}
const normalizeAcl=acl=>acl===null?null:'{'+acl.replace(/^\{|\}$/g,'').split(',').sort().join(',')+'}';
export const baseState={tables:base.tables.map(t=>({...t,acl:normalizeAcl(t.acl),constraints:t.constraints?.filter(c=>c.type!=='n')??null})),functions:base.functions.map(f=>({...f,acl:normalizeAcl(f.acl)}))};
export function columnSql(c){
 return ident(c.name)+' '+c.type+(c.generated?` generated always as (${c.default}) stored`:c.default!==null?` default ${c.default}`:'')+(c.not_null?' not null':'');
}
export function tableSql(t){
 return `create table public.${ident(t.name)} (${[...t.columns.map(columnSql),...(t.constraints??[]).filter(c=>c.type!=='f'&&c.type!=='n').map(c=>`constraint ${ident(c.name)} ${c.definition}`)].join(',\n')});`;
}
export function aclSql(type,name,acl){
 const privileges={r:'select',a:'insert',w:'update',d:'delete',D:'truncate',x:'references',t:'trigger',m:'maintain',X:'execute',U:'usage'};
 const out=[`revoke all on ${type} ${name} from public,anon,authenticated,service_role;`];
 for(const entry of (acl??'').replace(/^\{|\}$/g,'').split(',').filter(Boolean)){
  const match=entry.match(/^([^=]*)=([^/]*)\/([^/]+)$/);if(!match)throw Error('ACL desconhecida: '+entry);
  const role=match[1]||'public';if(role==='postgres')continue;
  for(const letter of match[2]){
   if(letter==='*')throw Error('ACL com grant option exige revisao');
   if(!privileges[letter])throw Error('Privilegio desconhecido: '+letter);
  }
  out.push(`grant ${[...match[2]].map(l=>privileges[l]).join(',')} on ${type} ${name} to ${role==='public'?'public':ident(role)};`);
 }
 return out.join('\n');
}
export async function restoreBase(db){
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; create function auth.uid() returns uuid language sql stable as 'select nullif(current_setting(''test.uid'',true),'''')::uuid';
 create table auth.users(id uuid primary key,raw_app_meta_data jsonb);
 create table public.profiles(id uuid primary key);
 create table public.ad_accounts(id uuid primary key default gen_random_uuid(),business_id uuid,meta_connection_id uuid,external_id text,name text,currency text,ownership text,status text,is_active boolean,unique(business_id,external_id));
 create table public.meta_connections(id uuid primary key,business_id uuid,meta_page_id text);
 create table public.webapp_legacy_access(profile_id uuid primary key,granted_at timestamptz);
 create table public.execucoes(id uuid primary key,nota text);
 create table public.criativos(id uuid primary key,nota text);`);
 for(const t of base.tables)await db.exec(tableSql(t));
 for(const t of base.tables)for(const c of t.constraints??[])if(c.type==='f')
  await db.exec(`alter table public.${ident(t.name)} add constraint ${ident(c.name)} ${c.definition};`);
 for(const f of base.functions){await db.exec(f.definition);await db.exec(aclSql('function','public.'+f.signature,f.acl));}
 const commands={'r':'select','a':'insert','w':'update','d':'delete','*':'all'};
 for(const t of base.tables){
  for(const i of t.indexes??[])if(!i.constraint_owned)await db.exec(i.definition);
  if(t.rls)await db.exec(`alter table public.${ident(t.name)} enable row level security;`);
  if(t.force_rls)await db.exec(`alter table public.${ident(t.name)} force row level security;`);
  await db.exec(aclSql('table','public.'+ident(t.name),t.acl));
  for(const p of t.policies??[])await db.exec(`create policy ${ident(p.name)} on public.${ident(t.name)} as ${p.permissive?'permissive':'restrictive'} for ${commands[p.command]} to ${p.roles.map(r=>r==='public'?r:ident(r)).join(',')}${p.using?' using ('+p.using+')':''}${p.check?' with check ('+p.check+')':''};`);
  for(const tr of t.triggers??[])await db.exec(tr.definition);
 }
}
