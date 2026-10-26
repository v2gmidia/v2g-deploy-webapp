/** Executar pelo cua_repl passando a aba localhost já selecionada.
 * Testa reload REAL, sem injetar estado, buscar APIs por fora ou preparar após reload.
 * O servidor scripts/servir-fila-geracao-local.mjs é exclusivamente fictício/loopback.
 */
import assert from 'node:assert/strict';
const PEDIDO='55555555-5555-4555-8555-555555555555';
export async function conferirRetomadaNoNavegador(tab) {
  const provas=[];
  const observar=()=>tab.getAXState({emit:false,disableDiffing:true});
  async function clicar(nome) {
    await tab.playwright.getByRole('button',{name:nome,exact:true}).click();
    await observar();
  }
  async function fila() {
    await tab.playwright.getByText('Na fila',{exact:true}).waitFor({state:'visible',timeoutMs:15000});
    const estado=await observar();assert.ok(estado.includes('Na fila'));return estado;
  }
  async function conferirContagens() {
    await clicar('Conferir contagens');
    const contagens=tab.playwright.getByTestId('fila-evidencias');
    await contagens.filter({hasText:/Trabalhos:\s*1\s*· Recibos fictícios:\s*0\s*· Envios:\s*1\s*· Consultas:/}).waitFor({state:'visible',timeoutMs:15000});
    const pedido=await tab.playwright.getByTestId('fila-pedido').innerText();
    const texto=await contagens.innerText();assert.equal(pedido.trim(),`Pedido: ${PEDIDO}`);
    assert.match(texto,/Trabalhos:\s*1\s*· Recibos fictícios:\s*0\s*· Envios:\s*1\s*· Consultas:/);
    return {pedido:PEDIDO,contagens:texto};
  }
  await tab.reload();await observar();
  await clicar('Limpar ensaio');
  await tab.playwright.getByText('Nenhum pedido deste negócio no ensaio.',{exact:true}).waitFor({state:'visible',timeoutMs:15000});
  await clicar('Preparar pedido fictício');
  await tab.playwright.getByRole('button',{name:'Criar imagem de teste',exact:true}).waitFor({state:'visible',timeoutMs:15000});
  await clicar('Criar imagem de teste');await fila();
  await tab.playwright.getByText('Controles do ensaio',{exact:true}).click();await observar();
  provas.push({passo:'submetido',...await conferirContagens()});
  await clicar('Preparar pedido fictício');await fila();
  provas.push({passo:'preparar repetido',...await conferirContagens()});
  for(let numero=1;numero<=2;numero++) {
    await tab.reload();
    const inicial=await observar();
    assert.ok(!inicial.includes('Nenhum pedido deste negócio no ensaio.'),'Leitura pendente não pode fingir ausência de pedido');
    await fila();
    await tab.playwright.getByText('Controles do ensaio',{exact:true}).click();await observar();
    provas.push({passo:`reload real ${numero}, sem preparar`,...await conferirContagens()});
  }
  return {resultado:'PASSOU',ambiente:'LOCAL FICTICIO',provas};
}
