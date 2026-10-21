import assert from "node:assert/strict";
import test from "node:test";
import { prepararPrevooDeGeracao } from "../lib/criativos/prevoo-geracao.ts";

const businessId = "negocio-ficticio";
const data = "2026-10-20T08:00:00Z";
const campo = (valor) => ({ valor, origem: "declaracao_cliente", registradoEm: data,
  estado: "confirmado_cliente" });
const logo = { id: "logo-1", business_id: businessId, uso: "logo",
  storage_path: `identidade/${businessId}/logo.png`, created_at: data,
  arquivado_em: null, copy: {} };
const fachada = { ...logo, id: "fachada-1", uso: "identidade",
  storage_path: `identidade/${businessId}/fachada.png`,
  copy: { identidade: { tipoFoto: "fachada" } } };
const autorizacao = (imagemId) => ({ imagemId, businessId,
  finalidade: "geracao_imagem", autorizadoEm: data, autorizadoPor: "usuario-ficticio",
  revogadoEm: null });

function entradaValida() {
  return {
    marca: { businessId, logoId: logo.id, usarFachada: true,
      fachadaId: fachada.id, linhas: [logo, fachada],
      autorizacoesConferidas: [autorizacao(logo.id), autorizacao(fachada.id)] },
    contexto: { businessId, objetivo: campo("Divulgar corte"),
      oferta: campo("Corte com agendamento"), acaoDesejada: campo("Agendar pelo WhatsApp"),
      promocao: false, validadeDaPromocao: null, coresConfirmadas: campo("azul e amarelo"),
      usarFachada: true, nichoId: "nicho-ficticio", nichoConfirmadoNoCatalogo: true,
      documentoCentralVersao: "central-1", documentoNichoVersao: "nicho-1",
      referencias: [{ id: "referencia-1", tipo: "imagem", origem: "acervo-curado",
        localizadorFonte: "referencia-ficticia-1", observadaEm: data,
        condicaoDeUso: "inspiração estrutural", padrao: "chamada e fachada",
        revisadaPorHumano: true, revisadaPor: "revisor-ficticio",
        usoComoInspiracaoPermitido: true }] },
    documentos: {
      central: { tipo: "central", versao: "central-1", nichoId: null,
        conteudo: "Não inventar preços ou resultados.", revisadoPor: "revisor-ficticio",
        revisadoEm: data },
      nicho: { tipo: "nicho", versao: "nicho-1", nichoId: "nicho-ficticio",
        conteudo: "Oferta e linguagem do nicho revisadas.", revisadoPor: "revisor-ficticio",
        revisadoEm: data },
    },
    custo: { businessId, tipo: "inicial", historicoCompleto: true, tentativas: [],
      limiteTotalCentavos: 450, tetoDaProximaTentativaCentavos: 150 },
  };
}

test("compõe briefing rastreável e projeta saldo após o teto da chamada", () => {
  const resultado = prepararPrevooDeGeracao(entradaValida());
  assert.equal(resultado.ok, true);
  assert.equal(resultado.briefing.logo, logo.storage_path);
  assert.equal(resultado.briefing.fachada, fachada.storage_path);
  assert.equal(resultado.briefing.documentoNichoVersao, "nicho-1");
  assert.equal(resultado.documentos.nicho.nichoId, "nicho-ficticio");
  assert.equal(resultado.saldoDepoisDaReservaCentavos, 300);
});

test("não compõe partes de negócios diferentes", () => {
  const entrada = entradaValida();
  entrada.custo.businessId = "outro-negocio";
  assert.deepEqual(prepararPrevooDeGeracao(entrada), { ok: false, etapa: "negocio",
    pendencias: ["negocios_divergentes"] });
});

test("sem autorização específica da fachada, para antes do briefing", () => {
  const entrada = entradaValida();
  entrada.marca.autorizacoesConferidas = [autorizacao(logo.id)];
  const resultado = prepararPrevooDeGeracao(entrada);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.etapa, "marca");
  assert.ok(resultado.pendencias.includes("autorizacao_fachada_ausente"));
});

test("sem referência admissível, para antes do custo", () => {
  const entrada = entradaValida();
  entrada.contexto.referencias[0].usoComoInspiracaoPermitido = false;
  const resultado = prepararPrevooDeGeracao(entrada);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.etapa, "contexto");
  assert.ok(resultado.pendencias.includes("referencia_admissivel_ausente"));
});

test("sem teto da próxima chamada, não libera geração", () => {
  const entrada = entradaValida();
  entrada.custo.tetoDaProximaTentativaCentavos = null;
  const resultado = prepararPrevooDeGeracao(entrada);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.etapa, "custo");
  assert.ok(resultado.pendencias.includes("teto_da_chamada_desconhecido"));
});

test("versão de documento sem conteúdo correspondente bloqueia antes do custo", () => {
  const entrada = entradaValida();
  entrada.documentos.nicho.versao = "outra-versao";
  const resultado = prepararPrevooDeGeracao(entrada);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.etapa, "documentos");
  assert.ok(resultado.pendencias.includes("documento_nicho_indisponivel"));
});

test("conteúdo vazio ou nicho divergente não libera geração", () => {
  const entrada = entradaValida();
  entrada.documentos.central.conteudo = " ";
  entrada.documentos.nicho.nichoId = "outro-nicho";
  const resultado = prepararPrevooDeGeracao(entrada);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.etapa, "documentos");
  assert.deepEqual(resultado.pendencias,
    ["documento_central_indisponivel", "documento_nicho_indisponivel"]);
});

test("documento sem revisor e data válida não libera geração", () => {
  const entrada = entradaValida();
  entrada.documentos.central.revisadoPor = "";
  entrada.documentos.nicho.revisadoEm = "data inválida";
  const resultado = prepararPrevooDeGeracao(entrada);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.etapa, "documentos");
  assert.deepEqual(resultado.pendencias,
    ["documento_central_indisponivel", "documento_nicho_indisponivel"]);
});
