import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {fixture,read,snapshot,baseline,measured,backend,canonical} from './fixture.mjs';
import {M,json,normalize,delta,normalizedSql,deltaSql} from './modelo.mjs';
const write=(n,s)=>{if(n.endsWith('.sql'))assert.doesNotMatch(s,/->>'(?:version|name) collate/);writeFileSync(new URL(n,import.meta.url),s);};
let ss=read('snapshot.sql').trim().replace(/;$/,'');
if(!ss.includes("'function_comments'"))ss+="||jsonb_build_object('function_comments',(select coalesce(jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'comment',obj_description(p.oid,'pg_proc')) order by n.nspname collate \"C\",p.proname collate \"C\"),'[]'::jsonb) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('evento_asaas_impede_confirmacao','checkout_producao_schema_v1')))";
write('snapshot.sql',ss+';\n');
const db=await fixture();
try{
 const pre=await snapshot(db),empty=delta(pre);
 const expectedParents=canonical(measured.snapshot.relations.filter(r=>!backend.includes(r.relname)),'relations');
 assert.deepEqual(pre.relations.filter(r=>!backend.includes(r.relname)),expectedParents,'dependencias medidas devem ser reproduzidas');
 assert.deepEqual(pre.functions,measured.snapshot.functions);assert.deepEqual(pre.u3_function_details,measured.snapshot.u3_function_details);
 await db.exec(read('delta.sql'));const post=await snapshot(db),expected=delta(post);assert.deepEqual(normalize(pre),normalize(post));
 const unchangedParents=expectedParents.filter(r=>!M.changedRelations.includes(r.relname));
 const protectedFunctions=pre.functions.filter(f=>!M.changedFunctions.includes(f.name)),protectedDetails=pre.u3_function_details.filter(f=>!M.changedFunctions.includes(f.name));
 const beforeLedger=canonical(baseline.snapshot.ledger,'ledger');assert.equal(beforeLedger.length,49);
 write('modelo-delta.json',JSON.stringify({before:empty,after:expected,protectedParents:unchangedParents,protectedFunctions,protectedDetails,baselineLedger:beforeLedger},null,2)+'\n');
 const u1=read('../u1-aplicar.sql'),a=u1.indexOf('-- Nine backend tables:'),b=u1.indexOf('end loop;',a)+9;
 const backendGuard=u1.slice(a,b).replaceAll('INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN').replace('if not r.relrowsecurity or',"if has_table_privilege('service_role',r.oid,'SELECT WITH GRANT OPTION') or has_any_column_privilege('service_role',r.oid,'SELECT WITH GRANT OPTION') or not r.relrowsecurity or");
 const parentSql="(select jsonb_agg(parent_entry order by parent_entry->>'nspname' collate \"C\",parent_entry->>'relname' collate \"C\") from jsonb_array_elements(("+normalizedSql('s')+")->'relations') parent_entry where parent_entry->>'relname'=any(array["+unchangedParents.map(p=>"'"+p.relname+"'").join(',')+"]))";
 const common="if current_user<>'postgres' then raise exception 'U6: executor inesperado';end if;\n"+backendGuard+'\ns:=('+ss+');\n'+
 "if (select jsonb_agg(item order by item->>'version' collate \"C\",item->>'name' collate \"C\") from jsonb_array_elements(s->'ledger') item where item->>'name' not in('"+M.applyName+"','"+M.returnName+"')) is distinct from "+json(beforeLedger)+" then raise exception 'U6: historico anterior divergiu';end if;\n"+
 'if '+parentSql+' is distinct from '+json(unchangedParents)+' or ('+normalizedSql('s')+")->'functions' is distinct from "+json(protectedFunctions)+' or ('+normalizedSql('s')+")->'u3_function_details' is distinct from "+json(protectedDetails)+" then raise exception 'U6: pais/helpers/U1-U5 divergiram';end if;\n";
 const state=x=>'if '+deltaSql('s')+' is distinct from '+json(x)+" then raise exception 'U6: delta/corpos/ACL/checks divergiram';end if;\n";
 const ledger=(n,name)=>"if jsonb_array_length(s->'ledger')<>"+n+"+(select count(*)::int from jsonb_array_elements(s->'ledger') item where item->>'name'='"+name+"') or (select count(*) from jsonb_array_elements(s->'ledger') item where item->>'name'='"+name+"')>1 then raise exception 'U6: contagem historico inesperada';end if;\n";
 const lock="perform set_config('lock_timeout','3s',true);perform pg_advisory_xact_lock(7261107,6);lock table public.commercial_payment_events in access exclusive mode;lock table public.commercial_orders,public.commercial_events,public.commercial_payment_email_outbox,public.checkout_3ds_context,public.checkout_security_attempts,public.commercial_order_units,public.businesses in share row exclusive mode;\n";
 const head='-- PREPARADO LOCALMENTE, nao aplicado. QA zskpijnqgkqwxksqmzmf.\n-- Um DO pelo canal futuro apply_migration, sem BEGIN/COMMIT externos.\n-- Readiness e helpers puros estruturais nao chamam provedores ou pagamentos.\n';
 write('u6-aplicar.sql',head+'do $u6$ declare s jsonb;r record;before_state jsonb;begin\n'+lock+common+ledger(49,M.applyName)+state(empty)+'before_state:=s;\n'+read('delta.sql')+'\ns:=('+ss+');\n'+state(expected)+'if '+normalizedSql('s')+' is distinct from '+normalizedSql('before_state')+" then raise exception 'U6: mudou fora do delta';end if;\nend;$u6$;\n");
 const strictPre="if jsonb_array_length(s->'ledger')<>49 or exists(select 1 from jsonb_array_elements(s->'ledger') item where item->>'name' in('"+M.applyName+"','"+M.returnName+"')) then raise exception 'U6: PRE deve ser baseline 49 sem U6';end if;\n";
 write('u6-conferir-pre.sql','begin read only;do $u6$ declare s jsonb;r record;begin\n'+common+strictPre+state(empty)+'end;$u6$;commit;\n');
 let undo=measured.definitions.filter(f=>M.changedFunctions.includes(f.name)).map(f=>f.definition+';').join('\n');
 undo+='\ndrop function public.checkout_producao_schema_v1();drop function public.evento_asaas_impede_confirmacao(text);\nalter table public.commercial_payment_events drop constraint commercial_payment_events_event_type_check;\nalter table public.commercial_payment_events add constraint commercial_payment_events_event_type_check '+measured.snapshot.relations.find(r=>r.relname==='commercial_payment_events').constraints.find(k=>k.name==='commercial_payment_events_event_type_check').def+';\n';
 // Os GRANTs da fonte sao no-op no estado medido; se isso mudar, nao adivinhar restauracao de ACL.
 for(const t of M.changedRelations)assert.deepEqual(pre.relations.find(r=>r.relname===t).table_acl,post.relations.find(r=>r.relname===t).table_acl,'ACL antiga mudou: requer retorno explicito '+t);
 write('delta-retorno.sql',undo);
 const noData="if exists(select 1 from public.commercial_payment_events) or exists(select 1 from public.commercial_events where source='asaas') or exists(select 1 from public.commercial_orders where payment_method in('asaas_pix','asaas_card') and (status='payment_approved' or subscription_creation_started_at is not null)) then raise exception 'U6: retorno recusado, historico/efeitos financeiros exigem avaliacao propria';end if;\n";
 write('u6-retornar.sql',head+'-- Retorno DDL nao restaura pagamentos/assinaturas/acesso/email; sem apagar dados.\ndo $u6$ declare s jsonb;r record;before_state jsonb;begin\n'+lock+common+ledger(50,M.returnName)+state(expected)+noData+'before_state:=s;\n'+undo+'\ns:=('+ss+');\n'+state(empty)+'if '+normalizedSql('s')+' is distinct from '+normalizedSql('before_state')+" then raise exception 'U6: retorno mudou fora do delta';end if;\nend;$u6$;\n");
 write('u6-verificar.sql','begin read only;do $u6$ declare s jsonb;r record;begin\n'+common+state(expected)+"if jsonb_array_length(s->'ledger')<>50 or not exists(select 1 from jsonb_array_elements(s->'ledger') item where item->>'name'='"+M.applyName+"') then raise exception 'U6: POS historico inesperado';end if;\nend;$u6$;commit;\n");
 const receipt="-- Um SELECT/uma linha receipt JSON, somente catalogos.\nselect jsonb_build_object('snapshot',s,'normalized',"+normalizedSql('s')+",'delta',"+deltaSql('s')+') receipt from(select ('+ss+') s) capture;\n';
 write('u6-preflight.sql',receipt);write('u6-pos.sql',receipt);
 console.log(JSON.stringify({generated:true,newFunctions:2,changedFunctions:7,readiness:1,remote:false}));
}finally{await db.close();}
