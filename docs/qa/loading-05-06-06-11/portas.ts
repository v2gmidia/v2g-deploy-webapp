// Portas explicitamente fictícias. Este bundle nunca carrega actions de servidor.
export const useRouter = () => (window as any).ensaio.router;
export async function analisarPecaAction() {
  await (window as any).ensaio.chamar('analise');
  return {ok:true,analise:{veredito:'presta',motivos:['Resultado FICTÍCIO'],recusados:[],motivo:null}};
}
export async function solicitarRevisaoAction(dados:FormData) {
  await (window as any).ensaio.chamar('upload');
  return {ok:true,id:dados.get('submissaoId'),repetido:false,analisarAgora:true};
}
export async function guardarPedidoAction(_anterior:unknown,dados:FormData) {
  await (window as any).ensaio.chamar('guardar');
  return {ok:true,id:dados.get('requestId')};
}
export async function acompanharGeracaoAction() { throw Error('Use consultar fictício explícito'); }
export const ReferenciasDoNicho = () => null;
