import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  alertasDeQualidade,
  contagemDeVendasConfirmadas,
  diagnosticoInstagramPermiteCompra,
  ROTULOS_INTERACAO,
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
  assert.match(tela, /somenteLeitura \? <div/);
  assert.match(tela, /Nenhuma action de escrita foi oferecida/);
});
