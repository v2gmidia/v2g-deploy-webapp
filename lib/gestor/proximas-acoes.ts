import { solicitacaoDaTarefaDeRevisao } from "./revisao-pendente.ts";

export type RevisaoAberta = { id: string; business_id: string; created_at: string };
export type TarefaAberta = {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_at: string | null;
  created_at: string;
};
export type ProximaAcao = {
  id: string;
  tipo: "revisao" | "tarefa";
  negocio: string;
  titulo: string;
  situacao: string;
  href: string;
  prioridade: number;
  ordenacao: number;
};

/** Somente trabalho das contas atribuídas ao operador. A peça é a fonte da revisão. */
export function proximasAcoesDoGestor(
  gestorId: string,
  minhasContas: ReadonlySet<string>,
  nomes: ReadonlyMap<string, string>,
  revisoes: readonly RevisaoAberta[],
  tarefas: readonly TarefaAberta[],
  agora: number,
): ProximaAcao[] {
  const revisoesVisiveis = revisoes.filter((r) => minhasContas.has(r.business_id));
  const idsRevisao = new Set(revisoesVisiveis.map((r) => r.id));
  const acoes: ProximaAcao[] = revisoesVisiveis.map((r) => ({
    id: `revisao:${r.id}`,
    tipo: "revisao",
    negocio: nomes.get(r.business_id) ?? "Negócio sem nome nesta consulta",
    titulo: "Revisar criativo enviado",
    situacao: "Peça aguardando decisão",
    href: `/gestor/criativos?negocio=${encodeURIComponent(r.business_id)}&peca=${encodeURIComponent(r.id)}`,
    prioridade: 0,
    ordenacao: Date.parse(r.created_at) || 0,
  }));
  for (const tarefa of tarefas) {
    if (!minhasContas.has(tarefa.business_id)) continue;
    if (tarefa.assigned_to && tarefa.assigned_to !== gestorId) continue;
    const revisao = solicitacaoDaTarefaDeRevisao(tarefa.id, tarefa.business_id, tarefa.description);
    if (revisao && idsRevisao.has(revisao)) continue;
    const vencimento = tarefa.due_at ? Date.parse(tarefa.due_at) : NaN;
    const vencida = Number.isFinite(vencimento) && vencimento < agora;
    acoes.push({
      id: `tarefa:${tarefa.id}`,
      tipo: "tarefa",
      negocio: nomes.get(tarefa.business_id) ?? "Negócio sem nome nesta consulta",
      titulo: tarefa.title,
      situacao: !tarefa.assigned_to ? "Sem responsável na tarefa" : vencida ? "Prazo vencido" :
        Number.isFinite(vencimento) ? "Com prazo registrado" : "Sem prazo registrado",
      href: `/gestor/tarefas?negocio=${encodeURIComponent(tarefa.business_id)}&filtro=abertas`,
      prioridade: !tarefa.assigned_to || vencida ? 1 : 2,
      ordenacao: Number.isFinite(vencimento) ? vencimento : Date.parse(tarefa.created_at) || 0,
    });
  }
  return acoes.sort((a, b) => a.prioridade - b.prioridade || a.ordenacao - b.ordenacao || a.id.localeCompare(b.id));
}
