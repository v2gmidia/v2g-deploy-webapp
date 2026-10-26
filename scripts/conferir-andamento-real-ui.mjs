/** Render da UI real com estado fixado; efeitos/rede desligados, não é ensaio autenticado. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {ambienteTs} from './test-utils/ts-isolado.mjs';
const business='33333333-3333-4333-8333-333333333333',request='55555555-5555-4555-8555-555555555555';
function render(estado,simulacao=false) {
  const estados=[estado,false,false];
  const a=ambienteTs({ports:{react:{useState:()=>[estados.shift(),()=>{}],useRef:v=>({current:v}),useCallback:f=>f,useEffect(){}},
    'next/navigation':{useRouter:()=>({refresh(){throw Error('efeito desligado no render');}})},
    './geracao-actions':{acompanharGeracaoAction(){throw Error('sem chamada no render');}},
    './pedido-de-imagem.module.css':{default:{}},
  }});
  return renderToStaticMarkup(a.load('app/(protected)/criativos/AndamentoDaImagem.tsx').AndamentoDaImagem({businessId:business,requestId:request,habilitada:true,simulacao}));
}
const sucesso={ok:true,requestId:request,businessId:business,jobId:'88888888-8888-4888-8888-888888888888',status:'artifact_available',simulada:false,consultarEm:null,imagemUrl:`/criativos/imagem-gerada/${request}?negocio=${business}`};
test('sucesso real tem imagem criada/alt correto, sem alegar teste ou publicação',()=>{
  const html=render(sucesso);assert.match(html,/Imagem criada/);assert.match(html,/alt="Imagem criada para este negócio"/);assert.match(html,/Nenhum anúncio foi publicado/);
  assert.ok(!html.includes('Imagem de teste disponível'));assert.ok(!html.includes('Criar imagem de teste'));assert.ok(!html.includes('SIMULAÇÃO LOCAL'));
});
test('pedido real sem execução não oferece criação fictícia nem converte liberação em sucesso',()=>{
  assert.ok(!render({ok:false,motivo:'nao_iniciado',podeSubmeter:false}).includes('Criar imagem de teste'));
  const html=render({ok:false,motivo:'submissao_real_pendente',podeSubmeter:false});assert.match(html,/aguarda a liberação da equipe/);assert.ok(!html.includes('Imagem criada'));
});
test('simulação explícita de componente preserva bancada; veto do servidor continua prevalecendo',()=>{
  assert.match(render({ok:false,motivo:'nao_iniciado'},true),/Criar imagem de teste/);
  assert.ok(!render({ok:false,motivo:'nao_iniciado',podeSubmeter:false},true).includes('Criar imagem de teste'));
});
test('reconciliação conserva mensagem de conferência sem botão de nova geração',()=>{
  const html=render({...sucesso,status:'reconciliation_required',imagemUrl:null});assert.match(html,/Nenhuma nova criação será iniciada/);assert.ok(!html.includes('Criar imagem de teste'));
});
test('dispatcher real só oferece iniciar com permissão explícita e não oferece cancelamento indisponível',()=>{
  const inicio=render({ok:false,motivo:'nao_iniciado',podeSubmeter:true,tipoCriacao:'real'});assert.match(inicio,/>Criar imagem<\/button>/);assert.ok(!inicio.includes('Criar imagem de teste'));
  const fila=render({...sucesso,status:'queued',imagemUrl:null,consultarEm:2000});assert.match(fila,/Na fila/);assert.ok(!fila.includes('Cancelar pedido na fila'));
});
