// Offline: SQL real em PGlite, dados ficticios, Auth/Vault locais simulados.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {fixture,read,M,backend,canonical,baseline} from './fixture.mjs';
import {conferirRecibos} from './comparar-recibos.mjs';
import {temAutorizacaoRevOps} from '../../../../lib/revops/autorizacao.ts';
import {registrarPedidoDeImagem,hashDoPedido} from '../../../../lib/criativos/pedido-imagem.ts';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',UA='31111111-1111-4111-8111-111111111111',UB='32222222-2222-4222-8222-222222222222';
const report={local:true,remoteDDL:false,remoteBusinessRows:false,engine:'PGlite',auth:'UID local simulado; app_metadata testado em funcao pura',concurrency:'sequencial; sem prova multissessao',cases:[]};
const mark=n=>{report.cases.push(n);console.log('PASS '+n);};
function seals(){let n=0;for(const dir of ['../','../u2/','../u3/','../u3-ordenacao-acl-08-11/'])for(const line of read(dir+'SHA256SUMS.txt').trim().split(/\r?\n/)){const[h,f]=line.split('  ');assert.equal(createHash('sha256').update(readFileSync(new URL(dir+f,import.meta.url))).digest('hex'),h,dir+f);n++;}assert.equal(n,73);}
const protectedSourcePaths=['lib/revops/autorizacao.ts','lib/revops/sessao.ts','lib/revops/dados.ts','lib/revops/contrato.ts','app/(internal)/revops/actions.ts','lib/criativos/pedido-imagem.ts','lib/criativos/pedidos-da-sessao.ts','lib/criativos/geracao/imagem-privada.ts','lib/criativos/geracao/configuracao-app.ts','app/(protected)/criativos/geracao-actions.ts','app/(protected)/criativos/page.tsx'];
const sourceHashes=()=>Object.fromEntries(protectedSourcePaths.map(p=>[p,createHash('sha256').update(readFileSync(new URL('../../../../'+p,import.meta.url))).digest('hex')]));
const beforeSources=sourceHashes();
const receipt=async db=>(await db.query(read('u4-preflight.sql'))).rows[0].receipt;
async function managed(db,file,name,version,before=false){await db.transaction(async t=>{const add=()=>t.query('insert into supabase_migrations.schema_migrations values($1,$2)',[version,name]);if(before)await add();await t.exec(read(file));if(!before)await add();});}
const apply=db=>managed(db,'u4-aplicar.sql',M.applyName,'fixture-u4');
const undo=db=>managed(db,'u4-retornar.sql',M.returnName,'fixture-u4-return');
async function seed(db){await db.query('insert into auth.users(id) values($1),($2)',[UA,UB]);await db.query('insert into public.profiles(id) values($1),($2)',[UA,UB]);await db.query("insert into public.businesses(id,profile_id,name) values($1,$2,'FICTICIO A'),($3,$4,'FICTICIO B')",[A,UA,B,UB]);}
async function withDb(fn,applied=true){const db=await fixture();try{await seed(db);if(applied)await apply(db);await fn(db);}finally{await db.close();}}
const count=async(db,t)=>(await db.query('select count(*)::int n from public.'+t)).rows[0].n;
const rvCounts=async db=>Object.fromEntries(await Promise.all(M.newTables.filter(t=>t.startsWith('revops_')).map(async t=>[t,await count(db,t)])));
async function interest(db,source=A,extra={}){const p={source,person:'Pessoa FICTICIA',email:'QA@EXAMPLE.INVALID',phone:'0000000000',organization:'Empresa FICTICIA',channel:'whatsapp',kind:'human_report',summary:'Interesse declarado ficticio',at:'2026-11-08T00:00:00Z',next:'Conferir proposta',diagnostic:'guidance_needed',actor:UA,...extra};return(await db.query('select public.revops_register_interest($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) id',[p.source,p.person,p.email,p.phone,p.organization,p.channel,p.kind,p.summary,p.at,p.next,p.diagnostic,p.actor])).rows[0].id;}
async function interaction(db,opp,source=B,extra={}){const p={system:'whatsapp',source,channel:'whatsapp',author:'autor FICTICIO',type:'message',kind:'human_report',summary:'Mensagem FICTICIA',at:'2026-11-08T00:01:00Z',transcript:'not_applicable',actor:UA,...extra};return(await db.query('select public.revops_register_interaction($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) id',[opp,p.system,p.source,p.channel,p.author,p.type,p.kind,p.summary,p.at,p.transcript,p.actor])).rows[0].id;}
const payload=()=>({versao:1,objetivo:'Mensagens no WhatsApp',oferta:'Oferta FICTICIA',acao:'Fale com a equipe',promocao:false,validade:null});
async function insertCreative(db,p=payload(),extra={}){const r={id:randomUUID(),business:A,actor:UA,hash:hashDoPedido(p),...extra};await db.query('insert into public.creative_generation_requests(id,business_id,requested_by,content_hash,payload) values($1,$2,$3,$4,$5)',[r.id,r.business,r.actor,r.hash,p]);return r.id;}
const authA=async db=>{await db.query("select set_config('request.fixture_uid',$1,false)",[UA]);await db.exec('set role authenticated');};
seals();mark('73 selos anteriores intactos antes');
for(const file of ['snapshot.sql','u4-aplicar.sql','u4-retornar.sql','u4-conferir-pre.sql','u4-verificar.sql','u4-preflight.sql','u4-pos.sql']){
 assert.doesNotMatch(read(file),/->>'(?:version|name) collate/,'canonicalizador nao pode reescrever chave JSON: '+file);
}
await withDb(async db=>{
 const sql=read('u4-aplicar.sql');
 const expression=sql.match(/if (\(select jsonb_agg\(item order by[\s\S]*?\)) is distinct from /)?.[1];
 assert.ok(expression,'expressao real da guarda deve existir');
 assert.match(expression,/item->>'version' collate "C"/);assert.match(expression,/item->>'name' collate "C"/);
 const shuffled=structuredClone(baseline.snapshot.ledger).reverse();
 const evaluate=async ledger=>(await db.query('select '+expression+' actual from(select $1::jsonb s) fixture',[{ledger}])).rows[0].actual;
 assert.deepEqual(await evaluate(shuffled),canonical(baseline.snapshot.ledger,'ledger'));
 const changed=structuredClone(shuffled);changed[0].name='alterado';assert.notDeepEqual(await evaluate(changed),canonical(baseline.snapshot.ledger,'ledger'));
 mark('expressao SQL real ordena historico embaralhado, preserva chaves JSON e distingue adulteracao');
},false);
assert.match(read('delta.sql'),/referenciaId/);assert.doesNotMatch(read('delta.sql'),/alter table public\.creative_review_requests/);
for(const u of [null,undefined,{id:UA},{id:UA,app_metadata:{role:'operator'}},{id:UA,user_metadata:{autorizacoes:['revops']}},{id:UA,app_metadata:{autorizacoes:'revops'}}])assert.equal(temAutorizacaoRevOps(u),false);
assert.equal(temAutorizacaoRevOps({id:UA,app_metadata:{autorizacoes:['revops']}}),true);
mark('RevOps nominal falha fechado: operador/user_metadata nao autorizam');
await withDb(async db=>{const pre=await receipt(db);await db.exec(read('u4-conferir-pre.sql'));await apply(db);await db.exec(read('u4-verificar.sql'));const post=await receipt(db);assert.equal(conferirRecibos(pre,post).ok,true);await db.query("insert into public.businesses(name) values('posterior legado FICTICIO')");await undo(db);assert.equal(conferirRecibos(post,await receipt(db),'return').ok,true);assert.equal(await count(db,'businesses'),3);for(const t of backend)assert.equal(await count(db,t),1);mark('aplicacao/retorno, guardas readonly, pais/dados preservados, ledger 47/48/49 e recibo SQL=JS');},false);
await withDb(async db=>{const pre=await receipt(db);await managed(db,'u4-aplicar.sql',M.applyName,'fixture-before',true);const post=await receipt(db);assert.equal(conferirRecibos(pre,post).ok,true);await managed(db,'u4-retornar.sql',M.returnName,'fixture-return-before',true);assert.equal(conferirRecibos(post,await receipt(db),'return').ok,true);mark('canal com ledger nominal antes do corpo tambem aceito');},false);
await withDb(async db=>{
 await db.exec('set role service_role');const opp=await interest(db);const before=await rvCounts(db);assert.equal(await interest(db,A,{person:'OUTRA pessoa',organization:'OUTRA empresa',summary:'Divergente'}),opp);assert.deepEqual(await rvCounts(db),before);
 const person=(await db.query('select * from public.revops_people')).rows[0];assert.equal(person.display_name,'Pessoa FICTICIA');assert.equal(person.email,'qa@example.invalid');
 mark('interesse idempotente preserva primeiro conteudo e IDs sem reescrever/mesclar');
 const other=await interest(db,B);assert.notEqual(other,opp);assert.equal(await count(db,'revops_people'),2);assert.equal(await count(db,'revops_prospect_organizations'),2);
 assert.deepEqual((await db.query('select lead_lp_id,commercial_order_id,business_id from public.revops_opportunities')).rows,[{lead_lp_id:null,commercial_order_id:null,business_id:null},{lead_lp_id:null,commercial_order_id:null,business_id:null}]);
 mark('mesmo nome/email/telefone com fonte distinta cria registros separados; sem vinculo automatico');
 const inter=await interaction(db,opp,'evento-1');const beforeInteraction=await rvCounts(db);assert.equal(await interaction(db,opp,'evento-1',{summary:'OUTRO conteudo',author:'OUTRO autor'}),inter);assert.deepEqual(await rvCounts(db),beforeInteraction);
 const first=(await db.query('select i.summary,s.source_author from public.revops_interactions i join public.revops_source_references s on s.id=i.source_reference_id where i.id=$1',[inter])).rows[0];assert.equal(first.summary,'Mensagem FICTICIA');assert.equal(first.source_author,'autor FICTICIO');
 mark('interacao idempotente com replay divergente preserva primeira fonte/autor/resumo');
 assert.equal(await interaction(db,other,'evento-1'),inter);assert.equal((await db.query('select count(*)::int n from public.revops_interaction_opportunities where interaction_id=$1',[inter])).rows[0].n,2);assert.equal(await count(db,'revops_interactions'),3);
 mark('N:N explicita compartilha mesmo evento entre duas oportunidades sem duplicar fonte/evento');
 const state=await rvCounts(db);for(const type of ['payment_approved','campaign_live'])await assert.rejects(interaction(db,opp,'bloqueado-'+type,{type}),/confirmacao_exige/);assert.deepEqual(await rvCounts(db),state);
 mark('confirmacoes operacionais recusadas pelas RPCs sem criar fatos falsos');
 for(const extra of [{channel:'invalido'},{kind:'invalido'},{summary:'x'},{actor:'99999999-9999-4999-8999-999999999999'}]){const old=await rvCounts(db);await assert.rejects(interest(db,randomUUID(),extra));assert.deepEqual(await rvCounts(db),old);}
 await assert.rejects(interaction(db,'99999999-9999-4999-8999-999999999999','faltante'),/oportunidade_nao/);
 mark('falha tardia de interesse e oportunidade inexistente sao atomicas, sem pessoas/fontes orfas');
 const meeting=await interaction(db,opp,'meeting',{type:'meeting_held',transcript:'pending'});assert.ok(meeting);const old=await rvCounts(db);await assert.rejects(interaction(db,opp,'meeting-invalido',{type:'meeting_held'}),/revops_meeting_transcript/);assert.deepEqual(await rvCounts(db),old);
 mark('reuniao exige estado de transcricao e falha atomica preserva contagens');
 const inf=await interaction(db,opp,'inference',{kind:'inference'});assert.equal((await db.query('select human_review_status from public.revops_interactions where id=$1',[inf])).rows[0].human_review_status,'pending');
 await assert.rejects(db.query("update public.revops_interactions set human_review_status='confirmed' where id=$1",[inf]),/revops_human_review_has_audit/);
 await db.query("update public.revops_interactions set human_review_status='confirmed',reviewed_by=$2,reviewed_at=now() where id=$1",[inf,UA]);
 await assert.rejects(db.query("update public.revops_interactions set human_review_status='not_applicable',reviewed_by=null,reviewed_at=null where id=$1",[inf]),/revops_inference_requires_review/);
 mark('inferencia nasce pendente e revisao exige autoria/data coerentes');
 const without=await interest(db,randomUUID(),{next:''});assert.equal((await db.query('select unknown_state from public.revops_opportunities where id=$1',[without])).rows[0].unknown_state,'proximo_passo_nao_informado');
 await assert.rejects(db.query("update public.revops_opportunities set population='cliente' where id=$1",[opp]),/check constraint/);await assert.rejects(db.query("update public.revops_opportunities set stage='inventado' where id=$1",[opp]),/check constraint/);
 mark('populacao comercial/stages limitados; proximo passo ausente explicitado');
 await assert.rejects(db.query('update public.revops_opportunities set business_id=$2 where id=$1',[opp,A]),/revops_links_have_proof/);
 await db.query("update public.revops_opportunities set business_id=$2,linked_by=$3,linked_at=now(),link_evidence='Conferencia FICTICIA explicita' where id=$1",[opp,A,UA]);
 assert.equal((await db.query('select business_id from public.revops_opportunities where id=$1',[other])).rows[0].business_id,null);
 for(const field of ['lead_lp_id','commercial_order_id'])await assert.rejects(db.query('update public.revops_opportunities set '+field+'=$2 where id=$1',[opp,field==='lead_lp_id'?'987654321':'99999999-9999-4999-8999-999999999999']),/foreign key/);
 mark('vinculo exige prova e FK existente; alterar A nao altera outra oportunidade');
 await db.query("update public.revops_opportunities set link_evidence='' where id=$1",[opp]);
 assert.equal((await db.query('select link_evidence from public.revops_opportunities where id=$1',[opp])).rows[0].link_evidence,'');
 const orderId=randomUUID();await db.query("insert into public.commercial_orders(id,external_ref,buyer_email,business_id,legal_name,cnpj,declares_cnpj,sells_by_whatsapp,origin,payment_method,billing_period,unit_price_cents,discount_percent,unit_count,total_cents) values($1,$2,'qa@example.invalid',$3,'Empresa FICTICIA','00000000000000',true,true,'self_service','asaas_pix','monthly',50000,0,1,50000)",[orderId,'pedido-FICTICIO-'+orderId,B]);
 await db.query('update public.revops_opportunities set commercial_order_id=$2 where id=$1',[opp,orderId]);
 assert.equal((await db.query('select business_id from public.revops_opportunities where id=$1',[opp])).rows[0].business_id,A);
 mark('limite da fonte: prova vazia e pedido de outro negocio passam FKs; sem atestar coerencia comercial');
 await db.exec('reset role');await authA(db);
 for(const t of M.newTables.filter(t=>t.startsWith('revops_')))await assert.rejects(db.query('select * from public.'+t),/permission denied/);
 await assert.rejects(interest(db),/permission denied/);await assert.rejects(interaction(db,opp,'cliente'),/permission denied/);
 await db.exec('reset role;set role anon');await assert.rejects(interest(db),/permission denied/);await assert.rejects(db.query('select * from public.revops_people'),/permission denied/);await db.exec('reset role');
 mark('RLS/ACL RevOps negam clientes/anon e RPC direta, inclusive com negocio proprio');
});
await withDb(async db=>{
 await authA(db);const id=await insertCreative(db);const row=(await db.query('select * from public.creative_generation_requests')).rows[0];assert.equal(row.status,'awaiting_configuration');assert.ok(row.created_at);assert.equal(row.id,id);
 mark('pedido criativo proprio aceita INSERT cinco colunas e defaults de estado/data');
 await assert.rejects(db.query("insert into public.creative_generation_requests(id,business_id,requested_by,content_hash,payload,status) values($1,$2,$3,$4,$5,'awaiting_configuration')",[randomUUID(),A,UA,'a'.repeat(64),payload()]),/permission denied/);
 await assert.rejects(db.query('insert into public.creative_generation_requests(id,business_id,requested_by,content_hash,payload,created_at) values($1,$2,$3,$4,$5,now())',[randomUUID(),A,UA,'a'.repeat(64),payload()]),/permission denied/);
 await assert.rejects(db.exec("update public.creative_generation_requests set status='awaiting_configuration'"),/permission denied/);await assert.rejects(db.exec('delete from public.creative_generation_requests'),/permission denied/);
 mark('imutabilidade cliente: sem estado/data fornecidos, UPDATE/DELETE negados');
 await assert.rejects(insertCreative(db,payload(),{business:B}),/row-level security/);await assert.rejects(insertCreative(db,payload(),{actor:UB}),/row-level security/);
 await db.exec('reset role');await db.query("select set_config('request.fixture_uid',$1,false)",[UB]);await db.exec('set role authenticated');assert.equal(await count(db,'creative_generation_requests'),0);await insertCreative(db,payload(),{business:B,actor:UB});await db.exec('reset role');await authA(db);assert.equal(await count(db,'creative_generation_requests'),1);
 mark('RLS criativo isola A/B e recusa autoria/negocio forjados');
 const v2={...payload(),versao:2,referenciaId:'700155112131034'};await insertCreative(db,v2);
 const check=(await db.query("select pg_get_constraintdef(oid) def from pg_constraint where conrelid='public.creative_generation_requests'::regclass and conname='creative_generation_requests_payload_check'")).rows;
 assert.equal(check.length,1);assert.match(check[0].def,/referenciaId/);await assert.rejects(insertCreative(db,{}),/payload_check/);
 for(const p of [{...v2,referenciaId:'https://externo.invalid/imagem.png'},{...v2,referenciaId:123},{...v2,referenciaId:undefined},{...v2,versao:3}])await assert.rejects(insertCreative(db,p),/payload_check/);
 mark('CHECK final preserva V1/V2 e recusa referencia URL/tipo/ID ou versao invalidos');
 for(const p of [{...payload(),objetivo:'x'},{...payload(),oferta:'x'.repeat(501)},{...payload(),acao:'x'.repeat(201)},{...payload(),promocao:'sim'},{...payload(),validade:'2027-01-01'},{...payload(),promocao:true,validade:null},{...payload(),extra:'x'.repeat(9000)}])await assert.rejects(insertCreative(db,p),/payload_check/);
 await assert.rejects(insertCreative(db,payload(),{hash:'invalido'}),/content_hash_check/);
 mark('limites payload/bytes/promocao/formato hash recusam entradas malformadas');
 await db.exec('reset role');await assert.rejects(insertCreative(db,payload(),{business:'99999999-9999-4999-8999-999999999999'}),/foreign key/);await assert.rejects(insertCreative(db,payload(),{actor:'99999999-9999-4999-8999-999999999999'}),/foreign key/);
 await assert.rejects(db.exec("update public.creative_generation_requests set status='generated'"),/status_check/);
 mark('FK negocio/perfil e estado fixo negam registros ou resultados de geracao inventados');
 const total=await count(db,'creative_generation_requests');await db.exec('set role service_role');assert.equal(await count(db,'creative_generation_requests'),total);await assert.rejects(insertCreative(db),/permission denied/);await assert.rejects(db.exec("update public.creative_generation_requests set status='awaiting_configuration'"),/permission denied/);await assert.rejects(db.exec('delete from public.creative_generation_requests'),/permission denied/);await assert.rejects(db.exec('truncate public.creative_generation_requests'),/permission denied/);
 const privileges=(await db.query("select has_table_privilege(current_user,'public.creative_generation_requests','MAINTAIN') maintain,has_table_privilege(current_user,'public.creative_generation_requests','SELECT WITH GRANT OPTION') grant_option")).rows[0];assert.deepEqual(privileges,{maintain:false,grant_option:false});
 await db.exec('reset role;set role anon');await assert.rejects(db.query('select * from public.creative_generation_requests'),/permission denied/);await assert.rejects(insertCreative(db),/permission denied/);await db.exec('reset role');
 mark('pedido criativo: service SELECT positivo, demais DML/MAINTAIN/grant option e anon negados');
});
await withDb(async db=>{
 await authA(db);
 const repo={async buscar(id,business){return(await db.query('select * from public.creative_generation_requests where id=$1 and business_id=$2',[id,business])).rows[0]??null;},async inserir(p){try{await db.query('insert into public.creative_generation_requests(id,business_id,requested_by,content_hash,payload) values($1,$2,$3,$4,$5)',[p.id,p.business_id,p.requested_by,p.content_hash,p.payload]);return 'criado';}catch(e){if(e.code==='23505')return 'conflito';throw e;}}};
 const entrada={habilitado:true,id:randomUUID(),negocioEsperado:A,...payload(),confirmado:true};const portas={sessao:async()=>({profileId:UA,businessId:A}),repositorio:repo,hoje:'2026-11-08'};
 assert.equal((await registrarPedidoDeImagem({...entrada,habilitado:false},{...portas,sessao:async()=>{throw Error('nao deve consultar');}})).motivo,'indisponivel');assert.equal(await count(db,'creative_generation_requests'),0);
 mark('flag OFF no contrato real nao consulta sessao/banco nem guarda pedido');
 assert.equal((await registrarPedidoDeImagem({...entrada,confirmado:false},portas)).motivo,'confirmacao_ausente');assert.equal((await registrarPedidoDeImagem({...entrada,negocioEsperado:B},portas)).motivo,'negocio_mudou');
 const first=await registrarPedidoDeImagem(entrada,portas);assert.deepEqual(first,{ok:true,id:entrada.id,repetido:false});assert.deepEqual(await registrarPedidoDeImagem(entrada,portas),{ok:true,id:entrada.id,repetido:true});assert.equal((await registrarPedidoDeImagem({...entrada,oferta:'Outra oferta'},portas)).motivo,'envio_alterado');assert.equal(await count(db,'creative_generation_requests'),1);
 mark('contrato real + SQL: request key idempotente, rejeita replay alterado e negocio mudado');
 assert.equal((await registrarPedidoDeImagem({...entrada,id:randomUUID(),promocao:true,validade:'2026-02-31'},portas)).motivo,'prazo_invalido');assert.equal((await registrarPedidoDeImagem({...entrada,id:randomUUID(),promocao:true,validade:'2020-01-01'},portas)).motivo,'prazo_invalido');
 const v2=await registrarPedidoDeImagem({...entrada,id:randomUUID(),referenciaId:'700155112131034',referenciasHabilitadas:true},portas);assert.equal(v2.ok,true);
 mark('contrato real valida calendario/prazo e referencia catalogada V2 sem gerar imagem');
 await db.exec('reset role');await db.query("select set_config('request.fixture_uid',$1,false)",[UB]);await db.exec('set role authenticated');
 const cross=await registrarPedidoDeImagem({...entrada,negocioEsperado:B},{...portas,sessao:async()=>({profileId:UB,businessId:B})});assert.equal(cross.motivo,'envio_alterado');assert.equal(await count(db,'creative_generation_requests'),0);
 mark('request key de outro negocio nao revela/substitui pedido existente nem cria duplicado');
 await db.exec('reset role');
 // Limites da fonte medidos, nao ocultados: DB so confere formato de hash e data.
 await insertCreative(db,{...payload(),promocao:true,validade:'2026-99-99'},{hash:'b'.repeat(64)});
 mark('limite medido: SQL nao recalcula hash nem valida calendario; contrato faz validacao adicional');
});
for(const change of ['grant update on public.execucoes to service_role','grant maintain on public.execucoes to service_role','grant select on public.execucoes to service_role with grant option','grant select(id) on public.execucoes to service_role with grant option',"grant execute on function public.escrever_apenas_se_livre(uuid,text,jsonb,text,text,uuid) to authenticated",'alter table public.profiles add column drift text','create role intruso_u4;alter default privileges grant execute on functions to intruso_u4'])await withDb(async db=>{await db.exec(change);const pre=await receipt(db);await assert.rejects(apply(db));assert.deepEqual(await receipt(db),pre);},false);
mark('drift pais/helpers/U3/ACL/backend/defaults aborta atomicamente');
for(const field of ['name','version'])await withDb(async db=>{const row=(await db.query('select version from supabase_migrations.schema_migrations order by version limit 1')).rows[0];await db.query('update supabase_migrations.schema_migrations set '+field+'=$1 where version=$2',['alterado-fixture-'+field,row.version]);const pre=await receipt(db);await assert.rejects(apply(db),/historico anterior version\/name/);assert.deepEqual(await receipt(db),pre);},false);
mark('troca de nome ou versao antiga com mesma contagem recusa antes do DDL');
await withDb(async db=>{await db.query('insert into supabase_migrations.schema_migrations values($1,$2)',['fixture-preexistente',M.applyName]);const pre=await receipt(db);await assert.rejects(db.exec(read('u4-conferir-pre.sql')),/historico PRE/);await db.exec('rollback');assert.deepEqual(await receipt(db),pre);mark('guarda readonly anterior recusa entrada U4 preexistente sem normalizar historico');},false);
await withDb(async db=>{await db.exec('alter table public.execucoes add column legitima text;alter table public.commercial_order_units add column legitima text');const pre=await receipt(db);await apply(db);const post=await receipt(db);assert.equal(conferirRecibos(pre,post).ok,true);await undo(db);assert.equal(conferirRecibos(post,await receipt(db),'return').ok,true);mark('backend/commercial_order_units com colunas legitimas extras aceitos e preservados');},false);
for(const change of ['create index posterior_u4 on public.revops_people(email)',"alter table public.creative_generation_requests add constraint posterior_u4 check(status='awaiting_configuration')",'create view public.posterior_u4 as select * from public.revops_people','create table public.posterior_u4(id uuid references public.revops_people(id))'])await withDb(async db=>{await db.exec(change);const pre=await receipt(db);await assert.rejects(undo(db));assert.deepEqual(await receipt(db),pre);});
mark('retorno recusa indice/CHECK/view posteriores sem CASCADE ou perda');
await withDb(async db=>{await interest(db);const pre=await receipt(db);await assert.rejects(undo(db),/dados posteriores/);assert.deepEqual(await receipt(db),pre);mark('retorno recusa registros RevOps posteriores');});
await withDb(async db=>{await insertCreative(db);const pre=await receipt(db);await assert.rejects(undo(db),/dados posteriores/);assert.deepEqual(await receipt(db),pre);mark('retorno recusa pedido criativo posterior');});
await withDb(async db=>{const pre=await receipt(db);await apply(db);const post=await receipt(db);const shuffle=x=>Array.isArray(x)?x.map(shuffle):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).map(([k,v])=>[k,['acl','table_acl','column_acl','roles'].includes(k)&&Array.isArray(v)?v.map(shuffle).reverse():shuffle(v)])):x;assert.equal(conferirRecibos(shuffle(pre),shuffle(post)).ok,true);const bad=structuredClone(post);bad.snapshot.functions.find(f=>f.name==='revops_register_interest').acl.push({role:'intruso',privilege:'EXECUTE',grantable:false});assert.throws(()=>conferirRecibos(pre,bad));mark('ACL equivalente reordenada aceita; grant extra no recibo recusado');},false);
assert.deepEqual(sourceHashes(),beforeSources);seals();mark('73 selos e consumidores/runtime inalterados depois');
report.ok=true;report.passed=report.cases.length;report.sourceHashes=beforeSources;
writeFileSync(new URL('resultado-ensaio.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:true,passed:report.passed,remoteDDL:false}));
