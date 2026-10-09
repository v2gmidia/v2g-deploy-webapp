/** Ensaio de Storage e RLS apenas no projeto v2g-webapp-qa. Cria e remove fixtures. */
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
assert.match(url, /^https:\/\/zskpijnqgkqwxksqmzmf\.supabase\.co\/?$/,
  "Este ensaio so pode rodar no projeto QA nomeado");
assert.ok(anonKey && adminKey, "Credenciais QA ausentes");

const admin = createClient(url, adminKey, { auth: { persistSession: false, autoRefreshToken: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const marcador = randomUUID();
const senha = randomBytes(24).toString("base64url");
const usuarios = [];
const negocios = [];
let caminho = null;
let submissaoId = null;

async function usuario(n) {
  const email = `qa-criativos-${n}-${marcador}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
  assert.ifError(error);
  const id = data.user.id;
  usuarios.push(id);
  const perfil = await admin.from("profiles").upsert({ id, full_name: `QA Criativos ${n}` });
  assert.ifError(perfil.error);
  const negocio = await admin.from("businesses").insert({ name: `QA Criativos ${n}`, profile_id: id })
    .select("id").single();
  assert.ifError(negocio.error);
  negocios.push(negocio.data.id);
  const cliente = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const login = await cliente.auth.signInWithPassword({ email, password: senha });
  assert.ifError(login.error);
  return { id, negocioId: negocio.data.id, cliente };
}

try {
  const a = await usuario("a");
  const b = await usuario("b");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9KUa0AAAAASUVORK5CYII=", "base64");
  submissaoId = randomUUID();
  caminho = `${a.negocioId}/${submissaoId}`;
  const registro = await admin.from("creative_review_requests").insert({
    id: submissaoId, business_id: a.negocioId, submitted_by: a.id,
    file_path: caminho, original_name: "qa.png", mime_type: "image/png",
    size_bytes: png.length, sha256: createHash("sha256").update(png).digest("hex"),
    status: "uploading",
  });
  assert.ifError(registro.error);
  const upload = await admin.storage.from("creative-review").upload(caminho, png,
    { contentType: "image/png", upsert: false });
  assert.ifError(upload.error);
  const final = await admin.from("creative_review_requests").update({ status: "awaiting_review" })
    .eq("id", submissaoId).select("id").single();
  assert.ifError(final.error);

  const proprio = await a.cliente.from("creative_review_requests")
    .select("id, status").eq("id", submissaoId);
  const alheio = await b.cliente.from("creative_review_requests")
    .select("id").eq("id", submissaoId);
  assert.ifError(proprio.error);
  assert.ifError(alheio.error);
  assert.equal(proprio.data.length, 1);
  assert.equal(alheio.data.length, 0);
  console.log("QA: leitura do proprio negocio e isolamento entre dois usuarios OK");

  const escritaDireta = await a.cliente.from("creative_review_requests")
    .update({ status: "approved_for_manual_publish" }).eq("id", submissaoId)
    .select("id");
  assert.ok(escritaDireta.error || escritaDireta.data.length === 0);
  const anonLeitura = await anon.from("creative_review_requests").select("id").eq("id", submissaoId);
  assert.ok(anonLeitura.error || anonLeitura.data.length === 0);
  console.log("QA: anonimo e escrita direta do cliente bloqueados OK");

  const semLink = await a.cliente.storage.from("creative-review").download(caminho);
  assert.ok(semLink.error, "Download direto deveria ser negado pelo Storage");
  const link = await admin.storage.from("creative-review").createSignedUrl(caminho, 60);
  assert.ifError(link.error);
  const resposta = await fetch(link.data.signedUrl);
  assert.equal(resposta.status, 200);
  assert.deepEqual(Buffer.from(await resposta.arrayBuffer()), png);
  console.log("QA: arquivo privado e URL temporaria do gestor OK");

  const repeticao = await admin.from("creative_review_requests").insert({
    id: submissaoId, business_id: a.negocioId, submitted_by: a.id,
    file_path: caminho, original_name: "qa.png", mime_type: "image/png",
    size_bytes: png.length, sha256: createHash("sha256").update(png).digest("hex"),
    status: "uploading",
  });
  assert.ok(repeticao.error, "ID duplicado deveria ser recusado");
  console.log("QA: identificador duplicado bloqueado OK");
} finally {
  if (caminho) await admin.storage.from("creative-review").remove([caminho]);
  if (submissaoId) await admin.from("creative_review_requests").delete().eq("id", submissaoId);
  for (const id of negocios) await admin.from("businesses").delete().eq("id", id);
  for (const id of usuarios) await admin.auth.admin.deleteUser(id);
}
