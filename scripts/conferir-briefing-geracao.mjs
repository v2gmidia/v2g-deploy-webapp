import assert from "node:assert/strict";
import test from "node:test";
import { prepararBriefingVisual } from "../lib/criativos/briefing-geracao.ts";

const agora = "2026-10-19T22:00:00-03:00";
const campo = (valor, estado = "confirmado_cliente") => ({
  valor, estado, origem: "formulario_cliente", registradoEm: agora,
});

function entradaValida() {
  return {
    businessId: "negocio-a",
    objetivo: campo("Divulgar corte masculino", "declarado_sem_conferencia"),
    oferta: campo("Corte masculino com agendamento pelo WhatsApp"),
    promocao: false,
    validadeDaPromocao: null,
    coresConfirmadas: campo("azul e amarelo"),
    logo: { businessId: "negocio-a", caminhoPrivado: "marca/logo.png", tipo: "logo",
      origem: "upload_cliente", registradoEm: agora, autorizadoParaGeracao: true },
    usarFachada: false,
    fachada: null,
    nichoId: "id-do-catalogo",
    nichoConfirmadoNoCatalogo: true,
    documentoCentralVersao: "2026-10-18",
    documentoNichoVersao: "piloto-1",
    referencias: [{ id: "ref-1", tipo: "imagem", origem: "biblioteca_meta",
      observadaEm: agora, padrao: "fachada e chamada para agendar",
      revisadaPorHumano: true, usoComoInspiracaoPermitido: true }],
  };
}

test("monta somente briefing, sem chamar gerador ou afirmar publicação", () => {
  const resultado = prepararBriefingVisual(entradaValida());
  assert.equal(resultado.ok, true);
  assert.equal(resultado.briefing.oferta, "Corte masculino com agendamento pelo WhatsApp");
  assert.equal(resultado.briefing.fachada, null);
  assert.deepEqual(resultado.briefing.referencias.map((item) => item.id), ["ref-1"]);
  assert.match(resultado.briefing.restricoes.join(" "), /não aprovação nem anúncio publicado/i);
});

test("não usa logo de outro negócio nem logo sem autorização para IA", () => {
  const outraConta = entradaValida();
  outraConta.logo.businessId = "negocio-b";
  assert.deepEqual(prepararBriefingVisual(outraConta).pendencias, ["logo_nao_autorizado"]);
  const semDireito = entradaValida();
  semDireito.logo.autorizadoParaGeracao = false;
  assert.deepEqual(prepararBriefingVisual(semDireito).pendencias, ["logo_nao_autorizado"]);
});

test("fachada selecionada exige arquivo declarado como fachada do próprio negócio", () => {
  const entrada = entradaValida();
  entrada.usarFachada = true;
  assert.deepEqual(prepararBriefingVisual(entrada).pendencias, ["fachada_real_ausente"]);
  entrada.fachada = { businessId: "negocio-a", caminhoPrivado: "marca/interior.jpg",
    tipo: "ambiente", origem: "upload_cliente", registradoEm: agora, autorizadoParaGeracao: true };
  assert.deepEqual(prepararBriefingVisual(entrada).pendencias, ["fachada_real_ausente"]);
  entrada.fachada.tipo = "fachada";
  assert.equal(prepararBriefingVisual(entrada).briefing.fachada, "marca/interior.jpg");
});

test("oferta, prazo e cores inferidos não entram na proposta", () => {
  const entrada = entradaValida();
  entrada.oferta.estado = "inferido_para_revisao";
  entrada.validadeDaPromocao = campo("sexta-feira", "declarado_sem_conferencia");
  entrada.coresConfirmadas.estado = "observado_fonte_externa";
  assert.deepEqual(prepararBriefingVisual(entrada).pendencias,
    ["oferta_nao_confirmada", "validade_nao_confirmada", "cores_nao_confirmadas"]);
});

test("uma promoção não gera peça sem validade confirmada", () => {
  const entrada = entradaValida();
  entrada.promocao = true;
  assert.deepEqual(prepararBriefingVisual(entrada).pendencias, ["validade_nao_confirmada"]);
  entrada.validadeDaPromocao = campo("Até 26/10/2026");
  assert.equal(prepararBriefingVisual(entrada).briefing.validadeDaPromocao, "Até 26/10/2026");
});

test("nicho precisa de ID confirmado e documentos versionados", () => {
  const entrada = entradaValida();
  entrada.nichoConfirmadoNoCatalogo = false;
  entrada.documentoNichoVersao = null;
  assert.deepEqual(prepararBriefingVisual(entrada).pendencias,
    ["nicho_nao_confirmado", "documentos_sem_versao"]);
});

test("vídeo, referência sem revisão e referência sem direito não servem de base", () => {
  const entrada = entradaValida();
  entrada.referencias[0].tipo = "video";
  assert.deepEqual(prepararBriefingVisual(entrada).pendencias, ["referencia_admissivel_ausente"]);
  entrada.referencias[0].tipo = "imagem";
  entrada.referencias[0].revisadaPorHumano = false;
  assert.deepEqual(prepararBriefingVisual(entrada).pendencias, ["referencia_admissivel_ausente"]);
  entrada.referencias[0].revisadaPorHumano = true;
  entrada.referencias[0].usoComoInspiracaoPermitido = false;
  assert.deepEqual(prepararBriefingVisual(entrada).pendencias, ["referencia_admissivel_ausente"]);
});

test("origem e data são obrigatórias para um campo confirmado", () => {
  const entrada = entradaValida();
  entrada.oferta.origem = null;
  assert.deepEqual(prepararBriefingVisual(entrada).pendencias, ["oferta_nao_confirmada"]);
  entrada.oferta.origem = "formulario_cliente";
  entrada.oferta.registradoEm = "data inválida";
  assert.deepEqual(prepararBriefingVisual(entrada).pendencias, ["oferta_nao_confirmada"]);
});
