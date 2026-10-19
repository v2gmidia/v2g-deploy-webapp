import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  alertasDaOportunidade,
  alertasDeQualidade,
  contagemDeVendasConfirmadas,
  descricaoDaFonteRevOps,
  diagnosticoInstagramPermiteCompra,
  ETAPAS_REVOPS,
  METADADOS_ETAPA_REVOPS,
  resumoOperacionalRevOps,
  ROTULOS_INTERACAO,
  rotuloDaEvidencia,
  TIPOS_MANUAIS_DE_INTERACAO,
} from "../lib/revops/contrato.ts";
import { temAutorizacaoRevOps } from "../lib/revops/autorizacao.ts";

const evento = (id, tipo, extra = {}) => ({
  id, tipo, evidencia: "source_fact", ocorreuEm: "2026-10-07T12:00:00Z",
  transcricao: "not_applicable", ...extra,
});

test("operador generico, cliente e anonimo nao recebem acesso RevOps", () => {
  assert.equal(temAutorizacaoRevOps(null), false);
  assert.equal(temAutorizacaoRevOps({ id: "cliente", app_metadata: {} }), false);
  assert.equal(temAutorizacaoRevOps({ id: "operador", app_metadata: { papel: "operador" } }), false);
  assert.equal(temAutorizacaoRevOps({
    id: "autorizado", app_metadata: { autorizacoes: ["revops"] },
  }), true);
});

test("dez conversas de anuncio nunca viram dez vendas", () => {
  const conversas = Array.from({ length: 10 }, (_, i) => evento(String(i), "message"));
  assert.equal(contagemDeVendasConfirmadas(conversas), 0);
});

test("aceite, relato, pagamento e campanha permanecem estados distintos", () => {
  assert.equal(ROTULOS_INTERACAO.proposal_liked, "Gostou da proposta");
  assert.equal(ROTULOS_INTERACAO.purchase_reported, "Compra relatada");
  assert.equal(ROTULOS_INTERACAO.payment_approved, "Pagamento aprovado");
  assert.equal(ROTULOS_INTERACAO.campaign_live, "Campanha no ar");
  assert.equal(new Set([
    ROTULOS_INTERACAO.proposal_liked,
    ROTULOS_INTERACAO.purchase_reported,
    ROTULOS_INTERACAO.payment_approved,
    ROTULOS_INTERACAO.campaign_live,
  ]).size, 4);
});

test("registro manual nao pode declarar pagamento ou campanha confirmados", () => {
  assert.equal(TIPOS_MANUAIS_DE_INTERACAO.includes("purchase_reported"), true);
  assert.equal(TIPOS_MANUAIS_DE_INTERACAO.includes("payment_approved"), false);
  assert.equal(TIPOS_MANUAIS_DE_INTERACAO.includes("campaign_live"), false);
  const migration = readFileSync(new URL(
    "../supabase/migrations/20261007160925_revops_v0.sql", import.meta.url,
  ), "utf8");
  assert.match(migration, /if p_interaction_type in \('payment_approved', 'campaign_live'\) then/);
  assert.match(migration, /raise exception 'confirmacao_exige_fonte_verificavel'/);
});

test("reuniao sem transcricao e venda relatada geram alertas honestos", () => {
  const alertas = alertasDeQualidade([
    evento("reuniao", "meeting_held", { transcricao: "pending" }),
    evento("venda", "purchase_reported", { evidencia: "human_report" }),
  ]);
  assert.deepEqual(alertas, [
    "Venda relatada sem pagamento confirmado",
    "Transcrição pendente",
  ]);
});

