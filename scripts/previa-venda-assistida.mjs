/** Guia local isolado. Nao carrega .env, Next, Auth, Supabase ou Asaas. */
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import ts from "typescript";

const assets = new Map([["/", { type: "text/html; charset=utf-8", body: readFileSync(new URL("../docs/previas/venda-assistida.html", import.meta.url), "utf8") }]]);
for (const name of ["pedido-assistido", "qualificacao", "preco"]) {
  const path = `/lib/contratacao/${name}.ts`;
  const source = readFileSync(new URL(`..${path}`, import.meta.url), "utf8");
  assets.set(path, { type: "text/javascript; charset=utf-8", body: ts.transpileModule(source,
    { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText });
}
createServer((req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") { res.writeHead(405); res.end("Somente leitura local"); return; }
  const asset = assets.get(new URL(req.url, "http://localhost").pathname);
  if (!asset) { res.writeHead(404); res.end("Nao encontrado"); return; }
  res.setHeader("Content-Type", asset.type);
  res.end(asset.body);
}).listen(4312, "127.0.0.1", () => console.log("Previa didatica isolada: http://127.0.0.1:4312 — sem cobrancas, login ou banco."));
