import assert from "node:assert/strict";
import { consultarJevLote, lerRespostaLoteJev, montarPedidoLoteJev } from "../lib/jev/lote-referencias.ts";
import { triarReferencias, type AnuncioObservado } from "../lib/jev/triagem-referencias.ts";

const base: AnuncioObservado = {
  id: "100001", url: "https://www.facebook.com/ads/library/?id=100001",
  anunciante: "Barbearia Fictícia", inicioExibido: "2026-01-01", observadoEm: "2026-10-26",
  situacaoExibida: "ativo", midiaObservada: "imagem", fonte: "biblioteca_meta_interface",
};
const anuncios = [
  { ...base, resumoPublico: "Corte de cabelo para clientes, agende um horário." },
  { ...base, id: "100002", url: "https://www.facebook.com/ads/library/?id=100002",
    anunciante: "Loja Fictícia", resumoPublico: "Cadeira para barbeiros." },
];
const pedido = montarPedidoLoteJev(anuncios);
assert.equal(pedido.state.anuncios.length, 2);
assert.deepEqual(Object.keys(pedido.questions), ["anuncio_0", "anuncio_1"]);
const resposta = { usage: { input_tokens: 120, output_tokens: 30 }, answers: {
  anuncio_0: { choice: "servico_barbearia", confidence: 0.95 },
  anuncio_1: { choice: "fornecedor_barbearia", confidence: 0.98 },
} };
const classificacoes = lerRespostaLoteJev(pedido, resposta);
assert.deepEqual(classificacoes.map(({ id }) => id), ["100001", "100002"]);
const triagem = triarReferencias(anuncios, classificacoes);
assert.deepEqual(triagem.map(({ destino }) => destino), ["candidato_para_revisao", "fora_do_recorte"]);
assert.ok(triagem.every(({ comprovaDesempenho, exigeRevisaoHumana }) => !comprovaDesempenho && exigeRevisaoHumana));

let requisicoes = 0;
const fetchFicticio: typeof fetch = async (url, init) => {
  requisicoes += 1;
  assert.equal(url, "https://api.typesafe.ai/v1/systemone");
  assert.equal(init?.method, "POST");
  assert.deepEqual(JSON.parse(String(init?.body)), pedido);
  return new Response(JSON.stringify(resposta), { status: 200 });
};
assert.deepEqual(await consultarJevLote(pedido, "chave-ficticia", fetchFicticio), {
  classificacoes, tokensEntrada: 120, tokensSaida: 30,
});
assert.equal(requisicoes, 1);
assert.throws(() => montarPedidoLoteJev([]), /entre 1 e 20/);
assert.throws(() => montarPedidoLoteJev([...anuncios, anuncios[0]!]), /repetido/);
assert.throws(() => montarPedidoLoteJev([{ ...anuncios[0]!, resumoPublico: "x".repeat(281) }]), /longo/);
assert.throws(() => montarPedidoLoteJev([{ ...anuncios[0]!, midiaObservada: "video" }]), /elegível/);
assert.throws(() => lerRespostaLoteJev(pedido, { answers: { anuncio_0: resposta.answers.anuncio_0 } }), /incompleta/);
assert.throws(() => lerRespostaLoteJev(pedido, { answers: { ...resposta.answers, anuncio_1: { choice: "vencedor", confidence: 1 } } }), /inválida/);
await assert.rejects(() => consultarJevLote(pedido, "", fetchFicticio), /ausente/);
assert.equal(requisicoes, 1);
console.log("lote Jev e triagem: verificações passaram");