test("qualidade da oportunidade aponta handoffs incompletos sem inventar desfecho", () => {
  const alertas = alertasDaOportunidade({
    responsavelId: null,
    proximoPasso: null,
    proximoPassoEm: null,
    vinculos: {
      pedido: true,
      negocio: false,
      prova: {
        registradaEm: "2026-10-07T12:00:00Z",
        registradaPorId: "f0000000-0000-4000-8000-000000000020",
        descricao: "Fixture de vínculo conferido.",
      },
    },
    interacoes: [evento("inferida", "message", {
      evidencia: "inference", revisaoHumana: "pending",
    })],
  });
  assert.deepEqual(alertas, [
    "Oportunidade sem responsável",
    "Oportunidade sem próximo passo",
    "Pedido sem negócio WebApp vinculado",
    "Inferência sem revisão humana",
  ]);
  assert.equal(alertas.some((alerta) => alerta.includes("Venda")), false);
});

test("vinculo existente sem prova completa vira alerta, nao confirmacao", () => {
  const alertas = alertasDaOportunidade({
    responsavelId: "f0000000-0000-4000-8000-000000000020",
    proximoPasso: "Revisar vínculo fictício",
    proximoPassoEm: "2026-10-08T12:00:00Z",
    vinculos: { pedido: false, negocio: true, prova: null },
    interacoes: [],
  });
  assert.deepEqual(alertas, ["Vínculo sem evidência completa"]);

  const dados = readFileSync(new URL("../lib/revops/dados.ts", import.meta.url), "utf8");
  assert.match(dados, /business_id, linked_at, linked_by, link_evidence, created_at/);
  assert.match(dados, /oportunidade\.linked_at && oportunidade\.linked_by && oportunidade\.link_evidence/);
});

test("etapas de trabalho, marcos, resultados e espera nao entram na mesma categoria", () => {
  assert.deepEqual(ETAPAS_REVOPS, [
    "interested", "qualification", "meeting", "proposal", "decision",
    "purchase_reported", "won_verified", "lost", "postponed",
  ]);
  assert.equal(METADADOS_ETAPA_REVOPS.qualification.natureza, "trabalho");
  assert.equal(METADADOS_ETAPA_REVOPS.purchase_reported.natureza, "marco");
  assert.equal(METADADOS_ETAPA_REVOPS.won_verified.natureza, "resultado");
  assert.equal(METADADOS_ETAPA_REVOPS.lost.natureza, "resultado");
  assert.equal(METADADOS_ETAPA_REVOPS.postponed.natureza, "espera");
});

test("resumo conta fatos unicos e nao publica conversao sem denominador", () => {
  const reuniaoCompartilhada = evento("reuniao-unica", "meeting_held");
  const resumo = resumoOperacionalRevOps([
    {
      responsavelId: "f0000000-0000-4000-8000-000000000020",
      proximoPasso: "Retorno fictício",
      interacoes: [reuniaoCompartilhada, evento("compra", "purchase_reported")],
    },
    {
      responsavelId: null,
      proximoPasso: null,
      interacoes: [reuniaoCompartilhada, evento("pagamento", "payment_approved")],
    },
  ]);
  assert.deepEqual(resumo, {
    oportunidades: 2,
    comResponsavel: 1,
    comProximoPasso: 1,
    reunioesRealizadas: 1,
    comprasRelatadas: 1,
    vendasVerificadas: 1,
  });
  assert.equal("conversao" in resumo, false);
});

test("linha do tempo distingue inferencia pendente, confirmada e rejeitada", () => {
  assert.equal(rotuloDaEvidencia("source_fact"), "Fato da fonte");
  assert.equal(rotuloDaEvidencia("human_report"), "Relato humano");
  assert.equal(rotuloDaEvidencia("inference", "pending"), "Inferência pendente de revisão");
  assert.equal(rotuloDaEvidencia("inference", "confirmed"), "Inferência marcada como confirmada");
  assert.equal(rotuloDaEvidencia("inference", "rejected"), "Inferência marcada como rejeitada");
  assert.equal(rotuloDaEvidencia("inference"), "Inferência sem estado de revisão");
});

