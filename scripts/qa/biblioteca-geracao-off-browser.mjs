/** Regressão pelo cua_repl: fonte persistida da biblioteca != última resposta de geração. */
import assert from 'node:assert/strict';
export async function conferirBibliotecaComGeracaoOff(tab) {
  const provas=[];
  const observar=()=>tab.getAXState({emit:false,disableDiffing:true});
  async function clicar(nome) {await tab.playwright.getByRole('button',{name:nome,exact:true}).click();await observar();}
  async function texto(valor) {await tab.playwright.getByText(valor,{exact:true}).waitFor({state:'visible',timeoutMs:15000});await observar();}
  async function biblioteca(contagem) {
    await tab.playwright.getByRole('button',{name:new RegExp(`^Biblioteca\\s*${contagem}$`)}).waitFor({state:'visible',timeoutMs:15000});
    const estado=await observar();
    if(contagem!=='0')assert.ok(!estado.includes('Nenhuma peça aqui.'));
    return estado;
  }
  async function controles() {await tab.playwright.getByText('Controles do ensaio',{exact:true}).click();await observar();}
  async function contagens(passo) {
    await clicar('Conferir contagens');
    const locator=tab.playwright.getByTestId('fila-evidencias');
    await locator.filter({hasText:/Trabalhos:\s*1\s*· Recibos fictícios:\s*1\s*· Envios:\s*1\s*· Consultas:/}).waitFor({state:'visible',timeoutMs:15000});
    const contagem=await locator.innerText();assert.match(contagem,/Trabalhos:\s*1\s*· Recibos fictícios:\s*1\s*· Envios:\s*1/);
    provas.push({passo,pedido:await tab.playwright.getByTestId('fila-pedido').innerText(),contagem});
  }
  await tab.reload();await observar();await clicar('Limpar ensaio');await texto('Nenhum pedido deste negócio no ensaio.');
  await clicar('Preparar pedido fictício');await tab.playwright.getByRole('button',{name:'Criar imagem de teste',exact:true}).waitFor({state:'visible',timeoutMs:15000});
  await clicar('Criar imagem de teste');await texto('Na fila');await controles();await clicar('Processar fila fictícia');
  await texto('Imagem de teste disponível');await biblioteca('1');await contagens('gerado: biblioteca 1');
  await clicar('Desligar backend do ensaio');await clicar('Consultar andamento');
  await texto('A criação de imagens está indisponível agora. Seu pedido continua guardado.');await biblioteca('1');
  await contagens('geração OFF + consulta: biblioteca 1');
  await tab.reload();await observar();await biblioteca('1');
  await texto('A criação de imagens está indisponível agora. Seu pedido continua guardado.');await controles();
  await contagens('reload com geração OFF: biblioteca 1');
  await clicar('Indisponibilizar fonte da biblioteca');
  await texto('Não foi possível conferir toda a biblioteca agora. Isso não significa que os criativos foram removidos.');
  await biblioteca('—');provas.push({passo:'fonte da biblioteca indisponível: erro, contagem desconhecida, sem falso vazio'});
  await tab.reload();await observar();
  await texto('A biblioteca está indisponível. Tente consultar novamente.');await biblioteca('—');await controles();
  provas.push({passo:'reload com fonte indisponível: erro, sem Nenhuma peça aqui'});
  await clicar('Restaurar fonte da biblioteca');await biblioteca('1');
  await contagens('fonte restaurada, geração ainda OFF: biblioteca 1');
  await clicar('Religar backend do ensaio');await clicar('Consultar andamento');await texto('Imagem de teste disponível');await biblioteca('1');
  await contagens('geração ON novamente: biblioteca 1, sem nova geração');
  await clicar('Trocar negócio fictício');await biblioteca('0');await texto('Nenhum pedido deste negócio no ensaio.');
  provas.push({passo:'negócio B: biblioteca 0 confirmada, sem card do A'});
  await clicar('Trocar negócio fictício');await biblioteca('1');await texto('Imagem de teste disponível');
  return {resultado:'PASSOU',ambiente:'LOCAL FICTICIO',provas};
}
