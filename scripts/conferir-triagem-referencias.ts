import assert from "node:assert/strict";
import { triarReferencias, type AnuncioObservado, type ClassificacaoJev } from "../lib/jev/triagem-referencias.ts";

const anuncio: AnuncioObservado = {
  id: "100001", url: "https://www.facebook.com/ads/library/?id=100001",
  anunciante: "Barbearia Fictícia", inicioExibido: "2026-06-01", observadoEm: "2026-10-26",
  situacaoExibida: "ativo", midiaObservada: "imagem", fonte: "biblioteca_meta_interface",
};
const classe: ClassificacaoJev = { id: anuncio.id, rotulo: "servico_barbearia", confianca: 0.96 };
function primeira(
  anuncios: AnuncioObservado[], respostas: ClassificacaoJev[],
) {
  const resultado = triarReferencias(anuncios, respostas)[0];
  assert.ok(resultado);
  return resultado;
}

const candidato = primeira([anuncio], [classe]);
assert.equal(candidato.destino, "candidato_para_revisao");
assert.equal(candidato.faixaDeContinuidade, "90_dias_ou_mais");
assert.equal(candidato.exigeRevisaoHumana, true);
assert.equal(candidato.comprovaDesempenho, false);
assert.equal(candidato.credibilidadeVerificada, false);

assert.equal(primeira([{ ...anuncio, id: "100002", url: "https://www.facebook.com/ads/library/?id=100002", midiaObservada: "video" }], [
  { ...classe, id: "100002" },
]).destino, "fora_do_recorte");
assert.equal(primeira([anuncio], [{ ...classe, rotulo: "fornecedor_barbearia" }]).destino, "fora_do_recorte");
assert.equal(primeira([anuncio], [{ ...classe, rotulo: "outro", confianca: 0.41 }]).destino, "revisao_de_classificacao");
assert.equal(primeira([anuncio], [{ ...classe, rotulo: "outro", confianca: 0.96 }]).destino, "fora_do_recorte");
assert.equal(primeira([anuncio], [{ ...classe, confianca: 0.69 }]).destino, "revisao_de_classificacao");
assert.equal(primeira([{ ...anuncio, inicioExibido: "2026-10-27" }], [classe]).destino, "dados_insuficientes");
assert.equal(primeira([anuncio], []).destino, "dados_insuficientes");
assert.throws(() => triarReferencias([anuncio, anuncio], [classe]), /repetido/);
assert.throws(() => triarReferencias([anuncio], [classe, classe]), /repetida/);
assert.throws(() => triarReferencias([anuncio], [{ ...classe, confianca: 1.2 }]), /inválida/);
assert.throws(() => triarReferencias([{ ...anuncio, url: "https://www.facebook.com/ads/library/?id=999999" }], [classe]), /diverge/);

console.log("triagem de referências: 12/12");