test("revisao concluida exige autoria e data auditaveis", () => {
  const alertas = alertasDaOportunidade({
    responsavelId: "f0000000-0000-4000-8000-000000000020",
    proximoPasso: "Registrar revisão fictícia",
    proximoPassoEm: "2026-10-08T12:00:00Z",
    vinculos: { pedido: false, negocio: false, prova: null },
    interacoes: [evento("inferida", "message", {
      evidencia: "inference",
      revisaoHumana: "confirmed",
      revisadoPorId: null,
      revisadoEm: null,
    })],
  });
  assert.deepEqual(alertas, ["Revisão humana sem autoria e data"]);

  const migration = readFileSync(new URL(
    "../supabase/migrations/20261007160925_revops_v0.sql", import.meta.url,
  ), "utf8");
  assert.match(migration, /reviewed_by uuid references public\.profiles\(id\)/);
  assert.match(migration, /reviewed_at timestamptz/);
  assert.match(migration, /constraint revops_human_review_has_audit check/);
  assert.match(migration, /human_review_status in \('confirmed', 'rejected'\)[\s\S]*reviewed_by is not null[\s\S]*reviewed_at is not null/);
});

test("linha do tempo mostra data da revisao completa sem expor UUID", () => {
  const tela = readFileSync(new URL(
    "../app/(internal)/revops/TelaRevOps.tsx", import.meta.url,
  ), "utf8");
  assert.match(tela, /interacao\.revisadoPorId && interacao\.revisadoEm/);
  assert.match(tela, /Revisão humana registrada em/);
  assert.match(tela, /autoria preservada no registro interno/);
  assert.doesNotMatch(tela, /\{interacao\.revisadoPorId\}/);
});

test("linha do tempo preserva autor da fonte sem inventar o ausente", () => {
  assert.equal(descricaoDaFonteRevOps({
    canal: "meet",
    sistema: "manual",
    referencia: "fixture-reuniao-001",
    autor: "Pessoa Fictícia",
  }), "meet · manual · ref. fixture-reuniao-001 · autor: Pessoa Fictícia");
  assert.equal(descricaoDaFonteRevOps({
    canal: "other",
    sistema: "other",
    referencia: "fixture-sem-autor",
    autor: null,
  }), "other · other · ref. fixture-sem-autor · autor não informado");
});

test("Instagram fraco orienta e nao veta compra", () => {
  assert.equal(diagnosticoInstagramPermiteCompra("guidance_needed"), true);
});

test("migration preserva empresas separadas e torna a fonte idempotente", () => {
  const migration = readFileSync(new URL(
    "../supabase/migrations/20261007160925_revops_v0.sql", import.meta.url,
  ), "utf8");
  assert.match(migration, /create table public\.revops_prospect_organizations/);
  assert.match(migration, /create table public\.revops_interaction_opportunities/);
  assert.match(migration, /unique \(source_system, source_external_id\)/);
  assert.match(migration, /source_reference_id uuid not null unique/);
  assert.match(migration, /on conflict do nothing/);
  assert.equal(
    [...migration.matchAll(/when p_evidence_kind = 'inference' then 'pending'/g)].length,
    2,
    "as duas RPCs devem mandar inferencia para revisao humana",
  );
  assert.doesNotMatch(migration, /lower\(.*email.*\).*revops_people/s);
});

test("bancada ficticia nao monta actions de escrita", () => {
  const pagina = readFileSync(new URL("../app/exemplo/[tela]/page.tsx", import.meta.url), "utf8");
  const tela = readFileSync(new URL("../app/(internal)/revops/TelaRevOps.tsx", import.meta.url), "utf8");
  assert.match(pagina, /somenteLeitura/);
  assert.match(pagina, /estadoPedido === "vazio" \|\| falhaConsulta/);
  assert.match(pagina, /falhaConsulta=\{falhaConsulta\}/);
  assert.match(tela, /somenteLeitura \? <div/);
  assert.match(tela, /Nenhuma action de escrita foi oferecida/);
  assert.match(tela, /Nenhum interessado registrado/);
  assert.match(tela, /Não foi possível consultar a estrutura RevOps/);
});
