// Somente arquivos locais e PGlite. Sem rede/credenciais/DDL remoto.
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {fixture,read,snapshot,baseline,deps,canonicalParents} from './fixture.mjs';
import {M,normalize,delta,normalizedSql,deltaSql,sqlJson} from './modelo.mjs';
import {read as readU2} from '../u2/fixture.mjs';
import {deltaSql as u2DeltaSql} from '../u2/modelo.mjs';
import {canonical,cmp,canonicalSqlOrders} from './canonical.mjs';
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),n.endsWith('.sql')?canonicalSqlOrders(s):s);
let ss=readU2('snapshot.sql')
 .replace("'campanhas_criacao'))","'campanhas_criacao','identidade_visual','narrativa_negocio','pessoas_do_negocio','entrevistas','propostas_de_perfil','itens_da_proposta','divergencias_de_cadastro'))")
 .replace("'status_da_exclusao')) funcs)","'status_da_exclusao','owns_business','registrar_procedencia','procedencia_do_campo','set_atualizado_em','aplicar_proposta','escrever_apenas_se_livre')) funcs)")
 .replace("'defaults',","'u3_function_details',(select coalesce(jsonb_agg(jsonb_build_object('name',p.proname,'arguments',pg_get_function_arguments(p.oid),'variadic',p.provariadic::text,'support',p.prosupport::text) order by p.proname),'[]'::jsonb) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('aplicar_proposta','escrever_apenas_se_livre')),\n'defaults',");
