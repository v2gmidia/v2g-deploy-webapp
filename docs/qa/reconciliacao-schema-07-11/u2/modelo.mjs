
import {M,parents,canonicalParents,read,snapshotSql} from './fixture.mjs';
export {M,snapshotSql};
const pairs=xs=>xs.map(([t,n])=>"('"+t+"','"+n+"')").join(',');
const scoped=(r,item,xs)=>"("+r+"->>'relname',"+item+"->>'name') in (values "+pairs(xs)+")";
export function normalizedSql(expr) {
 const colWhere=scoped('rel','item',M.columns),checkWhere=scoped('rel','item',M.checks),indexWhere=scoped('rel','item',M.indexes);
 const mapField=(field,where,ordered)=>"'"+field+"',(select jsonb_agg(item order by "+ordered+") from jsonb_array_elements(rel->'"+field+"') with ordinality e(item,pos) where not ("+where+"))";
 return "(select src.snapshot_doc-'relations'-'functions'||jsonb_build_object('relations',(select jsonb_agg(rel-'columns'-'constraints'-'indexes'||jsonb_build_object("+
 mapField('columns',colWhere,'pos')+","+mapField('constraints',checkWhere,"item->>'name'")+","+mapField('indexes',indexWhere,"item->>'name'")+
 ") order by rel->>'nspname',rel->>'relname') from jsonb_array_elements(src.snapshot_doc->'relations') rel where not (rel->>'nspname'='public' and rel->>'relname'='exclusoes_de_dados')),"+
 "'functions',(select jsonb_agg(f order by f->>'schema',f->>'name',f->>'identity') from jsonb_array_elements(src.snapshot_doc->'functions') f where f->>'name' not in ('desautorizar_meta','apagar_dados_da_meta','status_da_exclusao'))) from(select "+expr+" snapshot_doc) src)";
}
export function deltaSql(expr) {
 const selectItems=(field,xs)=>"(select coalesce(jsonb_agg(jsonb_build_object('table',rel->>'relname','object',item) order by rel->>'relname',item->>'name'),'[]'::jsonb) from jsonb_array_elements(src.snapshot_doc->'relations') rel cross join lateral jsonb_array_elements(rel->'"+field+"') item where "+scoped('rel','item',xs)+")";
 return "(select jsonb_build_object('columns',"+selectItems('columns',M.columns)+",'checks',"+selectItems('constraints',M.checks)+",'indexes',"+selectItems('indexes',M.indexes)+",'table',(select rel from jsonb_array_elements(src.snapshot_doc->'relations') rel where rel->>'nspname'='public' and rel->>'relname'='exclusoes_de_dados'),'functions',(select coalesce(jsonb_agg(f order by f->>'schema',f->>'name',f->>'identity'),'[]'::jsonb) from jsonb_array_elements(src.snapshot_doc->'functions') f where f->>'name' in ('desautorizar_meta','apagar_dados_da_meta','status_da_exclusao'))) from(select "+expr+" snapshot_doc) src)";
}
export function normalize(s) {
 const out=structuredClone(s);
 out.relations=out.relations.filter(r=>!(r.nspname==='public'&&r.relname===M.table)).map(r=>{
  for(const [field,list] of [['columns',M.columns],['constraints',M.checks],['indexes',M.indexes]]) {
   r[field]=r[field]?.filter(v=>!list.some(([t,n])=>t===r.relname&&n===v.name))??null;
   if(r[field]?.length===0)r[field]=null;
  }return r;
 });
 out.functions=out.functions.filter(f=>!M.functions.includes(f.name));
 return out;
}
export function delta(s) {
 const items=(field,list)=>s.relations.flatMap(r=>(r[field]??[]).filter(x=>list.some(([t,n])=>t===r.relname&&n===x.name)).map(object=>({table:r.relname,object}))).sort((a,b)=>(a.table+':'+a.object.name).localeCompare(b.table+':'+b.object.name));
 return {columns:items('columns',M.columns),checks:items('constraints',M.checks),indexes:items('indexes',M.indexes),table:s.relations.find(r=>r.nspname==='public'&&r.relname===M.table)??null,functions:s.functions.filter(f=>M.functions.includes(f.name))};
}
export const baselineParents=canonicalParents(parents);
export function parentsSql(expr) {
 return "(select jsonb_agg(parent_entry order by parent_entry->>'nspname',parent_entry->>'relname') from jsonb_array_elements(("+expr+")->'relations') parent_entry where (parent_entry->>'nspname',parent_entry->>'relname') in(values "+parents.map(p=>"('"+p.nspname+"','"+p.relname+"')").join(',')+"))";
}
export const expectedParentNames=parents.map(p=>p.nspname+'.'+p.relname);
