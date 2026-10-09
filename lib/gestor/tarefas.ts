export const TIPOS_DE_TAREFA = {
  prepare_meeting: "Preparar reunião",
  review_instagram: "Avaliar Instagram",
  collect_access: "Conferir acessos",
  choose_first_creative: "Definir primeiro criativo",
  prepare_first_campaign: "Preparar primeira campanha",
  support: "Atender solicitação",
  other: "Outra tarefa",
} as const;

export type TipoDeTarefa = keyof typeof TIPOS_DE_TAREFA;
export type TarefaDoGestor = {
  id: string;
  business_id: string;
  task_type: TipoDeTarefa;
  title: string;
  description: string | null;
  status: "open" | "done";
  assigned_to: string | null;
  due_at: string | null;
  created_at: string;
  completed_at: string | null;
  completion_note: string | null;
};

export function prioridadeDaTarefa(tarefa: TarefaDoGestor, agora: number): number {
  if (tarefa.status === "done") return 4;
  if (!tarefa.assigned_to) return 0;
  if (tarefa.due_at && Date.parse(tarefa.due_at) < agora) return 0;
  if (tarefa.due_at && Date.parse(tarefa.due_at) < agora + 24 * 60 * 60_000) return 1;
  return 2;
}

export function ordenarTarefas(tarefas: TarefaDoGestor[], agora: number): TarefaDoGestor[] {
  return [...tarefas].sort((a, b) => prioridadeDaTarefa(a, agora) - prioridadeDaTarefa(b, agora)
    || (a.due_at ?? "9999").localeCompare(b.due_at ?? "9999")
    || a.created_at.localeCompare(b.created_at));
}

export function vencimentoDaTarefa(tarefa: TarefaDoGestor, agora: number): string {
  if (tarefa.status === "done") return "Concluída pelo operador";
  if (!tarefa.assigned_to) return "Sem responsável";
  if (!tarefa.due_at) return "Sem prazo registrado";
  if (Date.parse(tarefa.due_at) < agora) return "Prazo vencido";
  return "Dentro do prazo registrado";
}
