import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {fixture,read,snapshot,baseline,measured,events,backend,canonical} from './fixture.mjs';
import {M,json,normalize,delta,normalizedSql,deltaSql} from './modelo.mjs';
const write=(n,s)=>{if(n.endsWith('.sql'))assert.doesNotMatch(s,/->>'(?:version|name) collate/);writeFileSync(new URL(n,import.meta.url),s);};
// A captura principal e preservada; o snapshot operacional inclui a dependência complementar.
let ss=read('snapshot.sql').replace("'historical_contract_access_events'))","'historical_contract_access_events','commercial_events'))").replace("'historical_contract_access_events','users')","'historical_contract_access_events','users','commercial_events')");
// JSON.parse nao preserva bigint numerico: o contrato serializa atributos de sequencia como texto.
ss=ss.replace(/z\.seq(?:start|increment|min|max|cache)\b(?!::text)/g,'$&::text');
write('snapshot.sql',ss);
const db=await fixture();
try{
 const pre=await snapshot(db),empty=delta(pre);
 const expectedParents=canonical([...measured.snapshot.relations.filter(r=>!backend.includes(r.relname)),...events.relations],'relations');
 const selected=pre.relations.filter(r=>expectedParents.some(p=>p.nspname===r.nspname&&p.relname===r.relname));
 assert.deepEqual(selected,expectedParents,'pais/Auth e dependencias medidas completos');
 assert.deepEqual(pre.functions,measured.snapshot.functions,'corpos/ACL/atributos medidos');
 await db.exec(read('delta.sql'));const post=await snapshot(db),expected=delta(post);
 const beforeN=normalize(pre),afterN=normalize(post);assert.deepEqual(afterN,beforeN,'contexto fora do delta alterado');
 const unchangedParents=expectedParents.filter(r=>!M.changedRelations.includes(r.relname));
 const protectedFunctions=pre.functions.filter(f=>!M.changedFunctions.includes(f.name));
 const protectedDetails=pre.u3_function_details.filter(f=>!M.changedFunctions.includes(f.name));
 const beforeLedger=canonical(baseline.snapshot.ledger,'ledger');
 write('modelo-delta.json',JSON.stringify({before:empty,after:expected,protectedParents:unchangedParents,protectedFunctions,baselineLedger:beforeLedger,protectedDetails:pre.u3_function_details.filter(f=>!M.changedFunctions.includes(f.name))},null,2)+'\n');
 const q=ss.trim().replace(/;$/,'');
 const u1=read('../u1-aplicar.sql'),a=u1.indexOf('-- Nine backend tables:'),b=u1.indexOf('end loop;',a)+9;
 const backendGuard=u1.slice(a,b).replaceAll('INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN').replace('if not r.relrowsecurity or',"if has_table_privilege('service_role',r.oid,'SELECT WITH GRANT OPTION') or has_any_column_privilege('service_role',r.oid,'SELECT WITH GRANT OPTION') or not r.relrowsecurity or");
 const parentSql="(select jsonb_agg(parent_entry order by parent_entry->>'nspname' collate \"C\",parent_entry->>'relname' collate \"C\") from jsonb_array_elements(("+normalizedSql('s')+")->'relations') parent_entry where parent_entry->>'relname'=any(array["+unchangedParents.map(p=>"'"+p.relname+"'").join(',')+"]))";
 const common="if current_user<>'postgres' then raise exception 'U5: executor inesperado';end if;\n"+backendGuard+'\ns:=('+q+');\n'+
 "if (select jsonb_agg(item order by item->>'version' collate \"C\",item->>'name' collate \"C\") from jsonb_array_elements(s->'ledger') item where item->>'name' not in('"+M.applyName+"','"+M.returnName+"')) is distinct from "+json(beforeLedger)+" then raise exception 'U5: historico anterior divergiu';end if;\n"+
 'if '+parentSql+' is distinct from '+json(unchangedParents)+' or ('+normalizedSql('s')+")->'functions' is distinct from "+json(protectedFunctions)+' or ('+normalizedSql('s')+")->'u3_function_details' is distinct from "+json(protectedDetails)+" then raise exception 'U5: pais/helpers/U1-U4 divergiram';end if;\n"+
 "if s->'auth_read_capability' is distinct from jsonb_build_object('schema',true,'select',true) then raise exception 'U5: capacidade Auth insuficiente';end if;\n";
 const state=x=>'if '+deltaSql('s')+' is distinct from '+json(x)+" then raise exception 'U5: delta/corpos/ACL/triggers/geracao divergiram';end if;\n";
 const ledger=(n,name)=>"if jsonb_array_length(s->'ledger')<>"+n+"+(select count(*)::int from jsonb_array_elements(s->'ledger') item where item->>'name'='"+name+"') or (select count(*) from jsonb_array_elements(s->'ledger') item where item->>'name'='"+name+"')>1 then raise exception 'U5: contagem historico inesperada';end if;\n";
 const lock="perform set_config('lock_timeout','3s',true);perform pg_advisory_xact_lock(7261107,5);lock table public.commercial_orders,public.onboarding_meetings,public.fiscal_documents in access exclusive mode;lock table auth.users in share row exclusive mode;\n";
 const head='-- PREPARADO SOMENTE LOCAL, nao aplicado. QA zskpijnqgkqwxksqmzmf.\n-- Canal futuro apply_migration: um DO, sem BEGIN/COMMIT externos. Sem chamar RPCs.\n';
 write('u5-aplicar.sql',head+'do $u5$ declare s jsonb;r record;before_state jsonb;begin\n'+lock+common+ledger(48,M.applyName)+state(empty)+'before_state:=s;\n'+read('delta.sql')+'\ns:=('+q+');\n'+state(expected)+'if '+normalizedSql('s')+' is distinct from '+normalizedSql('before_state')+" then raise exception 'U5: alteracao fora do delta';end if;\nend;$u5$;\n");
 const strictPre="if jsonb_array_length(s->'ledger')<>48 or exists(select 1 from jsonb_array_elements(s->'ledger') item where item->>'name' in('"+M.applyName+"','"+M.returnName+"')) then raise exception 'U5: PRE nao e baseline 48 sem U5';end if;\n";
 write('u5-conferir-pre.sql','begin read only;do $u5$ declare s jsonb;r record;begin\n'+common+strictPre+state(empty)+'end;$u5$;commit;\n');
 const noData=M.newTables.map(t=>"if exists(select 1 from public."+t+") then raise exception 'U5: retorno recusado, tabela usada "+t+"';end if;").join('\n')+"\nif exists(select 1 from public.fiscal_documents where obligation_id is not null) then raise exception 'U5: retorno recusado, obrigacao vinculada';end if;\nif exists(select 1 from public.commercial_orders where length(cnpj)<>14) or exists(select 1 from public.onboarding_meetings where length(cnpj)<>14) then raise exception 'U5: retorno recusado, CPF aceito';end if;\n"+
 "if exists(select 1 from public.commercial_orders where payment_method='direct_pix' and status in('awaiting_payment','proof_received') group by lower(buyer_email),cnpj having count(*)>1) or exists(select 1 from public.commercial_orders where origin='self_service' and status='awaiting_payment' group by lower(buyer_email),cnpj having count(*)>1) or exists(select 1 from public.commercial_orders where origin='assisted' and payment_method in('asaas_pix','asaas_card') and status='awaiting_payment' group by lower(buyer_email),cnpj having count(*)>1) or exists(select 1 from public.onboarding_meetings where status in('pending','confirmed') group by cnpj having count(*)>1) then raise exception 'U5: retorno recusado, duplicatas agora permitidas';end if;\n";
 let undo='';
 for(const f of measured.definitions.filter(f=>M.changedFunctions.includes(f.name)))undo+=f.definition+';\n';
 for(const t of ['commercial_orders','onboarding_meetings'])undo+='drop trigger conferir_documento_contratante on public.'+t+';\nalter table public.'+t+' drop column contractor_document_type;\nalter table public.'+t+' drop constraint '+t+'_cnpj_check;\nalter table public.'+t+' add constraint '+t+'_cnpj_check '+measured.snapshot.relations.find(r=>r.relname===t).constraints.find(k=>k.name===t+'_cnpj_check').def+';\n';
 undo+='drop index public.commercial_orders_contratante_lookup;\n';
 for(const n of ['commercial_orders_one_open_direct_pix','commercial_orders_one_open_self_service','commercial_orders_one_open_assisted_asaas','onboarding_meetings_uma_ativa_por_cnpj'])undo+=measured.snapshot.relations.flatMap(r=>r.indexes??[]).find(i=>i.name===n).def+';\n';
 undo+='alter table public.fiscal_documents drop constraint fiscal_documents_obligation_order_fk;drop index public.fiscal_documents_obligation_idx;drop index public.fiscal_documents_one_authorized_per_obligation_idx;alter table public.fiscal_documents drop column obligation_id;\n';
 for(const f of post.functions.filter(f=>M.newFunctions.includes(f.name)&&!['documento_contratante_valido','conferir_documento_contratante_gravado'].includes(f.name)))undo+='drop function '+f.schema+'.'+f.name+'('+f.identity+');\n';
 for(const t of ['historical_contract_access_events','historical_contract_access','commercial_manual_evidence','fiscal_obligations'])undo+='drop table public.'+t+';\n';
 undo+='drop function public.conferir_documento_contratante_gravado();drop function public.documento_contratante_valido(text);\n';
 for(const d of measured.snapshot.column_details.filter(d=>['commercial_orders','onboarding_meetings'].includes(d.table)&&['cnpj','declares_cnpj'].includes(d.column)))undo+='comment on column public.'+d.table+'.'+d.column+' is '+(d.comment===null?'null':"'"+d.comment.replaceAll("'","''")+"'")+';\n';
 write('delta-retorno.sql',undo);
 write('u5-retornar.sql',head+'-- Retorno nao restaura efeitos em dados/identidades; exige ato proprio.\ndo $u5$ declare s jsonb;r record;before_state jsonb;begin\n'+lock+'lock table '+M.newTables.map(t=>'public.'+t).join(',')+' in access exclusive mode;\n'+common+ledger(49,M.returnName)+state(expected)+noData+'before_state:=s;\n'+undo+'\ns:=('+q+');\n'+state(empty)+'if '+normalizedSql('s')+' is distinct from '+normalizedSql('before_state')+" then raise exception 'U5: retorno alterou fora do delta';end if;\nend;$u5$;\n");
 write('u5-verificar.sql','begin read only;do $u5$ declare s jsonb;r record;begin\n'+common+state(expected)+"if jsonb_array_length(s->'ledger')<>49 or not exists(select 1 from jsonb_array_elements(s->'ledger') item where item->>'name'='"+M.applyName+"') then raise exception 'U5: POS historico inesperado';end if;\nend;$u5$;commit;\n");
 const receipt="-- SELECT unico/uma linha receipt JSON, catalogos apenas.\nselect jsonb_build_object('snapshot',s,'normalized',"+normalizedSql('s')+",'delta',"+deltaSql('s')+') receipt from(select ('+q+') s) capture;\n';
 write('u5-preflight.sql',receipt);write('u5-pos.sql',receipt);
 console.log(JSON.stringify({generated:true,newTables:4,newFunctions:7,changedFunctions:5,remote:false}));
}finally{await db.close();}
