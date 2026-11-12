import type { ReactNode } from "react";
import type { ContextoAgencia, RetornoCarteira } from "@/lib/agencia/contexto";
import { hrefDaCarteira, hrefDoCliente } from "@/lib/agencia/contexto";
import type { ResumoDaCarteira } from "@/lib/agencia/resumo";
import { resumirMeta } from "@/lib/inicio/resumo-meta";
import type { InventarioMeta, ResultadoInventarioMeta } from "@/lib/anuncios/contrato-meta";
import type { IntervaloDoInicio } from "@/lib/inicio/periodo";
import type { PendenciaDoOnboarding } from "@/lib/onboarding/conclusao";
import { dinheiro, diaCurto } from "@/lib/formato";
import { SeletorDePeriodo } from "@/app/(protected)/inicio/SeletorDePeriodo";
import { AtualizarInicio } from "@/app/(protected)/inicio/AtualizarInicio";
import { CabecalhoAgencia, CaminhoDoCliente, ProximoPassoAgencia, Seta } from "./Comuns";
import { GraficoInvestimento } from "./GraficoInvestimento";
import comuns from "./agencia.module.css";
import styles from "./inicio-cliente.module.css";

export type DetalheAgenciaDoInicio = { contexto: ContextoAgencia; resumo: ResumoDaCarteira; retorno: RetornoCarteira };
const contar = (n: number | null) => n === null ? "Não medido" : n.toLocaleString("pt-BR");
function IconeMetrica({ tipo }: { tipo: "investido" | "cliques" | "impressoes" | "conversas" }) {
  const paths = { investido: <><rect x="3" y="4" width="14" height="12" rx="2" /><path d="M3 8h14m-6 4h3" /></>,
    cliques: <path d="m5 3 11 7-5 1-2 5L5 3Zm7 10 4 4" />, impressoes: <path d="M4 17v-6m6 6V3m6 14V7M2 17h16" />,
    conversas: <path d="M17 9a7 7 0 0 1-9 7l-5 2 1-5a7 7 0 1 1 13-4Z" /> };
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">{paths[tipo]}</svg>;
}
export function InicioDoCliente({ detalhe, dados, resumo, resultado, intervalo, anterior, pendencia, falhaPendencia, faixa, complemento }: {
  detalhe: DetalheAgenciaDoInicio; dados: InventarioMeta | null; resumo: ReturnType<typeof resumirMeta> | null;
  resultado: ResultadoInventarioMeta; intervalo: IntervaloDoInicio; anuncios: string; anterior: boolean;
  pendencia: PendenciaDoOnboarding | null; falhaPendencia: boolean; faixa: ReactNode; complemento: ReactNode;
}) {
  const { contexto: c, retorno, resumo: tarefa } = detalhe;
  const anunciosDoCliente = hrefDoCliente("/anuncios", c.businessId, retorno,
    { desde: intervalo.desde, ate: intervalo.ate, conta: dados?.contaId });
  const valor = (n: number | null) => n === null || !dados?.moeda ? "Não medido" : dinheiro(n / 100, dados.moeda);
  return <div className={`${comuns.raiz} ${styles.raiz}`}>
    {faixa}<CaminhoDoCliente contexto={c} retorno={retorno} />
    <CabecalhoAgencia titulo="Início" descricao={`${c.anunciante} · acompanhamento do cliente`}
      acao={<SeletorDePeriodo key={`${intervalo.desde}:${intervalo.ate}`} intervalo={intervalo} />} />
    {intervalo.erro && <p className="form-error" role="alert">{intervalo.erro}</p>}
    {!resultado.ok && <div className="form-warning" role="status"><p>{resultado.mensagem}</p>{anterior && <p>Os números abaixo são da última consulta confirmada, com sua data original. Não são uma nova medição.</p>}<AtualizarInicio /></div>}
    {resultado.ok && !dados && <p className="form-error" role="alert">Não foi possível confirmar a conta e o período desta leitura.</p>}
    {(resultado.contas.length > 1 || !resultado.ok && resultado.contas.length > 0) && <form method="get" action="/inicio" className={styles.conta}>
      <label>Conta de anúncios<select name="conta" defaultValue={dados?.contaId ?? resultado.contaSelecionada ?? ""}><option value="" disabled>Escolha uma conta</option>{resultado.contas.map(conta => <option key={conta.id} value={conta.id}>{conta.id}</option>)}</select></label>
      <input type="hidden" name="cliente" value={c.businessId} /><input type="hidden" name="desde" value={intervalo.desde} /><input type="hidden" name="ate" value={intervalo.ate} />
      <input type="hidden" name="busca_carteira" value={retorno.busca} /><input type="hidden" name="pendentes_carteira" value={retorno.pendentes ? "1" : ""} /><input type="hidden" name="pagina_carteira" value={retorno.pagina} />
      <button className="cta">Consultar conta</button></form>}
    {dados && resumo && <>
      <section className={comuns.estado} aria-label="Estado dos resultados"><div><b>Resultados</b><span>{resumo.campanhas ? resumo.entregaHistorica ? "Houve entrega neste período" : "Campanhas encontradas na Meta" : "Nenhuma campanha retornou nesta consulta"}</span></div><a className={comuns.link} href={anunciosDoCliente}>Ver anúncios<Seta /></a></section>
      <p className={styles.nota}>{diaCurto(dados.periodo.desde)} a {diaCurto(dados.periodo.ate)} · {resumo.campanhasObservadas} de {resumo.campanhas} campanhas com observação.{resumo.parcial ? " Resultados parciais." : ""}</p>
      <section aria-labelledby="inicio-resumo-titulo"><h2 id="inicio-resumo-titulo">Resumo do período</h2><dl className={styles.metricas}>
        {([{ tipo: "investido", nome: "Investido", valor: valor(resumo.gasto) }, { tipo: "cliques", nome: "Cliques totais", valor: contar(resumo.cliques) },
          { tipo: "impressoes", nome: "Impressões", valor: contar(resumo.impressoes) }, { tipo: "conversas", nome: "Conversas", valor: "Não medido" }] as const).map(m => <div key={m.tipo}>
            <dt><IconeMetrica tipo={m.tipo} />{m.nome}</dt><dd className={m.valor === "Não medido" ? styles.ausente : undefined}>{m.valor}</dd></div>)}
      </dl></section>
    </>}
    <div className={styles.gradePrincipal}><div>
      {dados && resumo && <><GraficoInvestimento dias={resumo.dias} moeda={dados.moeda} inconsistente={resumo.serieInconsistente} />
        <details className={styles.detalhes}><summary>Sobre esta leitura</summary><p>Conta {dados.contaId} · Meta Marketing API · {dados.moeda ?? "Moeda não confirmada"} · Fuso: {dados.fuso ?? "Não confirmado"}.</p>
          <p>Consulta em {new Date(dados.coletadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília).</p>
          <p>{resumo.parcial ? "Resumo parcial: somente as campanhas com observação entram na soma; um campo desconhecido continua não medido. " : "Valores das campanhas com observação. "}Não somamos campanhas aos seus conjuntos ou anúncios. Cliques não representam pessoas únicas ou vendas. A entrega histórica não confirma veiculação atual.</p></details></>}
    </div><ProximoPassoAgencia contexto={c} resumo={tarefa} retorno={retorno} /></div>
    {falhaPendencia && <p className="form-warning" role="status">Não conseguimos conferir as pendências do cadastro agora.</p>}
    {pendencia && <section className={styles.pendencia}><div><h2>Pendência do cadastro</h2><h3>{pendencia.titulo}</h3><p>{pendencia.corpo}</p></div><a className={comuns.link} href={pendencia.href === "/onboarding" ? `/onboarding?cliente=${c.businessId}` : pendencia.href}>{pendencia.rotulo}<Seta /></a></section>}
    <section className={styles.teto} aria-label="Teto de mídia"><div><h2>{resultado.contas.length === 1 ? "Teto mensal de mídia" : "Teto mensal informado no cadastro"}</h2>
      <p>{resultado.contas.length === 1 ? `Conta ${resultado.contas[0]!.id}` : "A vinculação do teto à conta ainda precisa de conferência."}</p></div>
      <strong>{c.verbaMensal === null ? "Não informado" : dinheiro(c.verbaMensal, "BRL")}</strong><a className={comuns.link} href="/verba">Conferir teto<Seta /></a></section>
    <dl className={styles.cadastro}><div><dt>Anunciante</dt><dd>{c.anunciante}</dd></div><div><dt>Agência</dt><dd>{c.agencia}</dd></div><div><dt>Região de atendimento</dt><dd>{c.praca ?? "Não informada"}</dd></div><div><dt>Gestor responsável</dt><dd>{c.gestor ?? "A conferir"}</dd></div></dl>
    <nav aria-label="Ações do cliente"><a className={comuns.link} href={hrefDoCliente("/criativos", c.businessId, retorno)}>Abrir criativos<Seta /></a></nav>
    {complemento}<a className={comuns.link} href={hrefDaCarteira("/inicio", retorno)}><Seta voltar />Voltar à carteira</a>
  </div>;
}
