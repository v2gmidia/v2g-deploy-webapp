#!/usr/bin/env node
/**
 * Copia os quatro casos de referência do Oregon para o V2G-SITE.
 *
 * Passos 3 e 4 de `docs/migracao-banco.md`. Só LÊ do Oregon — nada é
 * apagado lá, e o projeto fica de pé como backup vivo.
 *
 * Idempotente: reexecutar não duplica. As linhas vão com `id` explícito e
 * `Prefer: resolution=merge-duplicates`, e o upload usa `upsert`.
 *
 * Uso:  node scripts/migrar-execucoes.mjs
 *       node scripts/migrar-execucoes.mjs --conferir   (só verifica)
 */
import { readFileSync } from "node:fs";

const GUARDAR = ["899f120c", "ee301c4f", "a56d3dea", "e3c5944f"];
const BUCKET = "v2g-midia";

const env = {};
for (const l of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
}

const ORIGEM = { url: (env.V2G_OREGON_URL || "").replace(/\/+$/, ""), key: env.V2G_OREGON_SERVICE_KEY };
const DESTINO = { url: (env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, ""), key: env.SUPABASE_SERVICE_ROLE_KEY };

for (const [nome, c] of [["Oregon", ORIGEM], ["V2G-SITE", DESTINO]]) {
  if (!c.url || !c.key) {
    console.error(`Faltam credenciais de ${nome} no .env.local.`);
    process.exit(1);
  }
}

const cab = (c, extra = {}) => ({
  apikey: c.key,
  Authorization: `Bearer ${c.key}`,
  "Content-Type": "application/json",
  ...extra,
});

async function rest(c, caminho, opcoes = {}) {
  const r = await fetch(c.url + caminho, { ...opcoes, headers: { ...cab(c), ...(opcoes.headers || {}) } });
  const txt = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${caminho}: ${txt.slice(0, 300)}`);
  return txt ? JSON.parse(txt) : null;
}

async function contar(c, tabela) {
  const r = await fetch(`${c.url}/rest/v1/${tabela}?select=id`, {
    headers: { ...cab(c), Prefer: "count=exact", Range: "0-0" },
  });
  return Number((r.headers.get("content-range") || "/0").split("/")[1]);
}

async function conferir() {
  console.log("\n=== CONFERÊNCIA NO DESTINO ===");
  const execs = await rest(DESTINO, "/rest/v1/execucoes?select=id,nome_negocio,status,origem_criativo&order=nome_negocio");
  const criat = await contar(DESTINO, "criativos");
  const objs = await rest(DESTINO, `/rest/v1/rpc/nada`, { method: "POST", body: "{}" }).catch(() => null);

  console.log(`  execucoes : ${execs.length}  (espera 4)  ${execs.length === 4 ? "OK" : "DIVERGE"}`);
  console.log(`  criativos : ${criat}  (espera 20) ${criat === 20 ? "OK" : "DIVERGE"}`);
  for (const e of execs) {
    console.log(`     ${e.id.slice(0, 8)}  ${(e.nome_negocio || "").padEnd(20)} ${e.status}  modo=${e.origem_criativo}`);
  }
  return { execs, criat, objs };
}

if (process.argv.includes("--conferir")) {
  await conferir();
  process.exit(0);
}

// ---------- passo 3: as linhas ----------
console.log("=== PASSO 3: copiando linhas ===");

// `like` nao existe para uuid no Postgres — o filtro por prefixo tem que
// acontecer aqui. Buscar so os ids e barato: 47 uuids.
const todosIds = await rest(ORIGEM, "/rest/v1/execucoes?select=id");
const ids = todosIds.map((r) => r.id).filter((id) => GUARDAR.includes(id.slice(0, 8)));
const execucoes = await rest(ORIGEM, `/rest/v1/execucoes?id=in.(${ids.join(",")})&select=*`);
console.log(`  execucoes lidas do Oregon: ${execucoes.length}`);
if (execucoes.length !== 4) {
  console.error("  esperava 4 — abortando antes de escrever nada.");
  process.exit(1);
}

const criativos = await rest(ORIGEM, `/rest/v1/criativos?execucao_id=in.(${ids.join(",")})&select=*`);
console.log(`  criativos lidos do Oregon:  ${criativos.length}`);

await rest(DESTINO, "/rest/v1/execucoes", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(execucoes),
});
console.log(`  execucoes gravadas no destino`);

await rest(DESTINO, "/rest/v1/criativos", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(criativos),
});
console.log(`  criativos gravados no destino`);

// ---------- passo 4: os arquivos ----------
console.log("\n=== PASSO 4: copiando arquivos ===");
const caminhos = [...new Set(criativos.map((c) => c.storage_path).filter(Boolean))];
console.log(`  caminhos distintos: ${caminhos.length}`);

let copiados = 0, faltando = 0, bytes = 0;
for (const p of caminhos) {
  const cod = p.split("/").map(encodeURIComponent).join("/");
  const baixa = await fetch(`${ORIGEM.url}/storage/v1/object/${BUCKET}/${cod}`, {
    headers: { apikey: ORIGEM.key, Authorization: `Bearer ${ORIGEM.key}` },
  });
  if (!baixa.ok) {
    console.log(`  AUSENTE no Oregon (${baixa.status}): ${p}`);
    faltando += 1;
    continue;
  }
  const corpo = Buffer.from(await baixa.arrayBuffer());
  const tipo = baixa.headers.get("content-type") || "application/octet-stream";

  const sobe = await fetch(`${DESTINO.url}/storage/v1/object/${BUCKET}/${cod}`, {
    method: "POST",
    headers: {
      apikey: DESTINO.key,
      Authorization: `Bearer ${DESTINO.key}`,
      "Content-Type": tipo,
      "x-upsert": "true",
    },
    body: corpo,
  });
  if (!sobe.ok) {
    console.log(`  FALHOU ao subir: ${p} -> ${sobe.status} ${(await sobe.text()).slice(0, 120)}`);
    faltando += 1;
    continue;
  }
  copiados += 1;
  bytes += corpo.length;
}
console.log(`  copiados: ${copiados} | ausentes/falhas: ${faltando} | ${(bytes / 1048576).toFixed(2)} MB`);

await conferir();

// ---------- a prova: uma URL assinada ----------
console.log("\n=== URL ASSINADA (prova de que o arquivo atravessou) ===");
const alvo = criativos.find((c) => c.storage_path && !c.e_video) || criativos.find((c) => c.storage_path);
const codAlvo = alvo.storage_path.split("/").map(encodeURIComponent).join("/");
const ass = await fetch(`${DESTINO.url}/storage/v1/object/sign/${BUCKET}/${codAlvo}`, {
  method: "POST",
  headers: cab(DESTINO),
  body: JSON.stringify({ expiresIn: 3600 }),
});
if (!ass.ok) {
  console.log("  falhou ao assinar:", ass.status, (await ass.text()).slice(0, 200));
} else {
  const { signedURL } = await ass.json();
  const url = DESTINO.url + "/storage/v1" + signedURL;
  const teste = await fetch(url);
  const buf = Buffer.from(await teste.arrayBuffer());
  console.log(`  arquivo   : ${alvo.storage_path}`);
  console.log(`  HTTP      : ${teste.status}`);
  console.log(`  tipo      : ${teste.headers.get("content-type")}`);
  console.log(`  bytes     : ${buf.length} (banco diz ${alvo.tamanho_bytes ?? "n/d"})`);
  console.log(`  assinatura: ${url.slice(0, 110)}...`);
}
