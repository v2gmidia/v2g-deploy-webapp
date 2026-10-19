import assert from "node:assert/strict";
import { lerRespostaVisual, montarFormularioVisual, prepararPedidoVisual } from "../lib/jev/criativos-piloto.ts";

let verificacoes = 0;
function conferir(condicao: unknown, mensagem: string): void {
  assert.ok(condicao, mensagem);
  verificacoes += 1;
}

/** Cabeçalho sintético: serve somente para testar a preparação, não é uma imagem para envio. */
function pngDeTeste(largura: number, altura: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const dimensoes = new DataView(bytes.buffer);
  dimensoes.setUint32(16, largura);
  dimensoes.setUint32(20, altura);
  return bytes;
}

function jpegDeTeste(largura: number, altura: number): Uint8Array {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08,
    (altura >> 8) & 0xff, altura & 0xff, (largura >> 8) & 0xff, largura & 0xff, 0, 0]);
  return bytes;
}

const preparado = prepararPedidoVisual(pngDeTeste(500, 500), "Oferta declarada pelo cliente");
conferir(preparado.ok, "PNG e dimensões aceitas");
if (!preparado.ok) throw new Error("fixture de imagem recusada");
conferir(preparado.pedido.state.textoAnuncio === "Oferta declarada pelo cliente", "texto permanece dado do estado");
conferir(Object.keys(preparado.pedido.assets)[0] === preparado.pedido.state.imagem, "referência única aponta para o asset");
conferir(preparado.pedido.questions.formato.type === "choice" &&
  preparado.pedido.questions.oferta_explicita.type === "noul", "perguntas fechadas no mesmo pedido");
conferir(preparado.cabecalhos["TypeSafe-Danger-Zone-Images"] === "true", "imagem experimental exige cabeçalho explícito");

const formulario = montarFormularioVisual(preparado);
conferir(formulario.has("request") && formulario.has("imagem"), "multipart contém JSON e arquivo");
const pedidoNoFormulario = JSON.parse(await (formulario.get("request") as Blob).text());
conferir(pedidoNoFormulario.model === "jev-1.13.0" &&
  pedidoNoFormulario.assets[preparado.pedido.state.imagem].part === "imagem", "multipart segue contrato da API");

conferir(prepararPedidoVisual(new Uint8Array()).ok === false, "arquivo vazio recusado");
conferir(prepararPedidoVisual(new Uint8Array(9 * 1024 * 1024 + 1)).ok === false, "limite local de tamanho respeitado");
conferir(prepararPedidoVisual(new Uint8Array([1, 2, 3])).ok === false, "formato falso recusado");
conferir(prepararPedidoVisual(pngDeTeste(200, 500)).ok === false, "imagem pequena recusada");
conferir(prepararPedidoVisual(pngDeTeste(1569, 500)).ok === false, "imagem larga recusada");
conferir(prepararPedidoVisual(pngDeTeste(500, 500), "x".repeat(2_001)).ok === false, "texto grande recusado");
const jpeg = prepararPedidoVisual(jpegDeTeste(800, 600));
conferir(jpeg.ok && jpeg.mimeType === "image/jpeg", "JPEG reconhecido pelos bytes");
if (!jpeg.ok) throw new Error("fixture JPEG recusada");
conferir((montarFormularioVisual(jpeg).get("imagem") as File).type === "image/jpeg", "multipart preserva MIME JPEG");

const resposta = {
  answers: {
    formato: { choice: "produto", confidence: 0.9 },
    gancho: { choice: "beneficio", confidence: 0.7 },
    sinal_de_prova: { choice: "nenhum", confidence: 0.95 },
    oferta_explicita: { noul: 0.4 },
  },
};
const leitura = lerRespostaVisual(resposta);
conferir(leitura?.rotulos.formato === "produto" && leitura.rotulos.gancho === "beneficio", "rótulos válidos lidos");
conferir(leitura?.exigeRevisaoHumana === true && leitura.comprovaDesempenho === false,
  "classificação não aprova nem prova desempenho");
conferir(leitura?.probabilidadeDeOfertaExplicita === 0.4, "Noul permanece probabilidade, não sim/não inventado");
conferir(lerRespostaVisual({ answers: { ...resposta.answers, formato: { choice: "vencedor", confidence: 1 } } }) === null,
  "rótulo fora da taxonomia recusado");
conferir(lerRespostaVisual({ answers: { ...resposta.answers, gancho: { choice: "beneficio", confidence: 2 } } }) === null,
  "confiança fora de 0 a 1 recusada");
conferir(lerRespostaVisual({ answers: { ...resposta.answers, oferta_explicita: undefined } }) === null,
  "resposta incompleta recusada");

console.log(`piloto visual Jev: ${verificacoes}/${verificacoes}`);
