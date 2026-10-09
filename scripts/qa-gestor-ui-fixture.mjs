/** Fixture temporaria para a interface do gestor; so aceita o Supabase QA. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
assert.match(url, /^https:\/\/zskpijnqgkqwxksqmzmf\.supabase\.co\/?$/);
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = `qa-gestor-ui-${randomUUID()}@example.invalid`;
const password = randomBytes(24).toString("base64url");
const usuario = await admin.auth.admin.createUser({
  email, password, email_confirm: true, app_metadata: { papel: "operador" },
});
assert.ifError(usuario.error);
const id = usuario.data.user.id;
try {
  const perfil = await admin.from("profiles").upsert({ id, full_name: "Gestor QA Temporario" });
  assert.ifError(perfil.error);
  const negocio = await admin.from("businesses").insert({
    name: "Negocio QA Temporario", profile_id: id, dados_ficticios: false,
  }).select("id").single();
  assert.ifError(negocio.error);
  console.log(JSON.stringify({ id, businessId: negocio.data.id, email, password }));
} catch (erro) {
  await admin.auth.admin.deleteUser(id);
  throw erro;
}
