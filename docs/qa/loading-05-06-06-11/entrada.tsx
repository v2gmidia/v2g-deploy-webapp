// Componentes reais, portas fictícias; nenhum Auth/DB/Storage/Meta/Jev/gerador.
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {PedirRevisao} from '../../../app/(protected)/criativos/PedirRevisao';
import {Analisar} from '../../../app/(protected)/criativos/Analisar';
import {AndamentoDaImagem} from '../../../app/(protected)/criativos/AndamentoDaImagem';
import {GaleriaCriativos} from '../../../app/(protected)/criativos/GaleriaCriativos';
import {PedidoDeImagem} from '../../../app/(protected)/criativos/PedidoDeImagem';
import CarregandoCriativos from '../../../app/(protected)/criativos/loading';
import CarregandoAnuncios from '../../../app/(protected)/anuncios/loading';
import {AtualizacaoDaConsulta} from '../../../app/(protected)/anuncios/AtualizacaoDaConsulta';
import {InventarioDeAnunciosMeta} from '../../../app/(protected)/anuncios/AnunciosMeta';

const business='11111111-1111-4111-8111-111111111111',request='22222222-2222-4222-8222-222222222222';
const ensaio:any={ms:150,falha:false,contagens:{},eventos:[],publicado:0,geracoes:0,notify:()=>{},router:{}};
(window as any).ensaio=ensaio;
ensaio.chamar=async(tipo:string)=>{
  ensaio.contagens[tipo]=(ensaio.contagens[tipo]??0)+1;
  const inicio=performance.now(),ms=ensaio.ms,falha=ensaio.falha;
  ensaio.notify();
  await new Promise(r=>setTimeout(r,ms));
  ensaio.eventos.push(`${tipo}: ${(performance.now()-inicio).toFixed(0)} ms · ${falha?'falha fictícia':'resposta fictícia'}`);
  ensaio.notify();
  if(falha)throw Error('FALHA_FICTICIA');
};
ensaio.router.refresh=()=>{ensaio.contagens.refresh=(ensaio.contagens.refresh??0)+1;ensaio.notify();};
const base={ok:true as const,requestId:request,businessId:business,jobId:request,status:'running' as const,simulada:true,consultarEm:null,imagemUrl:null};
const consultar=async(b:string,r:string,op:string)=>{
  try{await ensaio.chamar(op);}
  catch{return {ok:false as const,motivo:'conferir_estado' as const};}
  return {...base,businessId:b,requestId:r,status:op==='cancelar'?'cancelled' as const:'running' as const};
};
const item={id:'ficticio',nome:'CRIATIVO FICTÍCIO',imagemUrl:'/imagem-lenta.svg',grupo:'biblioteca' as const,estado:'Guardada',tom:'neutro' as const,criadoEm:'06/11/2026'};
async function selecionar() {
  const canvas=document.createElement('canvas');canvas.width=1088;canvas.height=1088;
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#ECF5F2';ctx.fillRect(0,0,1088,1088);ctx.fillStyle='#102A35';ctx.font='64px sans-serif';ctx.fillText('FICTÍCIO — TESTE LOCAL',50,500);
  const blob=await new Promise<Blob>(r=>canvas.toBlob(b=>r(b!),'image/png'));
  for(const campo of document.querySelectorAll<HTMLInputElement>('input[type=file]')){
    const dt=new DataTransfer();dt.items.add(new File([blob],'FICTICIO.png',{type:'image/png'}));campo.files=dt.files;campo.dispatchEvent(new Event('change',{bubbles:true}));
  }
}
function App(){
  const [versao,setVersao]=useState(0),[tela,setTela]=useState('envio'),[chave,setChave]=useState(0),[modo,setModo]=useState('rápido');
  ensaio.notify=()=>setVersao(v=>v+1);
  ensaio.router.push=async(url:string)=>{try{await ensaio.chamar('filtro');ensaio.destino=url;}catch{ensaio.destino='Falha fictícia de leitura. Nenhum zero preenchido.';}ensaio.notify();};
  return <div className="app-shell v2g-editorial"><main className="bancada">
    <h1>Loading 05/06 · ensaio local</h1><p className="form-warning">DADOS FICTÍCIOS. Componentes reais com chamadas substituídas. Nenhuma geração, análise paga, publicação ou gravação externa.</p>
    <fieldset><legend>Controles do ensaio</legend><label>Cenário <select value={modo} onChange={e=>{setModo(e.target.value);ensaio.ms=e.target.value==='rápido'?150:e.target.value==='lento'?2500:30_000;}}><option>rápido</option><option>lento</option><option>mais de 10 s</option></select></label>
      <label><input type="checkbox" onChange={e=>{ensaio.falha=e.target.checked;}}/>Falhar próxima resposta</label>
      <label>Tela <select value={tela} onChange={e=>setTela(e.target.value)}>{['envio','análise','geração','galeria','pedido','filtros','skeleton criativos','skeleton anúncios'].map(t=><option key={t}>{t}</option>)}</select></label>
      <button onClick={()=>{setChave(v=>v+1);ensaio.contagens={};ensaio.eventos=[];ensaio.notify();}}>Reiniciar somente este componente</button>
      <button onClick={()=>void selecionar()}>Selecionar imagem fictícia</button>
      <button onClick={()=>{const form=document.querySelector<HTMLFormElement>('form');if(form){form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}}}>Testar dois envios imediatos</button>
    </fieldset>
    <output aria-live="polite">Chamadas fictícias: {JSON.stringify(ensaio.contagens)} · Destino: {ensaio.destino??'nenhum'} · Publicações: 0</output>
    <ul>{ensaio.eventos.map((e:string,i:number)=><li key={i}>{e}</li>)}</ul>
    <div key={`${tela}:${chave}`} className="criativos-editorial">
      {tela==='envio'?<section className="criativos-envio"><PedirRevisao businessId={business} hoje="2026-11-06"/></section>:null}
      {tela==='análise'?<Analisar businessId={business} podeEnviar/>:null}
      {tela==='geração'?<AndamentoDaImagem businessId={business} requestId={request} habilitada consultar={consultar} simulacao/>:null}
      {tela==='galeria'?<GaleriaCriativos itens={[item]}/>:null}
      {tela==='pedido'?<PedidoDeImagem businessId={business} requestId={request} hoje="2026-11-06" pedidos={[]} falhou={false}/>:null}
      {tela==='filtros'?<AtualizacaoDaConsulta hoje="2026-11-06"><details open><summary>Escolher período</summary><form className="periodo-form"><label>Data inicial<input type="date" name="desde" defaultValue="2026-11-01"/></label><label>Data final<input type="date" name="ate" defaultValue="2026-11-06"/></label><button>Aplicar período</button></form></details>
        <InventarioDeAnunciosMeta periodo={{desde:'2026-11-01',ate:'2026-11-06'}} resultado={{ok:true,contas:[{id:'act_9001'},{id:'act_9002'}],contaSelecionada:'act_9001',dados:{businessId:business,contaId:'act_9001',periodo:{desde:'2026-11-01',ate:'2026-11-06'},moeda:'BRL',fuso:'America/Sao_Paulo',coletadoEm:'2026-11-06T12:00:00Z',campanhas:[]}}}/>
        <p>Leitura anterior FICTÍCIA · conta act_9001 · 01/11–06/11 · valor conhecido R$ 123,45</p></AtualizacaoDaConsulta>:null}
      {tela==='skeleton criativos'?<CarregandoCriativos/>:null}{tela==='skeleton anúncios'?<CarregandoAnuncios/>:null}
    </div><span className="sr-only">Render {versao}</span>
  </main></div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
