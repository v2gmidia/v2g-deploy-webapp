import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { COLUNAS_DO_CADASTRO } from "@/lib/cadastro/montar";
import { montarPortfolio, type NegocioDoPortfolio } from "@/lib/gestor/portfolio";
import { tituloDaAba } from "@/lib/titulos";
import styles from "./Gestor.module.css";

export const metadata = tituloDaAba("/gestor");
export const dynamic = "force-dynamic";

/** Visão interna de leitura. Cada número representa linha do banco, nunca métrica da Meta. */
export default async function GestorPage() {
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
    const [pedidos, contas] = ids.length ? await Promise.all([
      admin.from("commercial_orders")
        .select("id, business_id, status, created_at")
        .in("business_id", ids).order("created_at", { ascending: false }).limit(1000),
      admin.from("ad_accounts").select("id, business_id")
        .in("business_id", ids).limit(1000),
    ]) : [{ data: [], error: null }, { data: [], error: null }];
    if (pedidos.error || contas.error || !pedidos.data || !contas.data) {
      throw pedidos.error ?? contas.error ?? new Error("dados de operacao indisponiveis");
    }
    const contratos = pedidos.data.length ? await admin.from("contract_documents")
      .select("order_id, status")
      .in("order_id", pedidos.data.map((p) => p.id))
      .order("created_at", { ascending: false }).limit(1000)
      : { data: [], error: null };
    if (contratos.error || !contratos.data) throw contratos.error ?? new Error("contratos indisponiveis");
    const linhas = montarPortfolio(negocios.data as unknown as NegocioDoPortfolio[], pedidos.data, contratos.data, contas.data);
    const parcial = (negocios.count ?? 0) > negocios.data.length || pedidos.data.length === 1000 || contas.data.length === 1000 || contratos.data.length === 1000;

    return <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <div><p className={styles.sobretitulo}>OPERAÇÃO · VISÃO DO GESTOR</p>
          <h1>Carteira de negócios</h1>
          <p>Uma fila para decidir o próximo contato. Estados de reunião, saldo e desempenho exigem confirmação nas respectivas fontes.</p>
        </div>
        <nav className={styles.links} aria-label="Ferramentas do gestor">
          <a href="/revisar-perfil#fichas">Fichas completas</a>
          <a href="/pedidos">Pedidos Pix</a>
          <a href="/saude-meta">Fila de revisão</a>
        </nav>
      </header>
      {parcial && <p className="form-warning">Consulta parcial: há registros além do limite de 1.000 por tabela. Use as telas específicas antes de decidir.</p>}
      <div className={styles.resumo} aria-label="Resumo da carteira">
        <div><strong>{linhas.length}</strong><span>negócios retornados</span></div>
        <div><strong>{linhas.filter((l) => l.prioridade <= 2).length}</strong><span>pedidos para acompanhar</span></div>
        <div><strong>{linhas.filter((l) => !l.onboardingConcluido).length}</strong><span>onboardings pendentes</span></div>
        <div><strong>{linhas.filter((l) => l.pendenciasCadastro > 0).length}</strong><span>cadastros com campos pendentes</span></div>
      </div>
      <section aria-labelledby="titulo-fila">
        <div className={styles.introducao}><h2 id="titulo-fila">Próxima ação por negócio</h2>
          <p>A ordem começa por comprovantes para conferir. A ficha guarda respostas e procedência.</p></div>
        {linhas.length === 0 ? <p>Nenhum negócio real retornado nesta consulta.</p> :
          <div className={styles.lista}>{linhas.map((linha) =>
            <article className={styles.linha} key={linha.id}>
              <div><h3>{linha.nome}</h3><small>{linha.id}</small></div>
              <div className={styles.acao}><b>{linha.proximaAcao}</b>
                <span>{linha.contas} conta(s) vinculada(s) · {linha.pendenciasCadastro} campo(s) pendente(s)</span></div>
              <div className={styles.destinos}>
                <a href={`/revisar-perfil?negocio=${encodeURIComponent(linha.id)}#ficha-${encodeURIComponent(linha.id)}`}>Abrir ficha</a>
                {linha.origem === "pedido" && <a href="/pedidos">Ver pedido</a>}
              </div>
            </article>)}</div>}
      </section>
      <p className={styles.fonte}>Fonte: cadastro, pedidos, contratos e contas vinculadas no Supabase. Reuniões não são sincronizadas; resultados, saldo e ritmo de gasto não são calculados nesta tela.</p>
    </div>;
  } catch (error) {
    console.error("[gestor] falha ao consultar carteira ::", error instanceof Error ? error.message : "erro desconhecido");
    return <div className="canvas"><div className="page-head"><h1>Carteira indisponível</h1></div>
      <p className="form-error" role="alert">Não foi possível carregar a carteira agora. Recarregue para tentar novamente.</p>
    </div>;
  }
}
