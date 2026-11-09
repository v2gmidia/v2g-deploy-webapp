// Provas offline com dados ficticios. Nenhum cliente Auth/HTTP, segredo ou rede.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {fixture,read,measured,baseline,backend,canonical} from './fixture.mjs';
import {M,deltaSql} from './modelo.mjs';
import {conferirRecibos} from './comparar-recibos.mjs';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',UA='31111111-1111-4111-8111-111111111111',UB='32222222-2222-4222-8222-222222222222',OP='41111111-1111-4111-8111-111111111111',OP2='42222222-2222-4222-8222-222222222222';
const CPF='00000000191',CNPJ='11222333000181';
const report={local:true,remoteDDL:false,auth:'auth.uid/handle e estrutura medidos; JWT/confirmacao simulados localmente, sem Auth real',concurrency:'sequencial, sem certificacao multissessao',cases:[]};
const mark=n=>{report.cases.push(n);console.log('PASS '+n);};
const sha=p=>createHash('sha256').update(readFileSync(new URL(p,import.meta.url))).digest('hex');
function seals(){let n=0;for(const dir of ['../','../u2/','../u3/','../u3-ordenacao-acl-08-11/','../u4/'])for(const line of read(dir+'SHA256SUMS.txt').trim().split(/\r?\n/)){const[h,f]=line.split('  ');assert.equal(sha(dir+f),h,dir+f);n++;}assert.equal(n,97);}
const paths=['app/(protected)/pedidos/evidencias-actions.ts','app/(protected)/pedidos/acesso-contratado/actions.ts','app/(public)/acesso-contratado/[id]/actions.ts','app/(public)/acesso-contratado/[id]/page.tsx'];
const sourceHashes=()=>Object.fromEntries(paths.map(p=>[p,sha('../../../../'+p)]));
const sourcesBefore=sourceHashes();
const receipt=async db=>(await db.query(read('u5-preflight.sql'))).rows[0].receipt;
async function managed(db,file,name,version,before=false){await db.transaction(async t=>{const add=()=>t.query('insert into supabase_migrations.schema_migrations values($1,$2)',[version,name]);if(before)await add();await t.exec(read(file));if(!before)await add();});}
const apply=db=>managed(db,'u5-aplicar.sql',M.applyName,'fixture-u5');
const undo=db=>managed(db,'u5-retornar.sql',M.returnName,'fixture-u5-return');
const row=async(db,q,args=[])=>(await db.query(q,args)).rows[0];
const scalar=async(db,q,args=[])=>Object.values(await row(db,q,args))[0];
async function seed(db){
 for(const [id,email,op] of [[UA,'clientea@example.invalid',false],[UB,'clienteb@example.invalid',false],[OP,'operador@example.invalid',true],[OP2,'operador2@example.invalid',true]])await db.query('insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values($1,$2,now(),$3,$4)',[id,email,op?{papel:'operador'}:{},{}]);
 await db.query("insert into public.businesses(id,name,profile_id) values($1,'FICTICIO A',null),($2,'FICTICIO B',$3)",[A,B,UB]);
 await db.query('insert into public.manager_accounts(business_id,operator_profile_id,assigned_by) values($1,$2,$2),($3,$4,$4)',[A,OP,B,OP2]);
}
async function withDb(fn,applied=true){const db=await fixture();try{await seed(db);if(applied)await apply(db);await fn(db);}finally{await db.close();}}
async function session(db,uid){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid??'']);await db.exec('set role authenticated');}
async function order(db,business=A,doc=CNPJ,profile=UA){return await scalar(db,"insert into public.commercial_orders(external_ref,buyer_email,buyer_profile_id,business_id,legal_name,cnpj,declares_cnpj,sells_by_whatsapp,origin,payment_method,billing_period,unit_price_cents,discount_percent,unit_count,total_cents) values($1,$2,$3,$4,'Negocio FICTICIO',$5,true,true,'self_service','asaas_card','monthly',50000,0,1,50000) returning id",[randomUUID(),profile===UB?'clienteb@example.invalid':'clientea@example.invalid',profile,business,doc]);}
async function evidence(db,{id=randomUUID(),business=A,ord=null,profile=null,email='clientea@example.invalid',doc=CNPJ,source='historical_contract',ref='ref-'+randomUUID(),date='2026-01-01',op=OP}={}){return await scalar(db,'select public.registrar_evidencia_manual($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[id,business,ord,profile,email,doc,source,ref,date,op]);}
async function review(db,id,{business=A,op=OP,status='checked',note='Conferencia FICTICIA completa',identity=true,source=true}={}){return await scalar(db,'select public.revisar_evidencia_manual($1,$2,$3,$4,$5,$6,$7)',[id,business,op,status,note,identity,source]);}
async function issue(db,e,{id=randomUUID(),op=OP,note='Concessao FICTICIA conferida'}={}){return await scalar(db,'select public.emitir_acesso_contratado($1,$2,$3,$4)',[id,e,op,note]);}
async function accept(db,id){return await scalar(db,'select public.aceitar_acesso_contratado($1)',[id]);}
async function revoke(db,id,{op=OP,note='Revogacao FICTICIA conferida'}={}){return await scalar(db,'select public.revogar_acesso_contratado($1,$2,$3)',[id,op,note]);}
async function self(db,doc=CPF,ref=randomUUID()){return await scalar(db,"select public.registrar_pedido_self_service($1,'comprador@example.invalid','Pessoa Ficticia','11999990000','Negocio FICTICIO',$2,1,'monthly','asaas_card')",[ref,doc]);}
const tableRows=async(db,t)=>Number(await scalar(db,'select count(*) from public.'+t));
seals();mark('97 selos U1-U4 intactos antes');
for(const file of ['snapshot.sql','u5-aplicar.sql','u5-retornar.sql','u5-conferir-pre.sql','u5-verificar.sql','u5-preflight.sql','u5-pos.sql'])assert.doesNotMatch(read(file),/->>'(?:version|name) collate/);
await withDb(async db=>{
 const post=await receipt(db),seq=post.snapshot.sequences[0];
 for(const k of ['start','increment','min','max','cache'])assert.equal(typeof seq[k],'string');
 assert.equal(seq.max,'9223372036854775807');
 assert.equal(await scalar(db,'select ('+deltaSql('$1::jsonb')+")->'sequences'->0->>'max'",[post.snapshot]),'9223372036854775807');
 const near='9223372036854775806';assert.equal(Number(near),Number(seq.max));
 await db.exec('alter sequence public.historical_contract_access_events_id_seq maxvalue '+near);const changed=await receipt(db);assert.equal(changed.snapshot.sequences[0].max,near);
 await assert.rejects(undo(db),/delta\/corpos\/ACL\/triggers\/geracao/);assert.deepEqual(await receipt(db),changed);
 mark('sequencia bigint usa texto exato no SQL e recusa maximo diferente mesmo se Number arredonda igual');
});
await withDb(async db=>{
 const pre=await receipt(db);await db.exec(read('u5-conferir-pre.sql'));await apply(db);await db.exec(read('u5-verificar.sql'));const post=await receipt(db);assert.equal(conferirRecibos(pre,post).ok,true);await undo(db);const returned=await receipt(db);assert.equal(conferirRecibos(post,returned,'return').ok,true);
 for(const f of measured.definitions.filter(f=>M.changedFunctions.includes(f.name)))assert.equal(await scalar(db,'select pg_get_functiondef(p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname=$1 and p.proname=$2 and pg_get_function_identity_arguments(p.oid)=$3',[f.schema,f.name,f.identity]),f.definition);
 assert.equal(await tableRows(db,'businesses'),2);assert.equal(await tableRows(db,'profiles'),4);for(const t of backend)assert.equal(await tableRows(db,t),1);
 mark('aplicacao/retorno exatos: corpos/Auth restaurados, dados legados e ledger 48/49/50 preservados');
},false);
await withDb(async db=>{const pre=await receipt(db);await managed(db,'u5-aplicar.sql',M.applyName,'fixture-before',true);const post=await receipt(db);assert.equal(conferirRecibos(pre,post).ok,true);await managed(db,'u5-retornar.sql',M.returnName,'fixture-before-return',true);assert.equal(conferirRecibos(post,await receipt(db),'return').ok,true);mark('canal pode registrar entrada nominal antes ou depois do corpo');},false);
await withDb(async db=>{
 const oA=await order(db),oB=await order(db,B,CNPJ,UB);const legacyDoc=await scalar(db,"insert into public.fiscal_documents(order_id,provider,status) values($1,'asaas','pending') returning id",[oA]);
 const pre=await receipt(db);await apply(db);assert.equal(await scalar(db,'select obligation_id from public.fiscal_documents where id=$1',[legacyDoc]),null);assert.equal(conferirRecibos(pre,await receipt(db)).ok,true);
 await db.exec('set role service_role');const f=await scalar(db,"insert into public.fiscal_obligations(order_id,competence_month,document_kind,amount_cents) values($1,'2026-11-01','service',50000) returning id",[oA]);
 await assert.rejects(db.query("insert into public.fiscal_obligations(order_id,competence_month,document_kind,amount_cents) values($1,'2026-11-01','service',50000)",[oA]),/unique/);
 for(const [month,kind,amount] of [['2026-11-02','service',50000],['2026-11-01','produto',50000],['2026-11-01','service',0]])await assert.rejects(db.query('insert into public.fiscal_obligations(order_id,competence_month,document_kind,amount_cents) values($1,$2,$3,$4)',[oB,month,kind,amount]),/check constraint/);
 await assert.rejects(db.query("insert into public.fiscal_documents(order_id,provider,obligation_id) values($1,'asaas',$2)",[oB,f]),/foreign key/);
 await db.query("insert into public.fiscal_documents(order_id,provider,obligation_id,status,authorized_at) values($1,'asaas',$2,'authorized',now())",[oA,f]);
 await assert.rejects(db.query("insert into public.fiscal_documents(order_id,provider,obligation_id,status,authorized_at) values($1,'asaas',$2,'authorized',now())",[oA,f]),/unique/);
 await db.query("insert into public.fiscal_documents(order_id,provider,obligation_id,status) values($1,'asaas',$2,'rejected'),($1,'asaas',$2,'cancelled')",[oA,f]);
 mark('competencia unica, mes/valor/tipo, FK composta e NFS-e autorizada unica; rejeitada/cancelada nao duplica obrigacao');
 await assert.rejects(db.exec('update public.fiscal_obligations set amount_cents=1'),/permission denied/);await assert.rejects(db.exec('delete from public.fiscal_obligations'),/permission denied/);
 assert.deepEqual(await row(db,"select has_table_privilege(current_user,'public.fiscal_obligations','MAINTAIN') maintain,has_table_privilege(current_user,'public.fiscal_obligations','SELECT WITH GRANT OPTION') select_grant,has_table_privilege(current_user,'public.fiscal_obligations','INSERT WITH GRANT OPTION') insert_grant"),{maintain:false,select_grant:false,insert_grant:false});
 await session(db,UA);assert.equal(await tableRows(db,'fiscal_obligations'),1);await assert.rejects(db.query("insert into public.fiscal_obligations(order_id,competence_month,document_kind,amount_cents) values($1,'2026-12-01','service',1)",[oA]),/permission denied/);
 await session(db,UB);assert.equal(await tableRows(db,'fiscal_obligations'),0);await db.exec('reset role;set role anon');await assert.rejects(db.query('select * from public.fiscal_obligations'),/permission denied/);await db.exec('reset role');
 mark('fiscal: comprador proprio le, outro/anon nao; servico SELECT+INSERT sem UPDATE/DELETE');
 const before=await receipt(db);await assert.rejects(undo(db),/tabela usada|obrigacao vinculada/);assert.deepEqual(await receipt(db),before);mark('retorno fiscal recusa obrigacao usada e preserva estado');
},false);
await withDb(async db=>{
 await db.exec('set role service_role');for(const d of [CPF,CNPJ])assert.equal(await scalar(db,'select public.documento_contratante_valido($1)',[d]),true);for(const d of [null,'00000000000','00000000000000','00000000192','11222333000182','000.000.001-91','x'+CPF])assert.equal(await scalar(db,'select public.documento_contratante_valido($1)',[d]),false);
 const ref=randomUUID(),o=await self(db,CPF,ref);assert.equal(await self(db,CPF,ref),o);await assert.rejects(self(db,CNPJ,ref),/referencia ja utilizada/);const o2=await self(db,CPF);assert.notEqual(await scalar(db,'select business_id from public.commercial_orders where id=$1',[o]),await scalar(db,'select business_id from public.commercial_orders where id=$1',[o2]));
 assert.equal(await scalar(db,'select contractor_document_type from public.commercial_orders where id=$1',[o]),'cpf');assert.equal(await tableRows(db,'commercial_order_units'),2);
 const direct=await scalar(db,"select public.registrar_pedido_pix_assistido($1,'pix@example.invalid','Pix FICTICIO',$2,1,'monthly')",[randomUUID(),CPF]);assert.equal(await scalar(db,'select contractor_document_type from public.commercial_orders where id=$1',[direct]),'cpf');
 const assisted=await scalar(db,"select public.registrar_pedido_asaas_assistido($1,null,'asaas@example.invalid','11999990000','Pessoa Ficticia','Asaas FICTICIO',$2,1,'monthly','asaas_card',$3)",[randomUUID(),CPF,OP]);assert.equal(await scalar(db,'select contractor_document_type from public.commercial_orders where id=$1',[assisted]),'cpf');
 mark('checksum CPF/CNPJ, retry por referencia e tres portas comerciais preservam negocios separados/units reais');
 for(const doc of [null,'00000000192'])await assert.rejects(db.query('update public.commercial_orders set cnpj=$2,legal_name=$3 where id=$1',[o,doc,'Outra razao']),/documento_contratante_invalido/);
 await assert.rejects(db.query("update public.commercial_orders set contractor_document_type='cnpj' where id=$1",[o]),/generated|DEFAULT/);
 const b=await scalar(db,'select business_id from public.commercial_orders where id=$1',[o]);
 await db.query("insert into public.onboarding_meetings(business_id,order_id,cnpj,calendar_id,starts_at,ends_at,status) values($1,$2,$3,'fixture','2027-01-01T10:00Z','2027-01-01T10:25Z','pending')",[b,o,CPF]);
 await assert.rejects(db.query("update public.onboarding_meetings set cnpj=null,google_event_id='outro' where business_id=$1",[b]),/documento_contratante_invalido/);
 await db.exec('reset role');await session(db,UA);await assert.rejects(db.query('select public.documento_contratante_valido($1)',[CPF]),/permission denied/);await assert.rejects(self(db,CPF),/permission denied/);await db.exec('reset role');
 mark('NULL/documento invalido em UPDATE multicoluna recusados; generated imutavel e validador/RPC negados ao cliente');
 const before=await receipt(db);await assert.rejects(undo(db),/CPF aceito/);assert.deepEqual(await receipt(db),before);mark('retorno recusa CPF aceito sem apagar pedido ou agenda');
});
await withDb(async db=>{
 const invalid=await order(db,A,'12345678901234');await apply(db);await db.query('update public.commercial_orders set legal_name=$2 where id=$1',[invalid,'Legado mantido']);await db.query('update public.commercial_orders set cnpj=cnpj,legal_name=$2 where id=$1',[invalid,'Legado mantido novamente']);assert.equal(await scalar(db,'select cnpj from public.commercial_orders where id=$1',[invalid]),'12345678901234');await assert.rejects(db.query('update public.commercial_orders set cnpj=$2 where id=$1',[invalid,'12345678901235']),/documento_contratante_invalido/);mark('CNPJ legado sem checksum permanece inalterado; nova alteracao documental exige checksum');
},false);
await withDb(async db=>{
 await db.exec('set role service_role');const args={id:randomUUID(),doc:CPF,ref:'documento-'+randomUUID()};const id=await evidence(db,args);assert.equal(await evidence(db,args),id);assert.equal(await scalar(db,'select contractor_document_type from public.commercial_manual_evidence where id=$1',[id]),'cpf');
 assert.equal(await review(db,id,{identity:false}),false);assert.equal(await review(db,id,{source:null}),false);assert.equal(await review(db,id,{business:B}),false);assert.equal(await review(db,id,{op:OP2}),false);assert.equal(await review(db,id),true);assert.equal(await review(db,id),true);assert.equal(await review(db,id,{note:'Outra conferencia FICTICIA'}),false);
 await assert.rejects(evidence(db,{...args,email:'outro@example.invalid'}),/evidencia_duplicada_divergente/);await assert.rejects(evidence(db,{business:B,op:OP,profile:UB,email:'clienteb@example.invalid'}),/carteira_nao_autorizada/);
 assert.equal(await scalar(db,'select profile_id from public.businesses where id=$1',[A]),null);assert.equal(await tableRows(db,'commercial_orders'),0);assert.equal(await tableRows(db,'commercial_events'),0);
 await db.exec('reset role');await assert.rejects(db.query("update public.commercial_manual_evidence set claimed_cnpj=null,review_note='Outra nota FICTICIA' where id=$1",[id]),/documento_contratante_invalido/);await db.exec('set role service_role');
 mark('evidencia/revisao idempotentes, carteira e flags exigidas, sem pagamento/pedido/acesso automatico');
 await assert.rejects(db.query("update public.commercial_manual_evidence set claimed_email='outro@example.invalid' where id=$1",[id]),/permission denied/);await assert.rejects(db.query('delete from public.commercial_manual_evidence where id=$1',[id]),/permission denied/);
 await session(db,UA);await assert.rejects(db.query('select * from public.commercial_manual_evidence'),/permission denied/);await assert.rejects(evidence(db),/permission denied/);await db.exec('reset role;set role anon');await assert.rejects(db.query('select * from public.commercial_manual_evidence'),/permission denied/);await db.exec('reset role');
 mark('evidencia: servico so colunas previstas, sem DELETE/reidentificar; clientes/anon negados');
});
await withDb(async db=>{
 const ord=await order(db);await db.exec('set role service_role');const id=await evidence(db,{ord,doc:CNPJ,profile:UA,source:'direct_pix'});assert.equal(await review(db,id),true);
 const old=await scalar(db,'select status from public.commercial_orders where id=$1',[ord]);assert.equal(old,'awaiting_payment');await assert.rejects(evidence(db,{ord,business:B,op:OP2,profile:UB,email:'clienteb@example.invalid'}),/pedido_divergente|identidade_divergente/);
 const e2=await evidence(db,{ord,doc:CNPJ,profile:UA,source:'direct_pix'});await db.query("insert into public.commercial_payment_events(provider_event_id,order_id,provider_charge_id,due_date,event_type,amount_cents) values('fixture-refund',$1,'pay_fixture','2026-01-01','PAYMENT_REFUNDED',50000)",[ord]);await db.query("update public.commercial_orders set provider_charge_id='pay_fixture' where id=$1",[ord]);assert.equal(await review(db,e2),false);await db.exec('reset role');
 mark('evidencia com pedido verifica identidade exata e evento financeiro negativo, sem promover pagamento');
});
await withDb(async db=>{
 await db.exec('set role service_role');const e=await evidence(db,{doc:CPF});await assert.rejects(issue(db,e),/contratacao_nao_conferida/);assert.equal(await review(db,e),true);
 await assert.rejects(issue(db,e,{op:UA}),/concessao_nao_autorizada/);await assert.rejects(issue(db,e,{op:OP2}),/carteira_nao_autorizada/);
 const g=await issue(db,e);assert.equal(await issue(db,e),g);await assert.rejects(issue(db,e,{note:'Concessao divergente FICTICIA'}),/reenvio_divergente/);
 await assert.rejects(db.query("update public.historical_contract_access set issue_note='Forjado FICTICIO' where id=$1",[g]),/permission denied/);await assert.rejects(db.query("insert into public.historical_contract_access_events(access_id,kind,actor_id) values($1,'accepted',$2)",[g,UA]),/permission denied/);
 assert.equal(await scalar(db,'select profile_id from public.businesses where id=$1',[A]),null);await assert.rejects(accept(db,g),/permission denied/);
 mark('emissao exige conferida/historical, operador em app_metadata e carteira; emitir nao vincula dono');
 await session(db,UA);assert.equal(await tableRows(db,'historical_contract_access'),0);await assert.rejects(db.query('select * from public.historical_contract_access_events'),/permission denied/);await assert.rejects(issue(db,e),/permission denied/);
 await session(db,UB);assert.equal(await accept(db,g),false);await session(db,null);assert.equal(await accept(db,g),false);
 await session(db,UA);assert.equal(await accept(db,g),true);assert.equal(await accept(db,g),true);assert.equal(await scalar(db,'select profile_id from public.businesses where id=$1',[A]),UA);assert.equal(await tableRows(db,'historical_contract_access'),1);
 await db.exec('reset role');assert.equal(await scalar(db,"select count(*)::int from public.historical_contract_access_events where access_id=$1 and kind='accepted'",[g]),1);assert.equal(await tableRows(db,'commercial_orders'),0);assert.equal(await scalar(db,'select profile_id from public.businesses where id=$1',[B]),UB);
 mark('aceite por ID+email confirmado/UID correto; RLS nao enumera convite e retry nao duplica evento');
 const before=await receipt(db);await assert.rejects(undo(db),/tabela usada/);assert.deepEqual(await receipt(db),before);
 await db.exec('set role service_role');assert.equal(await revoke(db,g,{op:OP2}),false);assert.equal(await revoke(db,g),true);assert.equal(await revoke(db,g),true);assert.equal(await revoke(db,g,{note:'Outra revogacao FICTICIA'}),false);assert.equal(await scalar(db,'select profile_id from public.businesses where id=$1',[A]),null);
 await session(db,UA);assert.equal(await accept(db,g),false);assert.equal(await tableRows(db,'historical_contract_access'),0);await db.exec('reset role');
 mark('revogacao auditada/idempotente remove so dono introduzido; concessao usada impede retorno mesmo revogada');
});
await withDb(async db=>{
 await db.exec('set role service_role');const e=await evidence(db,{profile:UA,doc:CNPJ});assert.equal(await review(db,e),true);await db.exec('reset role');await db.query('update public.businesses set profile_id=$2 where id=$1',[A,UA]);await db.exec('set role service_role');const g=await issue(db,e);await session(db,UA);assert.equal(await accept(db,g),true);await db.exec('reset role;set role service_role');assert.equal(await revoke(db,g),true);assert.equal(await scalar(db,'select profile_id from public.businesses where id=$1',[A]),UA);await db.exec('reset role');
 mark('revogacao preserva dono preexistente');
});
await withDb(async db=>{
 await db.exec('set role service_role');const e=await evidence(db);assert.equal(await review(db,e),true);const g=await issue(db,e);await session(db,UA);assert.equal(await accept(db,g),true);await db.exec('reset role');await order(db,A,CNPJ,UA);await db.exec('set role service_role');assert.equal(await revoke(db,g),true);assert.equal(await scalar(db,'select profile_id from public.businesses where id=$1',[A]),UA);await db.exec('reset role');
 mark('revogacao preserva vinculo apoiado por pedido independente posterior');
});
for(const mode of ['expired','unconfirmed','evidence_changed','business_changed','commercial_order'])await withDb(async db=>{
 await db.exec('set role service_role');const e=await evidence(db);assert.equal(await review(db,e),true);const g=await issue(db,e);await db.exec('reset role');
 if(mode==='expired')await db.query("update public.historical_contract_access set accept_before=now()-interval '1 day' where id=$1",[g]);
 if(mode==='unconfirmed')await db.query('update auth.users set email_confirmed_at=null where id=$1',[UA]);
 if(mode==='evidence_changed')await db.query("update public.commercial_manual_evidence set status='rejected',review_note='Mudou a conferencia' where id=$1",[e]);
 if(mode==='business_changed')await db.query('update public.businesses set profile_id=$2 where id=$1',[A,UB]);
 if(mode==='commercial_order')await order(db);
 const beforeOwner=await scalar(db,'select profile_id from public.businesses where id=$1',[A]);await session(db,UA);assert.equal(await accept(db,g),false);await db.exec('reset role');assert.equal(await scalar(db,'select profile_id from public.businesses where id=$1',[A]),beforeOwner);assert.equal(await scalar(db,"select count(*)::int from public.historical_contract_access_events where access_id=$1 and kind='accepted'",[g]),0);
});mark('aceite falha fechado com expiracao, email nao confirmado, evidencia/dono alterados ou pedido independente');
await withDb(async db=>{
 const id=randomUUID(),email='novo-historico@example.invalid';await db.query('update public.businesses set claim_email=$2 where id=$1',[A,email]);await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[id,email,{access_flow:'historical_contract'}]);assert.equal(await scalar(db,'select profile_id from public.businesses where id=$1',[A]),null);assert.equal(await scalar(db,'select count(*)::int from public.profiles where id=$1',[id]),1);
 const other=randomUUID(),business=randomUUID();await db.query("insert into public.businesses(id,name,claim_email) values($1,'Outro FICTICIO','normal@example.invalid')",[business]);await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,'normal@example.invalid','{}')",[other]);assert.equal(await scalar(db,'select profile_id from public.businesses where id=$1',[business]),other);
 await undo(db);assert.equal(await scalar(db,'select profile_id from public.businesses where id=$1',[A]),null);assert.equal(await scalar(db,'select count(*)::int from public.profiles where id=$1',[id]),1);
 mark('trigger Auth real cria perfil, marcador so nega claim automatico; retorno nao refaz efeitos passados');
});
const driftCases=[
 "create or replace function private.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$begin if new.email is not null then perform 1;end if;return new;end$$",
 "create or replace function public.registrar_pedido_pix_assistido(p_ref text,p_email text,p_legal_name text,p_cnpj text,p_unit_count integer,p_billing_period text) returns uuid language plpgsql set search_path='' as $$begin -- cpf_cnpj_v0\n return null;end$$",
 'drop index public.commercial_orders_one_open_self_service;create unique index commercial_orders_one_open_self_service on public.commercial_orders(external_ref)',
 'alter table public.commercial_orders add column contractor_document_type text',
 "alter table public.onboarding_meetings add column contractor_document_type text generated always as ('cpf'::text) stored",
 'grant update on public.execucoes to service_role',
 'grant select(id) on public.execucoes to service_role with grant option',
 'create role intruso_u5;alter default privileges grant execute on functions to intruso_u5'
];
for(const change of driftCases)await withDb(async db=>{await db.exec(change);const pre=await receipt(db);await assert.rejects(apply(db));assert.deepEqual(await receipt(db),pre);},false);
mark('guardas completas recusam Auth adulterado mantendo frase, marcador falso, indice homonimo, coluna comum/geracao errada e ACL/defaults');
await withDb(async db=>{
 const def=await scalar(db,"select pg_get_functiondef('public.escrever_apenas_se_livre(uuid,text,jsonb,text,text,uuid)'::regprocedure)");
 const changed=def.replace('DEFAULT NULL::uuid',"DEFAULT '99999999-9999-4999-8999-999999999999'::uuid");assert.notEqual(changed,def);await db.exec(changed);const pre=await receipt(db);
 await assert.rejects(db.exec(read('u5-conferir-pre.sql')),/pais\/helpers/);await db.exec('rollback');assert.deepEqual(await receipt(db),pre);
 await assert.rejects(apply(db),/pais\/helpers/);assert.deepEqual(await receipt(db),pre);
 mark('default antigo alterado sem mudar corpo/identity/ACL e recusado no PRE e no DO');
},false);
for(const field of ['name','version'])await withDb(async db=>{const v=await scalar(db,'select version from supabase_migrations.schema_migrations order by version limit 1');await db.query('update supabase_migrations.schema_migrations set '+field+'=$1 where version=$2',['alterado-'+field,v]);const pre=await receipt(db);await assert.rejects(apply(db),/historico anterior/);assert.deepEqual(await receipt(db),pre);},false);
mark('historico alterado com mesma contagem recusa antes do delta');
await withDb(async db=>{
 const expression=read('u5-aplicar.sql').match(/if (\(select jsonb_agg\(item order by[\s\S]*?\)) is distinct from /)[1];assert.deepEqual(await scalar(db,'select '+expression+' from(select $1::jsonb s) fixture',[{ledger:structuredClone(baseline.snapshot.ledger).reverse()}]),canonical(baseline.snapshot.ledger,'ledger'));mark('expressao real compara 48 pares embaralhados com chaves JSON integras');
},false);
await withDb(async db=>{await db.exec('alter table public.execucoes add column extra_legitima text');const pre=await receipt(db);await apply(db);const post=await receipt(db);assert.equal(conferirRecibos(pre,post).ok,true);await undo(db);assert.equal(conferirRecibos(post,await receipt(db),'return').ok,true);mark('backend com extras legitimos preservado sem congelar stub');},false);
await withDb(async db=>{await self(db,CNPJ);await self(db,CNPJ);const pre=await receipt(db);await assert.rejects(undo(db),/duplicatas agora permitidas/);assert.deepEqual(await receipt(db),pre);mark('retorno recusa duplicatas CNPJ agora permitidas, sem apagar pedidos');});
for(const change of ['create index posterior_u5 on public.historical_contract_access(recipient_email)',"alter table public.commercial_orders add constraint posterior_u5 check(contractor_document_type in('cpf','cnpj'))",'create view public.posterior_u5 as select contractor_document_type from public.commercial_orders','create table public.posterior_u5(id uuid references public.fiscal_obligations(id))'])await withDb(async db=>{await db.exec(change);const pre=await receipt(db);await assert.rejects(undo(db));assert.deepEqual(await receipt(db),pre);});
mark('retorno recusa indice/CHECK/view/FK posteriores, sem CASCADE ou perda');
await withDb(async db=>{const pre=await receipt(db);await apply(db);const post=await receipt(db);const shuffle=x=>Array.isArray(x)?x.map(shuffle):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,['acl','table_acl','column_acl','roles'].includes(k)&&Array.isArray(v)?v.map(shuffle).reverse():shuffle(v)])):x;assert.equal(conferirRecibos(shuffle(pre),shuffle(post)).ok,true);const bad=structuredClone(post);bad.delta.functions[0].body_md5='adulterado';assert.throws(()=>conferirRecibos(pre,bad));mark('ACL equivalente reordenada aceita, corpo/hash no recibo adulterado recusado');},false);
assert.deepEqual(sourceHashes(),sourcesBefore);seals();mark('97 selos e consumers/runtime intactos depois');
report.ok=true;report.passed=report.cases.length;report.sourceHashes=sourcesBefore;writeFileSync(new URL('resultado-ensaio.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:true,passed:report.passed,remoteDDL:false}));
