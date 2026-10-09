/** Regressão de ordenação da fila, com fixtures descartáveis somente no QA. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
assert.match(url, /^https:\/\/zskpijnqgkqwxksqmzmf\.supabase\.co\/?$/,
  "Este ensaio só pode rodar no Supabase QA nomeado");
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
assert.ok(chave, "Credencial QA ausente");
const admin = createClient(url, chave, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const marcador = randomUUID();
const usuario = await admin.auth.admin.createUser({
  email: `qa-prioridade-criativos-${marcador}@example.invalid`,
  password: randomBytes(24).toString("base64url"), email_confirm: true,
});
assert.ifError(usuario.error);
const usuarioId = usuario.data.user.id;
let negocioId = null;
let outroNegocioId = null;

try {
  const perfil = await admin.from("profiles").upsert({ id: usuarioId, full_name: "QA Prioridade Criativos" });
  assert.ifError(perfil.error);
  const negocio = await admin.from("businesses").insert({
    name: "QA Prioridade Criativos", profile_id: usuarioId, dados_ficticios: true,
  }).select("id").single();
  assert.ifError(negocio.error);
  negocioId = negocio.data.id;
  const outroNegocio = await admin.from("businesses").insert({
    name: "QA Outra Conta Criativos", profile_id: usuarioId, dados_ficticios: true,
  }).select("id").single();
  assert.ifError(outroNegocio.error);
  outroNegocioId = outroNegocio.data.id;

  const pendenteId = randomUUID();
  const pendenteOutraContaId = randomUUID();
  const linha = (id, status, created_at) => ({
    id, business_id: negocioId, submitted_by: usuarioId,
    file_path: `${negocioId}/${id}`, original_name: "qa.png",
    mime_type: "image/png", size_bytes: 8, sha256: "a".repeat(64), status, created_at,
  });
  const historico = Array.from({ length: 101 }, (_, indice) =>
    linha(randomUUID(), "upload_failed", new Date(Date.UTC(2026, 1, 1, 0, indice)).toISOString()));
  const insercao = await admin.from("creative_review_requests").insert([
    linha(pendenteId, "awaiting_review", "2026-01-01T00:00:00.000Z"), ...historico,
    { ...linha(pendenteOutraContaId, "awaiting_review", "2026-01-02T00:00:00.000Z"),
      business_id: outroNegocioId, file_path: `${outroNegocioId}/${pendenteOutraContaId}` },
  ]);
  assert.ifError(insercao.error);
  const atribuicao = await admin.from("manager_accounts").insert({
    business_id: negocioId, operator_profile_id: usuarioId, assigned_by: usuarioId,
  });
  assert.ifError(atribuicao.error);

  const colunas = "id, business_id, original_name, file_path, status, review_note, created_at";
  const antiga = await admin.from("creative_review_requests").select("id")
    .eq("business_id", negocioId).order("created_at", { ascending: false }).limit(100);
  const pendentes = await admin.from("creative_review_requests")
    .select(colunas, { count: "exact" }).eq("business_id", negocioId)
    .eq("status", "awaiting_review").order("created_at", { ascending: true }).limit(100);
  const recentes = await admin.from("creative_review_requests")
    .select(colunas).eq("business_id", negocioId).neq("status", "awaiting_review")
    .order("created_at", { ascending: false }).limit(30);
  assert.ifError(antiga.error);
  assert.ifError(pendentes.error);
  assert.ifError(recentes.error);
  assert.equal(antiga.data.length, 100);
  assert.equal(antiga.data.some((item) => item.id === pendenteId), false,
    "O limite anterior deveria ocultar a pendência antiga nesta fixture");
  assert.equal(pendentes.count, 1);
  assert.equal(pendentes.data[0]?.id, pendenteId);
  assert.ok(pendentes.data.every((item) => item.business_id === negocioId),
    "O filtro do negócio não pode trazer a peça de outra conta");
  assert.equal(recentes.data.length, 30);
  assert.ok(recentes.data.every((item) => item.status !== "awaiting_review"));
  console.log("QA: pendência antiga visível antes dos 30 itens recentes; filtro não trouxe a peça de outra conta.");
  const minhasContas = await admin.from("manager_accounts").select("business_id")
    .eq("operator_profile_id", usuarioId).limit(1000);
  assert.ifError(minhasContas.error);
  const idsAtribuidos = minhasContas.data.map((item) => item.business_id);
  assert.deepEqual(idsAtribuidos, [negocioId]);
  const minhasPendencias = await admin.from("creative_review_requests")
    .select("id, business_id", { count: "exact" }).eq("status", "awaiting_review")
    .in("business_id", idsAtribuidos).order("created_at", { ascending: true }).limit(100);
  assert.ifError(minhasPendencias.error);
  assert.equal(minhasPendencias.count, 1);
  assert.equal(minhasPendencias.data[0]?.id, pendenteId);
  assert.ok(minhasPendencias.data.every((item) => item.business_id === negocioId));
  console.log("QA: filtro Minhas contas trouxe só a peça da conta atribuída.");
} finally {
  if (outroNegocioId) {
    const remocao = await admin.from("creative_review_requests").delete().eq("business_id", outroNegocioId);
    assert.ifError(remocao.error);
    const negocio = await admin.from("businesses").delete().eq("id", outroNegocioId);
    assert.ifError(negocio.error);
  }
  if (negocioId) {
    const remocao = await admin.from("creative_review_requests").delete().eq("business_id", negocioId);
    assert.ifError(remocao.error);
    const negocio = await admin.from("businesses").delete().eq("id", negocioId);
    assert.ifError(negocio.error);
  }
  const usuario = await admin.auth.admin.deleteUser(usuarioId);
  assert.ifError(usuario.error);
}
