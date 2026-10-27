import assert from "node:assert/strict";
import { triarReferencias, type AnuncioObservado, type ClassificacaoJev } from "../lib/jev/triagem-referencias.ts";
import { avaliarCortesDePertinencia } from "../lib/jev/avaliar-cortes.ts";

const anuncios: AnuncioObservado[] = ["101", "102", "103", "104"].map((id) => ({
  id, url: `https://www.facebook.com/ads/library/?id=${id}`,
  anunciante: `Barbearia fictícia ${id}`, inicioExibido: "2026-06-01",
  observadoEm: "2026-10-26", situacaoExibida: "ativo",
  midiaObservada: "imagem", fonte: "biblioteca_meta_interface",
}));
const classes: ClassificacaoJev[] = [
  { id: "101", rotulo: "servico_barbearia", confianca: 0.9 },
  { id: "102", rotulo: "servico_barbearia", confianca: 0.81 },
  { id: "103", rotulo: "outro", confianca: 0.41 },
  { id: "104", rotulo: "outro", confianca: 0.95 },
];
const referencias = triarReferencias(anuncios, classes);
assert.equal(referencias[2]?.destino, "revisao_de_classificacao");

const parcial = avaliarCortesDePertinencia(referencias, [{ id: "103", pertenceAoNicho: true }]);
assert.deepEqual(parcial.map((a) => a.selecionados), [2, 1]);
assert.deepEqual(parcial.map((a) => a.falsosNegativosConhecidos), [1, 1]);
assert.ok(parcial.every((a) => a.precisao === null && a.cobertura === null));

const completo = avaliarCortesDePertinencia(referencias, [
  { id: "101", pertenceAoNicho: true },
  { id: "102", pertenceAoNicho: false },
  { id: "103", pertenceAoNicho: true },
  { id: "104", pertenceAoNicho: false },
]);
assert.equal(completo[0]?.precisao, 0.5);
assert.equal(completo[0]?.cobertura, 0.5);
assert.equal(completo[1]?.precisao, 1);
assert.equal(completo[1]?.cobertura, 0.5);
assert.throws(() => avaliarCortesDePertinencia(referencias, [{ id: "101", pertenceAoNicho: true }, { id: "101", pertenceAoNicho: false }]), /repetida/);
assert.throws(() => avaliarCortesDePertinencia(referencias, [], [1.2]), /inválido/);
console.log("avaliação de cortes Jev: 9 verificações fictícias");
