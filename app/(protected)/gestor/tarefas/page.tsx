import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ordenarTarefas, prioridadeDaTarefa, TIPOS_DE_TAREFA,
  vencimentoDaTarefa, type TarefaDoGestor } from "@/lib/gestor/tarefas";
import { AssumirConta, ConcluirTarefa, CriarTarefa } from "./Formularios";

export const metadata = { title: "Tarefas do gestor | V2G", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TarefasDoGestorPage({ searchParams }: {
  searchParams: Promise<{ negocio?: string; q?: string; filtro?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();
  if (process.env.V2G_MANAGER_WORK_ENABLED !== "true")
    return <div className="canvas"><h1>Tarefas do gestor</h1><p>A fila interna ainda não foi ativada neste ambiente.</p></div>;
  try {
    const admin = createAdminClient();
    const [negocios, tarefas, atribuicoes] = await Promise.all([
      admin.from("businesses").select("id, name").eq("dados_ficticios", false).order("name").limit(1000),
      admin.from("manager_tasks").select("id, business_id, task_type, title, description, status, assigned_to, due_at, created_at, completed_at, completion_note")
        .order("created_at", { ascending: false }).limit(1000),
      admin.from("manager_accounts").select("business_id, operator_profile_id, assigned_at").limit(1000),
    ]);
    if (negocios.error || tarefas.error || atribuicoes.error ||
        !negocios.data || !tarefas.data || !atribuicoes.data) throw new Error("fila indisponível");
    const negociosPorId = new Map(negocios.data.map((negocio) => [negocio.id, negocio.name]));
    const responsaveis = [...new Set([
      ...atribuicoes.data.map((atribuicao) => atribuicao.operator_profile_id),
      ...tarefas.data.map((tarefa) => tarefa.assigned_to).filter((id): id is string => !!id),
    ])];
    const perfis = responsaveis.length ? await admin.from("profiles")
      .select("id, full_name").in("id", responsaveis) : { data: [], error: null };
    const nomes = new Map((perfis.data ?? []).map((perfil) => [perfil.id, perfil.full_name]));
    const responsavelPorNegocio = new Map(atribuicoes.data.map((atribuicao) =>
      [atribuicao.business_id, atribuicao.operator_profile_id]));
    const semResponsavel = negocios.data.filter((negocio) => !responsavelPorNegocio.has(negocio.id));
    const parametros = await searchParams;
    const negocioInicial = negociosPorId.has(parametros.negocio ?? "") ? parametros.negocio! : null;
    const busca = typeof parametros.q === "string" ? parametros.q.trim().slice(0, 120) : "";
    const filtro = ["abertas", "minhas", "sem_responsavel", "concluidas"].includes(parametros.filtro ?? "")
      ? parametros.filtro! : "abertas";
    const agora = Date.now();
    const linhas = ordenarTarefas(tarefas.data as TarefaDoGestor[], agora);
    const visiveis = linhas.filter((tarefa) => {
      if (filtro === "abertas" && tarefa.status !== "open") return false;
      if (filtro === "minhas" && (tarefa.status !== "open" || tarefa.assigned_to !== user.id)) return false;
      if (filtro === "sem_responsavel" && (tarefa.status !== "open" || !!tarefa.assigned_to)) return false;
      if (filtro === "concluidas" && tarefa.status !== "done") return false;
      const texto = `${negociosPorId.get(tarefa.business_id) ?? ""} ${tarefa.title}`.toLocaleLowerCase("pt-BR");
      return !busca || texto.includes(busca.toLocaleLowerCase("pt-BR"));
    });
    const parcial = negocios.data.length === 1000 || tarefas.data.length === 1000 ||
      atribuicoes.data.length === 1000 || !!perfis.error;
    const formatarData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
    return <div className="canvas">
      <div className="page-head"><p>OPERAÇÃO · USO INTERNO</p><h1>Tarefas e responsáveis</h1>
        <p>Acompanhe a preparação de cada conta. Estas tarefas são registros da equipe, não estados confirmados da Meta ou de pagamentos.</p></div>
      <p><a href="/gestor">Voltar à carteira</a> · <a href="/gestor/criativos">Peças para revisar</a></p>
      {parcial && <p className="form-warning">Consulta parcial ou nomes de responsáveis indisponíveis. Confira o registro antes de decidir.</p>}
      <div className="auth-card"><strong>{linhas.filter((t) => t.status === "open").length} abertas</strong> · {linhas.filter((t) => t.status === "open" && prioridadeDaTarefa(t, agora) === 0).length} vencidas ou sem responsável · {atribuicoes.data.length} contas com responsável registrado</div>
      <CriarTarefa negocios={negocios.data} negocioInicial={negocioInicial} />
      <section aria-labelledby="contas-sem-responsavel"><h2 id="contas-sem-responsavel">Responsável por conta</h2>
        {negocios.data.length === 0 && <p>Nenhum negócio retornado nesta consulta.</p>}
        <details><summary>{semResponsavel.length} conta(s) sem responsável registrado</summary>
          <div>{semResponsavel.slice(0, 20).map((negocio) => <article className="auth-card" key={negocio.id}>
            <h3>{negocio.name}</h3><AssumirConta businessId={negocio.id} />
            <p><a href={`/revisar-perfil?negocio=${encodeURIComponent(negocio.id)}#ficha-${encodeURIComponent(negocio.id)}`}>Abrir ficha</a> · <a href={`/gestor/tarefas?negocio=${encodeURIComponent(negocio.id)}`}>Criar tarefa desta conta</a></p>
          </article>)}</div>
          {semResponsavel.length > 20 && <p className="form-warning">Mostrando 20 contas sem responsável; use a carteira para localizar as demais.</p>}
        </details>
      </section>
      <section aria-labelledby="lista-tarefas"><h2 id="lista-tarefas">Fila de trabalho</h2>
        <form action="/gestor/tarefas" method="get" className="auth-card">
          <label>Buscar <input type="search" name="q" defaultValue={busca} placeholder="Negócio ou tarefa" /></label>
          <label>Mostrar <select name="filtro" defaultValue={filtro}>
            <option value="abertas">Abertas</option><option value="minhas">Minhas abertas</option>
            <option value="sem_responsavel">Sem responsável</option><option value="concluidas">Concluídas</option>
          </select></label><button type="submit">Filtrar</button>
        </form>
        <p>{visiveis.length} de {linhas.length} tarefas nesta consulta.</p>
        {visiveis.length === 0 && <p>Nenhuma tarefa corresponde ao filtro.</p>}
        {visiveis.map((tarefa) => <article className="auth-card" key={tarefa.id}>
          <p>{TIPOS_DE_TAREFA[tarefa.task_type]} · {negociosPorId.get(tarefa.business_id) ?? "Negócio não encontrado"}</p>
          <h3>{tarefa.title}</h3>
          {tarefa.description && <p>{tarefa.description}</p>}
          <p><strong>{vencimentoDaTarefa(tarefa, agora)}</strong> · Responsável: {tarefa.assigned_to === user.id ? "você" : tarefa.assigned_to ? nomes.get(tarefa.assigned_to) ?? "operador sem nome disponível" : "não atribuído"}</p>
          <p>{tarefa.due_at ? `Prazo: ${formatarData.format(new Date(tarefa.due_at))}` : "Sem prazo"} · Registrada: {formatarData.format(new Date(tarefa.created_at))}</p>
          {tarefa.status === "done" && <p>Registro de conclusão: {tarefa.completion_note ?? "indisponível"}</p>}
          {tarefa.status === "open" && tarefa.assigned_to === user.id && <ConcluirTarefa id={tarefa.id} />}
        </article>)}
      </section>
      <p className="foot-line">Concluir uma tarefa registra a ação do operador. Pagamento, assinatura, reserva e campanha exigem confirmação nas respectivas fontes.</p>
    </div>;
  } catch {
    return <div className="canvas"><h1>Tarefas indisponíveis</h1><p className="form-error" role="alert">Não foi possível carregar a fila agora. Tente novamente.</p></div>;
  }
}
