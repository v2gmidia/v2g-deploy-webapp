import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

for (const [arquivo, tipo] of [["confirmar.html", "email"], ["recuperar.html", "recovery"]]) {
  const html = readFileSync(new URL(`../docs/auth-email/${arquivo}`, import.meta.url), "utf8");
  const link = html.match(/href="([^"]+token_hash=[^"]+)"/)?.[1];
  assert.ok(link, `Link ausente em ${arquivo}`);
  const url = new URL(link.replace("{{ .RedirectTo }}", "https://qa.example.invalid/auth/confirmar")
    .replace("{{ .TokenHash }}", "TOKEN_FICTICIO").replaceAll("&amp;", "&"));
  assert.equal(url.pathname, "/auth/confirmar");
  assert.equal(url.searchParams.get("token_hash"), "TOKEN_FICTICIO");
  assert.equal(url.searchParams.get("type"), tipo);
  assert.ok(!html.includes("localhost"));
}
console.log("Templates de confirmacao e recuperacao: URLs e tipos validos");
