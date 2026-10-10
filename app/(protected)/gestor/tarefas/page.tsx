import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ordenarTarefas, ordenarTarefasConcluidas, prioridadeDaTarefa, TIPOS_DE_TAREFA,
  vencimentoDaTarefa, type TarefaDoGestor } from "@/lib/gestor/tarefas";
import { solicitacaoDaTarefaDeRevisao } from "@/lib/gestor/revisao-pendente";
import { AssumirConta, AssumirTarefa, ConcluirTarefa, CriarTarefa, PrepararConta } from "./Formularios";

export const metadata = { title: "Tarefas do gestor | V2G", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
    const parametros = await searchParams;
    const negocioPedido = typeof parametros.negocio === "string" ? parametros.negocio.trim() : "";
    if (negocioPedido && !UUID.test(negocioPedido))
      return <div className="canvas"><h1>Tarefas do gestor</h1>
        <p className="form-warning">A conta informada é inválida.</p>
        <p><a href="/gestor/tarefas">Ver todas as tarefas</a></p></div>;
    // Uma conta escolhida deve ser buscada pelo ID, mesmo que esteja além das
    // primeiras 1.000 linhas da carteira geral.
    let consultaNegocios = admin.from("businesses").select("id, name")
      .eq("dados_ficticios", false);
    if (negocioPedido) consultaNegocios = consultaNegocios.eq("id", negocioPedido);
    const negocios = await consultaNegocios.order("name").limit(1000);
    if (negocios.error || !negocios.data) throw new Error("negócios indisponíveis");
    const negociosPorId = new Map(negocios.data.map((negocio) => [negocio.id, negocio.name]));
    if (negocioPedido && !negociosPorId.has(negocioPedido))
      return <div className="canvas"><h1>Tarefas do gestor</h1>
        <p className="form-warning">A conta informada não está disponível nesta consulta.</p>
        <p><a href="/gestor/tarefas">Ver todas as tarefas</a></p></div>;
    const negocioInicial = negocioPedido || null;
    const busca = typeof parametros.q === "string" ? parametros.q.trim().slice(0, 120) : "";
    const filtro = ["abertas", "minhas", "sem_responsavel", "concluidas"].includes(parametros.filtro ?? "")
      ? parametros.filtro! : "abertas";
    let consultaTarefas = admin.from("manager_tasks")
      .select("id, business_id, task_type, title, description, status, assigned_to, due_at, created_at, completed_at, completion_note", { count: "exact" });
    if (negocioInicial) consultaTarefas = consultaTarefas.eq("business_id", negocioInicial);
    if (filtro === "concluidas") consultaTarefas = consultaTarefas.eq("status", "done");
    else consultaTarefas = consultaTarefas.eq("status", "open");
    if (filtro === "minhas") consultaTarefas = consultaTarefas.eq("assigned_to", user.id);
    if (filtro === "sem_responsavel") consultaTarefas = consultaTarefas.is("assigned_to", null);
    let consultaAbertas = admin.from("manager_tasks")
      .select("id", { count: "exact", head: true }).eq("status", "open");
    if (negocioInicial) consultaAbertas = consultaAbertas.eq("business_id", negocioInicial);
    const consultaAtribuicoes = admin.from("manager_accounts")
      .select("business_id, operator_profile_id, assigned_at");
    const [tarefas, atribuicoes, abertas] = await Promise.all([
      consultaTarefas.order(filtro === "concluidas" ? "completed_at" : "created_at",
        { ascending: filtro !== "concluidas" }).limit(1000),
      (negocioInicial ? consultaAtribuicoes.eq("business_id", negocioInicial) : consultaAtribuicoes)
        .limit(1000),
      consultaAbertas,
    ]);
    if (tarefas.error || atribuicoes.error || !tarefas.data || !atribuicoes.data)
      throw new Error("fila indisponível");
    const responsaveis = [...new Set([
      ...atribuicoes.data.map((atribuicao) => atribuicao.operator_profile_id),
      ...tarefas.data.map((tarefa) => tarefa.assigned_to).filter((id): id is string => !!id),
    ])];
    const perfis = responsaveis.length ? await admin.from("profiles")
      .select("id, full_name").in("id", responsaveis) : { data: [], error: null };
    const nomes = new Map((perfis.data ?? []).map((perfil) => [perfil.id, perfil.full_name]));
    const responsavelPorNegocio = new Map(atribuicoes.data.map((atribuicao) =>
      [atribuicao.business_id, atribuicao.operator_profile_id]));
    const semResponsavel = negocios.data.filter((negocio) =>
      (!negocioInicial || negocio.id === negocioInicial) && !responsavelPorNegocio.has(negocio.id));
    const agora = Date.now();
    const linhas = filtro === "concluidas"
      ? ordenarTarefasConcluidas(tarefas.data as TarefaDoGestor[])
      : ordenarTarefas(tarefas.data as TarefaDoGestor[], agora);
    const visiveis = linhas.filter((tarefa) => {
      if (negocioInicial && tarefa.business_id !== negocioInicial) return false;
      if (filtro === "abertas" && tarefa.status !== "open") return false;
      if (filtro === "minhas" && (tarefa.status !== "open" || tarefa.assigned_to !== user.id)) return false;
      if (filtro === "sem_responsavel" && (tarefa.status !== "open" || !!tarefa.assigned_to)) return false;
      if (filtro === "concluidas" && tarefa.status !== "done") return false;
      const texto = `${negociosPorId.get(tarefa.business_id) ?? ""} ${tarefa.title}`.toLocaleLowerCase("pt-BR");
      return !busca || texto.includes(busca.toLocaleLowerCase("pt-BR"));
    });
    const tarefasParciais = tarefas.count === null || tarefas.count > tarefas.data.length;
    const parcial = (!negocioInicial && negocios.data.length === 1000) || tarefasParciais ||
      atribuicoes.data.length === 1000 || !!perfis.error;
    const formatarData = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
    return <div className="canvas">
      <div className="page-head"><p>OPERAÇÃO · USO INTERNO</p><h1>Tarefas e responsáveis</h1>
        <p>Acompanhe a preparação de cada conta. Estas tarefas são registros da equipe, não estados confirmados da Meta ou de pagamentos.</p></div>
      <p><a href="/gestor">Voltar à carteira</a> · <a href="/gestor/criativos">Peças para revisar</a>
        {negocioInicial && <> · <a href="/gestor/tarefas">Ver todas as tarefas</a></>}</p>
      {negocioInicial && <p>Conta selecionada: <strong>{negociosPorId.get(negocioInicial)}</strong></p>}
      {parcial && <p className="form-warning">Consulta parcial ou nomes de responsáveis indisponíveis. Busca e prioridades podem cobrir somente os itens exibidos; confira a fonte antes de decidir.</p>}
      {(abertas.error || abertas.count === null) && <p className="form-warning">O total de tarefas abertas não pôde ser confirmado agora.</p>}
      <div className="auth-card"><strong>{abertas.error || abertas.count === null ? "—" : abertas.count} abertas</strong>
        {filtro === "abertas" && <> · {linhas.filter((t) => prioridadeDaTarefa(t, agora) === 0).length} vencidas ou sem responsável {tarefasParciais ? "entre as exibidas" : ""}</>}
        {" · "}{atribuicoes.data.length} atribuição(ões) retornada(s)</div>
      {negocioInicial && (responsavelPorNegocio.get(negocioInicial) === user.id
        ? <PrepararConta businessId={negocioInicial} />
        : <p className="form-warning">As pendências iniciais são criadas pelo gestor responsável desta conta.</p>)}
      <CriarTarefa negocios={negocios.data.filter((negocio) =>
        (!negocioInicial || negocio.id === negocioInicial) && responsavelPorNegocio.get(negocio.id) === user.id)}
        negocioInicial={responsavelPorNegocio.get(negocioInicial ?? "") === user.id ? negocioInicial : null} />
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
          {negocioInicial && <input type="hidden" name="negocio" value={negocioInicial} />}
          <label>Buscar <input type="search" name="q" defaultValue={busca} placeholder="Negócio ou tarefa" /></label>
          <label>Mostrar <select name="filtro" defaultValue={filtro}>
            <option value="abertas">Abertas</option><option value="minhas">Minhas abertas</option>
            <option value="sem_responsavel">Sem responsável</option><option value="concluidas">Concluídas</option>
          </select></label><button type="submit">Filtrar</button>
        </form>
        <p>{visiveis.length} exibida(s) de {tarefas.count ?? "total indisponível"} tarefa(s) no filtro {negocioInicial ? "desta conta" : "da carteira"}.</p>
        {visiveis.length === 0 && <p>Nenhuma tarefa corresponde ao filtro.</p>}
        {visiveis.map((tarefa) => <article className="auth-card" key={tarefa.id}>
          <p>{TIPOS_DE_TAREFA[tarefa.task_type]} · {negociosPorId.get(tarefa.business_id) ?? "Negócio não encontrado"}</p>
          <h3>{tarefa.title}</h3>
          {tarefa.description && <p>{tarefa.description}</p>}
          <p><strong>{vencimentoDaTarefa(tarefa, agora)}</strong> · Responsável: {tarefa.assigned_to === user.id ? "você" : tarefa.assigned_to ? nomes.get(tarefa.assigned_to) ?? "operador sem nome disponível" : "não atribuído"}</p>
          <p>{tarefa.due_at ? `Prazo: ${formatarData.format(new Date(tarefa.due_at))}` : "Sem prazo"} · Registrada: {formatarData.format(new Date(tarefa.created_at))}</p>
          {tarefa.status === "done" && <p>Registro de conclusão: {tarefa.completion_note ?? "indisponível"}</p>}
          {tarefa.status === "open" && !tarefa.assigned_to &&
            responsavelPorNegocio.get(tarefa.business_id) === user.id && <AssumirTarefa id={tarefa.id} />}
          {tarefa.status === "open" && tarefa.assigned_to === user.id &&
            (solicitacaoDaTarefaDeRevisao(tarefa.id, tarefa.business_id, tarefa.description)
              ? <p><a href={`/gestor/criativos?negocio=${encodeURIComponent(tarefa.business_id)}&peca=${encodeURIComponent(solicitacaoDaTarefaDeRevisao(tarefa.id, tarefa.business_id, tarefa.description)!)}`}>Conferir peça e registrar decisão</a></p>
              : <ConcluirTarefa id={tarefa.id} />)}
        </article>)}
      </section>
      <p className="foot-line">Concluir uma tarefa registra a ação do operador. Pagamento, assinatura, reserva e campanha exigem confirmação nas respectivas fontes.</p>
    </div>;
  } catch {
    return <div className="canvas"><h1>Tarefas indisponíveis</h1><p className="form-error" role="alert">Não foi possível carregar a fila agora. Tente novamente.</p></div>;
  }
}
