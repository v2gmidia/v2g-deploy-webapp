// Preparacao exclusivamente local, baseada em fontes e recibo metadata-only aprovado.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {canonicalSqlOrders} from '../u3-ordenacao-acl-08-11/canonical.mjs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const raw=readFileSync('C:/Users/victo/.codex/private-backups/v2g/qa-schema/U3-20261108T112125Z/post.json');
const receipt=JSON.parse(raw);
write('baseline-u3.json',JSON.stringify({sourceSha256:createHash('sha256').update(raw).digest('hex'),snapshot:receipt.snapshot},null,2)+'\n');
const sql=n=>read('../../../../supabase/migrations/'+n).replaceAll('\r\n','\n');
const revops=sql('20261007160925_revops_v0.sql').replaceAll('create or replace function','create function');
const creative=sql('20261021001651_creative_generation_requests.sql');
const later=sql('20261026193000_referencia_publica_pedido_criativo.sql');
// Somente o CHECK final do pedido, nao as alteracoes de creative_review_requests (outra unidade).
const finalCheck=later.slice(later.indexOf('alter table public.creative_generation_requests\n  add constraint'),later.indexOf('alter table public.creative_review_requests'));
assert.ok(finalCheck.includes('creative_generation_requests_payload_check')&&finalCheck.includes('referenciaId'));
const start=creative.indexOf('  payload jsonb not null check ('),end=creative.indexOf("  status text not null",start);
let c=creative.slice(0,start)+'  payload jsonb not null,\n'+creative.slice(end);
c+='\n'+finalCheck;
const tables=['revops_people','revops_prospect_organizations','revops_opportunities','revops_opportunity_people','revops_source_references','revops_interactions','revops_interaction_opportunities','creative_generation_requests'];
// ACL nova explicita e fechada; evita herancas de defaults ampliando acesso.
const grants=tables.map(t=>'revoke all on public.'+t+' from public,anon,authenticated,service_role;').join('\n')+'\n'+tables.filter(t=>t!=='creative_generation_requests').map(t=>'grant select,insert,update,delete on public.'+t+' to service_role;').join('\n')+'\ngrant select on public.creative_generation_requests to authenticated;\ngrant insert(id,business_id,requested_by,content_hash,payload) on public.creative_generation_requests to authenticated;\n';
const rpcAcl='\ngrant select on public.creative_generation_requests to service_role;\nrevoke all on function public.revops_register_interest(text,text,text,text,text,text,text,text,timestamptz,text,text,uuid),public.revops_register_interaction(uuid,text,text,text,text,text,text,text,timestamptz,text,uuid) from public,anon,authenticated,service_role;\ngrant execute on function public.revops_register_interest(text,text,text,text,text,text,text,text,timestamptz,text,text,uuid),public.revops_register_interaction(uuid,text,text,text,text,text,text,text,timestamptz,text,uuid) to service_role;\n';
write('delta.sql',revops+'\n'+c+'\n'+grants+rpcAcl);
const M={status:'PREPARACAO_LOCAL_SEM_APLICACAO',project_id:'zskpijnqgkqwxksqmzmf',groups:[12,14],absentObjects:10,newTables:tables,functions:['revops_register_interest','revops_register_interaction'],columns:[],checks:[],constraints:[],indexes:[],helpers:[],applyName:'qa_reconciliacao_u4_revops_pedido_criativo_20261108',returnName:'qa_reconciliacao_u4_revops_pedido_criativo_retorno_20261108',ledger:{before:47,after:48,afterReturn:49},baselineU3:{version:'20261108113154',receiptSha256:createHash('sha256').update(raw).digest('hex')},sources:['20261007160925_revops_v0.sql','20261021001651_creative_generation_requests.sql','20261026193000_referencia_publica_pedido_criativo.sql:CHECK creative_generation_requests apenas']};
write('manifesto.json',JSON.stringify(M,null,2)+'\n');
// Captura de pais adicionais: apenas catalogos; nenhuma linha de cliente/Auth/Vault.
let s=read('../u3-ordenacao-acl-08-11/snapshot.sql');
s=s.replace("'divergencias_de_cadastro'))","'divergencias_de_cadastro','profiles','leads_lp','commercial_orders','"+tables.join("','")+"'))");
s=s.replace("'escrever_apenas_se_livre')) funcs)","'escrever_apenas_se_livre','revops_register_interest','revops_register_interaction')) funcs)");
s=s.replace("p.proname in('aplicar_proposta','escrever_apenas_se_livre')","p.proname in('aplicar_proposta','escrever_apenas_se_livre','revops_register_interest','revops_register_interaction')");
write('snapshot.sql',canonicalSqlOrders(s));
// Query pequena independente para metadados dos 3 pais FK adicionais.
write('capturar-pais.sql',canonicalSqlOrders(read('../u3-ordenacao-acl-08-11/snapshot.sql').split("'functions',")[0].replace("'relations',","'relations',").replace(/c\.relname in \([^]*?\)\) or\(n\.nspname='vault' and c\.relname='secrets'\)/,"c.relname in ('profiles','leads_lp','commercial_orders'))") .replace(/,\s*$/,'')+');\n'));
console.log(JSON.stringify({prepared:true,baselineLedger:receipt.snapshot.ledger.length,newTables:tables.length}));
