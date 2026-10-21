import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const modulo = readFileSync(new URL("../lib/seguranca/checkout.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL(
  "../supabase/migrations/20261018133000_checkout_security_controls.sql", import.meta.url,
), "utf8");
const compra = readFileSync(new URL("../app/contratar/actions.ts", import.meta.url), "utf8");
const pagamento = readFileSync(new URL("../lib/contratacao/iniciar-pagamento.ts", import.meta.url), "utf8");
const actionPublica = readFileSync(new URL("../app/contratar/pagamento/actions.ts", import.meta.url), "utf8");

test("action publica nao aceita bypass da verificacao de seguranca", () => {
  assert.doesNotMatch(actionPublica, /segurancaJaVerificada/);
  assert.match(actionPublica, /iniciarPagamentoInterno\(anterior, form, false\)/);
  assert.match(pagamento, /import "server-only"/);
});

test("IP só é confiado quando a requisição traz a marca da Vercel", () => {
  assert.match(modulo, /process\.env\.VERCEL !== "1"/);
  assert.match(modulo, /x-vercel-id/);
  assert.match(modulo, /x-vercel-forwarded-for/);
  assert.match(modulo, /isIP\(candidato\)/);
});

test("Turnstile é validado no servidor com token, IP, hostname e action", () => {
  assert.match(modulo, /turnstile\/v0\/siteverify/);
  assert.match(modulo, /remoteip: ip/);
  assert.match(modulo, /corpo\.action === "checkout"/);
  assert.match(modulo, /hosts\.includes\(corpo\.hostname\.toLowerCase\(\)\)/);
  assert.match(modulo, /AbortSignal\.timeout\(8_000\)/);
});

test("rate limit é atômico e não persiste IP ou e-mail puros", () => {
  assert.match(migration, /pg_advisory_xact_lock/g);
  assert.match(migration, /ip_hash text not null/);
  assert.match(migration, /contact_hash text not null/);
  assert.doesNotMatch(migration, /\bemail\s+text/i);
  assert.doesNotMatch(migration, /\bip\s+text/i);
  assert.match(modulo, /createHmac\("sha256"/);
});

test("pedido e pagamento aplicam CAPTCHA e limite apenas atrás da trava", () => {
  for (const fonte of [compra, pagamento]) {
    assert.match(fonte, /segurancaCheckoutAtiva\(\)/);
    assert.match(fonte, /verificarTurnstile/);
    assert.match(fonte, /consumir_limite_checkout/);
  }
  assert.ok(compra.indexOf("segurancaCheckoutAtiva()")
    < compra.indexOf("return iniciarCheckoutHospedado(form)"),
  "a proteção precisa rodar também antes do checkout hospedado legado");
});

