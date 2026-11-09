import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),write=(n,s)=>writeFileSync(new URL(n,import.meta.url),s);
const measured=JSON.parse(read('metadados-qa.json'));
const source=n=>read('../../../../supabase/migrations/'+n).replaceAll('\r\n','\n').replace(/^begin;\s*$/gmi,'').replace(/^commit;\s*$/gmi,'');
const risk=source('20261022152629_asaas_estados_processamento.sql'),ready=source('20261105194728_public_checkout_production_readiness.sql').replace('create or replace function','create function');
const names=['registrar_evento_financeiro_asaas','registrar_evento_financeiro_comercial','registrar_evento_inicial_3ds','registrar_evento_inicial_3ds_comercial','reservar_assinatura_apos_3ds','aprovar_pagamento_api_comercial','aprovar_pagamento_api_self_service'];
const predicate=/e[.]event_type not in\s*\('PAYMENT_CREATED',\s*'PAYMENT_UPDATED',\s*'PAYMENT_CONFIRMED',\s*'PAYMENT_RECEIVED'\)/g;
const replaceExact=(s,a,b,label)=>{assert.ok(s.includes(a),label);return s.replaceAll(a,b);};
function patch(f){
 let s=f.definition;
 if(f.name.includes('inicial_3ds')||f.name.includes('reservar_assinatura')||f.name==='aprovar_pagamento_api_comercial'){
  assert.equal([...s.matchAll(predicate)].length,1,'predicado medido '+f.name);s=s.replace(predicate,'public.evento_asaas_impede_confirmacao(e.event_type)');
 }
 if(f.name.startsWith('registrar_evento')){
  assert.equal(s.split("'PAYMENT_CREATED'").length-1,1,'whitelist medida '+f.name);
  s=s.replace("'PAYMENT_CREATED'","'PAYMENT_AWAITING_RISK_ANALYSIS','PAYMENT_APPROVED_BY_RISK_ANALYSIS','PAYMENT_REPROVED_BY_RISK_ANALYSIS','PAYMENT_AUTHORIZED','PAYMENT_CREATED'");
 }
 if(f.name.includes('inicial_3ds')){
  s=replaceExact(s,"if p_event_type = 'PAYMENT_CONFIRMED' and","if p_event_type in ('PAYMENT_CONFIRMED','PAYMENT_RECEIVED') and",'aprovacao '+f.name);
  s=replaceExact(s,"p_event_id,'PAYMENT_CONFIRMED'",'p_event_id,p_event_type','evento '+f.name);
 }else if(f.name.includes('reservar_assinatura'))s=replaceExact(s,"e.event_type = 'PAYMENT_CONFIRMED'","e.event_type in ('PAYMENT_CONFIRMED','PAYMENT_RECEIVED')",'reserva '+f.name);
 else if(f.name==='aprovar_pagamento_api_self_service')s=replaceExact(s,'  select order_id into v_event_order from public.commercial_events',"\n  if exists(select 1 from public.commercial_payment_events e\n      where e.order_id=p_order_id and e.provider_charge_id=p_charge_id\n        and public.evento_asaas_impede_confirmacao(e.event_type)) then return false; end if;\n  select order_id into v_event_order from public.commercial_events",'guarda self service');
 assert.notEqual(s,f.definition);return s+';\n';
}
const prefix=risk.slice(risk.indexOf('create function public.evento_asaas_impede_confirmacao'),risk.indexOf('-- Ajustes cirurgicos'));
assert.ok(prefix.includes('add constraint commercial_payment_events_event_type_check'));
const defs=names.map(n=>{const f=measured.definitions.find(f=>f.name===n);assert.ok(f,'definicao medida '+n);return patch(f);});
write('delta.sql',prefix+'\n'+defs.join('\n')+'\n'+ready);
const manifest={status:'PREPARACAO_LOCAL_EM_ANDAMENTO',project_id:'zskpijnqgkqwxksqmzmf',groups:[15,19],absentNames:2,newFunctions:['evento_asaas_impede_confirmacao','checkout_producao_schema_v1'],changedFunctions:names,changedRelations:['businesses','commercial_orders','commercial_order_units','commercial_events','commercial_payment_events','commercial_payment_email_outbox','checkout_3ds_context','checkout_security_attempts'],applyName:'qa_reconciliacao_u6_eventos_readiness_20261108',returnName:'qa_reconciliacao_u6_eventos_readiness_retorno_20261108',ledger:{before:49,after:50,afterReturn:51},baselineU5:{version:'20261109012806',receiptSha256:'bb77c660bdb8ede4ae13852a2d50a00be0939247412376597818aa3e26196a6e'}};
write('manifesto.json',JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({prepared:true,changedFunctions:7,newFunctions:2,grantTargets:8}));
