/** Gerador LOCAL. Sem .env, CLI, rede, credenciais ou projeto remoto. */
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {PGlite,read,ident,literal,base,baseState,restoreBase,captureState,captureQuery,stateQuery,newFunctions,newColumns,tableNames,columnSql,tableSql,aclSql} from './modelo.mjs';
import {prepararSchemaCheckout,sqlMigration,readiness,cadeiaCheckout} from '../../../scripts/test-utils/checkout-schema.mjs';
const save=(name,text)=>writeFileSync(new URL(name,import.meta.url),text);
const reference=new PGlite(),clone=new PGlite();
try{
 await prepararSchemaCheckout(reference);await reference.exec(sqlMigration(readiness));
 const desired=await captureState(reference);
 await restoreBase(clone);
 const restored=await captureState(clone);
 // A base de quatro tabelas e quatro funcoes deve corresponder ao catalogo real.
 assert.deepEqual(restored,baseState,'Reconstrucao da base diverge do catalogo observado');
 const statements=[];
 const order=desired.tables.find(t=>t.name==='commercial_orders');
 for(const name of newColumns){const c=order.columns.find(c=>c.name===name);assert.ok(c,name);statements.push(`alter table public.commercial_orders add column ${columnSql(c)};`);}
 const replaced=['commercial_orders_billing_period_check','commercial_orders_check','commercial_orders_total_matches','commercial_orders_cnpj_check'];
 for(const name of replaced)statements.push(`alter table public.commercial_orders drop constraint ${ident(name)};`);
 const constraints=['commercial_orders_billing_period_check','commercial_orders_discount_matches','commercial_orders_total_matches','commercial_orders_cnpj_check',
 'commercial_orders_payment_attempt_count_check','commercial_orders_provider_card_flow_check','commercial_orders_provider_checkout_id_key','commercial_orders_provider_subscription_id_key'];
 for(const name of constraints){const c=order.constraints.find(c=>c.name===name);assert.ok(c,name);statements.push(`alter table public.commercial_orders add constraint ${ident(c.name)} ${c.definition};`);}
 statements.push(`alter table public.commercial_orders add constraint commercial_orders_3ds_matches check (provider_card_flow = 'direct' or (origin='self_service' and billing_period='monthly' and payment_method='asaas_card'));`);
 for(const name of tableNames){
  const t=desired.tables.find(t=>t.name===name);assert.ok(t,name);statements.push(tableSql(t));
  for(const c of t.constraints??[])if(c.type==='f')statements.push(`alter table public.${ident(name)} add constraint ${ident(c.name)} ${c.definition};`);
  for(const i of t.indexes??[])if(!i.constraint_owned)statements.push(i.definition+';');
  statements.push(`alter table public.${ident(name)} enable row level security;`,aclSql('table','public.'+ident(name),t.acl));
 }
 for(const name of newFunctions){
  const f=desired.functions.find(f=>f.name===name);assert.ok(f,name);
  statements.push(f.definition+';',aclSql('function','public.'+f.signature,f.acl));
 }
 statements.push(`create trigger conferir_documento_contratante before insert or update of cnpj on public.commercial_orders for each row execute function public.conferir_documento_contratante_gravado('cnpj');`);
 const forward=statements.join('\n\n');await clone.exec(forward);
 const post=await captureState(clone);
 save('estado-pos-esperado.json',JSON.stringify(post,null,2)+'\n');
 const wrap=(before,after,sql,label)=>`-- LOCAL / NAO APLICADO. ${label}. Autorizacao futura especifica, backup privado e conferencia de dados exigidos.
begin;
set local standard_conforming_strings=on;
set local lock_timeout='5s';
set local statement_timeout='60s';
do $v2g_comercial_pacote$
declare v_state jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended('v2g-commercial-production-minimum-v1',0));
 lock table public.businesses,public.commercial_orders,public.commercial_order_units,public.commercial_events in share row exclusive mode;
 ${stateQuery.replace(' as state','').replace(/^select /,'select ').replace(/ from \(/,' into v_state from (')};
 if v_state = ${literal(JSON.stringify(after))}::jsonb then return; end if;
 if v_state is distinct from ${literal(JSON.stringify(before))}::jsonb then raise exception 'v2g_comercial_estado_divergente'; end if;
 ${sql}
 ${stateQuery.replace(' as state','').replace(/ from \(/,' into v_state from (')};
 if v_state is distinct from ${literal(JSON.stringify(after))}::jsonb then raise exception 'v2g_comercial_pos_divergente'; end if;
end;
$v2g_comercial_pacote$;
commit;
`;
 const execute=statements.map(s=>'execute '+literal(s)+';').join('\n');
 save('aplicar-local-revisavel.sql',wrap(baseState,post,execute,'Somente delta minimo; sem ledger, provedor, flags ou dados de clientes'));
 const undo=[];
 undo.push(`if exists(select 1 from public.commercial_orders where buyer_name is not null or buyer_whatsapp is not null or provider_checkout_id is not null or provider_checkout_url is not null or checkout_creation_started_at is not null or provider_subscription_id is not null or payment_creation_started_at is not null or provider_first_due_date is not null or payment_attempt_count<>0 or provider_card_flow<>'direct' or subscription_creation_started_at is not null or provider_subscription_first_due_date is not null or length(cnpj)<>14) then raise exception 'v2g_comercial_retorno_dados_em_uso'; end if;`);
 for(const name of tableNames)undo.push(`if exists(select 1 from public.${ident(name)}) then raise exception 'v2g_comercial_retorno_tabela_em_uso: ${name}'; end if;`);
 const revert=[`drop trigger conferir_documento_contratante on public.commercial_orders;`];
 for(const name of [...newFunctions].reverse()){const f=post.functions.find(f=>f.name===name);revert.push('drop function public.'+f.signature+';');}
 for(const name of [...tableNames].reverse())revert.push('drop table public.'+ident(name)+';');
 for(const name of [...constraints,'commercial_orders_3ds_matches'])revert.push(`alter table public.commercial_orders drop constraint ${ident(name)};`);
 for(const name of [...newColumns].reverse())revert.push(`alter table public.commercial_orders drop column ${ident(name)};`);
 for(const name of replaced){const c=base.tables.find(t=>t.name==='commercial_orders').constraints.find(c=>c.name===name);revert.push(`alter table public.commercial_orders add constraint ${ident(name)} ${c.definition};`);}
 undo.push(...revert.map(s=>'execute '+literal(s)+';'));
 save('retornar-se-nao-usado.sql',wrap(post,baseState,undo.join('\n'),'Retorno conservador: recusa uso dos objetos novos; sem exclusao de linhas ou CASCADE'));
 save('verificar-pre.sql',`-- SOMENTE CATALOGOS; nenhum pedido ou segredo. Executar em transacao READ ONLY no alvo nominal confirmado.\nbegin transaction read only;\nselect jsonb_build_object('read_only',current_setting('transaction_read_only'),'base_corresponde',s.state=${literal(JSON.stringify(baseState))}::jsonb,'pacote_ja_presente',s.state=${literal(JSON.stringify(post))}::jsonb) as verificacao from (${stateQuery}) s;\ncommit;\n`);
 const protectedTables=base.public_table_fingerprints.filter(t=>t.name!=='commercial_orders');
 save('verificar-pos.sql',`-- SOMENTE CATALOGOS; nao chama RPC financeira. Nao substitui backup/prova funcional.\nbegin transaction read only;\nselect jsonb_build_object('read_only',current_setting('transaction_read_only'),'estado_pos_corresponde',s.state=${literal(JSON.stringify(post))}::jsonb,\n'outros_objetos_preservados',(select jsonb_agg(t order by t->>'name') from jsonb_array_elements(x.metadata->'public_table_fingerprints') t where t->>'name'<>'commercial_orders' and t->>'name' not in (${tableNames.map(literal).join(',')}))=${literal(JSON.stringify(protectedTables))}::jsonb,\n'funcoes_anteriores_preservadas',(select jsonb_agg(f order by f->>'signature') from jsonb_array_elements(x.metadata->'public_function_fingerprints') f where f->>'signature' not in (${post.functions.filter(f=>newFunctions.includes(f.name)).map(f=>literal(f.signature)).join(',')}))=${literal(JSON.stringify(base.public_function_fingerprints))}::jsonb,\n'default_acl_preservada',x.metadata->'default_acl'=${literal(JSON.stringify(base.default_acl))}::jsonb) as verificacao from (${stateQuery}) s cross join (${captureQuery}) x;\ncommit;\n`);
 save('fontes.json',JSON.stringify({referenceOnly:true,sourceMigrations:[...cadeiaCheckout,readiness],newTables:tableNames,newColumns,newFunctions,preservedLegacyFunctions:base.functions.map(f=>f.signature),notApplied:true},null,2)+'\n');
 console.log(JSON.stringify({generated:true,newTables:tableNames.length,newColumns:newColumns.length,newFunctions:newFunctions.length,baselineMatched:true,notApplied:true}));
}finally{await clone.close();await reference.close();}
