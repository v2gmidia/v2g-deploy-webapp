/** Ensaio de RLS e estados da fila interna somente no Supabase QA. */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { tarefasDaPreparacao } from "../lib/gestor/preparacao.ts";
import { idDaTarefaDeRevisao, TITULO_TAREFA_REVISAO } from "../lib/gestor/revisao-pendente.ts";
import { sincronizarTarefaDeRevisao } from "../lib/gestor/sincronizar-revisao.ts";

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
let outroNegocioId = null;
let tarefaId = null;
let outraTarefaId = null;
let preparacaoIds = [];
let historicoIds = [];
let solicitacaoId = null;
let tarefaDeRevisaoId = null;
let outraSolicitacaoId = null;
let outraRevisaoTarefaId = null;

try {
  for (const papel of ["operador", "cliente", "operador2"]) {
    const email = `qa-gestor-${papel}-${marcador}@example.invalid`;
    const criado = await admin.auth.admin.createUser({
      email, password: senha, email_confirm: true,
      app_metadata: papel.startsWith("operador") ? { papel: "operador" } : {},
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
  const outroNegocio = await admin.from("businesses").insert({
    name: "QA Outra Conta Gestor", profile_id: operador.id, dados_ficticios: true,
  }).select("id").single();
  assert.ifError(outroNegocio.error);
  outroNegocioId = outroNegocio.data.id;

  const atribuicao = await admin.from("manager_accounts").insert({
    business_id: negocioId, operator_profile_id: operador.id, assigned_by: operador.id,
  });
  assert.ifError(atribuicao.error);
  const outraAtribuicao = await admin.from("manager_accounts").insert({
    business_id: outroNegocioId, operator_profile_id: operador.id, assigned_by: operador.id,
  });
  assert.ifError(outraAtribuicao.error);
  const atribuicoesDaConta = await admin.from("manager_accounts")
    .select("business_id, operator_profile_id, assigned_at")
    .eq("business_id", negocioId).limit(1000);
  assert.ifError(atribuicoesDaConta.error);
  assert.equal(atribuicoesDaConta.data.length, 1);
  assert.equal(atribuicoesDaConta.data[0].business_id, negocioId);
  const atribuicaoRepetida = await admin.from("manager_accounts").insert({
    business_id: negocioId, operator_profile_id: operador.id, assigned_by: operador.id,
  });
  assert.ok(atribuicaoRepetida.error, "Atribuicao duplicada deveria ser recusada");
  console.log("QA: uma atribuicao por negocio OK");

  tarefaId = randomUUID();
  const criada = await admin.from("manager_tasks").insert({
    id: tarefaId, business_id: negocioId, task_type: "prepare_meeting",
    title: "Preparar reunião QA", assigned_to: operador.id, created_by: operador.id,
    created_at: "2026-01-01T00:00:00.000Z",
  });
  assert.ifError(criada.error);
  outraTarefaId = randomUUID();
  const outraTarefa = await admin.from("manager_tasks").insert({
    id: outraTarefaId, business_id: outroNegocioId, task_type: "support",
    title: "Tarefa de outra conta QA", assigned_to: operador.id, created_by: operador.id,
  });
  assert.ifError(outraTarefa.error);
  const tarefasDaConta = await admin.from("manager_tasks").select("id, business_id")
    .eq("business_id", negocioId).order("created_at", { ascending: false }).limit(1000);
  assert.ifError(tarefasDaConta.error);
  assert.ok(tarefasDaConta.data.some((item) => item.id === tarefaId));
  assert.ok(tarefasDaConta.data.every((item) => item.business_id === negocioId));
  assert.ok(tarefasDaConta.data.every((item) => item.id !== outraTarefaId));
  console.log("QA: filtro da conta não trouxe tarefa de outro negócio OK");
  const historico = Array.from({ length: 101 }, (_, indice) => {
    const id = randomUUID();
    const momento = new Date(Date.UTC(2026, 1, 1, 0, indice)).toISOString();
    return { id, business_id: negocioId, task_type: "other", title: `Histórico QA ${indice}`,
      status: "done", assigned_to: operador.id, created_by: operador.id,
      completed_by: operador.id, completed_at: momento,
      completion_note: "Conclusão sintética do ensaio", created_at: momento };
  });
  historicoIds = historico.map((item) => item.id);
  const insercaoHistorico = await admin.from("manager_tasks").insert(historico);
  assert.ifError(insercaoHistorico.error);
  const consultaAntiga = await admin.from("manager_tasks").select("id")
    .eq("business_id", negocioId).order("created_at", { ascending: false }).limit(100);
  const consultaAbertas = await admin.from("manager_tasks")
    .select("id, status", { count: "exact" }).eq("business_id", negocioId)
    .eq("status", "open").order("created_at", { ascending: true }).limit(100);
  assert.ifError(consultaAntiga.error);
  assert.ifError(consultaAbertas.error);
  assert.equal(consultaAntiga.data.some((item) => item.id === tarefaId), false);
  assert.equal(consultaAbertas.count, 1);
  assert.equal(consultaAbertas.data[0]?.id, tarefaId);
  const [minhasAbertas, semResponsavel, concluidas] = await Promise.all([
    admin.from("manager_tasks").select("id", { count: "exact" })
      .eq("business_id", negocioId).eq("status", "open").eq("assigned_to", operador.id).limit(100),
    admin.from("manager_tasks").select("id", { count: "exact" })
      .eq("business_id", negocioId).eq("status", "open").is("assigned_to", null).limit(100),
    admin.from("manager_tasks").select("id", { count: "exact" })
      .eq("business_id", negocioId).eq("status", "done").limit(100),
  ]);
  for (const resultado of [minhasAbertas, semResponsavel, concluidas]) assert.ifError(resultado.error);
  assert.equal(minhasAbertas.count, 1);
  assert.equal(semResponsavel.count, 0);
  assert.equal(concluidas.count, 101);
  assert.equal(concluidas.data.length, 100, "O total deve denunciar o recorte de 100 itens");
  console.log("QA: tarefa aberta antiga visível apesar de 101 concluídas mais recentes OK");
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

  const itens = tarefasDaPreparacao(negocioId);
  preparacaoIds = itens.map((item) => item.id);
  for (const item of itens) {
    const criada = await admin.from("manager_tasks").insert({
      id: item.id, business_id: negocioId, task_type: item.tipo,
      title: item.titulo, description: item.descricao,
      assigned_to: operador.id, created_by: operador.id,
    });
    assert.ifError(criada.error);
  }
  const repeticaoPreparacao = await admin.from("manager_tasks").insert({
    id: itens[0].id, business_id: negocioId, task_type: itens[0].tipo,
    title: itens[0].titulo, assigned_to: operador.id, created_by: operador.id,
  });
  assert.equal(repeticaoPreparacao.error?.code, "23505");
  const preparadas = await admin.from("manager_tasks").select("id, assigned_to, task_type")
    .eq("business_id", negocioId).in("id", preparacaoIds);
  assert.ifError(preparadas.error);
  assert.equal(preparadas.data.length, 3);
  assert.ok(preparadas.data.every((item) => item.assigned_to === operador.id));
  console.log("QA: três pendências iniciais atribuídas sem duplicação OK");

  solicitacaoId = randomUUID();
  tarefaDeRevisaoId = idDaTarefaDeRevisao(solicitacaoId);
  const solicitacao = await admin.from("creative_review_requests").insert({
    id: solicitacaoId, business_id: negocioId, submitted_by: operador.id,
    file_path: `${negocioId}/${solicitacaoId}`, original_name: "qa.png",
    mime_type: "image/png", size_bytes: 8, sha256: "0".repeat(64),
    status: "awaiting_review",
  });
  assert.ifError(solicitacao.error);
  const semGestor = await admin.from("manager_accounts").delete().eq("business_id", negocioId);
  assert.ifError(semGestor.error);
  let falharInsercao = true;
  const adminComFalhaPontual = new Proxy(admin, {
    get(alvo, propriedade) {
      if (propriedade !== "from") return Reflect.get(alvo, propriedade);
      return (tabela) => {
        const consulta = alvo.from(tabela);
        if (tabela !== "manager_tasks") return consulta;
        return new Proxy(consulta, {
          get(objeto, metodo) {
            if (metodo === "insert" && falharInsercao) return () => {
              falharInsercao = false;
              return Promise.resolve({ error: { message: "falha QA simulada" } });
            };
            return Reflect.get(objeto, metodo);
          },
        });
      };
    },
  });
  await assert.rejects(() => sincronizarTarefaDeRevisao(adminComFalhaPontual, solicitacaoId, negocioId));
  const aposFalha = await admin.from("manager_tasks").select("id", { count: "exact", head: true })
    .eq("id", tarefaDeRevisaoId);
  assert.ifError(aposFalha.error);
  assert.equal(aposFalha.count, 0);
  const inicial = await sincronizarTarefaDeRevisao(admin, solicitacaoId, negocioId);
  assert.equal(inicial.status, "open");
  assert.equal(inicial.assignedTo, null);
  const repeticao = await sincronizarTarefaDeRevisao(admin, solicitacaoId, negocioId);
  assert.equal(repeticao.status, "open");
  const novaAtribuicao = await admin.from("manager_accounts").insert({
    business_id: negocioId, operator_profile_id: operador.id, assigned_by: operador.id,
  });
  assert.ifError(novaAtribuicao.error);
  const aposAtribuicao = await sincronizarTarefaDeRevisao(admin, solicitacaoId, negocioId);
  assert.equal(aposAtribuicao.assignedTo, operador.id);
  const trocaGestor = await admin.from("manager_accounts").update({
    operator_profile_id: usuarios[2].id, updated_at: new Date().toISOString(),
  }).eq("business_id", negocioId);
  assert.ifError(trocaGestor.error);
  const aposTroca = await sincronizarTarefaDeRevisao(admin, solicitacaoId, negocioId);
  assert.equal(aposTroca.assignedTo, usuarios[2].id);
  const devolucao = await admin.from("manager_accounts").update({
    operator_profile_id: operador.id, updated_at: new Date().toISOString(),
  }).eq("business_id", negocioId);
  assert.ifError(devolucao.error);
  const aposDevolucao = await sincronizarTarefaDeRevisao(admin, solicitacaoId, negocioId);
  assert.equal(aposDevolucao.assignedTo, operador.id);
  const duplicada = await admin.from("manager_tasks").insert({
    id: tarefaDeRevisaoId, business_id: negocioId, task_type: "other",
    title: TITULO_TAREFA_REVISAO, created_by: operador.id,
  });
  assert.equal(duplicada.error?.code, "23505");
  const decidida = await admin.from("creative_review_requests").update({
    status: "approved_for_manual_publish", reviewed_by: operador.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", solicitacaoId).eq("status", "awaiting_review").select("id").single();
  assert.ifError(decidida.error);
  const encerrada = await sincronizarTarefaDeRevisao(admin, solicitacaoId, negocioId);
  assert.equal(encerrada.status, "done");
  const repeticaoDaDecisao = await sincronizarTarefaDeRevisao(admin, solicitacaoId, negocioId);
  assert.equal(repeticaoDaDecisao.status, "done");
  const quantidade = await admin.from("manager_tasks").select("id", { count: "exact", head: true })
    .eq("id", tarefaDeRevisaoId);
  assert.ifError(quantidade.error);
  assert.equal(quantidade.count, 1);
  await assert.rejects(() => sincronizarTarefaDeRevisao(admin, solicitacaoId, outroNegocioId));
  console.log("QA: falha pontual, retomada, troca de gestor e decisão repetida sem duplicar OK");

  // A decisao pode vencer a tentativa de criar a tarefa auxiliar.
  outraSolicitacaoId = randomUUID();
  outraRevisaoTarefaId = idDaTarefaDeRevisao(outraSolicitacaoId);
  const decididaAntes = await admin.from("creative_review_requests").insert({
    id: outraSolicitacaoId, business_id: outroNegocioId, submitted_by: operador.id,
    file_path: `${outroNegocioId}/${outraSolicitacaoId}`, original_name: "qa-corrida.png",
    mime_type: "image/png", size_bytes: 8, sha256: "0".repeat(64),
    status: "changes_requested", reviewed_by: operador.id,
    reviewed_at: new Date().toISOString(),
  });
  assert.ifError(decididaAntes.error);
  const recuperada = await sincronizarTarefaDeRevisao(admin, outraSolicitacaoId, outroNegocioId);
  assert.equal(recuperada.status, "done");
  console.log("QA: decisão anterior à criação também resulta em tarefa concluída OK");
} finally {
  const falhasDaLimpeza = [];
  const conferirLimpeza = (resultado, etapa) => {
    if (resultado.error) falhasDaLimpeza.push(`${etapa}: ${resultado.error.code ?? "erro"}`);
  };
  if (tarefaId) conferirLimpeza(await admin.from("manager_tasks").delete().eq("id", tarefaId), "tarefa");
  if (outraTarefaId) conferirLimpeza(await admin.from("manager_tasks").delete().eq("id", outraTarefaId), "outra tarefa");
  if (preparacaoIds.length) conferirLimpeza(await admin.from("manager_tasks").delete().in("id", preparacaoIds), "preparação");
  if (historicoIds.length) conferirLimpeza(await admin.from("manager_tasks").delete().in("id", historicoIds), "histórico");
  if (tarefaDeRevisaoId) conferirLimpeza(await admin.from("manager_tasks").delete().eq("id", tarefaDeRevisaoId), "tarefa de criativo");
  if (outraRevisaoTarefaId) conferirLimpeza(await admin.from("manager_tasks").delete().eq("id", outraRevisaoTarefaId), "outra tarefa de criativo");
  if (solicitacaoId) conferirLimpeza(await admin.from("creative_review_requests").delete().eq("id", solicitacaoId), "solicitação de criativo");
  if (outraSolicitacaoId) conferirLimpeza(await admin.from("creative_review_requests").delete().eq("id", outraSolicitacaoId), "outra solicitação de criativo");
  if (negocioId) {
    conferirLimpeza(await admin.from("manager_accounts").delete().eq("business_id", negocioId), "atribuição");
    conferirLimpeza(await admin.from("businesses").delete().eq("id", negocioId), "negócio");
  }
  if (outroNegocioId) {
    conferirLimpeza(await admin.from("manager_accounts").delete().eq("business_id", outroNegocioId), "outra atribuição");
    conferirLimpeza(await admin.from("businesses").delete().eq("id", outroNegocioId), "outro negócio");
  }
  for (const usuario of usuarios) conferirLimpeza(await admin.auth.admin.deleteUser(usuario.id), "usuário");
  assert.deepEqual(falhasDaLimpeza, [], "A limpeza dos registros sintéticos do QA falhou");
  for (const id of [negocioId, outroNegocioId].filter(Boolean)) {
    const [negociosRestantes, tarefasRestantes, atribuicoesRestantes] = await Promise.all([
      admin.from("businesses").select("id", { count: "exact", head: true }).eq("id", id),
      admin.from("manager_tasks").select("id", { count: "exact", head: true }).eq("business_id", id),
      admin.from("manager_accounts").select("business_id", { count: "exact", head: true }).eq("business_id", id),
    ]);
    for (const resultado of [negociosRestantes, tarefasRestantes, atribuicoesRestantes]) {
      assert.ifError(resultado.error);
      assert.equal(resultado.count, 0, "A fixture do QA precisa ser removida por completo");
    }
  }
}
