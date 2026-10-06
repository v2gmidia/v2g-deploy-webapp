import assert from "node:assert/strict";
import { test } from "node:test";
import { camposDaFicha, valorDaFicha, pracaOriginal, marcaOriginal, coberturaDaConsulta, LIMITE_FICHAS } from "../lib/perfil/ficha-operador.ts";

test("ausência não vira zero e false permanece informação", () => {
  assert.equal(valorDaFicha(null), "Não informado");
  assert.equal(valorDaFicha(undefined), "Não informado");
  assert.equal(valorDaFicha("  "), "Não informado");
  assert.equal(valorDaFicha(0), "0");
  assert.equal(valorDaFicha(false), "Não");
  assert.equal(valorDaFicha(Number.NaN), "Valor inválido");
});
test("procedência extraída não é confirmação; campo sem origem é explícito", () => {
  const ficha = camposDaFicha({ name: "Negócio fictício", monthly_budget: 0,
    procedencia: { name: { origem: "extraido", em: "2026-10-04T12:00:00Z" } } });
  assert.match(ficha.find(x => x.campo === "name")!.origem, /não equivale/);
  assert.equal(ficha.find(x => x.campo === "name")!.em, "2026-10-04T12:00:00Z");
  assert.equal(ficha.find(x => x.campo === "monthly_budget")!.valor, "0");
  assert.match(ficha.find(x => x.campo === "monthly_budget")!.origem, /não registrada/);
});
test("JSON inesperado não quebra nem expõe campos fora da ficha", () => {
  const ficha = camposDaFicha({ procedencia: [], segredo: "não deve aparecer" });
  assert.ok(ficha.every(x => x.valor === "Não informado"));
  assert.ok(!JSON.stringify(ficha).includes("não deve aparecer"));
  assert.equal(valorDaFicha({ desconhecido: true }), "Formato não reconhecido");
});
test("origem desconhecida nunca é interpretada como propriedade do objeto", () => {
  const ficha = camposDaFicha({ procedencia: { name: { origem: "toString" } } });
  assert.match(ficha.find(x => x.campo === "name")!.origem, /não reconhecida/);
});
test("praça livre sobrevive com cidade e alcance estruturados nulos", () => {
  const linha = { city: null, radius_km: null, onboarding: { respostas: { praca: {
    texto: "Atendo o interior todo", echo: "Atendo o interior todo", origem: "texto",
    em: "2026-10-04T12:00:00Z", segredo: "não renderizar",
  } } } };
  assert.deepEqual(pracaOriginal(linha), { texto: "Atendo o interior todo",
    origem: "Texto livre informado pelo cliente", em: "2026-10-04T12:00:00Z" });
  assert.equal(camposDaFicha(linha).find(x => x.campo === "radius_km")!.rotulo, "Alcance dos anúncios (km)");
});
test("praça ausente ou vazia não inventa resposta nem procedência", () => {
  assert.equal(pracaOriginal({}), null);
  assert.equal(pracaOriginal({ onboarding: { respostas: { praca: { texto: " ", echo: "" } } } }), null);
  assert.equal(pracaOriginal({ onboarding: { respostas: { praca: { texto: "Região", origem: "inventada" } } } })!.em, null);
});
test("praça selecionada preserva a cidade no echo e sua origem", () => {
  assert.deepEqual(pracaOriginal({ onboarding: { respostas: { praca: {
    texto: "Cidade + região", echo: "Curitiba · Cidade + região", origem: "chip", em: "2026-10-04T12:00:00Z",
  } } } }), { texto: "Curitiba · Cidade + região", origem: "Opção selecionada pelo cliente", em: "2026-10-04T12:00:00Z" });
});
test("limite e cobertura não prometem completude quando há recorte", () => {
  assert.equal(LIMITE_FICHAS, 1000);
  assert.match(coberturaDaConsulta(1000, 1500), /Recorte: 1000 de 1500/);
  assert.match(coberturaDaConsulta(200, 1500), /Recorte: 200 de 1500/);
  assert.match(coberturaDaConsulta(0, null), /Total não confirmado/);
  assert.match(coberturaDaConsulta(0, 0), /0 negócio/);
  assert.match(coberturaDaConsulta(2, 2), /2 informado/);
});
test("praça legada na chave 3 permanece consultável", () => {
  assert.deepEqual(pracaOriginal({ onboarding: { respostas: { "3": {
    texto: "Interior", origem: "texto", em: "2026-08-01T12:00:00Z",
  } } } }), { texto: "Interior", origem: "Texto livre informado pelo cliente", em: "2026-08-01T12:00:00Z" });
});
test("praça nova vence a legada quando ambas existem", () => {
  assert.equal(pracaOriginal({ onboarding: { respostas: {
    "3": { texto: "Antiga", origem: "texto" }, praca: { texto: "Nova", origem: "texto" },
  } } })!.texto, "Nova");
});
test("praça nova vazia ou nula não ressuscita a legada", () => {
  for (const praca of [null, {}, { texto: " ", echo: "" }]) {
    assert.equal(pracaOriginal({ onboarding: { respostas: {
      "3": { texto: "Antiga", origem: "texto" }, praca,
    } } }), null);
  }
});
test("descrição visual aparece literalmente com origem e horário do cliente", () => {
  assert.deepEqual(marcaOriginal({ onboarding: { respostas: { nome: "Preservada" }, marca: {
    aparencia: "Azul escuro e fotos dos produtos", aparenciaNaoSei: false,
    siteNaoTenho: true, em: "2026-10-05T17:00:00Z", segredo: "não renderizar",
  } } }), {
    texto: "Azul escuro e fotos dos produtos", origem: "Descrição informada pelo cliente",
    siteNaoTenho: true, em: "2026-10-05T17:00:00Z",
  });
});
test("não sei permanece explícito e não vira cor presumida", () => {
  assert.deepEqual(marcaOriginal({ onboarding: { marca: {
    aparencia: "verde", aparenciaNaoSei: true, siteNaoTenho: false,
    em: "2026-10-05T17:00:00Z",
  } } }), {
    texto: "Cliente ainda não sabe como descrever o visual da marca",
    origem: "Estado “não sei” informado pelo cliente", siteNaoTenho: false,
    em: "2026-10-05T17:00:00Z",
  });
});
test("marca ausente ou sem carimbo não inventa resposta", () => {
  assert.equal(marcaOriginal({}), null);
  assert.equal(marcaOriginal({ onboarding: { marca: { aparencia: "azul" } } }), null);
  assert.equal(marcaOriginal({ onboarding: { marca: [] } }), null);
});
