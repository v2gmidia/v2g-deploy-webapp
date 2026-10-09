import assert from "node:assert/strict";
import test from "node:test";
import { ordenarTarefas, prioridadeDaTarefa, TIPOS_DE_TAREFA,
  vencimentoDaTarefa } from "../lib/gestor/tarefas.ts";

const agora = Date.parse("2026-10-09T15:00:00Z");
const base = { id: "a", business_id: "negocio", task_type: "collect_access",
  title: "Conferir acesso", description: null, status: "open", assigned_to: "gestor",
  due_at: null, created_at: "2026-10-09T12:00:00Z", completed_at: null, completion_note: null };

test("fila prioriza sem responsavel e prazo vencido", () => {
  const tarefas = [
    { ...base, id: "normal" },
    { ...base, id: "sem", assigned_to: null },
    { ...base, id: "vencida", due_at: "2026-10-09T10:00:00Z" },
    { ...base, id: "amanha", due_at: "2026-10-10T10:00:00Z" },
    { ...base, id: "feita", status: "done", completed_at: "2026-10-09T13:00:00Z", completion_note: "Conferido" },
  ];
  assert.deepEqual(ordenarTarefas(tarefas, agora).map((t) => t.id),
    ["vencida", "sem", "amanha", "normal", "feita"]);
  assert.equal(prioridadeDaTarefa(tarefas[4], agora), 4);
});

test("rótulos não confundem tarefa com estado externo", () => {
  assert.equal(vencimentoDaTarefa({ ...base, assigned_to: null }, agora), "Sem responsável");
  assert.equal(vencimentoDaTarefa({ ...base, due_at: "2026-10-09T10:00:00Z" }, agora), "Prazo vencido");
  assert.equal(vencimentoDaTarefa({ ...base, status: "done" }, agora), "Concluída pelo operador");
  assert.match(TIPOS_DE_TAREFA.prepare_first_campaign, /Preparar/);
});
