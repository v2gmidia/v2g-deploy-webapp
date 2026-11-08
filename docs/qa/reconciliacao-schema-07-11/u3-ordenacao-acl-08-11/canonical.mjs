// Ordenacao binaria ASCII/C somente de listas de metadados, nunca corpos SQL ou grants.
export const cmp=(a,b)=>a<b?-1:a>b?1:0;
const keys={relations:['nspname','relname'],functions:['schema','name','identity'],u3_function_details:['name'],table_acl:['role','privilege','grantor'],column_acl:['column','role','privilege'],acl:['role','privilege'],constraints:['name'],indexes:['name'],triggers:['name'],policies:['name'],ledger:['version','name']};
export function canonical(value,key=''){
 if(Array.isArray(value)){
  const a=value.map(v=>canonical(v));
  if(key==='roles')a.sort(cmp);
  else if(keys[key])a.sort((x,y)=>{for(const k of keys[key]){const c=cmp(x[k]??'',y[k]??'');if(c)return c;}return 0;});
  return a;
 }
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,canonical(v,k)]));
 return value;
}
// Todas as expressoes textuais usadas nos ORDER BY desta captura/modelo.
// Numeros/ordinalidade (attnum, oid, pos) permanecem sem COLLATE.
export function canonicalSqlOrders(sql){
 return sql.replace(/order by ([\s\S]*?)(?=\) from| from | for update|;|$)/gi,(_whole,clause)=>{
  const held=[];
  clause=clause.replace(/case when (?:a\.grantee|x)=0 then 'PUBLIC' else (?:a\.grantee|x)::regrole::text end(?: collate "C")?/g,s=>{held.push(s.replace(/ collate "C"$/,'')+' collate "C"');return '@@C'+(held.length-1)+'@@';});
  clause=clause.replace(/(?:\b(?:obj|f|rel|parent_entry|item)->>'[^']+'|\b[a-z]+\.(?:grantor)::regrole::text|\bk\.conrelid::regclass::text|\b[a-z]+\.(?:privilege_type|conname|attname|polname|tgname|relname|proname)|\bversion\b|\bname\b)(?: collate "C")?/g,s=>s.replace(/ collate "C"$/,'')+' collate "C"');
  clause=clause.replace(/@@C(\d+)@@/g,(_m,i)=>held[Number(i)]);
  return 'order by '+clause;
 });
}
