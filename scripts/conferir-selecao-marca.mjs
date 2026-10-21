import assert from "node:assert/strict";
import { selecionarMarcaParaGeracao } from "../lib/criativos/selecionar-marca.ts";

const negocio = "barbearia-1";
const caminho = (id) => `identidade/${negocio}/${id}.png`;
const logo = { id: "logo-1", business_id: negocio, uso: "logo", storage_path: caminho("logo"),
  created_at: "2026-10-20T00:00:00Z", arquivado_em: null, copy: {} };
const fachada = { ...logo, id: "foto-1", uso: "identidade", storage_path: caminho("fachada"),
  copy: { identidade: { tipoFoto: "fachada" } } };
const autorizar = (imagemId) => ({ imagemId, businessId: negocio,
  finalidade: "geracao_imagem", autorizadoEm: "2026-10-20T00:01:00Z",
  autorizadoPor: "usuario-1", revogadoEm: null });
const base = { businessId: negocio, logoId: logo.id, usarFachada: true,
  fachadaId: fachada.id, linhas: [logo, fachada],
  autorizacoesConferidas: [autorizar(logo.id), autorizar(fachada.id)] };
let casos = 0;
function teste(nome, entrada, esperado, sucesso = false) {
  const r = selecionarMarcaParaGeracao(entrada);
  assert.equal(r.ok, sucesso, nome);
  if (esperado) assert.ok(!r.ok && r.pendencias.includes(esperado), nome);
  casos += 1;
  return r;
}
const valido = teste("logo e fachada autorizados", base, null, true);
assert.equal(valido.logo.caminhoPrivado, caminho("logo"));
assert.equal(valido.fachada.caminhoPrivado, caminho("fachada"));
teste("sem fachada pedida", { ...base, usarFachada: false, fachadaId: null }, null, true);
teste("foto antiga sem tipo não vira fachada", { ...base, linhas: [logo, { ...fachada, copy: {} }] }, "fachada_nao_elegivel");
teste("ambiente não vira fachada", { ...base, linhas: [logo, { ...fachada, copy: { identidade: { tipoFoto: "ambiente" } } }] }, "fachada_nao_elegivel");
teste("linha de outro negócio bloqueada", { ...base, linhas: [{ ...logo, business_id: "outro" }, fachada] }, "logo_nao_elegivel");
teste("caminho de outro negócio bloqueado", { ...base, linhas: [logo, { ...fachada, storage_path: "identidade/outro/foto.png" }] }, "fachada_nao_elegivel");
teste("arquivada bloqueada", { ...base, linhas: [{ ...logo, arquivado_em: "2026-10-20T01:00:00Z" }, fachada] }, "logo_nao_elegivel");
teste("upload não autoriza IA", { ...base, autorizacoesConferidas: [] }, "autorizacao_logo_ausente");
teste("autorização da fachada é própria", { ...base, autorizacoesConferidas: [autorizar(logo.id)] }, "autorizacao_fachada_ausente");
teste("revogação bloqueia", { ...base, autorizacoesConferidas: [{ ...autorizar(logo.id), revogadoEm: "2026-10-20T02:00:00Z" }, autorizar(fachada.id)] }, "autorizacao_logo_ausente");
teste("autorização de outro negócio bloqueia", { ...base, autorizacoesConferidas: [{ ...autorizar(logo.id), businessId: "outro" }, autorizar(fachada.id)] }, "autorizacao_logo_ausente");
teste("ID duplicado falha fechado", { ...base, linhas: [logo, logo, fachada] }, "logo_nao_elegivel");
console.log(`Seleção local da marca: ${casos}/${casos} casos sintéticos passaram.`);
