import {M,read} from './fixture.mjs';
import {canonical,cmp} from './canonical.mjs';
export {M};
const sqlJson=x=>"'"+JSON.stringify(x).replaceAll("'","''")+"'::jsonb";
export {sqlJson};
const lists={columns:M.columns,constraints:[...M.checks,...M.constraints],indexes:M.indexes};
const selected=(r,n,list)=>list.some(([t,k])=>r===t&&k===n);
export function normalize(s){
 const a=canonical(s);
 a.relations=a.relations.filter(r=>!M.newTables.includes(r.relname)).map(r=>{
  for(const [field,list] of Object.entries(lists)){r[field]=r[field]?.filter(x=>!selected(r.relname,x.name,list))??null;if(r[field]?.length===0)r[field]=null;}return r;
 });
 a.functions=a.functions.filter(f=>!M.functions.includes(f.name));
 a.u3_function_details=a.u3_function_details?.filter(f=>!M.functions.includes(f.name))??[];
 return a;
}
export function delta(s){
 s=canonical(s);
 const items=(field,list)=>s.relations.flatMap(r=>(r[field]??[]).filter(x=>selected(r.relname,x.name,list)).map(object=>({table:r.relname,object}))).sort((a,b)=>cmp(a.table+':'+a.object.name,b.table+':'+b.object.name));
 return {tables:s.relations.filter(r=>M.newTables.includes(r.relname)),columns:items('columns',lists.columns),constraints:items('constraints',lists.constraints),indexes:items('indexes',lists.indexes),functions:s.functions.filter(f=>M.functions.includes(f.name)),details:s.u3_function_details??[]};
}
export function normalizedSql(expr){
 const map=Object.entries(lists).map(([field,list])=>"'"+field+"',(select jsonb_agg(item order by "+(field==='columns'?'pos':"item->>'name'")+") from jsonb_array_elements(rel->'"+field+"') with ordinality vals(item,pos) where not exists(select 1 from jsonb_array_elements("+sqlJson(list)+") pair where pair->>0=rel->>'relname' and pair->>1=item->>'name'))").join(',');
 return "(select src.doc-'relations'-'functions'-'u3_function_details'||jsonb_build_object('relations',(select jsonb_agg(rel-'columns'-'constraints'-'indexes'||jsonb_build_object("+map+") order by rel->>'nspname',rel->>'relname') from jsonb_array_elements(src.doc->'relations') rel where not (rel->>'relname'=any(array["+M.newTables.map(x=>"'"+x+"'").join(',')+"]))),'functions',(select jsonb_agg(f order by f->>'schema',f->>'name',f->>'identity') from jsonb_array_elements(src.doc->'functions') f where f->>'name' not in ('aplicar_proposta','escrever_apenas_se_livre')),'u3_function_details','[]'::jsonb) from(select "+expr+" doc) src)";
}
export function deltaSql(expr){
 const fields=Object.entries(lists).map(([field,list])=>"'"+field+"',(select coalesce(jsonb_agg(jsonb_build_object('table',rel->>'relname','object',item) order by rel->>'relname',item->>'name'),'[]'::jsonb) from jsonb_array_elements(src.doc->'relations') rel cross join lateral jsonb_array_elements(rel->'"+field+"') item where exists(select 1 from jsonb_array_elements("+sqlJson(list)+") pair where pair->>0=rel->>'relname' and pair->>1=item->>'name'))").join(',');
 return "(select jsonb_build_object("+fields+",'tables',(select coalesce(jsonb_agg(rel order by rel->>'nspname',rel->>'relname'),'[]'::jsonb) from jsonb_array_elements(src.doc->'relations') rel where rel->>'relname'=any(array["+M.newTables.map(x=>"'"+x+"'").join(',')+"])), 'functions',(select coalesce(jsonb_agg(f order by f->>'schema',f->>'name',f->>'identity'),'[]'::jsonb) from jsonb_array_elements(src.doc->'functions') f where f->>'name' in('aplicar_proposta','escrever_apenas_se_livre')),'details',src.doc->'u3_function_details') from(select "+expr+" doc) src)";
}
