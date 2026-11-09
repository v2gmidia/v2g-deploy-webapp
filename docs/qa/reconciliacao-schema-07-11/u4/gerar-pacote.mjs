import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {fixture,read,snapshot,baseline,parents,backend,canonical} from './fixture.mjs';
import {M,json,normalize,delta,normalizedSql,deltaSql} from './modelo.mjs';
import {canonicalSqlOrders} from '../u3-ordenacao-acl-08-11/canonical.mjs';
const write=(n,s)=>{const out=n.endsWith('.sql')?canonicalSqlOrders(s):s;if(n.endsWith('.sql'))assert.doesNotMatch(out,/->>'(?:version|name) collate/,'chave JSON corrompida pelo canonicalizador: '+n);writeFileSync(new URL(n,import.meta.url),out);};
const db=await fixture();
try{
 const pre=await snapshot(db),empty=delta(pre);
 const expectedParents=canonical([...baseline.snapshot.relations.filter(r=>!backend.includes(r.relname)&&r.relname!=='commercial_order_units'),...parents],'relations');
 const selectParents=s=>s.relations.filter(r=>expectedParents.some(p=>r.nspname===p.nspname&&r.relname===p.relname));
 assert.deepEqual(selectParents(pre),expectedParents,'pais completos medidos devem coincidir com fixture');
 assert.deepEqual(pre.functions,canonical(baseline.snapshot.functions,'functions'));
 assert.deepEqual(pre.u3_function_details,baseline.snapshot.u3_function_details);
 assert.equal(pre.ledger.length,47);
 await db.exec(read('delta.sql'));const post=await snapshot(db),expected=delta(post);
 assert.deepEqual(normalize(post),normalize(pre),'delta nao pode alterar pais/helpers/backend');
 write('modelo-delta.json',JSON.stringify({before:empty,after:expected,protectedParents:expectedParents,protectedFunctions:pre.functions,protectedFunctionDetails:pre.u3_function_details},null,2)+'\n');
 const q=read('snapshot.sql').trim().replace(/;$/,'');
 const u1=read('../u1-aplicar.sql'),a=u1.indexOf('-- Nine backend tables:'),b=u1.indexOf('end loop;',a)+9;
 const backendGuard=u1.slice(a,b).replaceAll('INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN').replace('if not r.relrowsecurity or',"if has_table_privilege('service_role',r.oid,'SELECT WITH GRANT OPTION') or has_any_column_privilege('service_role',r.oid,'SELECT WITH GRANT OPTION') or not r.relrowsecurity or");
 const parentSql="(select jsonb_agg(parent_entry order by parent_entry->>'nspname',parent_entry->>'relname') from jsonb_array_elements(("+normalizedSql('s')+")->'relations') parent_entry where parent_entry->>'relname'=any(array["+expectedParents.map(p=>"'"+p.relname+"'").join(',')+"]))";
 const baselineLedger=canonical(baseline.snapshot.ledger,'ledger');
 const common="if current_user<>'postgres' then raise exception 'U4: executor inesperado';end if;\n"+backendGuard+'\ns:=('+q+');\n'+
 "if (select jsonb_agg(item order by item->>'version' collate \"C\",item->>'name' collate \"C\") from jsonb_array_elements(s->'ledger') item where item->>'name' not in('"+M.applyName+"','"+M.returnName+"')) is distinct from "+json(baselineLedger)+" then raise exception 'U4: historico anterior version/name divergiu';end if;\n"+
 'if '+parentSql+' is distinct from '+json(expectedParents)+' or ('+normalizedSql('s')+")->'functions' is distinct from "+json(pre.functions)+' or ('+normalizedSql('s')+")->'u3_function_details' is distinct from "+json(pre.u3_function_details)+" then raise exception 'U4: pais/U1/U2/U3/helpers divergiu';end if;\n";
 const ledger=(count,name)=>"if jsonb_array_length(s->'ledger')<>"+count+"+(select count(*)::int from jsonb_array_elements(s->'ledger') e where e->>'name'='"+name+"') or (select count(*) from jsonb_array_elements(s->'ledger') e where e->>'name'='"+name+"')>1 or not exists(select 1 from jsonb_array_elements(s->'ledger') e where e->>'version'='20261108113154' and e->>'name'='qa_reconciliacao_u3_perfil_procedencia_20261108') then raise exception 'U4: historico divergente';end if;\n";
 const state=x=>'if '+deltaSql('s')+' is distinct from '+json(x)+" then raise exception 'U4: delta/ACL/definicoes divergentes';end if;\n";
 const lock="perform set_config('lock_timeout','3s',true);perform pg_advisory_xact_lock(7261107,4);lock table public.businesses,public.profiles,public.leads_lp,public.commercial_orders in access share mode;\n";
 const header='-- PREPARADO LOCALMENTE; NAO APLICADO. QA zskpijnqgkqwxksqmzmf.\n-- Canal futuro apply_migration, um DO sem BEGIN/COMMIT externos; sem invocar RPC.\n';
 const preLedger="if jsonb_array_length(s->'ledger')<>47 or exists(select 1 from jsonb_array_elements(s->'ledger') e where e->>'name' in('"+M.applyName+"','"+M.returnName+"')) then raise exception 'U4: historico PRE deve ter 47 entradas e nenhum ato U4';end if;\n";
 write('u4-conferir-pre.sql','begin read only;do $u4$ declare s jsonb;r record;begin\n'+common+preLedger+state(empty)+'end;$u4$;commit;\n');
 write('u4-aplicar.sql',header+'do $u4$ declare s jsonb;r record;before_state jsonb;begin\n'+lock+common+ledger(47,M.applyName)+state(empty)+'before_state:=s;\n'+read('delta.sql')+'\ns:=('+q+');\n'+state(expected)+'if '+normalizedSql('s')+' is distinct from '+normalizedSql('before_state')+" then raise exception 'U4: mudou fora do delta';end if;\nend;$u4$;\n");
 const drop="drop function public.revops_register_interest(text,text,text,text,text,text,text,text,timestamptz,text,text,uuid);drop function public.revops_register_interaction(uuid,text,text,text,text,text,text,text,timestamptz,text,uuid);\n"+['creative_generation_requests','revops_interaction_opportunities','revops_interactions','revops_source_references','revops_opportunity_people','revops_opportunities','revops_prospect_organizations','revops_people'].map(t=>'drop table public.'+t+';').join('\n');
 const noData=M.newTables.map(t=>"if exists(select 1 from public."+t+") then raise exception 'U4: retorno recusado, dados posteriores em "+t+"';end if;").join('\n');
 write('u4-retornar.sql',header+'do $u4$ declare s jsonb;r record;before_state jsonb;begin\n'+lock+'lock table '+M.newTables.map(t=>'public.'+t).join(',')+' in access exclusive mode;\n'+common+ledger(48,M.returnName)+state(expected)+noData+'\nbefore_state:=s;\n'+drop+'\ns:=('+q+');\n'+state(empty)+'if '+normalizedSql('s')+' is distinct from '+normalizedSql('before_state')+" then raise exception 'U4: retorno mudou fora do delta';end if;\nend;$u4$;\n");
 write('u4-verificar.sql','begin read only;do $u4$ declare s jsonb;r record;begin\n'+common+state(expected)+"if jsonb_array_length(s->'ledger')<>48 or not exists(select 1 from jsonb_array_elements(s->'ledger') e where e->>'name'='"+M.applyName+"') then raise exception 'U4: historico POS inesperado';end if;\nend;$u4$;commit;\n");
 const receipt="-- Leitura apenas, um SELECT/uma linha receipt JSON, sem linhas de aplicacao/Auth/Vault.\nselect jsonb_build_object('snapshot',s,'normalized',"+normalizedSql('s')+",'delta',"+deltaSql('s')+') receipt from(select ('+q+') s) capture;\n';
 write('u4-preflight.sql',receipt);write('u4-pos.sql',receipt);
 console.log(JSON.stringify({generated:true,newTables:8,newRPC:2,ledger:47,remote:false}));
}finally{await db.close();}
