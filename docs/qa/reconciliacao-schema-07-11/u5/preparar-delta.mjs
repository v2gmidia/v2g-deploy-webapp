import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const meta=JSON.parse(read('metadados-qa.json'));
const source=n=>read('../../../../supabase/migrations/'+n).replaceAll('\r\n','\n').replace(/^begin;\s*$/gmi,'').replace(/^commit;\s*$/gmi,'');
const fiscal=source('20261013060000_competencia_documento_fiscal.sql');
let evidence=source('20261022200400_manual_contract_evidence.sql');
const cpf=source('20261025215302_cpf_cnpj_contratante_v0.sql');
let historic=source('20261104040711_historical_contract_access.sql');
function patch(def,name){
 const old="p_cnpj !~ '^[0-9]{14}$'";assert.equal(def.split(old).length-1,1,'validacao medida '+name);
 def=def.replace(old,'not public.documento_contratante_valido(p_cnpj)');
 if(['registrar_pedido_pix_assistido','registrar_pedido_self_service','registrar_pedido_pix_assistido_com_lead'].includes(name)){
  const pattern=/select business_id into v_business_id from public\.commercial_orders\s+where buyer_email = v_email and cnpj = p_cnpj and business_id is not null\s+and status = 'payment_approved'\s+order by created_at desc limit 1;\s+if v_business_id is null then\s+(insert into public\.businesses\(name, claim_email\)\s+values \((v_name|v_legal_name), v_email\) returning id into v_business_id;)\s+end if;/;
  assert.ok(pattern.test(def),'fusao medida '+name);def=def.replace(pattern,'$1');
  def=def.replace('-- Uma compra adicional do mesmo comprador/CNPJ usa o negócio existente.','-- Nova referencia cria negocio distinto; documento nao funde negocios.');
 }
 def=def.replace('select * into v_existing from public.commercial_orders where external_ref = p_ref;',"perform pg_advisory_xact_lock(hashtextextended('commercial-order-ref:'||p_ref,0));\n  select * into v_existing from public.commercial_orders where external_ref = p_ref;");
 def=def.replace(/\bbegin\b/i,'begin\n  -- cpf_cnpj_v0: validacao e identidade por pedido; sem fusao por contato/documento.');
 return def;
}
const start=evidence.indexOf('create function public.registrar_evidencia_manual('),end=evidence.indexOf('create function public.revisar_evidencia_manual(');
assert.ok(start>=0&&end>start);evidence=evidence.slice(0,start)+patch(evidence.slice(start,end),'registrar_evidencia_manual')+evidence.slice(end);
const helpers=cpf.slice(cpf.indexOf('create or replace function public.documento_contratante_valido'),cpf.indexOf('do $tabelas$')).replaceAll('create or replace function','create function');
let ddl=fiscal+'\n'+helpers+'\n'+evidence;
for(const t of ['commercial_orders','onboarding_meetings','commercial_manual_evidence']){
 const col=t==='commercial_manual_evidence'?'claimed_cnpj':'cnpj';
 ddl+='\nalter table public.'+t+' drop constraint '+t+'_'+col+'_check;\nalter table public.'+t+' add constraint '+t+'_'+col+"_check check("+col+" ~ '^([0-9]{11}|[0-9]{14})$');\nalter table public."+t+' add column contractor_document_type text generated always as(case length('+col+") when 11 then 'cpf' when 14 then 'cnpj' end) stored;\ncreate trigger conferir_documento_contratante before insert or update of "+col+' on public.'+t+' for each row execute function public.conferir_documento_contratante_gravado(\''+col+'\');\ncomment on column public.'+t+'.'+col+" is 'CPF ou CNPJ do contratante, somente digitos; nome legado preservado. Tipo em contractor_document_type. Nao identifica o titular do cartao.';\n";
}
ddl+="comment on column public.commercial_orders.declares_cnpj is 'Confirmacao do documento informado pelo contratante (CPF ou CNPJ). Nome legado preservado; nao consulta cadastro.';\n";
for(const n of ['commercial_orders_one_open_direct_pix','commercial_orders_one_open_self_service','commercial_orders_one_open_assisted_asaas','onboarding_meetings_uma_ativa_por_cnpj'])ddl+='drop index public.'+n+';\n';
ddl+='create index commercial_orders_contratante_lookup on public.commercial_orders(lower(buyer_email),cnpj);\n';
for(const f of meta.definitions.filter(f=>f.name.startsWith('registrar_pedido_')))ddl+='\n'+patch(f.definition,f.name)+';\n';
const handle=meta.definitions.find(f=>f.name==='handle_new_user').definition;
assert.equal(handle.split('if new.email is not null then').length-1,1);
const nextHandle=handle.replace('if new.email is not null then',"if new.email is not null and (new.raw_user_meta_data ->> 'access_flow') is distinct from 'historical_contract' then");
const guardStart=historic.indexOf('do $guard$'),guardEnd=historic.indexOf('end $guard$;')+'end $guard$;'.length;
assert.ok(guardStart>=0&&guardEnd>guardStart);historic=historic.slice(0,guardStart)+nextHandle+';\n'+historic.slice(guardEnd);
ddl+='\n'+historic;
ddl+='\nrevoke all on public.fiscal_obligations from public,anon,authenticated,service_role;\ngrant select on public.fiscal_obligations to authenticated;\ngrant select,insert on public.fiscal_obligations to service_role;\nrevoke all on sequence public.historical_contract_access_events_id_seq from public,anon,authenticated,service_role;\n';
write('delta.sql',ddl);
const manifest={status:'PREPARACAO_LOCAL_EM_ANDAMENTO',project_id:'zskpijnqgkqwxksqmzmf',groups:[13,16,17,18],absentObjects:14,newTables:['fiscal_obligations','commercial_manual_evidence','historical_contract_access','historical_contract_access_events'],changedRelations:['commercial_orders','onboarding_meetings','fiscal_documents','users'],newFunctions:['documento_contratante_valido','conferir_documento_contratante_gravado','registrar_evidencia_manual','revisar_evidencia_manual','emitir_acesso_contratado','aceitar_acesso_contratado','revogar_acesso_contratado'],changedFunctions:['handle_new_user','registrar_pedido_pix_assistido','registrar_pedido_self_service','registrar_pedido_pix_assistido_com_lead','registrar_pedido_asaas_assistido'],applyName:'qa_reconciliacao_u5_documentos_acesso_historico_20261108',returnName:'qa_reconciliacao_u5_documentos_acesso_historico_retorno_20261108',ledger:{before:48,after:49,afterReturn:50},baselineU4:{version:'20261109000622',receiptSha256:'4e4f3cdf596b417ea637a85478a91f30922009d06b5ddfd294411e77bfd03dab'},metadataGap:[]};
write('manifesto.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({prepared:true,newTables:4,newFunctions:7,changedFunctions:5,missingCatalog:manifest.metadataGap}));
