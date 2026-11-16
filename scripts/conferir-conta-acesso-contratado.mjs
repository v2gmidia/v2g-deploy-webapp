import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const owner='00000000-0000-4000-8000-000000000001',business='00000000-0000-4000-8000-000000000004';
const connection='00000000-0000-4000-8000-000000000006',grant='00000000-0000-4000-8000-000000000009';
const email='titular@example.test',account='act_123456',page='123456';
const accepted={id:grant,business_id:business,recipient_email:email,accepted_by:owner,accepted_at:'2026-11-01',revoked_at:null};
function setup(options={}){
 const calls=[];const user=options.signedOut?null:{id:owner,email,email_confirmed_at:'2026-11-01'};
 const db={auth:{getUser:async()=>({data:{user},error:null})},from(table){
  const chain={select(){return chain;},eq(){return chain;},neq(){return chain;},limit(){return chain;},
   maybeSingle:async()=>({data:{id:connection,meta_page_id:page},error:null}),
   then(ok,bad){return Promise.resolve({data:[],error:null}).then(ok,bad);}};return chain;}};
 const admin={rpc:async(name,args)=>{calls.push({name,args});
  if(name==='obter_token_meta')return {data:'fixture-local-not-a-credential',error:null};
  if(name==='registrar_conta_contratada')return options.nativeSuccess?{data:connection,error:null}:{data:null,error:{message:options.nativeError??'negocio novo sem pedido aprovado'}};
  if(name==='registrar_conta_acesso_contratado')return options.historicalFailure?{data:null,error:{message:'acesso_contratado_nao_autorizado'}}:{data:connection,error:null};
  if(name==='registrar_conta_piloto_qa')return {data:connection,error:null};
  throw Error('unexpected RPC '+name);}};
 const {load}=ambienteTs({ports:{
  '@/lib/supabase/server':{createClient:async()=>db},
  '@/lib/supabase/admin':{createAdminClient:()=>admin},
  '@/lib/multiconta/ativo':{negocioAtivoDaSessao:async()=>({status:'selecionado',negocio:{id:business}})},
  '@/lib/meta/graph':{listarContasDeAnuncio:async()=>options.assetMissing?[]:[{externalId:account,elegivel:true,nome:'Cliente local',moeda:'BRL'}],listarPaginas:async()=>[{id:page}]},
  '@/lib/contratacao/acesso-contratado':{acessosContratadosDoPerfil:async()=>options.grants??[accepted]},
  '@/lib/piloto-qa/acesso':{acessosPilotoQa:async()=>options.qa?[{ad_account_external_id:account,meta_page_id:page}]:[]},
  'next/navigation':{redirect:p=>{throw Error('redirect:'+p);}},
 }});
 const form=new FormData();for(const [k,v]of Object.entries({conta:account,pagina:page,businessId:options.changedBusiness?'00000000-0000-4000-8000-000000000005':business}))form.set(k,v);
 return {calls,run:()=>load('app/(fluxo)/conectar/escolher/actions.ts').salvarEscolhaAction({},form)};
}
test('ação real: sessão + ativo Meta validado + concessão explícita, sem criar pagamento',async()=>{
 const s=setup();await assert.rejects(s.run(),/redirect:\/inicio/);
 assert.deepEqual(s.calls.map(c=>c.name),['obter_token_meta','registrar_conta_contratada','registrar_conta_acesso_contratado']);
 assert.equal(s.calls[2].args.p_access_id,grant);assert.equal(s.calls[2].args.p_profile_id,owner);
 assert.equal(s.calls[2].args.p_business_id,business);assert.equal(s.calls[2].args.p_external_id,account);assert.equal(s.calls[2].args.p_page_id,page);
});
test('ação real: sem sessão, troca de cliente ou ativo ausente não registra conta',async()=>{
 for(const options of [{signedOut:true},{changedBusiness:true},{assetMissing:true}]){
  const s=setup(options);assert.ok((await s.run()).erro);assert.equal(s.calls.some(c=>c.name.startsWith('registrar_conta')),false);
 }
});
test('ação real: contrato ausente, alheio, revogado ou ambíguo não libera fallback',async()=>{
 for(const grants of [[],[{...accepted,business_id:connection}],[{...accepted,accepted_by:connection}],[{...accepted,revoked_at:'2026-11-02'}],[accepted,accepted]]){
  const s=setup({grants});assert.ok((await s.run()).erro);assert.equal(s.calls.some(c=>c.name==='registrar_conta_acesso_contratado'),false);
 }
});
test('ação real: pedido pendente ou unidade indisponível preservam recusa financeira',async()=>{
 for(const nativeError of ['pedido ainda nao aprovado','sem unidade contratada disponivel']){
  const s=setup({nativeError});assert.ok((await s.run()).erro);assert.equal(s.calls.some(c=>c.name==='registrar_conta_acesso_contratado'),false);
 }
});
test('ação real: sucesso original não chama novo caminho, e recusa histórica não vaza erro cru',async()=>{
 const normal=setup({nativeSuccess:true});await assert.rejects(normal.run(),/redirect:\/inicio/);assert.equal(normal.calls.length,2);
 const denied=setup({historicalFailure:true});const result=await denied.run();assert.ok(result.erro);assert.equal(result.erro.includes('acesso_contratado_nao_autorizado'),false);
});
test('ação real: caminho QA exato continua separado da contratação histórica',async()=>{
 const s=setup({grants:[],qa:true});await assert.rejects(s.run(),/redirect:\/inicio/);
 assert.equal(s.calls.at(-1).name,'registrar_conta_piloto_qa');assert.equal(s.calls.some(c=>c.name==='registrar_conta_acesso_contratado'),false);
});
