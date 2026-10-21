/** Homologacao HTTPS real, somente QA nomeado e fixtures criadas nesta rodada. */
import assert from 'node:assert/strict';
import { randomUUID,randomBytes,createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {encodeReply}=require('next/dist/compiled/react-server-dom-webpack/client.node');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(url,'https://zskpijnqgkqwxksqmzmf.supabase.co');
const app='https://v2g-webapp-qa.vercel.app';
const admin=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const run=randomUUID(),password=randomBytes(30).toString('base64url'),users=[],clients=[],businesses=[],requests=[];
const checks=[];
const pass=(name)=>{checks.push(name);console.log('PASS '+name);};
async function actor(label,operator=false){
  const email=`e28-${label}-${run}@example.invalid`;
  const r=await admin.auth.admin.createUser({email,password,email_confirm:true,app_metadata:operator?{papel:'operador'}:{}});
  assert.ifError(r.error);users.push(r.data.user.id);
  assert.ifError((await admin.from('profiles').upsert({id:r.data.user.id,full_name:'E28 QA '+label})).error);
  const jar=new Map();
  const client=createServerClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>items.forEach(({name,value})=>jar.set(name,value))}});
  assert.ifError((await client.auth.signInWithPassword({email,password})).error);
  clients.push(client);
  return {id:r.data.user.id,email,jar,client};
}
async function business(actor){
  const r=await admin.from('businesses').insert({profile_id:actor.id,name:'E28-QA-'+run,dados_ficticios:true}).select('id').single();
  assert.ifError(r.error);businesses.push(r.data.id);
  assert.ifError((await admin.from('webapp_legacy_access').insert({profile_id:actor.id,granted_at:new Date(Date.now()+60000).toISOString()})).error);
  return r.data.id;
}
function headers(actor,biz){return {cookie:[...[...actor.jar].map(([k,v])=>k+'='+encodeURIComponent(v)),...(biz?['v2g_negocio_ativo='+biz]:[])].join('; '),origin:app};}
async function page(path,actor,biz){const r=await fetch(app+path,{headers:headers(actor,biz),redirect:'manual'});return {status:r.status,html:await r.text(),location:r.headers.get('location')};}
async function actionId(path,actor,biz,name){
  const p=await page(path,actor,biz);assert.equal(p.status,200,'pagina '+path+' indisponivel');
  const sources=[...p.html.matchAll(/src="([^\"]+\.js(?:\?[^\"]*)?)"/g)].map(x=>new URL(x[1],app).href);
  for(const src of [...new Set(sources)]){
    const text=await (await fetch(src,{headers:headers(actor,biz)})).text();
    const rx=new RegExp('createServerReference[^;]{0,500}?([a-f0-9]{40,})[^;]{0,500}?'+name);
    const hit=text.match(rx);if(hit)return hit[1];
  }
  throw Error('Referencia da action '+name+' nao encontrada no bundle publicado');
}
async function action(path,actor,biz,id,args){
  const body=await encodeReply(args);
  const r=await fetch(app+path,{method:'POST',redirect:'manual',headers:{...headers(actor,biz),'Next-Action':id,Accept:'text/x-component'},body});
  const text=await r.text();
  assert.equal(r.status,200,'HTTP action '+r.status);
  const values=text.split('\n').flatMap(line=>{try{return [JSON.parse(line.slice(line.indexOf(':')+1))];}catch{return [];}});
  const value=values.find(v=>v&&typeof v==='object'&&('ok' in v||'erro' in v));
  assert.ok(value,'Resposta da action nao conferivel');return value;
}
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9KUa0AAAAASUVORK5CYII=','base64');
const hash=createHash('sha256').update(png).digest('hex');
let failure;
try{
  const owner=await actor('owner'),other=await actor('other'),manager=await actor('manager',true),wrongManager=await actor('wrong-manager',true);
  const biz=await business(owner),otherBiz=await business(other);
  assert.ifError((await admin.from('manager_accounts').insert([{business_id:biz,operator_profile_id:manager.id,assigned_by:manager.id},{business_id:otherBiz,operator_profile_id:wrongManager.id,assigned_by:manager.id}])).error);
  pass('Auth real e duas carteiras ficticias preparadas');
  const upload=await actionId('/criativos',owner,biz,'solicitarRevisaoAction');
  const id=randomUUID();requests.push({id,biz});
  const form=()=>{const f=new FormData();f.set('submissaoId',id);f.set('businessId',biz);f.set('arquivo',new File([png],'E28-QA-'+run+'.png',{type:'image/png'}));f.set('objetivo','whatsapp_messages');f.set('promocao','nao');f.set('validade','');f.set('confirmado','sim');return f;};
  const denied=await action('/criativos',other,otherBiz,upload,[form()]);assert.equal(denied.ok,false);pass('Outro cliente nao envia para negocio alheio');
  const invalid=form();invalid.set('confirmado','');
  const invalidResult=await action('/criativos',owner,biz,upload,[invalid]);assert.equal(invalidResult.ok,false);
  const absent=await admin.from('creative_review_requests').select('id').eq('id',id);assert.ifError(absent.error);assert.equal(absent.data.length,0);
  pass('Envio sem confirmacao falha sem criar pedido');
  const created=await action('/criativos',owner,biz,upload,[form()]);assert.equal(created.ok,true);assert.equal(created.analisarAgora,false);pass('Upload HTTPS pela action real sem analise paga');
  const replay=await action('/criativos',owner,biz,upload,[form()]);assert.equal(replay.ok,true);assert.equal(replay.repetido,true);pass('Replay HTTPS idempotente');
  const changed=form();changed.set('objetivo','instagram_visits');
  const changedResult=await action('/criativos',owner,biz,upload,[changed]);assert.equal(changedResult.ok,false);pass('Replay com intencao diferente e negado');
  const row=await admin.from('creative_review_requests').select('id,business_id,submitted_by,file_path,sha256,status,upload_intent').eq('id',id).single();assert.ifError(row.error);
  assert.equal(row.data.sha256,hash);assert.equal(row.data.status,'awaiting_review');assert.equal(row.data.upload_intent.objective,'whatsapp_messages');
  const stored=await admin.storage.from('creative-review').download(row.data.file_path);assert.ifError(stored.error);assert.equal(createHash('sha256').update(Buffer.from(await stored.data.arrayBuffer())).digest('hex'),hash);pass('Banco e Storage preservam intencao e hash exatos');
  const anonymous=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const privateObject=await anonymous.storage.from('creative-review').download(row.data.file_path);assert.ok(privateObject.error);assert.equal(privateObject.data,null);pass('Storage privado nega download anonimo');
  const rls=await other.client.from('creative_review_requests').select('id').eq('id',id);assert.ifError(rls.error);assert.equal(rls.data.length,0);pass('RLS nega leitura de outro dono');
  const gallery=await page('/criativos',owner,biz);assert.equal(gallery.status,200);assert.ok(gallery.html.includes('E28-QA-'+run+'.png'));pass('Galeria autenticada recupera pedido');
  const imageUrl=gallery.html.match(/https:\/\/[^"<>\\\s]+\/storage\/v1\/object\/sign\/creative-review\/[^"<>\\\s]+/);
  assert.ok(imageUrl,'Galeria precisa fornecer imagem privada assinada');
  const image=await fetch(imageUrl[0].replaceAll('&amp;','&'));assert.equal(image.status,200);assert.equal(createHash('sha256').update(Buffer.from(await image.arrayBuffer())).digest('hex'),hash);pass('Imagem assinada pela galeria recupera os bytes exatos');
  assert.ifError((await owner.client.auth.signOut({scope:'local'})).error);
  assert.ifError((await owner.client.auth.signInWithPassword({email:owner.email,password})).error);
  const reloaded=await page('/criativos',owner,biz);assert.equal(reloaded.status,200);assert.ok(reloaded.html.includes('E28-QA-'+run+'.png'));pass('Novo login preserva pedido na galeria');
  const otherGallery=await page('/criativos',other,otherBiz);assert.equal(otherGallery.status,200);assert.ok(!otherGallery.html.includes('E28-QA-'+run+'.png'));pass('Galeria de outro dono nao expoe o arquivo');
  const decision=await actionId('/gestor/criativos',manager,null,'revisarPecaAction');
  const decide=()=>{const f=new FormData();f.set('id',id);f.set('decisao','changes_requested');f.set('nota','E28 QA solicitar ajuste ficticio.');return f;};
  const deniedManager=await action('/gestor/criativos',wrongManager,null,decision,[{},decide()]);assert.ok(deniedManager.erro);pass('Gestor de outra carteira nao decide');
  const decided=await action('/gestor/criativos',manager,null,decision,[{},decide()]);assert.ok(decided.ok);pass('Gestor correto registra decisao HTTPS');
  const final=await admin.from('creative_review_requests').select('status,reviewed_by').eq('id',id).single();assert.ifError(final.error);assert.equal(final.data.status,'changes_requested');assert.equal(final.data.reviewed_by,manager.id);
  const tasks=await admin.from('manager_tasks').select('id,status,assigned_to').eq('business_id',biz);assert.ifError(tasks.error);assert.equal(tasks.data.length,1);assert.equal(tasks.data[0].status,'done');pass('Tarefa unica acompanha decisao');
  const twice=await action('/gestor/criativos',manager,null,decision,[{},decide()]);assert.ok(twice.erro);pass('Segunda decisao nao sobrescreve a primeira');
}catch(e){failure=e;console.error('FAIL '+e.name+': '+e.message);}
finally{
  for(const client of clients){assert.ifError((await client.auth.signOut({scope:'global'})).error);}
  for(const {id,biz} of requests){const path=biz+'/'+id;assert.ifError((await admin.storage.from('creative-review').remove([path])).error);assert.ifError((await admin.from('creative_review_requests').delete().eq('id',id).eq('business_id',biz)).error);}
  for(const id of businesses){assert.ifError((await admin.from('manager_tasks').delete().eq('business_id',id)).error);assert.ifError((await admin.from('manager_accounts').delete().eq('business_id',id)).error);assert.ifError((await admin.from('businesses').delete().eq('id',id).eq('dados_ficticios',true)).error);}
  for(const id of users){assert.ifError((await admin.from('webapp_legacy_access').delete().eq('profile_id',id)).error);assert.ifError((await admin.auth.admin.deleteUser(id)).error);}
  console.log('Fixtures desta rodada removidas; '+checks.length+' verificacoes passaram.');
  console.log(JSON.stringify({rodada:run,pedidos:requests,usuariosFicticios:users,verificacoes:checks.length,limpeza:'concluida',falhou:!!failure}));
}
if(failure)process.exitCode=1;
