import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { registrarPedidoDeImagem, hashDoPedido } from "../lib/criativos/pedido-imagem.ts";

const negocio = "12345678-1234-4234-8234-123456789012";
const perfil = "22345678-1234-4234-8234-123456789012";
const id = "32345678-1234-4234-8234-123456789012";
const base = { habilitado: true, id, negocioEsperado: negocio, objetivo: "Apresentar serviço",
  oferta: "Corte de cabelo", acao: "Chamar no WhatsApp da empresa", promocao: false,
  validade: "", confirmado: true };
let linhas, insercoes, sessao, falha;
beforeEach(() => { linhas = new Map(); insercoes = 0;
  sessao = { profileId: perfil, businessId: negocio }; falha = false; });

function portas() {
  return { hoje: "2026-10-20", sessao: async () => sessao, repositorio: {
    buscar: async (chave, businessId) => {
      if (falha) throw Error("banco indisponivel");
      const linha = linhas.get(chave);
      return linha?.business_id === businessId ? structuredClone(linha) : null;
    },
    inserir: async (pedido) => {
      if (linhas.has(pedido.id)) return "conflito";
      insercoes++;
      linhas.set(pedido.id, { ...structuredClone(pedido), created_at: "2026-10-20T23:00:00Z" });
      return "criado";
    },
  } };
}
const enviar = (extra = {}, deps = portas()) => registrarPedidoDeImagem({ ...base, ...extra }, deps);

test("salva pedido confirmado e recupera de outro chamador do mesmo repositório", async () => {
  assert.deepEqual(await enviar(), { ok: true, id, repetido: false });
  const salvo = await portas().repositorio.buscar(id, negocio);
  assert.equal(salvo.payload.oferta, "Corte de cabelo");
  assert.equal(salvo.status, "awaiting_configuration");
  assert.equal(salvo.requested_by, perfil);
  assert.equal(salvo.content_hash, hashDoPedido(salvo.payload));
  assert.equal("autorizadoParaGeracao" in salvo, false);
});
test("replay não duplica pedido nem troca o conteúdo", async () => {
  await enviar();
  assert.deepEqual(await enviar(), { ok: true, id, repetido: true });
  assert.equal(insercoes, 1);
  assert.deepEqual(await enviar({ oferta: "Oferta alterada" }), { ok: false, motivo: "envio_alterado" });
  assert.equal(linhas.get(id).payload.oferta, base.oferta);
});
test("submissões concorrentes convergem para uma linha", async () => {
  const respostas = await Promise.all([enviar(), enviar(), enviar()]);
  assert.equal(respostas.every((r) => r.ok), true);
  assert.equal(respostas.filter((r) => !r.repetido).length, 1);
  assert.equal(linhas.size, 1);
});
test("sem sessão e formulário de aba antiga não consultam nem gravam", async () => {
  const deps = portas();
  deps.repositorio.buscar = () => { throw Error("não deve consultar"); };
  sessao = null;
  assert.deepEqual(await enviar({}, deps), { ok: false, motivo: "negocio_mudou" });
  sessao = { profileId: perfil, businessId: "outro" };
  assert.deepEqual(await enviar({}, deps), { ok: false, motivo: "negocio_mudou" });
  assert.equal(insercoes, 0);
});
test("flag desligada não chama sessão nem banco", async () => {
  const deps = portas();
  deps.sessao = () => { throw Error("não deve autenticar"); };
  assert.deepEqual(await enviar({ habilitado: false }, deps), { ok: false, motivo: "indisponivel" });
});
test("confirmação e comprimentos são conferidos também no servidor", async () => {
  assert.equal((await enviar({ confirmado: false })).motivo, "confirmacao_ausente");
  for (const extra of [{ objetivo: " " }, { oferta: "x".repeat(501) },
    { acao: "x".repeat(201) }, { id: "não-uuid" }, { oferta: { valor: "oi" } }])
    assert.equal((await enviar(extra)).motivo, "dados_invalidos");
  assert.equal(insercoes, 0);
});
test("data inexistente, vencida ou com horário é recusada; hoje é válido", async () => {
  for (const validade of ["2026-10-19", "2026-02-30", "2026-13-01", "2026-10-20T00:00Z", ""])
    assert.equal((await enviar({ promocao: true, validade })).motivo, "prazo_invalido");
  assert.equal((await enviar({ promocao: true, validade: "2026-10-20" })).ok, true);
});
test("tirar promoção descarta prazo residual sem inventar oferta", async () => {
  await enviar({ promocao: false, validade: "2026-10-19" });
  assert.equal(linhas.get(id).payload.validade, null);
});
test("falha de leitura não afirma sucesso ou lista vazia", async () => {
  falha = true;
  assert.deepEqual(await enviar(), { ok: false, motivo: "indisponivel" });
  assert.equal(insercoes, 0);
});
test("hash adulterado e tentativa de outro perfil não viram replay válido", async () => {
  await enviar();
  linhas.get(id).payload.oferta = "conteúdo alterado";
  assert.equal((await enviar()).motivo, "envio_alterado");
  linhas.get(id).payload.oferta = base.oferta;
  sessao = { profileId: "outro-perfil", businessId: negocio };
  assert.equal((await enviar()).motivo, "envio_alterado");
});
test("referência aprovada vincula o pedido; troca no replay exige novo ID", async () => {
  const referenciaId = "700155112131034";
  assert.equal((await enviar({ referenciaId, referenciasHabilitadas: true })).ok, true);
  assert.equal(linhas.get(id).payload.versao, 2);
  assert.equal(linhas.get(id).payload.referenciaId, referenciaId);
  assert.equal((await enviar({ referenciaId, referenciasHabilitadas: true })).repetido, true);
  assert.equal((await enviar({ referenciaId: "1077371334754860", referenciasHabilitadas: true })).motivo, "envio_alterado");
  assert.equal(insercoes, 1);
});
test("referência forjada ou catálogo fechado não escreve", async () => {
  for (const extra of [{ referenciaId: "700155112131034", referenciasHabilitadas: false },
    { referenciaId: "https://evil.example", referenciasHabilitadas: true },
    { referenciaId: "999999999999999", referenciasHabilitadas: true }])
    assert.equal((await enviar(extra)).ok, false);
  assert.equal(insercoes, 0);
});
