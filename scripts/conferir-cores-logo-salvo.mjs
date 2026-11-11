import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {ambienteTs} from './test-utils/ts-isolado.mjs';

const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const caminho=`identidade/${A}/logo-1.png`;
const logo={id:'logo-1',caminho,url:`https://zskpijnqgkqwxksqmzmf.supabase.co/storage/v1/object/sign/v2g-midia/${caminho}?token=fixture`,uso:'logo',nomeDoArquivo:'logo.png'};
const propostas=[{hex:'#442288',peso:.8},{hex:'#CCAA88',peso:.2}];
const {coresDoLogoSalvo}=ambienteTs({globals:{File}}).load('lib/identidade/cores-do-logo-salvo.ts');
const copiar=x=>JSON.parse(JSON.stringify(x));

test('logo salvo é lido sem cookies e só gera proposta, sem reenvio ou gravação',async()=>{
  const chamadas=[];
  const r=await coresDoLogoSalvo(logo,A,new AbortController().signal,{
    buscar:async(url,opcoes)=>{chamadas.push({url,opcoes});return new Response(new Blob(['imagem'],{type:'image/png'}));},
    extrair:async(file,quantas)=>{assert.equal(file.type,'image/png');assert.equal(quantas,6);return propostas;},
  });
  assert.equal(r.ok,true);assert.deepEqual(r.cores,propostas);
  assert.equal(chamadas.length,1);assert.equal(chamadas[0].opcoes.credentials,'omit');
  assert.equal(chamadas[0].opcoes.redirect,'error');assert.equal(chamadas[0].opcoes.cache,'no-store');
});

test('origem externa, produção, outro cliente, caminho divergente e URL inválida não são consultados',async()=>{
  let chamadas=0;
  for(const [item,business] of [
    [{...logo,url:logo.url.replace('zskpijnqgkqwxksqmzmf.supabase.co','fora.invalid')},A],
    [{...logo,url:logo.url.replace('zskpijnqgkqwxksqmzmf.supabase.co','ushccxpoxjikzqnwhgfd.supabase.co')},A],
    [logo,B],[{...logo,caminho:`identidade/${B}/logo-1.png`},A],
    [{...logo,caminho:`identidade/${A}/../${B}/logo.png`},A],
    [{...logo,url:'https://['},A],[{...logo,url:null},A],
  ]) assert.equal((await coresDoLogoSalvo(item,business,new AbortController().signal,{
    buscar:async()=>{chamadas++;throw Error('não deve consultar');},extrair:async()=>[],
  })).ok,false);
  assert.equal(chamadas,0);
});

test('falha, tipo impróprio, limite e cancelamento não viram cores vazias bem sucedidas',async()=>{
  const respostas=[new Response('negado',{status:403}),new Response('<html>',{headers:{'content-type':'text/html'}}),
    new Response('imagem',{headers:{'content-type':'image/png','content-length':String(10*1024*1024)}}),
    new Response(new Blob([],{type:'image/png'})),
    new Response(new Blob([new Uint8Array(10*1024*1024)],{type:'image/png'}))];
  for(const resposta of respostas) assert.equal((await coresDoLogoSalvo(logo,A,new AbortController().signal,{
    buscar:async()=>resposta,extrair:async()=>{throw Error('não extrair');},
  })).ok,false);
  const controle=new AbortController();controle.abort();
  assert.equal((await coresDoLogoSalvo(logo,A,controle.signal,{buscar:async()=>{throw Error('não buscar');},extrair:async()=>[]})).ok,false);
  assert.equal((await coresDoLogoSalvo(logo,A,new AbortController().signal,{buscar:async()=>{throw Error('offline');},extrair:async()=>[]})).ok,false);
});

test('logo sem cores é resposta válida, sem inventar uma cor padrão',async()=>{
  const r=await coresDoLogoSalvo(logo,A,new AbortController().signal,{
    buscar:async()=>new Response(new Blob(['imagem'],{type:'image/png'})),extrair:async()=>[],
  });
  assert.equal(r.ok,true);assert.equal(r.cores.length,0);
});