ss=canonicalSqlOrders(ss);
write('snapshot.sql',ss);
const db=await fixture();
try {
 const pre=await snapshot(db);
 const expectedParents=canonicalParents([...baseline.parents,...deps.relations]);
 assert.deepEqual(pre.relations.filter(r=>expectedParents.some(p=>p.relname===r.relname)),expectedParents,'pais locais devem corresponder metadados QA');
 const frozen=normalize(pre);delete frozen.ledger;
 const empty=delta(pre);
 await db.exec(read('delta.sql'));
 const post=await snapshot(db),expected=delta(post);
 const n=normalize(post);delete n.ledger;assert.deepEqual(n,frozen);
 assert.equal(pre.ledger.length,46);
 const u2Expected=canonical(JSON.parse(readU2('modelo-delta.json')).after);
 assert.deepEqual(canonical((await db.query('select '+canonicalSqlOrders(u2DeltaSql('$1::jsonb'))+' as d',[post])).rows[0].d),u2Expected);
 write('modelo-delta.json',JSON.stringify({before:empty,after:expected,protectedParents:expectedParents,protectedFunctions:frozen.functions,localFixtureOnly:frozen},null,2)+'\n');
 const sealed=readU2('../u1-aplicar.sql'),a=sealed.indexOf('-- Nine backend tables:'),b=sealed.indexOf('end loop;',a)+9;
 const backendGuard=sealed.slice(a,b).replaceAll('INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN').replace('if not r.relrowsecurity or',"if has_table_privilege('service_role',r.oid,'SELECT WITH GRANT OPTION') or has_any_column_privilege('service_role',r.oid,'SELECT WITH GRANT OPTION') or not r.relrowsecurity or");
 const query=ss.trim().replace(/;$/,'');
 const parentSql="(select jsonb_agg(parent_entry order by parent_entry->>'nspname',parent_entry->>'relname') from jsonb_array_elements(("+normalizedSql('s')+")->'relations') parent_entry where parent_entry->>'relname'=any(array["+expectedParents.map(p=>"'"+p.relname+"'").join(',')+"]))";
 const common="if current_user<>'postgres' then raise exception 'U3: executor inesperado';end if;\n"+backendGuard+"\ns:=("+query+");\n"+
 "if "+u2DeltaSql('s')+" is distinct from "+sqlJson(u2Expected)+" then raise exception 'U3: U2 divergiu';end if;\n"+
 "if "+parentSql+" is distinct from "+sqlJson(expectedParents)+" or ("+normalizedSql('s')+")->'functions' is distinct from "+sqlJson(frozen.functions)+" then raise exception 'U3: pais/helpers/U1 divergiu';end if;\n";
 const stateGuard=(state)=>"if "+deltaSql('s')+" is distinct from "+sqlJson(state)+" then raise exception 'U3: delta/definicoes/ACL divergiram';end if;\n";
 // O canal pode registrar sua entrada nominal antes ou depois do corpo, na mesma transacao.
 const ledgerGuard=(count,name)=>"if jsonb_array_length(s->'ledger')<>"+count+"+(select count(*)::int from jsonb_array_elements(s->'ledger') e where e->>'name'='"+name+"') or (select count(*) from jsonb_array_elements(s->'ledger') e where e->>'name'='"+name+"')>1 then raise exception 'U3: historico mudou ou nome repetido';end if;\nif not exists(select 1 from jsonb_array_elements(s->'ledger') e where e->>'version'='20261108005549' and e->>'name'='qa_reconciliacao_u2_operacional_meta_20261107') then raise exception 'U3: U2 ausente no historico';end if;\n";
 const lock="perform set_config('lock_timeout','3s',true);perform pg_advisory_xact_lock(7261107,3);\nlock table public.businesses,public.creatives,public.identidade_visual,public.narrativa_negocio in access exclusive mode;\n";
 const header='-- PREPARADO LOCALMENTE; NAO APLICADO. QA zskpijnqgkqwxksqmzmf, canal apply_migration.\n-- Um DO; sem BEGIN/COMMIT externos; sem invocar RPC de negocio.\n';
 write('u3-aplicar.sql',header+'do $u3$ declare s jsonb;r record;before_state jsonb;begin\n'+lock+common+ledgerGuard(46,M.applyName)+stateGuard(empty)+'before_state:=s;\n'+read('delta.sql')+'\ns:=('+query+');\n'+stateGuard(expected)+"if ("+normalizedSql('s')+") is distinct from "+normalizedSql('before_state')+" then raise exception 'U3: alteracao fora do delta';end if;\nend;$u3$;\n");
 const drop="drop function public.aplicar_proposta(uuid,text);drop function public.escrever_apenas_se_livre(uuid,text,jsonb,text,text,uuid);\n"+
 'drop index public.creatives_pessoa_id_idx;alter table public.creatives drop constraint creatives_pessoa_negocio_fkey;alter table public.creatives drop constraint creatives_uso_check;alter table public.creatives drop column pessoa_id;\n'+
 ['itens_da_proposta','propostas_de_perfil','divergencias_de_cadastro','entrevistas','pessoas_do_negocio'].map(t=>'drop table public.'+t+';').join('\n');
 const dataGuard=M.newTables.map(t=>"if exists(select 1 from public."+t+") then raise exception 'U3: retorno recusado, tabela com dados posteriores: "+t+"';end if;").join('\n')+"\nif exists(select 1 from public.creatives where pessoa_id is not null) then raise exception 'U3: retorno recusado, pessoa vinculada';end if;\n";
 write('u3-retornar.sql',header+'-- Retorno DDL NAO desfaz alteracoes de perfil/procedencia feitas pelas RPCs.\n-- Exige autorizacao propria e comparacao do POS original antes do ato.\ndo $u3$ declare s jsonb;r record;before_state jsonb;begin\n'+lock+'lock table '+M.newTables.map(t=>'public.'+t).join(',')+' in access exclusive mode;\n'+common+ledgerGuard(47,M.returnName)+stateGuard(expected)+dataGuard+'before_state:=s;\n'+drop+'\ns:=('+query+');\n'+stateGuard(empty)+'if '+normalizedSql('s')+' is distinct from '+normalizedSql('before_state')+" then raise exception 'U3: retorno alterou contexto protegido';end if;\nend;$u3$;\n");
 write('u3-verificar.sql','begin read only;\ndo $u3$ declare s jsonb;r record;begin\n'+common+stateGuard(expected)+"if jsonb_array_length(s->'ledger')<>47 or not exists(select 1 from jsonb_array_elements(s->'ledger') e where e->>'name'='"+M.applyName+"') then raise exception 'U3: historico POS inesperado';end if;\nend;$u3$;\ncommit;\n");
 const receipt='-- SOMENTE LEITURA: SELECT unico, uma linha, receipt JSON; sem linhas de clientes/Auth/Vault.\nselect jsonb_build_object(\'snapshot\',s,\'normalized\','+normalizedSql('s')+",'delta',"+deltaSql('s')+') as receipt from(select ('+query+') s) capture;\n';
 write('u3-preflight.sql',receipt);write('u3-pos.sql',receipt);
 console.log(JSON.stringify({generated:true,newTables:5,newColumns:1,newFunctions:2,apply:'single DO',remote:false}));
}finally{await db.close();}
