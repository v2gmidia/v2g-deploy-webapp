
/** Preparador LOCAL: so PGlite e arquivos desta pasta; nunca executa contra QA. */
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {fixture,read,snapshot} from './fixture.mjs';
import {M,normalizedSql,deltaSql,parentsSql,baselineParents,delta} from './modelo.mjs';
const write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const json=o=>"'"+JSON.stringify(o).replaceAll("'","''")+"'::jsonb";
const db=await fixture();
try {
 const pre=await snapshot(db);
 const pp=pre.relations.filter(t=>baselineParents.some(p=>p.nspname===t.nspname&&p.relname===t.relname));
 assert.deepEqual(pp,baselineParents,'fixture dos pais deve reproduzir metadados QA medidos');
 const empty=delta(pre),u1=pre.functions;
 await db.exec(read('delta.sql'));
 const post=await snapshot(db),expected=delta(post);
 write('modelo-delta.json',JSON.stringify({before:empty,after:expected,u1},null,2)+'\n');
 const sealed=read('../u1-aplicar.sql');
 const a=sealed.indexOf('-- Nine backend tables:'),b=sealed.indexOf('end loop;',a)+9;
 const backendGuard=sealed.slice(a,b)
  .replaceAll('INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER','INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')
  .replace('if not r.relrowsecurity or',"if has_table_privilege('service_role',r.oid,'SELECT WITH GRANT OPTION') or has_any_column_privilege('service_role',r.oid,'SELECT WITH GRANT OPTION') or not r.relrowsecurity or");
 const snapshotSql=read('snapshot.sql').trim().replace(/;$/,'');
 const common=[
 "perform set_config('lock_timeout','3s',true);",
 "if current_user<>'postgres' then raise exception 'U2: executor inesperado'; end if;",
 "perform pg_advisory_xact_lock(7261107,2);",
 "lock table public.businesses,public.campaigns,public.creatives,public.ad_accounts in access exclusive mode;",
 "lock table public.meta_connections,public.metrics_daily,public.commercial_order_units,vault.secrets in access share mode;",
 backendGuard,
 "s:=("+snapshotSql+");",
 "if (s->'vault_access')<>jsonb_build_object('usage',true,'select',true,'delete',true) then raise exception 'U2: privilegios Vault insuficientes'; end if;",
 "if (select coalesce(jsonb_agg(f order by f->>'schema',f->>'name',f->>'identity'),'[]'::jsonb) from jsonb_array_elements(s->'functions') f where f->>'name'='marcar_conexao_meta_quebrada') is distinct from "+json(u1)+" then raise exception 'U2: U1 divergiu'; end if;",
 "if not exists(select 1 from jsonb_array_elements(s->'ledger') x where x->>'version'='20261108001903' and x->>'name'='qa_reconciliacao_u1_meta_reconexao_20261107') then raise exception 'U2: ledger U1 ausente'; end if;",
 "if "+parentsSql(normalizedSql('s'))+" is distinct from "+json(baselineParents)+" then raise exception 'U2: pais/definicoes/ACL divergiram'; end if;",
 "if s->'incoming_fks' is distinct from "+json(pre.incoming_fks)+" then raise exception 'U2: grafo FK divergente'; end if;",
 ].join('\n');
 const ddl=read('delta.sql');
 const afterGuard="if "+deltaSql('s')+" is distinct from "+json(expected)+" then raise exception 'U2: delta/ACL/definicao divergente'; end if;";
 const header="-- PREPARADO, NAO AUTORIZADO. Canal futuro: apply_migration, QA zskpijnqgkqwxksqmzmf.\n-- Um DO, sem BEGIN/COMMIT externos. Nenhuma chamada de negocio.\n";
 const apply=header+"do $u2$ declare s jsonb; before_state jsonb; r record; begin\n"+common+"\nif "+deltaSql('s')+" is distinct from "+json(empty)+" then raise exception 'U2: delta ja existe ou diverge; nao repetir'; end if;\nbefore_state:="+normalizedSql('s')+";\n"+ddl+"\ns:=("+snapshotSql+");\n"+afterGuard+"\nif before_state is distinct from "+normalizedSql('s')+" then raise exception 'U2: mudou algo fora do delta'; end if;\nend; $u2$;\n";
 write('u2-aplicar.sql',apply);
 const dataGuard=M.columns.map(([t,n])=>"if exists(select 1 from public."+t+" where "+n+" is not null) then raise exception 'U2: retorno recusado, coluna com conteudo posterior "+t+"."+n+"'; end if;").join('\n');
 const drop=[
 ...M.functions.map(n=>"drop function public."+n+"(text);"),
 "drop table public.exclusoes_de_dados;",
 ...M.indexes.filter(i=>i[0]!==M.table).map(([,n])=>"drop index public."+n+";"),
 ...M.checks.map(([t,n])=>"alter table public."+t+" drop constraint "+n+";"),
 ...M.columns.slice().reverse().map(([t,n])=>"alter table public."+t+" drop column "+n+";")
 ].join('\n');
 const undo=header+"do $u2$ declare s jsonb; before_state jsonb; r record; begin\n"+common+"\n"+afterGuard+
 "\nlock table public.exclusoes_de_dados in access exclusive mode;\n"+
 "if exists(select 1 from public.exclusoes_de_dados) then raise exception 'U2: retorno recusado, registro de exclusao posterior'; end if;\n"+
 dataGuard+"\nbefore_state:="+normalizedSql('s')+";\n"+drop+"\ns:=("+snapshotSql+");\nif "+deltaSql('s')+" is distinct from "+json(empty)+" then raise exception 'U2: delta residual'; end if;\nif before_state is distinct from "+normalizedSql('s')+" then raise exception 'U2: retorno alterou algo fora do delta'; end if;\nend; $u2$;\n";
 write('u2-retornar.sql',undo);
 // A verificacao e somente leitura: mesmo contexto, sem advisory/locks/settings.
 const checksOnly=common.split('\n').filter(l=>!l.startsWith('perform set_config')&&!l.startsWith('perform pg_advisory')&&!l.startsWith('lock table')).join('\n');
 write('u2-verificar.sql',"begin read only;\ndo $u2$ declare s jsonb;r record;begin\n"+checksOnly+"\n"+afterGuard+"\nend; $u2$;\ncommit;\n");
 const receipt="-- SOMENTE LEITURA: um SELECT/uma linha/receipt JSON. Nenhuma linha de cliente.\nselect jsonb_build_object('snapshot',s,'normalized',"+normalizedSql('s')+",'delta',"+deltaSql('s')+") as receipt from(select ("+snapshotSql+") s) capture;\n";
 write('u2-preflight.sql',receipt);write('u2-pos.sql',receipt);
 console.log(JSON.stringify({generated:true,objects:17,columns:13,checks:8,indexes:6,newTable:1,newFunctions:3,sqlBody:'single DO'}));
}catch(error){console.error(error.message.slice(0,200));if(error.query)console.error(error.query.slice(0,500));if(error.actual&&error.expected){for(let i=0;i<error.actual.length;i++){const x=error.actual[i],y=error.expected[i];for(const k of Object.keys(x)){if(JSON.stringify(x[k])!==JSON.stringify(y[k]))console.error(x.relname,k,JSON.stringify({actual:x[k],expected:y[k]}).slice(0,2000));}}}process.exitCode=1;}finally {await db.close();}
