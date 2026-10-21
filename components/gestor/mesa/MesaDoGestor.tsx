"use client";

/* Direção aprovada: prints do Victor, tabela densa da carteira + análise por conta.
   Identidade editorial V2G; destaque só para exceções. Período compartilhado,
   tabela/cartões, séries diárias e ranking da peça. Esta view recebe dados;
   nenhuma credencial, consulta administrativa ou ação de campanha vive aqui. */
import { useMemo, useState } from "react";
import { diasDoPeriodo, intervaloMesa, leituraCompletaMesa, metricasMesa, ordemMesa, sinaisDaConta, sinalPrincipalMesa, variacaoMesa, verbaMesa, type ContaMesa, type EstadoMesa, type PeriodoMesa } from "@/lib/gestor/painel";
import { AnaliseConta } from "./AnaliseConta";
import { dataMesa, IconeMesa, moedaMesa, numeroMesa, percentualMesa, SeloMesa, VariacaoMesa } from "./elementos";
import styles from "./MesaDoGestor.module.css";

type Filtro = "todas" | "atencao" | "saudavel" | "sem_dados";

export function MesaDoGestor({ contas, referencia, demonstracao }: {
  contas: ContaMesa[]; referencia: string; demonstracao: boolean;
}) {
  const [periodo, setPeriodo] = useState<PeriodoMesa>(7);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busca, setBusca] = useState("");
  const [visao, setVisao] = useState<"tabela" | "cartoes">("tabela");
  const [ordem, setOrdem] = useState("prioridade");
  const [selecionada, definirSelecionada] = useState<string | null>(null);
  function setSelecionada(id: string | null) {
    definirSelecionada(id);
    window.scrollTo({ top: 0, behavior: "instant" });
    requestAnimationFrame(() => document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true }));
  }
  const [criteriosAbertos, setCriteriosAbertos] = useState(false);
  const linhas = useMemo(() => contas.map((conta) => {
    const dias = diasDoPeriodo(conta.dias, referencia, periodo);
    const atual = metricasMesa(dias);
    const anterior = metricasMesa(diasDoPeriodo(conta.dias, referencia, periodo, true));
    const sinais = sinaisDaConta(conta, referencia, periodo);
    return { conta, atual, anterior, sinais, sinal: sinalPrincipalMesa(sinais), verba: verbaMesa(conta, referencia), disponivel: leituraCompletaMesa(conta, referencia, periodo) };
  }), [contas, referencia, periodo]);
  const atencao = linhas.filter((l) => l.sinal.estado === "critico" || l.sinal.estado === "atencao").length;
  const saudaveis = linhas.filter((l) => l.sinal.estado === "saudavel").length;
  const semDados = linhas.filter((l) => l.sinal.estado === "sem_dados").length;
  const normalizar = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visiveis = linhas.filter((l) => (filtro === "todas" || (filtro === "atencao" ? ["atencao", "critico"].includes(l.sinal.estado) : l.sinal.estado === filtro)) && normalizar(`${l.conta.negocio} ${l.conta.responsavel} ${l.conta.nomeConta}`).includes(normalizar(busca))).sort((a, b) => {
    if (ordem === "nome") return a.conta.negocio.localeCompare(b.conta.negocio, "pt-BR");
    if (ordem === "gasto") return b.atual.gastoCentavos - a.atual.gastoCentavos;
    if (ordem === "custo") return (b.atual.cprCentavos ?? -1) - (a.atual.cprCentavos ?? -1);
    return ordemMesa[a.sinal.estado] - ordemMesa[b.sinal.estado] || a.conta.negocio.localeCompare(b.conta.negocio, "pt-BR");
  });
  const contaAberta = contas.find((c) => c.id === selecionada);
  const janela = intervaloMesa(referencia, periodo);
  const totalGasto = linhas.filter((l) => l.disponivel).reduce((s, l) => s + l.atual.gastoCentavos, 0);
  const totalTetos = contas.reduce((s, c) => s + (c.tetoMensalCentavos ?? 0), 0);
  const filtros: { id: Filtro; nome: string; quantidade: number }[] = [
    { id: "todas", nome: "Todas as contas", quantidade: contas.length },
    { id: "atencao", nome: "Precisam de atenção", quantidade: atencao },
    { id: "saudavel", nome: "Dentro dos critérios", quantidade: saudaveis },
    { id: "sem_dados", nome: "Sem leitura", quantidade: semDados },
  ];
  function gastoDaConta(linha: typeof linhas[number]) {
    return <div className={styles.verbaCelula}><strong>{moedaMesa(linha.disponivel ? linha.verba.gastoCentavos : null)}</strong><small>de {moedaMesa(linha.verba.tetoCentavos)} / mês</small><div className={styles.barraVerba} data-estado={linha.sinais.some((s) => s.dimensao === "verba" && s.estado !== "saudavel") ? "atencao" : "saudavel"}><span style={{ width: `${linha.disponivel ? Math.min(100, linha.verba.percentual ?? 0) : 0}%` }} /></div></div>;
  }
  function saldo(conta: ContaMesa) {
    return <><strong>{moedaMesa(conta.cobranca.tipo === "pre_pago" ? conta.cobranca.saldoCentavos : conta.cobranca.emAbertoCentavos)}</strong><small>{conta.cobranca.tipo === "pre_pago" ? "Disponível · pré-pago" : "Em aberto · pós-pago"}</small></>;
  }

  return <div className={styles.mesa}>
    <div className={styles.barraPeriodo}>
      <div className={styles.caminho}><span>Operação / {contaAberta ? "Análise da conta" : "Carteira de contas"}</span>{demonstracao && <span className={styles.demonstracao} title="Todas as contas, números e sinais desta tela são ilustrativos."><span className={styles.pontoDemo} />Dados de demonstração</span>}</div>
      <div className={styles.seletorPeriodo}><IconeMesa nome="calendario" /><label htmlFor="periodo-mesa" className={styles.srOnly}>Período de análise</label><select id="periodo-mesa" value={periodo} onChange={(e) => setPeriodo(Number(e.target.value) as PeriodoMesa)}><option value={7}>Últimos 7 dias</option><option value={14}>Últimos 14 dias</option><option value={30}>Últimos 30 dias</option></select><span>{dataMesa(janela.inicio)} – {dataMesa(janela.fim)}</span></div>
    </div>
    {contaAberta ? <AnaliseConta key={contaAberta.id} conta={contaAberta} referencia={referencia} periodo={periodo} voltar={() => setSelecionada(null)} /> : <>
      <header className={styles.cabecalho}><div><h1 tabIndex={-1}>Carteira de contas</h1><p>Veja onde agir. Aprofunde a análise quando um sinal pedir atenção.</p></div><button type="button" className={styles.botaoSecundario} aria-expanded={criteriosAbertos} onClick={() => setCriteriosAbertos(!criteriosAbertos)}><IconeMesa nome="filtro" />Critérios dos sinais</button></header>
      {criteriosAbertos && <section className={styles.criterios} aria-label="Critérios dos sinais"><h2>O que cada sinal significa</h2><div className={styles.gradeCriterios}>{(["critico", "atencao", "saudavel", "sem_dados"] as EstadoMesa[]).map((estado) => <div key={estado}><SeloMesa estado={estado} /><p>{estado === "critico" ? "Custo muito acima da meta da conta ou saldo insuficiente para dois dias no gasto observado." : estado === "atencao" ? "Desvio de custo, frequência, CTR ou ritmo de verba que pede investigação." : estado === "saudavel" ? "Sem desvio nos critérios medidos, com leitura completa. Não comprova vendas." : "Fonte indisponível, leitura incompleta ou critérios ausentes. Nunca vira verde por falta de dados."}</p></div>)}</div><p>As regras desta demonstração são ilustrativas. Cada conta precisa de metas, amostra e estratégia próprias; o ritmo linear não define sozinho uma mudança de orçamento.</p></section>}
      <div className={styles.resumoCarteira} aria-label="Resumo da carteira">
        <div><span>Contas acompanhadas</span><strong>{contas.length}<small>{saudaveis} dentro dos critérios</small></strong></div>
        <div><span>Precisam de atenção</span><strong className={styles.numeroAtencao}>{atencao}<small>{linhas.filter((l) => l.sinal.estado === "critico").length} com ação prioritária</small></strong></div>
        <div><span>Investimento no período</span><strong>{moedaMesa(totalGasto)}<small>{contas.length - semDados} contas com leitura completa</small></strong></div>
        <div><span>Verba aprovada do mês</span><strong>{moedaMesa(totalTetos)}<small>Somente tetos informados</small></strong></div>
      </div>
      <div className={styles.filtrosEstado} aria-label="Filtrar situação da conta">{filtros.map((f) => <button type="button" key={f.id} aria-pressed={filtro === f.id} onClick={() => setFiltro(f.id)}>{f.nome}<span>{f.quantidade}</span></button>)}</div>
      <div className={styles.ferramentas}>
        <label className={styles.busca}><IconeMesa nome="busca" /><span className={styles.srOnly}>Buscar cliente, conta ou responsável</span><input type="search" placeholder="Buscar cliente, conta ou responsável" value={busca} onChange={(e) => setBusca(e.target.value)} /></label>
        <label className={styles.ordenacao}><span className={styles.srOnly}>Ordenar contas</span><select value={ordem} onChange={(e) => setOrdem(e.target.value)}><option value="prioridade">Por prioridade</option><option value="nome">Nome do negócio</option><option value="gasto">Maior investimento</option><option value="custo">Maior custo / resultado</option></select></label>
        <div className={styles.trocaVisao} aria-label="Forma de visualização"><button type="button" aria-label="Visão em tabela" aria-pressed={visao === "tabela"} onClick={() => setVisao("tabela")}><IconeMesa nome="tabela" /></button><button type="button" aria-label="Visão em cartões" aria-pressed={visao === "cartoes"} onClick={() => setVisao("cartoes")}><IconeMesa nome="cartoes" /></button></div>
      </div>
      {visiveis.length === 0 ? <div className={styles.vazio}><IconeMesa nome="busca" tamanho={28} /><h2>Nenhuma conta neste recorte</h2><p>Tente outro nome ou remova o filtro de situação.</p><button type="button" className={styles.botaoSecundario} onClick={() => { setBusca(""); setFiltro("todas"); }}>Limpar busca e filtros</button></div> : visao === "tabela" ? <div className={styles.quadroTabela}><div className={styles.rolagem} tabIndex={0} role="region" aria-label="Contas da carteira. Role horizontalmente para ver todas as colunas."><table className={styles.tabelaCarteira}><thead><tr><th>Cliente / conta</th><th>Gasto / verba do mês</th><th>Resultados</th><th>Custo / resultado</th><th>CTR / CPC de link</th><th>Saldo / cobrança</th><th><span className={styles.srOnly}>Abrir análise</span></th></tr></thead><tbody>{visiveis.map((l) => <tr key={l.conta.id} data-estado={l.sinal.estado}>
        <td><button type="button" className={styles.nomeConta} onClick={() => setSelecionada(l.conta.id)}>{l.conta.negocio}</button><small className={styles.estadoDaLinha}>{l.sinal.titulo} · {l.conta.responsavel}</small></td>
        <td>{gastoDaConta(l)}</td>
        <td><strong>{numeroMesa(l.disponivel ? l.atual.resultados : null)}</strong><small>{l.conta.tipoResultado === "conversas" ? "Conversas" : l.conta.tipoResultado}</small></td>
        <td><strong>{moedaMesa(l.disponivel ? l.atual.cprCentavos : null)}</strong>{l.disponivel && <VariacaoMesa valor={variacaoMesa(l.atual.cprCentavos, l.anterior.cprCentavos)} custo />}</td>
        <td><strong>{percentualMesa(l.disponivel ? l.atual.ctr : null)}</strong><small>{moedaMesa(l.disponivel ? l.atual.cpcCentavos : null)} / clique</small></td>
        <td>{saldo(l.conta)}</td>
        <td><button type="button" className={styles.abrirAnalise} onClick={() => setSelecionada(l.conta.id)} aria-label={`Análise de ${l.conta.negocio}`}><IconeMesa nome="grafico" /><span>Análise</span></button></td>
      </tr>)}</tbody></table></div></div> : <div className={styles.gradeContas}>{visiveis.map((l) => <article className={styles.cartaoConta} key={l.conta.id}><div className={styles.topoCartao}><h2><button type="button" onClick={() => setSelecionada(l.conta.id)}>{l.conta.negocio}</button></h2><button type="button" className={styles.setaCartao} onClick={() => setSelecionada(l.conta.id)} aria-label={`Análise de ${l.conta.negocio}`}><IconeMesa nome="seta" /></button></div><p>{l.conta.responsavel} · {l.conta.nicho}</p><SeloMesa estado={l.sinal.estado}>{l.sinal.titulo}</SeloMesa><div className={styles.verbaCartao}><span>Gasto / verba do mês</span>{gastoDaConta(l)}</div><div className={styles.numerosCartao}><div><span>Conversas</span><strong>{numeroMesa(l.disponivel ? l.atual.resultados : null)}</strong></div><div><span>Custo / conversa</span><strong>{moedaMesa(l.disponivel ? l.atual.cprCentavos : null)}</strong></div></div><footer><span>{l.conta.cobranca.tipo === "pre_pago" ? "Saldo" : "Em aberto"}: {moedaMesa(l.conta.cobranca.tipo === "pre_pago" ? l.conta.cobranca.saldoCentavos : l.conta.cobranca.emAbertoCentavos)}</span><span>{l.disponivel ? "Leitura 10h15" : "Sem leitura"}</span></footer></article>)}</div>}
      <div className={styles.rodapeCarteira}><span>{visiveis.length} de {contas.length} contas</span><span><IconeMesa nome="relogio" tamanho={14} />{dataMesa(referencia)} · leituras ilustrativas às 10h15</span></div>
      <p className={styles.rodapeDados}>O investimento usa o período selecionado; a barra de verba usa o mês inteiro. Saldo pré-pago e cobrança pós-paga são informações distintas. Resultados de objetivos diferentes não são somados.</p>
    </>}
  </div>;
}
