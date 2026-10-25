/** Codigo real e validador Next instalado, portas locais. Nunca le senhas reais ou chama Auth. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ambienteTs } from './test-utils/ts-isolado.mjs';
const require=createRequire(import.meta.url);
const {ensureServerEntryExports}=require('next/dist/build/webpack/loaders/next-flight-loader/action-validate.js');
const senha='K7!mQ2@vR9#s'; // Fixture exclusiva do teste; nao e credencial de conta.
const form=(s=senha,c=s)=>{const f=new FormData();f.set('senha',s);f.set('confirmarSenha',c);return f;};
const redirect=destino=>{throw Object.assign(Error('redirecionamento de teste'),{destino});};
function redefinir({error=null,throwUpdate=false,erroSaida=null,throwSaida=false,throwClient=false}={}) {
  const chamadas=[];
  const mod=ambienteTs({ports:{'next/navigation':{redirect},
    '@/lib/supabase/server':{createClient:async()=>{
      if(throwClient)throw Error('indisponivel');
      return {auth:{updateUser:async({password})=>{chamadas.push('salvar');assert.equal(password,senha);
        if(throwUpdate)throw Error('indisponivel');return {error};},
        signOut:async()=>{chamadas.push('sair');if(throwSaida)throw Error('indisponivel');return {error:erroSaida};}}};
    }},
    '@/lib/auth-errors':{mensagemDeErroAuth:()=> 'Link expirado. Peça outro link.'},
  }}).load('app/(public)/redefinir/actions.ts');
  return {mod,chamadas,run:f=>mod.redefinirAction({},f??form())};
}
test('exportacao antiga de objeto reproduz erro Next; action atual exporta somente funcao assincrona',()=>{
  assert.throws(()=>ensureServerEntryExports([async()=>{},{}]),/can only export async functions/);
  const {mod}=redefinir();
  assert.deepEqual(Object.keys(mod),['redefinirAction']);
  assert.doesNotThrow(()=>ensureServerEntryExports(Object.values(mod)));
  assert.equal(mod.redefinirAction.constructor.name,'AsyncFunction');
});
test('senha salva e logout bem sucedido redirecionam para confirmacao publica',async()=>{
  const c=redefinir();await assert.rejects(c.run(),e=>e.destino==='/redefinir/concluido');
  assert.deepEqual(c.chamadas,['salvar','sair']);
});
for(const opts of [{erroSaida:{code:'indisponivel'}},{throwSaida:true}]) test('logout falho nao esconde senha salva e leva a aviso proprio',async()=>{
  const c=redefinir(opts);await assert.rejects(c.run(),e=>e.destino==='/redefinir/concluido?aviso=sessao');
  assert.deepEqual(c.chamadas,['salvar','sair']);
});
test('senha invalida e confirmacao diferente nao chamam Auth',async()=>{
  const c=redefinir();assert.ok((await c.run(form(senha.slice(0,11)))).error);
  assert.ok((await c.run(form(senha,senha+'x'))).error);assert.equal(c.chamadas.length,0);
});
test('erro conhecido do provedor nao faz logout nem exibe falso sucesso',async()=>{
  const c=redefinir({error:{code:'session_missing'}});assert.match((await c.run()).error,/Link expirado/);
  assert.deepEqual(c.chamadas,['salvar']);
});
for(const opts of [{throwUpdate:true},{throwClient:true}]) test('excecao de rede devolve orientacao honesta sem tela de erro',async()=>{
  const c=redefinir(opts);assert.match((await c.run()).error,/Não foi possível confirmar a alteração/);
  assert.ok(!c.chamadas.includes('sair'));
});

function proxyContext({falha=false}={}) {
  let consultas=0;
  const response={
    next:()=>({tipo:'next',cookies:{getAll:()=>[]}}),
    redirect:url=>({tipo:'redirect',url:String(url),cookies:{set:()=>{}}}),
  };
  const mod=ambienteTs({ports:{'next/server':{NextResponse:response},
    '@supabase/ssr':{createServerClient:()=>{consultas++;if(falha)throw Error('Auth indisponivel');
      return {auth:{getUser:async()=>({data:{user:null}})}};}},
    '@/lib/contratacao/acesso':{temAcessoWebApp:async()=>{throw Error('Nao conceder acesso');}},
  }}).load('proxy.ts');
  return {run:(path,method='GET')=>{const u=new URL('https://qa.example.invalid'+path);u.clone=()=>new URL(u);
    return mod.proxy({method,nextUrl:u,cookies:{getAll:()=>[]}});},consultas:()=>consultas};
}
test('confirmacao abre apos logout mesmo com Auth fora do ar; somente GET/HEAD do caminho exato',async()=>{
  const c=proxyContext({falha:true});
  assert.equal((await c.run('/redefinir/concluido')).tipo,'next');
  assert.equal((await c.run('/redefinir/concluido?aviso=sessao','HEAD')).tipo,'next');
  assert.equal(c.consultas(),0);
  await assert.rejects(c.run('/redefinir/concluido','POST'),/Auth indisponivel/);
  await assert.rejects(c.run('/redefinir/concluido-outra'),/Auth indisponivel/);
});
test('mudanca nao abre inicio ou outra rota protegida sem sessao',async()=>{
  const c=proxyContext();const r=await c.run('/inicio');
  assert.equal(r.tipo,'redirect');assert.equal(new URL(r.url).pathname,'/entrar');assert.equal(c.consultas(),1);
});

function callback({redirectType=null,error=null}={}) {
  const chamadas=[];
  const mod=ambienteTs({ports:{
    'next/server':{NextResponse:{redirect:url=>({destino:String(url)})}},
    '@/lib/supabase/server':{createClient:async()=>({auth:{
      exchangeCodeForSession:async()=>({data:{user:{id:'fixture'},redirectType},error}),
      verifyOtp:async()=>({data:{user:{id:'fixture'}},error}),
    }})},
    '@/lib/contratacao/vincular':{vincularComprasAprovadas:async()=>{chamadas.push('vincular');}},
    '@/lib/auth-errors':{registrarErroAuth:()=>{}},
  }}).load('app/auth/confirmar/route.ts');
  return {run:path=>mod.GET({url:'https://qa.example.invalid/auth/confirmar'+path}),chamadas};
}
test('PKCE recovery sem type usa origem do SDK e nao cai no inicio ou reivindica negocio',async()=>{
  const c=callback({redirectType:'recovery'});assert.equal((await c.run('?code=fixture')).destino,'https://qa.example.invalid/redefinir');
  assert.equal(c.chamadas.length,0);
});
test('OTP recovery ignora next alheio e vai para redefinir sem vincular compras',async()=>{
  const c=callback();assert.equal((await c.run('?token_hash=fixture&type=recovery&next=/conta')).destino,'https://qa.example.invalid/redefinir');
  assert.equal(c.chamadas.length,0);
});
test('confirmacao comum preserva destino seguro e fluxo existente',async()=>{
  const c=callback();assert.equal((await c.run('?code=fixture&next=/conta')).destino,'https://qa.example.invalid/conta');
  assert.deepEqual(c.chamadas,['vincular']);
  assert.equal((await c.run('?code=fixture&next=https://outro.example')).destino,'https://qa.example.invalid/inicio');
});
test('callback rejeitado nao cria sucesso ou vinculo',async()=>{
  const c=callback({error:{code:'expired'}});
  assert.equal((await c.run('?code=fixture')).destino,'https://qa.example.invalid/redefinir?erro=invalido');
  assert.equal(c.chamadas.length,0);
});
test('confirmacao real tem resultado claro e link para entrar mesmo sem sessao',async()=>{
  const mod=ambienteTs({ports:{'@/components/ui/EntradaEditorial':{
    EntradaEditorial:({children})=>React.createElement('main',null,children)},
  }}).load('app/(public)/redefinir/concluido/page.tsx');
  for(const aviso of [undefined,'sessao']) {
    const html=renderToStaticMarkup(await mod.default({searchParams:Promise.resolve({aviso})}));
    assert.match(html,/Sua nova senha foi salva/);assert.match(html,/Entrar com a nova senha/);
    assert.match(html,/adicionar=1/);if(aviso)assert.match(html,/Não foi possível confirmar o encerramento/);
  }
});
