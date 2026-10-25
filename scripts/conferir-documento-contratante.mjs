/** Fluxos reais em portas isoladas, fixtures sinteticas; sem rede/credenciais. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ambienteTs } from './test-utils/ts-isolado.mjs';
import { lerDocumentoContratante,normalizarDocumentoContratante,identificarDocumentoContratante } from '../lib/contratacao/documento-contratante.ts';
import { validarCompra } from '../lib/contratacao/qualificacao.ts';
import { validarPedidoAssistido } from '../lib/contratacao/pedido-assistido.ts';
import { validarEvidenciaManual } from '../lib/contratacao/evidencia-manual.ts';
import { cnpjsDoComprador } from '../lib/multiconta/identificacao.ts';
import { negociosLiberados } from '../lib/multiconta/elegibilidade.ts';
import { conciliarReserva } from '../lib/agenda/conciliacao.ts';
import { descricaoDaReuniao } from '../lib/agenda/descricao-reuniao.ts';
import { filtrarCompras } from '../lib/gestor/compras.ts';
const cpf='00000000191',cnpj='11222333000181',email='contratante@example.invalid';
const ref='00000000-0000-4000-8000-000000000025';
const form=values=>{const f=new FormData();for(const [k,v] of Object.entries(values))f.set(k,String(v));return f;};
const compra=doc=>form({referencia:ref,nome:'Pessoa Ficticia',email,whatsapp:'11999990000',razaoSocial:'Negocio Ficticio',
  cnpj:doc,contas:1,periodo:'monthly',metodo:'asaas_card',vendeWhatsApp:'sim'});
const redirecionar=url=>{throw new Error('NAV:'+url);};

test('CPF e CNPJ tem tipo explicito, mascara normalizada e zeros preservados',()=>{
  assert.deepEqual(lerDocumentoContratante('000.000.001-91'),{numero:cpf,tipo:'cpf'});
  assert.deepEqual(lerDocumentoContratante('11.222.333/0001-81'),{numero:cnpj,tipo:'cnpj'});
  assert.equal(identificarDocumentoContratante(cpf),'CPF 000.000.001-91');
  assert.equal(identificarDocumentoContratante(cnpj),'CNPJ 11.222.333/0001-81');
  assert.equal(normalizarDocumentoContratante(' 000.000.001-91 '),cpf);
});
test('invalido, repetido, letra e tamanho errado nunca viram documento valido',()=>{
  for(const d of ['',null,191,'00000000192','11222333000182','00000000000','11111111111',
    '00000000000000','12345678901234','123','abc'+cpf,cpf+'@',cpf+'0']) assert.equal(lerDocumentoContratante(d),null);
});
for(const [doc,tipo] of [[cpf,'cpf'],[cnpj,'cnpj']]) {
  test(`compra ${tipo}, Pix assistido e evidencia documental aceitam o mesmo contratante`,()=>{
    const validada=validarCompra(compra(doc));assert.equal(validada.dados?.cnpj,doc);assert.equal(validada.dados?.documentoTipo,tipo);
    const assistida=validarPedidoAssistido(form({ref,email,legalName:'Negocio Ficticio',cnpj:doc,unitCount:1,
      billingPeriod:'monthly',declaresCnpj:'yes',sellsByWhatsApp:'yes',vinculoLead:'atendimento_direto'}),true);
    assert.equal(assistida.dados?.documentoTipo,tipo);
    const evidencia=validarEvidenciaManual(form({id:ref,businessId:ref,email,cnpj:doc,source:'direct_pix',
      reference:'fixture-25-documento',sourceDate:'2026-10-20'}),'2026-10-25');
    assert.equal(evidencia.dados?.claimed_cnpj,doc);
  });
  test(`primeiro acesso ${tipo}: action real confere documento exato antes de criar conta`,async()=>{
    let cadastrado=0;const filtros=[];
    const q={select:()=>q,eq:(k,v)=>{filtros.push([k,v]);return q;},not:()=>q,limit:()=>q,
      maybeSingle:async()=>({data:{id:ref},error:null})};
    const auth=ambienteTs({env:{NEXT_PUBLIC_SITE_URL:'https://qa.example.invalid'},ports:{
      'next/navigation':{redirect:redirecionar},
      '@/lib/supabase/server':{createClient:async()=>({auth:{signUp:async()=>{cadastrado++;return {data:{session:null},error:null};}}})},
      '@/lib/supabase/admin':{createAdminClient:()=>({from:()=>q})},
      '@/lib/contratacao/vincular':{vincularComprasAprovadas:async()=>{throw Error('Nao vincular sem sessao');}},
    }}).load('app/(public)/entrar/actions.ts');
    const f=form({nome:'Pessoa Ficticia',email,whatsapp:'11999990000',cnpj:doc,
      senha:'Senha-Ficticia-Longa-2026!',confirmarSenha:'Senha-Ficticia-Longa-2026!'});
    assert.ok((await auth.signUpAction({},f)).message);assert.equal(cadastrado,1);
    assert.ok(filtros.some(([k,v])=>k==='cnpj'&&v===doc));
    assert.ok(filtros.some(([k,v])=>k==='buyer_email'&&v===email));
    assert.ok(filtros.some(([k,v])=>k==='status'&&v==='payment_approved'));
    f.set('cnpj',doc.slice(0,-1)+'2');assert.ok((await auth.signUpAction({},f)).error);assert.equal(cadastrado,1);
  });
  test(`compra ${tipo}: action real envia documento normalizado e preserva a referencia`,async()=>{
    const chamadas=[];
    const q={select:()=>q,eq:()=>q,single:async()=>({data:{id:ref,status:'awaiting_payment'},error:null})};
    const action=ambienteTs({env:{V2G_CHECKOUT_API_ENABLED:'true'},ports:{
      'next/navigation':{redirect:redirecionar},'next/headers':{headers:async()=>new Headers(),cookies:async()=>({set:()=>{}})},
      '@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user:null}})}})},
      '@/lib/supabase/admin':{createAdminClient:()=>({from:()=>q,rpc:async(n,args)=>{chamadas.push([n,args]);return {data:ref,error:null};}})},
      '@/lib/contratacao/ambiente-checkout':{checkoutSandboxSeguroNesteServidor:()=>true},
      '@/lib/seguranca/checkout':{segurancaCheckoutAtiva:()=>false},
      '@/lib/contratacao/iniciar-pagamento':{iniciarPagamentoInterno:async()=>{throw Error('Nao cobrar nesta action');}},
      './checkout-hospedado':{iniciarCheckoutHospedado:async()=>{throw Error('Nao hospedar');}},
    }}).load('app/contratar/actions.ts');
    await assert.rejects(action.iniciarCompra({},compra(doc)),/NAV:\/contratar\/pagamento\?ref=/);
    assert.equal(chamadas.length,1);assert.equal(chamadas[0][0],'registrar_pedido_self_service');
    assert.equal(chamadas[0][1].p_cnpj,doc);assert.equal(chamadas[0][1].p_ref,ref);
  });
}
test('primeiro acesso sem pedido nao cria conta mesmo com documento valido',async()=>{
  const q={select:()=>q,eq:()=>q,not:()=>q,limit:()=>q,maybeSingle:async()=>({data:null,error:null})};
  const action=ambienteTs({ports:{'next/navigation':{redirect:redirecionar},
    '@/lib/supabase/server':{createClient:async()=>{throw Error('Nao criar conta sem pedido');}},
    '@/lib/supabase/admin':{createAdminClient:()=>({from:()=>q})},
    '@/lib/contratacao/vincular':{vincularComprasAprovadas:async()=>{}},
  }}).load('app/(public)/entrar/actions.ts');
  assert.ok((await action.signUpAction({},form({nome:'Pessoa Ficticia',email,whatsapp:'11999990000',cnpj:cpf,
    senha:'Senha-Ficticia-Longa-2026!',confirmarSenha:'Senha-Ficticia-Longa-2026!'}))).message);
});

for(const [contratante,titular] of [[cpf,cnpj],[cnpj,cpf]]) test('pagamento real isolado separa contratante '+contratante.length+' e titular '+titular.length,async()=>{
  const chamadas=[];
  const pedido={id:ref,origin:'self_service',status:'awaiting_payment',buyer_email:email,buyer_name:'Pessoa Ficticia',
    buyer_whatsapp:'11999990000',legal_name:'Negocio Ficticio',cnpj:contratante,payment_method:'asaas_card',
    billing_period:'annual_upfront',total_cents:528000,provider_customer_id:null,provider_charge_id:null,
    provider_subscription_id:null,provider_checkout_id:null,checkout_creation_started_at:null,payment_creation_started_at:null,payment_attempt_count:0};
  const admin={from(){let escrevendo=false;const q={select:()=>q,eq:()=>q,is:()=>q,
    update:()=>{escrevendo=true;return q;},maybeSingle:async()=>({data:escrevendo?{id:ref}:pedido,error:null})};return q;}};
  const mod=ambienteTs({env:{V2G_CHECKOUT_API_ENABLED:'true'},ports:{
    'next/navigation':{redirect:redirecionar},'next/headers':{headers:async()=>new Headers({'x-forwarded-proto':'https','x-forwarded-for':'203.0.113.10'})},
    '@/lib/supabase/admin':{createAdminClient:()=>admin},
    '@/lib/contratacao/ambiente-checkout':{checkoutSandboxSeguroNesteServidor:()=>true},
    '@/lib/seguranca/checkout':{segurancaCheckoutAtiva:()=>false,ipConfiavelDaVercel:()=>null},
    './origem-asaas-servidor':{origemAsaasNoServidor:async()=>true},
    '@/lib/contratacao/asaas-sandbox':{idAsaas:(v,p)=>typeof v==='string'&&v.startsWith(p+'_')?v:null,
      asaasSandbox:async(path,options)=>{chamadas.push([path,options.body]);return {ok:true,body:{id:path==='/customers'?'cus_fixture':'pay_fixture'}};}},
  }}).load('lib/contratacao/iniciar-pagamento.ts');
  await assert.rejects(mod.iniciarPagamentoInterno({},form({ref,holderName:'Titular Ficticio',holderDocument:titular,
    cardNumber:'4111111111111111',expiryMonth:12,expiryYear:2035,ccv:'123',postalCode:'01001000',addressNumber:'10'})),/NAV:/);
  assert.equal(chamadas[0][0],'/customers');assert.equal(chamadas[0][1].cpfCnpj,contratante);
  assert.equal(chamadas[1][0],'/payments');assert.equal(chamadas[1][1].creditCardHolderInfo.cpfCnpj,titular);
  assert.notEqual(chamadas[0][1].cpfCnpj,chamadas[1][1].creditCardHolderInfo.cpfCnpj);
});
test('mesmo email acessa negocios CPF e CNPJ distintos; documento igual nao une os IDs',()=>{
  const negocios=['a','b','c'].map(id=>({id,name:'Negocio '+id,created_at:'2026-10-25T12:00:00Z'}));
  const pedidos=negocios.map((b,i)=>({business_id:b.id,cnpj:i===1?cnpj:cpf,buyer_email:email,buyer_profile_id:'perfil',status:'payment_approved'}));
  const documentos=cnpjsDoComprador(['a','b','c'],pedidos,'perfil',email);
  assert.deepEqual([...documentos],[['a',cpf],['b',cnpj],['c',cpf]]);
  assert.equal(negociosLiberados({negocios,pedidos,perfilId:'perfil',emailVerificado:email,legadoEm:null,operador:false}).length,3);
  assert.equal(cnpjsDoComprador(['a'],[{...pedidos[0],buyer_profile_id:'outro'}],'perfil',email).size,0);
});
test('agenda reconhece CPF exato; duas compras do mesmo CPF ficam em revisao, nunca fundidas',()=>{
  const evento={calendarId:'cal',eventId:'evt',etag:'v1',status:'confirmed',inicio:'2026-12-01T13:00:00Z',
    fim:'2026-12-01T13:25:00Z',emailParticipante:email,cnpjInformado:'000.000.001-91'};
  const candidato={businessId:'a',orderId:'pedido-a',paymentStatus:'payment_approved',emailVerificado:email,cnpj:cpf};
  assert.equal(conciliarReserva(evento,'cal',[candidato]).status,'reservado');
  assert.equal(conciliarReserva(evento,'cal',[candidato,{...candidato,businessId:'b',orderId:'pedido-b'}]).status,'revisao');
  assert.match(descricaoDaReuniao({},cpf),/CPF 000\.000\.001-91/);
});
test('HTML real do primeiro acesso, compra e seletor identifica ambos sem exigir 14 digitos',()=>{
  const env=ambienteTs({ports:{
    react:{...React,useState:valor=>[valor,()=>{}],useActionState:(_fn,estado)=>[estado,()=>{},false]},
    'next/navigation':{useSearchParams:()=>new URLSearchParams('modo=cadastro')},
    '@/components/ui/EntradaEditorial':{EntradaEditorial:({children})=>React.createElement('section',null,children)},
    '@/components/seguranca/Turnstile':{Turnstile:()=>{throw Error('CAPTCHA nao faz parte do ensaio de HTML');}},
    './actions':{signInAction:()=>{},signUpAction:()=>{},iniciarCompra:()=>{},escolherNegocioAction:()=>{}},
  }});
  const cadastro=renderToStaticMarkup(React.createElement(env.load('app/(public)/entrar/page.tsx').default));
  assert.match(cadastro,/CPF ou CNPJ do contratante/);assert.match(cadastro,/minLength="11"/i);
  assert.doesNotMatch(cadastro,/pattern="\[0-9\]\{14\}"/);
  const checkout=renderToStaticMarkup(React.createElement(env.load('app/contratar/FormularioContratar.tsx').FormularioContratar,{referencia:ref,apiAtiva:true}));
  assert.match(checkout,/CPF ou CNPJ do contratante/);assert.match(checkout,/name="cnpj"/);
  const seletor=renderToStaticMarkup(React.createElement(env.load('app/(public)/escolher-negocio/Formulario.tsx').FormularioNegocio,
    {negocios:[{id:'a',name:'Ficticio CPF',cnpj:cpf,codigo:'a'},{id:'b',name:'Ficticio CNPJ',cnpj:cnpj,codigo:'b'}],selecionado:null}));
  assert.match(seletor,/CPF 000\.000\.001-91/);assert.match(seletor,/CNPJ 11\.222\.333\/0001-81/);
  assert.equal((seletor.match(/name="businessId"/g)??[]).length,2);
});
test('busca operacional encontra CPF ou CNPJ mascarados sem juntar pedidos',()=>{
  const base={buyer_email:email,legal_name:'Ficticio',origin:'self_service',status:'awaiting_payment',created_at:'2026-10-25T12:00:00Z'};
  const pedidos=[{...base,id:'a',cnpj:cpf},{...base,id:'b',cnpj:cnpj}];
  assert.deepEqual(filtrarCompras(pedidos,'000.000.001-91','todas').map(p=>p.id),['a']);
  assert.deepEqual(filtrarCompras(pedidos,'11.222.333/0001-81','todas').map(p=>p.id),['b']);
});