function montar({habilitado=true,recuperar=async()=>({ok:true,cores:propostas})}={}) {
  const slots=[],cleanups=[],salvos=[];let cursor=0;
  const hooks={...React,
    useState(inicial){const i=cursor++;if(!(i in slots))slots[i]=typeof inicial==='function'?inicial():inicial;return[slots[i],valor=>{slots[i]=typeof valor==='function'?valor(slots[i]):valor;}];},
    useRef(inicial){const i=cursor++;if(!(i in slots))slots[i]={current:inicial};return slots[i];},
    useEffect(fn,deps){const i=cursor++;if(!(i in slots)||deps.some((v,j)=>v!==slots[i].deps[j])){
      slots[i]?.cleanup?.();const cleanup=fn();slots[i]={deps:[...deps],cleanup};cleanups.push(cleanup);
    }},
  };
  const {Marca}=ambienteTs({globals:{AbortController,setTimeout,clearTimeout},ports:{
    react:hooks,'next/navigation':{useRouter:()=>({push(){throw Error('não navegar');}})},
    '@/lib/identidade/cores-do-logo-salvo':{coresDoLogoSalvo:recuperar},
    './actions':{salvarMarcaAction:async dados=>{salvos.push(dados);return{ok:true};}},
    './LogoDaMarca':{LogoDaMarca:()=>null},'./VariacoesDaMarca':{VariacoesDaMarca:()=>null},
    '../tempo-da-operacao':{useTempoDaOperacao:()=>({visivel:false})},
    './Marca.module.css':{default:new Proxy({},{get:(_,k)=>k})},
  }}).load('app/(fluxo)/onboarding/marca/Marca.tsx');
  const inicial={businessId:A,site:'https://anunciante.invalid',instagram:'',marca:null,faltamBasicas:[],respostasBasicas:{},concluido:false};
  function elementos(node){if(!node||typeof node!=='object')return[];if(Array.isArray(node))return node.flatMap(elementos);return[node,...elementos(node.props?.children)];}
  function render(){cursor=0;return elementos(Marca({inicial,logo,variacoes:[],recuperarCoresSalvas:habilitado}));}
  const texto=node=>typeof node==='string'?node:Array.isArray(node)?node.map(texto).join(''):node&&typeof node==='object'?texto(node.props?.children):'';
  const botao=nome=>render().find(n=>n.type==='button'&&texto(n)===nome);
  return{render,botao,salvos,trocarNegocio:()=>{inicial.businessId=B;},cleanup:()=>cleanups.forEach(fn=>fn?.())};
}

test('remontar após recarga oferece recuperação sem novo upload, sem confirmar ou salvar automaticamente',async()=>{
  for(let recarga=0;recarga<2;recarga++){
    const m=montar();await m.botao('Sugerir cores do logo salvo').props.onClick();
    // O handler da UI inicia a promessa; permite seu término antes da renderização.
    await new Promise(resolve=>setImmediate(resolve));
    assert.equal(m.render().filter(n=>n.type==='input'&&n.props.type==='color').length,2);
    assert.equal(m.botao('Confirmar estas cores').props.disabled,false);assert.equal(m.salvos.length,0);
    await m.botao('Guardar e escolher horário').props.onClick();
    assert.deepEqual(copiar(m.salvos[0].coresConfirmadas),[]);m.cleanup();
  }
});

test('controle QA desligado não oferece recuperação nem inicia leitura',()=>{
  const m=montar({habilitado:false,recuperar:()=>{throw Error('não ler');}});
  assert.equal(m.botao('Sugerir cores do logo salvo'),undefined);m.cleanup();
});

