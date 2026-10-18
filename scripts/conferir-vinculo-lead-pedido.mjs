import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const sql = readFileSync(new URL(
  "../supabase/migrations/20261018130000_ligar_lead_lp_pedido.sql",
  import.meta.url,
), "utf8");
const action = readFileSync(new URL("../app/(protected)/pedidos/actions.ts", import.meta.url), "utf8");
const gestor = readFileSync(new URL("../app/(protected)/gestor/compras/page.tsx", import.meta.url), "utf8");

test("um lead da LP só pode originar um pedido", () => {
  assert.match(sql, /create unique index commercial_orders_one_order_per_source_lead/);
  assert.match(sql, /on public\.commercial_orders\(source_system, source_lead_id\)/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /return v_existing\.id/);
});

test("o servidor confere identificador, CNPJ, e-mail e WhatsApp sem aproximação", () => {
  assert.match(sql, /where id = p_source_lead_id/);
  assert.match(sql, /v_lead\.cnpj <> p_cnpj/);
  assert.match(sql, /lower\(btrim\(v_lead\.email\)\) <> v_email/);
  assert.match(sql, /regexp_replace\(v_lead\.whatsapp/);
  assert.doesNotMatch(sql, /similarity\s*\(/i);
  assert.doesNotMatch(sql, /levenshtein\s*\(/i);
});

test("a conversão preserva origem, UTMs, consentimento e evento comercial", () => {
  for (const campo of [
    "source_lead_origin", "source_lead_utm_source", "source_lead_utm_medium",
    "source_lead_utm_campaign", "source_lead_utm_content",
    "source_lead_consent_at", "source_lead_consent_text",
  ]) assert.match(sql, new RegExp(campo));
  assert.match(sql, /lead_convertido_em_pedido/);
  assert.match(gestor, /Lead #\{pedido\.source_lead_id\} da LP/);
});

test("o caminho novo fica fechado enquanto migration e configuração não forem autorizadas", () => {
  assert.match(action, /V2G_LEAD_ORDER_LINK_ENABLED === "true"/);
  assert.match(action, /registrar_pedido_pix_assistido_com_lead/);
  assert.match(action, /registrar_pedido_pix_assistido/);
});

