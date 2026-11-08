/** Porta de persistência em memória: não substitui a prova SQL das RPCs. */
export function adminMemoria(rows,rpc) {
  const writes=[];
  const admin={rpc,from(table){
    let filters=[],patch=null,kind='select',single=false;
    const q={select:()=>q,order:()=>q,limit:()=>q,eq:(k,v)=>{filters.push(r=>r[k]===v);return q;},
      is:(k,v)=>{filters.push(r=>r[k]===v);return q;},
      in:(k,v)=>{filters.push(r=>v.includes(r[k]));return q;},
      not:(k,_op,v)=>{filters.push(r=>r[k]!==v);return q;},
      gt:(k,v)=>{filters.push(r=>r[k]>v);return q;},lt:(k,v)=>{filters.push(r=>r[k]<v);return q;},
      update:values=>{kind='update';patch=values;return q;},
      delete:()=>{kind='delete';return q;},
      upsert:async values=>{writes.push([table,'upsert',values]);rows[table]=[values];return {error:null};},
      single:()=>{single=true;return q;},maybeSingle:()=>{single=true;return q;},
      then(resolve,reject){
        const found=(rows[table]??[]).filter(r=>filters.every(f=>f(r)));
        if(kind==='update'){writes.push([table,'update',patch]);found.forEach(r=>Object.assign(r,patch));}
        if(kind==='delete'){writes.push([table,'delete']);rows[table]=(rows[table]??[]).filter(r=>!found.includes(r));}
        const data=single?(found.length===1?{...found[0]}:null):found.map(r=>({...r}));
        return Promise.resolve({data,error:null,count:found.length}).then(resolve,reject);
      }};return q;
  }};return {admin,writes};
}
