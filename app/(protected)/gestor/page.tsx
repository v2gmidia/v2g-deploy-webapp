import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COLUNAS_DO_CADASTRO } from "@/lib/cadastro/montar";
import { filtrarPortfolio, montarPortfolio, type ExecucaoDoPortfolio, type FiltroDoPortfolio, type NegocioDoPortfolio } from "@/lib/gestor/portfolio";
import { proximasAcoesDoGestor, type RevisaoAberta, type TarefaAberta } from "@/lib/gestor/proximas-acoes";
import { tituloDaAba } from "@/lib/titulos";
import styles from "./Gestor.module.css";

export const metadata = tituloDaAba("/gestor");
export const dynamic = "force-dynamic";

/** Visão interna de leitura. Cada número representa linha do banco, nunca métrica da Meta. */
export default async function GestorPage({ searchParams }: {
  searchParams: Promise<{ q?: string; filtro?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  try {
    const admin = createAdminClient();
    const negocios = await admin.from("businesses")
      .select(`${COLUNAS_DO_CADASTRO}, dados_ficticios, updated_at, created_at`, { count: "exact" })
      .eq("dados_ficticios", false)
      .order("name", { ascending: true }).limit(1000);
    if (negocios.error || !negocios.data) throw negocios.error ?? new Error("negocios indisponiveis");
    const ids = negocios.data.map((n) => n.id);
    const [pedidos, contas, execucoes] = ids.length ? await Promise.all([
      admin.from("commercial_orders")
        .select("id, business_id, status, created_at")
        .in("business_id", ids).order("created_at", { ascending: false }).limit(1000),
      admin.from("ad_accounts").select("id, business_id, external_id, name, is_active")
        .in("business_id", ids).limit(1000),
      admin.from("execucoes")
        .select("id, business_id, status, campanha_meta, status_na_plataforma, status_lido_em, criado_em")
        .in("business_id", ids).order("criado_em", { ascending: false }).limit(1000),
    ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
    if (pedidos.error || contas.error || !pedidos.data || !contas.data) {
      throw pedidos.error ?? contas.error ?? new Error("dados de operacao indisponiveis");
    }
    const execucoesIndisponiveis = !!execucoes.error || !execucoes.data;
    const unidades = pedidos.data.length ? await admin.from("commercial_order_units")
      .select("order_id, ad_account_id")
      .in("order_id", pedidos.data.map((p) => p.id)).limit(1000)
      : { data: [], error: null };
    if (unidades.error || !unidades.data) throw unidades.error ?? new Error("unidades indisponiveis");
    const contratos = pedidos.data.length ? await admin.from("contract_documents")
      .select("order_id, status")
      .in("order_id", pedidos.data.map((p) => p.id))
      .order("created_at", { ascending: false }).limit(1000)
      : { data: [], error: null };
    if (contratos.error || !contratos.data) throw contratos.error ?? new Error("contratos indisponiveis");
    const linhas = montarPortfolio(negocios.data as unknown as NegocioDoPortfolio[], pedidos.data, contratos.data, contas.data,
      execucoesIndisponiveis ? [] : execucoes.data as ExecucaoDoPortfolio[], unidades.data);
    const parcial = (negocios.count ?? 0) > negocios.data.length || pedidos.data.length === 1000 || contas.data.length === 1000 || contratos.data.length === 1000 ||
      (!execucoesIndisponiveis && execucoes.data.length === 1000) || unidades.data.length === 1000;
    const parametros = await searchParams;
    const busca = typeof parametros.q === "string" ? parametros.q.slice(0, 120) : "";
    const trabalhoAtivo = process.env.V2G_MANAGER_WORK_ENABLED === "true";
    const filtrosDisponiveis = trabalhoAtivo
      ? ["minhas", "pedidos", "onboarding", "cadastro", "contas", "campanhas"]
      : ["pedidos", "onboarding", "cadastro", "contas", "campanhas"];
    const filtroCampanhaIndisponivel = execucoesIndisponiveis && parametros.filtro === "campanhas";
    const filtro: FiltroDoPortfolio = !filtroCampanhaIndisponivel && filtrosDisponiveis.includes(parametros.filtro ?? "")
      ? parametros.filtro as FiltroDoPortfolio : "todos";
    const revisoes = process.env.V2G_CREATIVE_REVIEW_ENABLED === "true"
      ? await admin.from("creative_review_requests").select("id", { count: "exact", head: true })
        .eq("status", "awaiting_review")
      : null;
    const revisoesDaCarteira = revisoes && ids.length
      ? await admin.from("creative_review_requests")
        .select("id, business_id, created_at", { count: "exact" }).in("business_id", ids)
        .eq("status", "awaiting_review").limit(1000)
      : null;
    const revisoesParciais = !!revisoesDaCarteira && !revisoesDaCarteira.error &&
      (revisoesDaCarteira.count === null || revisoesDaCarteira.count > (revisoesDaCarteira.data?.length ?? 0));
    const revisoesPorNegocio = new Map<string, number>();
    if (revisoesDaCarteira && !revisoesDaCarteira.error && !revisoesParciais) {
      for (const revisao of revisoesDaCarteira.data ?? []) {
        revisoesPorNegocio.set(revisao.business_id, (revisoesPorNegocio.get(revisao.business_id) ?? 0) + 1);
      }
    }
    const [responsaveis, tarefasAbertas] = trabalhoAtivo && ids.length ? await Promise.all([
      admin.from("manager_accounts").select("business_id, operator_profile_id")
        .in("business_id", ids).limit(1000),
      admin.from("manager_tasks").select("id, business_id, title, description, assigned_to, due_at, created_at")
        .in("business_id", ids).eq("status", "open").limit(1000),
    ]) : [{ data: [], error: null }, { data: [], error: null }];
    const trabalhoIndisponivel = !!(responsaveis.error || tarefasAbertas.error || !responsaveis.data || !tarefasAbertas.data);
    const trabalhoParcial = (responsaveis.data?.length ?? 0) === 1000 || (tarefasAbertas.data?.length ?? 0) === 1000;
    const minhasIndisponiveis = filtro === "minhas" &&
      (!!responsaveis.error || !responsaveis.data || responsaveis.data.length === 1000);
    const gestorPorNegocio = new Map((responsaveis.data ?? []).map((item) => [item.business_id, item.operator_profile_id]));
    const minhasContas = new Set((responsaveis.data ?? [])
      .filter((item) => item.operator_profile_id === user.id).map((item) => item.business_id));
    const filaPessoalIndisponivel = trabalhoIndisponivel || trabalhoParcial || parcial ||
      (!!revisoes && (!!revisoesDaCarteira?.error || revisoesParciais));
    const acoesPessoais = trabalhoAtivo && !filaPessoalIndisponivel
      ? proximasAcoesDoGestor(user.id, minhasContas,
        new Map(negocios.data.map((negocio) => [negocio.id, negocio.name])),
        revisoesDaCarteira?.data as RevisaoAberta[] ?? [], tarefasAbertas.data as TarefaAberta[], Date.now())
      : [];
    const visiveis = minhasIndisponiveis ? [] : filtrarPortfolio(linhas, busca, filtro, minhasContas);
    const tarefasPorNegocio = new Map<string, number>();
    for (const tarefa of tarefasAbertas.data ?? []) tarefasPorNegocio.set(tarefa.business_id, (tarefasPorNegocio.get(tarefa.business_id) ?? 0) + 1);

    return <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <div><p className={styles.sobretitulo}>OPERAÇÃO · VISÃO DO GESTOR</p>
          <h1>Carteira de negócios</h1>
          <p>Uma fila para decidir o próximo contato. Estados de reunião, saldo e desempenho exigem confirmação nas respectivas fontes.</p>
        </div>
        <nav className={styles.links} aria-label="Ferramentas do gestor">
          <a href="/revisar-perfil#fichas">Fichas completas</a>
          <a href="/gestor/compras">Todas as contratações</a>
          {revisoes && <a href="/gestor/criativos">{trabalhoAtivo ? "Revisar peças das minhas contas" : "Revisar peças recebidas"}</a>}
          {trabalhoAtivo && <a href="/gestor/tarefas">Tarefas da equipe{trabalhoIndisponivel ? "" : ` (${tarefasAbertas.data?.length ?? 0})`}</a>}
          <a href="/pedidos">Pedidos Pix</a>
          <a href="/saude-meta">Fila de revisão</a>
        </nav>
      </header>
      {revisoes?.error && <p className="form-warning">A fila de criativos não pôde ser consultada agora.</p>}
      {revisoesDaCarteira?.error && <p className="form-warning">As pendências de criativos por negócio não puderam ser consultadas agora.</p>}
      {revisoesParciais && <p className="form-warning">A contagem de peças por negócio está parcial ou indisponível. Confira a fila de cada negócio.</p>}
      {trabalhoAtivo && trabalhoIndisponivel && <p className="form-warning">Responsáveis ou tarefas indisponíveis agora; esses estados não serão inferidos.</p>}
      {execucoesIndisponiveis && <p className="form-warning">Execuções e campanhas não puderam ser consultadas agora. A carteira mostra os demais dados, sem afirmar ausência de campanhas.</p>}
      {filtroCampanhaIndisponivel && <p className="form-warning">O filtro de campanhas não pôde ser aplicado; a carteira completa está exibida.</p>}
      {trabalhoAtivo && !trabalhoIndisponivel && trabalhoParcial && <p className="form-warning">A lista de responsáveis ou tarefas chegou ao limite da consulta. Confira a fila específica.</p>}
      {parcial && <p className="form-warning">Consulta parcial: há registros além do limite de 1.000 por tabela. Use as telas específicas antes de decidir.</p>}
      <div className={styles.resumo} aria-label="Resumo da carteira">
        <div><strong>{linhas.length}</strong><span>negócios retornados</span></div>
        <div><strong>{linhas.filter((l) => l.prioridade <= 2).length}</strong><span>pedidos para acompanhar</span></div>
        <div><strong>{linhas.filter((l) => !l.onboardingConcluido).length}</strong><span>onboardings pendentes</span></div>
        <div><strong>{linhas.filter((l) => l.pendenciasCadastro > 0).length}</strong><span>cadastros com campos pendentes</span></div>
      </div>
      {trabalhoAtivo && <section aria-labelledby="titulo-minhas-acoes" className={styles.filaPessoal}>
        <div className={styles.introducao}><h2 id="titulo-minhas-acoes">Minhas próximas ações</h2>
          <p>Peças aguardando decisão e tarefas abertas das contas atribuídas a você. A peça aparece uma vez, mesmo que tenha tarefa associada.</p></div>
        {filaPessoalIndisponivel
          ? <p className="form-warning">Não foi possível montar uma fila pessoal completa nesta consulta. Abra as filas específicas para conferir as pendências.</p>
          : acoesPessoais.length === 0
            ? <p>Nenhuma peça ou tarefa aberta nas contas atribuídas a você nesta consulta.</p>
            : <>
              <p className={styles.contagem}>{acoesPessoais.length} ação(ões) nas suas contas</p>
              <ol className={styles.acoesPessoais}>{acoesPessoais.slice(0, 8).map((acao) => <li key={acao.id}>
                <span className={styles.acaoTipo}>{acao.tipo === "revisao" ? "CRIATIVO" : "TAREFA"}</span>
                <div><strong>{acao.titulo}</strong><span>{acao.negocio} · {acao.situacao}</span></div>
                <a href={acao.href}>Abrir pendência</a>
              </li>)}</ol>
              {acoesPessoais.length > 8 && <p className={styles.contagem}>Mostrando 8 ações. <a href="/gestor/tarefas?filtro=minhas">Ver tarefas</a> · <a href="/gestor/criativos">Ver peças</a></p>}
            </>}
      </section>}
      <section aria-labelledby="titulo-fila">
        <div className={styles.introducao}><h2 id="titulo-fila">Próxima ação por negócio</h2>
          <p>A ordem começa por comprovantes para conferir. A ficha guarda respostas e procedência.</p></div>
        <form className={styles.filtros} action="/gestor" method="get">
          <label>Buscar negócio <input type="search" name="q" defaultValue={busca} placeholder="Nome ou identificador" /></label>
          <label>Mostrar <select name="filtro" defaultValue={filtro}>
            <option value="todos">Toda a carteira</option>
            {trabalhoAtivo && <option value="minhas">Minhas contas</option>}
            <option value="pedidos">Pedidos para acompanhar</option>
            <option value="onboarding">Onboarding pendente</option>
            <option value="cadastro">Cadastro com pendência</option>
            <option value="contas">Contas para conferir</option>
            {!execucoesIndisponiveis && <option value="campanhas">Campanha criada no pipeline</option>}
          </select></label>
          <button type="submit">Filtrar</button>
        </form>
        {minhasIndisponiveis
          ? <p className="form-warning">Não foi possível confirmar todas as atribuições. O filtro das suas contas está indisponível agora.</p>
          : <p className={styles.contagem}>{visiveis.length} de {linhas.length} negócios nesta consulta</p>}
        {minhasIndisponiveis ? null : linhas.length === 0 ? <p>Nenhum negócio real retornado nesta consulta.</p> :
          visiveis.length === 0 ? <p>Nenhum negócio corresponde aos filtros.</p> :
          <div className={styles.lista}>{visiveis.map((linha) =>
            <article className={styles.linha} key={linha.id}>
              <div><h3>{linha.nome}</h3><small>{linha.id}</small></div>
              <div className={styles.acao}><b>{linha.proximaAcao}</b>
                <span>{linha.contas} conta(s) vinculada(s) · {linha.pendenciasCadastro} campo(s) pendente(s)</span>
                {trabalhoAtivo && !trabalhoIndisponivel && <span>Gestor responsável: {gestorPorNegocio.get(linha.id) === user.id ? "você" : gestorPorNegocio.has(linha.id) ? "outro operador" : "não atribuído"} · {tarefasPorNegocio.get(linha.id) ?? 0} tarefa(s) aberta(s)</span>}
                {revisoesDaCarteira && !revisoesDaCarteira.error && !revisoesParciais && (revisoesPorNegocio.get(linha.id) ?? 0) > 0 &&
                  <span>{revisoesPorNegocio.get(linha.id)} peça(s) aguardando revisão</span>}
                <span>{execucoesIndisponiveis ? "Execuções indisponíveis nesta consulta" : linha.ultimaExecucao
                  ? `Última execução: ${linha.ultimaExecucao.estado} · ${linha.execucoes} vinculada(s)`
                  : "Nenhuma execução vinculada nesta consulta"}</span>
                {linha.ultimaCampanha && <span>
                  Última campanha criada · leitura da plataforma: {linha.ultimaCampanha.estadoNaPlataforma ?? "sem leitura"}
                  {linha.ultimaCampanha.plataformaLidaEm && ` em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(linha.ultimaCampanha.plataformaLidaEm))}`}
                </span>}
                {linha.unidadesAprovadasLivres > 0 && <span>{linha.unidadesAprovadasLivres} unidade(s) aprovada(s) aguardando conta</span>}
                <details className={styles.contas}>
                  <summary>Preparar conversa com o cliente</summary>
                  <p>Reserve cerca de 10 minutos para avaliar a presença digital antes da reunião. Uma apresentação fraca pede orientação; não impede a compra.</p>
                  <p>Instagram: {linha.instagram
                    ? <a href={linha.instagram.url} target="_blank" rel="noopener noreferrer">{linha.instagram.rotulo}</a>
                    : linha.instagramInformadoSemLink ? "informado, mas o endereço precisa ser conferido na ficha" : "não informado"}</p>
                  <p>Negócio: {linha.descricaoParaReuniao ?? "descrição ainda não informada"}</p>
                  {linha.diferenciaisParaReuniao.length > 0 && <p>Diferenciais informados: {linha.diferenciaisParaReuniao.join(" · ")}</p>}
                  <p>Esta ficha reúne respostas do cliente; a avaliação do Instagram e a reunião ainda não têm confirmação registrada aqui.</p>
                </details>
                {linha.contasDetalhe.length > 0 && <details className={styles.contas}>
                  <summary>Ver contas de anúncios</summary>
                  <ul>{linha.contasDetalhe.map((conta) => <li key={conta.id}>
                    <b>{conta.nome}</b> <code>{conta.identificador}</code>
                    <span>{conta.ativa ? "Ativa no cadastro" : "Inativa no cadastro"} · {conta.vinculo === "pedido_aprovado" ? "Unidade de pedido aprovado" : "Sem unidade aprovada vinculada"}</span>
                  </li>)}</ul>
                </details>}</div>
              <div className={styles.destinos}>
                <a href={`/revisar-perfil?negocio=${encodeURIComponent(linha.id)}#ficha-${encodeURIComponent(linha.id)}`}>Abrir ficha</a>
                {linha.origem === "pedido" && <a href="/pedidos">Ver pedido</a>}
                {trabalhoAtivo && <a href={`/gestor/tarefas?negocio=${encodeURIComponent(linha.id)}`}>Tarefas da conta</a>}
                {revisoes && <a href={`/gestor/criativos?negocio=${encodeURIComponent(linha.id)}`}>Criativos da conta</a>}
                {linha.ultimaCampanha && <a href={`/ativar-campanha/${encodeURIComponent(linha.ultimaCampanha.idExecucao)}`}>Ver campanha</a>}
              </div>
            </article>)}</div>}
      </section>
      <p className={styles.fonte}>Fonte: cadastro, pedidos, unidades contratadas e contas no Supabase{execucoesIndisponiveis ? "; execuções indisponíveis nesta consulta" : "; execuções vinculadas quando disponíveis"}. Conta sem unidade vinculada pode ser legada; não é prova de inadimplência. O estado da plataforma é a última leitura registrada, não uma consulta ao vivo. Reuniões não são sincronizadas; resultados, saldo e ritmo de gasto não são calculados nesta tela.</p>
    </div>;
  } catch (error) {
    console.error("[gestor] falha ao consultar carteira ::", error instanceof Error ? error.message : "erro desconhecido");
    return <div className="canvas"><div className="page-head"><h1>Carteira indisponível</h1></div>
      <p className="form-error" role="alert">Não foi possível carregar a carteira agora. Recarregue para tentar novamente.</p>
    </div>;
  }
}
