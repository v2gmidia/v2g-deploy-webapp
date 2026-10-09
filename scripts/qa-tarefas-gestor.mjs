/** Ensaio de RLS e estados da fila interna somente no Supabase QA. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
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
let negocioId = null;
let tarefaId = null;

try {
  for (const papel of ["operador", "cliente"]) {
    const email = `qa-gestor-${papel}-${marcador}@example.invalid`;
    const criado = await admin.auth.admin.createUser({
      email, password: senha, email_confirm: true,
      app_metadata: papel === "operador" ? { papel: "operador" } : {},
    });
    assert.ifError(criado.error);
    usuarios.push({ id: criado.data.user.id, email, papel });
    const perfil = await admin.from("profiles").upsert({
      id: criado.data.user.id, full_name: `QA ${papel}`,
    });
    assert.ifError(perfil.error);
  }
  const operador = usuarios[0];
  const cliente = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const login = await cliente.auth.signInWithPassword({ email: usuarios[1].email, password: senha });
  assert.ifError(login.error);
  const negocio = await admin.from("businesses").insert({
    name: "QA Fila Gestor", profile_id: operador.id, dados_ficticios: true,
  }).select("id").single();
  assert.ifError(negocio.error);
  negocioId = negocio.data.id;

  const atribuicao = await admin.from("manager_accounts").insert({
    business_id: negocioId, operator_profile_id: operador.id, assigned_by: operador.id,
  });
  assert.ifError(atribuicao.error);
  const atribuicaoRepetida = await admin.from("manager_accounts").insert({
    business_id: negocioId, operator_profile_id: operador.id, assigned_by: operador.id,
  });
  assert.ok(atribuicaoRepetida.error, "Atribuicao duplicada deveria ser recusada");
  console.log("QA: uma atribuicao por negocio OK");

  tarefaId = randomUUID();
  const criada = await admin.from("manager_tasks").insert({
    id: tarefaId, business_id: negocioId, task_type: "prepare_meeting",
    title: "Preparar reunião QA", assigned_to: operador.id, created_by: operador.id,
  });
  assert.ifError(criada.error);
  const repetida = await admin.from("manager_tasks").insert({
    id: tarefaId, business_id: negocioId, task_type: "prepare_meeting",
    title: "Preparar reunião QA", assigned_to: operador.id, created_by: operador.id,
  });
  assert.ok(repetida.error, "ID duplicado deveria ser recusado");
  console.log("QA: tarefa duplicada bloqueada OK");

  for (const ator of [anon, cliente]) {
    const conta = await ator.from("manager_accounts").select("business_id").eq("business_id", negocioId);
    const tarefa = await ator.from("manager_tasks").select("id").eq("id", tarefaId);
    assert.ok(conta.error || conta.data.length === 0);
    assert.ok(tarefa.error || tarefa.data.length === 0);
    const escrita = await ator.from("manager_tasks").update({ title: "Tentativa externa" })
      .eq("id", tarefaId).select("id");
    assert.ok(escrita.error || escrita.data.length === 0);
  }
  console.log("QA: anonimo e cliente sem leitura ou escrita direta OK");

  const invalida = await admin.from("manager_tasks").update({ status: "done" }).eq("id", tarefaId);
  assert.ok(invalida.error, "Conclusao sem autor e nota deveria falhar no banco");
  const concluida = await admin.from("manager_tasks").update({
    status: "done", completed_by: operador.id, completed_at: new Date().toISOString(),
    completion_note: "Reunião preparada no ensaio QA",
  }).eq("id", tarefaId).eq("status", "open").eq("assigned_to", operador.id)
    .select("id, status").single();
  assert.ifError(concluida.error);
  assert.equal(concluida.data.status, "done");
  const conclusaoRepetida = await admin.from("manager_tasks").update({
    completion_note: "Outra conclusão",
  }).eq("id", tarefaId).eq("status", "open").select("id");
  assert.ifError(conclusaoRepetida.error);
  assert.equal(conclusaoRepetida.data.length, 0);
  console.log("QA: conclusao valida e repeticao bloqueada OK");
} finally {
  if (tarefaId) await admin.from("manager_tasks").delete().eq("id", tarefaId);
  if (negocioId) {
    await admin.from("manager_accounts").delete().eq("business_id", negocioId);
    await admin.from("businesses").delete().eq("id", negocioId);
  }
  for (const usuario of usuarios) await admin.auth.admin.deleteUser(usuario.id);
}
