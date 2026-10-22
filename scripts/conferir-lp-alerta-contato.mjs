import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const lead = { nome:'Pessoa fictícia', negocio:'Negócio fictício', email:'lead@example.invalid',
  whatsapp:'11999990000', cnpj:'11222333000181', instagram:'teste', nicho:'servicos_locais',
  vende_whatsapp:true, pagina_origem:'https://example.invalid', utm_campaign:'fixture' };
function alerta({ env = {}, fetcher = async()=>new Response('{"id":"fixture"}'), simulated = false } = {}) {
  const calls=[];const m={exports:{}};
  vm.runInNewContext(readFileSync(new URL('../../lp/api/_alerta-lead.js',import.meta.url),'utf8'),{
    module:m,require,AbortSignal,process:{env:{LEADS_ALERT_EMAIL_ENABLED:'true',LEADS_ALERT_FROM:'sender@example.invalid',
      LEADS_ALERT_RESEND_API_KEY:'fixture',IP_HASH_SALT:'fixture',LEADS_SIMULAR:simulated?'1':'0',...env}},
    fetch:async(url,opts)=>{calls.push({url,...opts});return fetcher(url,opts);}
  });
  return {calls,run:()=>m.exports.alertarNovoLead(lead)};
}
test('alerta desligado ou simulado não faz rede',async()=>{
  for(const c of [alerta({env:{LEADS_ALERT_EMAIL_ENABLED:'false'}}),alerta({simulated:true})]){
    assert.equal((await c.run()).estado,'desativado');assert.equal(c.calls.length,0);
  }
});
test('destino fixo, texto sem promessa de compra e chave estável sem contato',async()=>{
  const c=alerta();assert.equal((await c.run()).estado,'aceito');await c.run();
  const p=JSON.parse(c.calls[0].body);assert.deepEqual(p.to,['victor.cabral@v2gmidia.com.br']);
  assert.match(p.text,/não representa pedido, pagamento ou acesso/);
  assert.equal(c.calls[0].headers['Idempotency-Key'],c.calls[1].headers['Idempotency-Key']);
  assert.match(c.calls[0].headers['Idempotency-Key'],/^lp-lead\/[0-9a-f]{64}$/);
});
test('configuração inválida, erro e timeout ficam pendentes, sem reenvio automático',async()=>{
  const bad=alerta({env:{LEADS_ALERT_FROM:'sender@example.invalid\nBcc:evil@example.invalid'}});
  assert.equal((await bad.run()).estado,'pendente');assert.equal(bad.calls.length,0);
  for(const fetcher of [async()=>{throw Error('timeout');},async()=>new Response('{}',{status:500}),async()=>new Response('{}')]){
    const c=alerta({fetcher});assert.equal((await c.run()).estado,'pendente');assert.equal(c.calls.length,1);
  }
});
function handler({ rpcOk = true, throws = false, simulation = false, bot = false, invalid = false }={}) {
  const m={exports:{}};let alerts=0,writes=0,body,status;
  const localRequire=createRequire(new URL('../../lp/api/pre-cadastro.js',import.meta.url));
  vm.runInNewContext(readFileSync(new URL('../../lp/api/pre-cadastro.js',import.meta.url),'utf8'),{
    module:m,require:key=>key==='./_alerta-lead'?{alertarNovoLead:async()=>{alerts++;if(throws)throw Error('alerta');return {estado:'pendente',referencia:'fixture'};}}:localRequire(key),
    process:{env:{LEADS_SIMULAR:simulation?'1':'0',LEADS_CNPJ_RPC_ENABLED:'1',SUPABASE_URL:'https://qa.example.invalid',SUPABASE_ANON_KEY:'fixture',IP_HASH_SALT:'fixture'}},
    URL,Buffer,AbortSignal,console:{log(){},error(){}},fetch:async()=>{writes++;return new Response(JSON.stringify({ok:rpcOk}));}
  });
  const res={setHeader(){},end(raw){body=JSON.parse(raw);status=this.statusCode;}};
  return {run:async()=>{
    await m.exports({method:'POST',headers:{accept:'application/json',host:'localhost',origin:'http://localhost'},socket:{remoteAddress:'127.0.0.1'},
      body:{...lead,perfil:'dono',investe_anuncios:'nao',vende_whatsapp:'sim',consentimento:'sim',nome:invalid?'':lead.nome,empresa_url:bot?'robot':''}},res);
    return {alerts,writes,body,status};
  }};
}
test('lead salvo preserva sucesso e WhatsApp mesmo com alerta pendente ou exceção',async()=>{
  for(const throws of [false,true]){
    const r=await handler({throws}).run();assert.equal(r.status,200);assert.equal(r.body.ok,true);
    assert.equal(r.writes,1);assert.equal(r.alerts,1);
    assert.equal(new URL(r.body.contato_url).pathname,'/5521980351531');
    assert.equal('email' in r.body,false);
  }
});
test('bot, dados inválidos, RPC recusada e simulação não enviam alerta',async()=>{
  for(const opts of [{bot:true},{invalid:true},{rpcOk:false},{simulation:true}]){
    const r=await handler(opts).run();assert.equal(r.alerts,0);
  }
});
test('navegador aceita o mesmo WhatsApp que o servidor e força revisão do asset',()=>{
  const js=readFileSync(new URL('../../lp/assets/lp.v6.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../../lp/index.html',import.meta.url),'utf8');
  assert.match(js,/urlContato.pathname === '\/5521980351531'/);
  assert.match(html,/lp\.v6\.js\?contato=20261021/);
});
