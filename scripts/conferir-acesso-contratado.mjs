import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const id='11111111-1111-4111-8111-111111111111',business='22222222-2222-4222-8222-222222222222';
const user={id:'perfil-fixture',email:'cliente@example.invalid',email_confirmed_at:'2026-11-01',app_metadata:{},user_metadata:{}};
const grant={id,business_id:business,recipient_email:user.email,contractor_document:'00000000191',accepted_by:user.id,accepted_at:'2026-11-01',revoked_at:null};
function database(tables,errors=[]) {
 return {from(table){let filters=[],single=false,start=0,end=Infinity,max=Infinity;
  const q={select(){return q;},eq(k,v){filters.push(r=>r[k]===v);return q;},is(k,v){filters.push(r=>r[k]===v);return q;},
   not(k,_op,v){filters.push(r=>r[k]!==v);return q;},in(k,vs){filters.push(r=>vs.includes(r[k]));return q;},order(){return q;},
   range(a,b){start=a;end=b;return q;},limit(n){max=n;return q;},maybeSingle(){single=true;return q;},
   then(ok,bad){const rows=(tables[table]??[]).filter(r=>filters.every(f=>f(r))).slice(start,Math.min(end+1,start+max));
    return Promise.resolve({data:errors.includes(table)?null:single?(rows[0]??null):rows,error:errors.includes(table)?{code:'missing'}:null}).then(ok,bad);}};
  return q;}};
}
const load=(env={},ports={})=>ambienteTs({env,ports}).load;
const enabled={V2G_HISTORICAL_ACCESS_ENABLED:'true'};
test('portao real: concessao aceita + propriedade; negacao por revogacao/email/perfil/confirmacao',async()=>{
 const access=load(enabled)('lib/contratacao/acesso.ts').temAcessoWebApp;
 const tables=g=>({historical_contract_access:[g],businesses:[{id:business,profile_id:user.id}]});
 assert.equal(await access(database(tables(grant)),user),true);
 for(const g of [{...grant,revoked_at:'2026-11-02'},{...grant,accepted_at:null},{...grant,accepted_by:'terceiro'},
  {...grant,recipient_email:'outro@example.invalid'}]) assert.equal(await access(database(tables(g)),user),false);
 assert.equal(await access(database(tables(grant)),{...user,email_confirmed_at:null}),false);
 assert.equal(await access(database({...tables(grant),businesses:[{id:business,profile_id:'terceiro'}]}),user),false);
 assert.equal(await access(database(tables(grant),['historical_contract_access']),user),false);
 assert.equal(await load()('lib/contratacao/acesso.ts').temAcessoWebApp(database(tables(grant)),user),false);
});
test('seletor real: mesma pessoa, dois negocios; liberar um nao libera o outro',()=>{
 const select=load()('lib/multiconta/elegibilidade.ts').negociosLiberados;
 const negocios=[{id:business,name:'A',created_at:'2026-11-01'}, {id:'outro-negocio',name:'B',created_at:'2026-11-01'}];
 const input={negocios,pedidos:[],perfilId:user.id,emailVerificado:user.email,legadoEm:null,operador:false,acessosContratados:[grant]};
 assert.deepEqual(Array.from(select(input),n=>n.id),[business]);
 assert.equal(select({...input,acessosContratados:[{...grant,revoked_at:'2026-11-02'}]}).length,0);
 assert.equal(select({...input,emailVerificado:null}).length,0);
 assert.equal(select({...input,perfilId:'terceiro'}).length,0);
});
test('pre-cadastro real: ID explicito, documento, email, validade e negocio sem reivindicacao',async()=>{
 const check=load(enabled)('lib/contratacao/cadastro-contratado.ts').permiteCadastroContratado;
 const invitation={...grant,accepted_by:null,accept_before:'2099-01-01'};
 const tables=g=>({historical_contract_access:[g],businesses:[{id:business,profile_id:null,claim_email:null}]});
 assert.equal(await check(database(tables(invitation)),id,user.email,'00000000191'),true);
 assert.equal(await check(database(tables(invitation)),id,user.email,'11222333000181'),false);
 assert.equal(await check(database(tables(invitation)),id,'outra@example.invalid','00000000191'),false);
 assert.equal(await check(database(tables({...invitation,accept_before:'2020-01-01'})),id,user.email,'00000000191'),false);
 assert.equal(await check(database({...tables(invitation),businesses:[{id:business,profile_id:null,claim_email:user.email}]}),id,user.email,'00000000191'),false);
});
test('signup real com convite permite criar conta sem pedido e marca apenas recusa de vinculo automatico',async()=>{
 const calls=[];
 const admin=database({historical_contract_access:[{...grant,accepted_by:null,accept_before:'2099-01-01'}],businesses:[{id:business,profile_id:null,claim_email:null}]});
 const s={auth:{signUp:async payload=>{calls.push(payload);return {data:{session:null},error:null};}}};
 const act=load({...enabled,NEXT_PUBLIC_SITE_URL:'https://qa.example.invalid'},{
  '@/lib/supabase/server':{createClient:async()=>s},'@/lib/supabase/admin':{createAdminClient:()=>admin},
  'next/navigation':{redirect:()=>{throw Error('unexpected redirect');}},
 })('app/(public)/entrar/actions.ts').signUpAction;
 const form=new FormData();for(const [k,v] of Object.entries({nome:'Fixture',whatsapp:'11999990000',email:user.email,cnpj:'00000000191',senha:'Fixture!2026abc',confirmarSenha:'Fixture!2026abc',next:`/acesso-contratado/${id}`}))form.set(k,v);
 assert.ok((await act({},form)).message);assert.equal(calls.length,1);
 assert.equal(calls[0].options.data.access_flow,'historical_contract');
 form.set('email','outro@example.invalid');assert.ok((await act({},form)).message);assert.equal(calls.length,1);
});
test('aceite action real: usa RPC da sessao; nao usa admin, pedido, perfil fornecido ou ID de negocio',async()=>{
 let result=false;const calls=[];
 const act=load(enabled,{
  '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})},rpc:async(name,args)=>{calls.push({name,args});return {data:result,error:null};}})},
  'next/cache':{revalidatePath:()=>{}},'next/navigation':{redirect:path=>{throw Error('redirect:'+path);}},
 })('app/(public)/acesso-contratado/[id]/actions.ts').aceitarAcessoContratado;
 const form=new FormData();form.set('id',id);form.set('business_id','terceiro');form.set('profile_id','terceiro');
 assert.ok((await act({},form)).erro);result=true;await assert.rejects(act({},form),/redirect:\/escolher-negocio/);
 assert.deepEqual(calls.map(c=>c.name),['aceitar_acesso_contratado','aceitar_acesso_contratado']);
 assert.equal(JSON.stringify(calls[0].args),JSON.stringify({p_id:id}));
});
test('marcador de cadastro historico nao concede acesso nem invoca associacao por email',async()=>{
 let adminCalls=0;
 const fn=load(enabled,{'@/lib/supabase/admin':{createAdminClient:()=>{adminCalls++;throw Error('associacao automatica');}}})('lib/contratacao/vincular.ts').vincularComprasAprovadas;
 await fn({...user,user_metadata:{access_flow:'historical_contract'}});assert.equal(adminCalls,0);
});
test('resumo do negocio so aparece ao destinatario confirmado do ID explicito',async()=>{
 const fn=load(enabled)('lib/contratacao/cadastro-contratado.ts').resumoAcessoContratado;
 const db=database({historical_contract_access:[{...grant,accept_before:'2099-01-01'}],businesses:[{id:business,name:'Negocio exato',profile_id:user.id,claim_email:null}]});
 assert.equal((await fn(db,id,user)).nome,'Negocio exato');
 assert.equal(await fn(db,id,{...user,email:'terceiro@example.invalid'}),null);
 assert.equal(await fn(db,id,{...user,email_confirmed_at:null}),null);
});
test('emissao action real usa operador autenticado; user_metadata e falta de conferencia nao autorizam',async()=>{
 const calls=[];let current={...user,user_metadata:{papel:'operador'}};
 const action=load(enabled,{
  '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:current},error:null})}})},
  '@/lib/supabase/admin':{createAdminClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return {data:id,error:null};}})},
 })('app/(protected)/pedidos/acesso-contratado/actions.ts').decidirAcessoContratado;
 const f=new FormData();for(const [k,v] of Object.entries({modo:'emitir',id,note:'Conferencia ficticia autorizada',confirmed:'yes'})) f.set(k,v);
 assert.ok((await action({},f)).erro);assert.equal(calls.length,0);
 current={...user,app_metadata:{papel:'operador'}};
 assert.equal((await action({},f)).caminho,`/acesso-contratado/${id}`);
 assert.equal(calls[0].name,'emitir_acesso_contratado');assert.equal(calls[0].args.p_operator_id,user.id);
 f.delete('confirmed');assert.ok((await action({},f)).erro);assert.equal(calls.length,1);
});