test('cliques duplicados, escolha manual e resposta atrasada preservam a escolha mais recente',async()=>{
  let resolver,chamadas=0;
  const m=montar({recuperar:()=>{chamadas++;return new Promise(r=>{resolver=r;});}});
  const inicio=m.botao('Sugerir cores do logo salvo').props.onClick;
  inicio();inicio();assert.equal(chamadas,1);
  assert.equal(m.botao('Sugerir cores do logo salvo').props.disabled,true);
  m.botao('Adicionar cor manualmente').props.onClick();
  resolver({ok:true,cores:propostas});await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(m.render().filter(n=>n.type==='input'&&n.props.type==='color').map(n=>n.props.value),['#1250DC']);
  assert.equal(m.salvos.length,0);m.cleanup();
});

test('falha permite tentar novamente e nunca declara cores confirmadas',async()=>{
  const m=montar({recuperar:async()=>({ok:false})});
  m.botao('Sugerir cores do logo salvo').props.onClick();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(m.botao('Sugerir cores do logo salvo').props.disabled,false);
  assert.equal(m.render().filter(n=>n.type==='input'&&n.props.type==='color').length,0);
  assert.equal(m.salvos.length,0);m.cleanup();
});

test('sair da tela cancela a leitura; uma resposta tardia não aplica sugestões',async()=>{
  let resolver,sinal;
  const m=montar({recuperar:(_logo,_id,signal)=>{sinal=signal;return new Promise(r=>{resolver=r;});}});
  m.botao('Sugerir cores do logo salvo').props.onClick();m.cleanup();assert.equal(sinal.aborted,true);
  resolver({ok:true,cores:propostas});await new Promise(resolve=>setImmediate(resolve));
  assert.equal(m.render().filter(n=>n.type==='input'&&n.props.type==='color').length,0);
});

test('salvar no mesmo instante da leitura não usa confirmação anterior nem envia dados',async()=>{
  let resolver;
  const m=montar({recuperar:()=>new Promise(r=>{resolver=r;})});
  const iniciar=m.botao('Sugerir cores do logo salvo').props.onClick;
  const salvar=m.botao('Guardar e escolher horário').props.onClick;
  iniciar();await salvar();assert.equal(m.salvos.length,0);
  m.cleanup();resolver({ok:false});await new Promise(resolve=>setImmediate(resolve));
});

test('troca do contexto recebido cancela sugestões do negócio anterior',async()=>{
  let resolver,sinal;
  const m=montar({recuperar:(_logo,_id,signal)=>{sinal=signal;return new Promise(r=>{resolver=r;});}});
  m.botao('Sugerir cores do logo salvo').props.onClick();m.trocarNegocio();m.render();
  assert.equal(sinal.aborted,true);resolver({ok:true,cores:propostas});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(m.render().filter(n=>n.type==='input'&&n.props.type==='color').length,0);m.cleanup();
});

test('página real passa a recuperação apenas pelo portão QA e após carregar o negócio',async()=>{
  for(const habilitado of [true,false]){
    const props={businessId:A,site:'',instagram:'',marca:null,faltamBasicas:[],respostasBasicas:{}};
    const {default:Page}=ambienteTs({ports:{
      './actions':{carregarMarcaAction:async()=>props},'./Marca':{Marca:()=>null},
      '@/components/ui/Marca':{Marca:()=>null},
      '@/lib/identidade/armazenar':{listarIdentidade:async id=>{assert.equal(id,A);return{logo,fotos:[]};}},
      './variacoes-actions':{carregarVariacoesVisuais:async()=>[]},
      '@/lib/piloto-qa/acesso':{pilotoQaHabilitado:()=>habilitado},
      '../onboarding-editorial.css':{},
    }}).load('app/(fluxo)/onboarding/marca/page.tsx');
    function achar(n){if(!n||typeof n!=='object')return null;if(Array.isArray(n))return n.map(achar).find(Boolean);
      return n.props?.inicial?n:achar(n.props?.children);}
    const componente=achar(await Page());assert.ok(componente);assert.equal(componente.props.recuperarCoresSalvas,habilitado);
  }
});
