// Somente arquivos locais para uma leitura estrita de catalogos QA.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const raw=readFileSync('C:/Users/victo/.codex/private-backups/v2g/qa-schema/U5-20261109T012526Z/post.json');
write('baseline-u5.json',JSON.stringify({sourceSha256:createHash('sha256').update(raw).digest('hex'),snapshot:JSON.parse(raw).snapshot},null,2)+'\n');
const parents=['commercial_payment_email_outbox','checkout_3ds_context','checkout_security_attempts'];
const changed=['registrar_evento_financeiro_asaas','registrar_evento_financeiro_comercial','registrar_evento_inicial_3ds','registrar_evento_inicial_3ds_comercial','reservar_assinatura_apos_3ds','aprovar_pagamento_api_comercial','aprovar_pagamento_api_self_service'];
const funcs=[...changed,'pedido_asaas_comercial_elegivel','consumir_limite_checkout','evento_asaas_impede_confirmacao','checkout_producao_schema_v1'];
let s=read('../u5/snapshot.sql').trim().replace(/;$/,'');
s=s.replace("'commercial_events'))","'commercial_events','"+parents.join("','")+"'))");
s=s.replace("'set_updated_at','uid')) funcs)","'set_updated_at','uid','"+funcs.join("','")+"')) funcs)");
// O snapshot de U5 tem a mesma lista no detalhe dos argumentos.
s=s.replace("'set_updated_at','uid')","'set_updated_at','uid','"+funcs.join("','")+"')");
const handlers="select t.tgfoid from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in('"+parents.join("','")+"') and not t.tgisinternal";
const definitions="(select jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'definition',pg_get_functiondef(p.oid),'identity',pg_get_function_identity_arguments(p.oid),'owner',p.proowner::regrole::text,'acl',p.proacl::text) order by n.nspname collate \"C\",p.proname collate \"C\",pg_get_function_identity_arguments(p.oid) collate \"C\") from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private') and (p.proname in('"+funcs.join("','")+"') or p.oid in("+handlers+")))";
const detailed="jsonb_build_object('extra_column_details',(select jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'column',a.attname,'identity',a.attidentity,'generated',a.attgenerated,'comment',col_description(c.oid,a.attnum)) order by n.nspname collate \"C\",c.relname collate \"C\",a.attnum) from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid where n.nspname='public' and c.relname in('"+parents.join("','")+"') and a.attnum>0 and not a.attisdropped))";
write('snapshot.sql',s+'||'+detailed+';\n');
write('capturar-metadados.sql',"-- Catalogos apenas: sem linhas de clientes, Auth, Vault, IPs ou payloads.\nselect jsonb_build_object('snapshot',("+s+')||'+detailed+",'definitions',"+definitions+');\n');
console.log(JSON.stringify({prepared:true,ledger:JSON.parse(raw).snapshot.ledger.length,parents,financialFunctions:changed.length}));
