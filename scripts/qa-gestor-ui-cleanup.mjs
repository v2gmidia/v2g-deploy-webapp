/** Remove somente fixture de interface do gestor no Supabase QA. */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
assert.match(url, /^https:\/\/zskpijnqgkqwxksqmzmf\.supabase\.co\/?$/);
const [id, businessId] = process.argv.slice(2);
assert.match(id ?? "", /^[0-9a-f-]{36}$/i);
assert.match(businessId ?? "", /^[0-9a-f-]{36}$/i);
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY ?? "", {
  auth: { persistSession: false, autoRefreshToken: false },
});
const usuario = await admin.auth.admin.getUserById(id);
assert.ifError(usuario.error);
assert.match(usuario.data.user.email ?? "", /^qa-gestor-ui-[0-9a-f-]+@example\.invalid$/);
const negocio = await admin.from("businesses").select("id, name, profile_id")
  .eq("id", businessId).single();
assert.ifError(negocio.error);
assert.equal(negocio.data.name, "Negocio QA Temporario");
assert.equal(negocio.data.profile_id, id);
for (const [tabela, filtro] of [
  ["manager_tasks", "business_id"], ["manager_accounts", "business_id"],
]) {
  const apagado = await admin.from(tabela).delete().eq(filtro, businessId);
  assert.ifError(apagado.error);
}
const apagadoNegocio = await admin.from("businesses").delete().eq("id", businessId);
assert.ifError(apagadoNegocio.error);
const apagadoUsuario = await admin.auth.admin.deleteUser(id);
assert.ifError(apagadoUsuario.error);
console.log("Fixture da interface do gestor removida do QA");
