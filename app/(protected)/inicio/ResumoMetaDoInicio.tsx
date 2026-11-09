"use client";

import { useEffect, useState, type ReactNode } from "react";
import { dinheiro, diaCurto } from "@/lib/formato";
import type { ResultadoInventarioMeta } from "@/lib/anuncios/contrato-meta";
import { chaveDoEscopo, leituraAnteriorPermitida, resumirMeta, type EscopoInicioMeta, type MemoriaInicioMeta } from "@/lib/inicio/resumo-meta";
import type { DiaMeta } from "@/lib/inicio/serie-meta";
import type { IntervaloDoInicio } from "@/lib/inicio/periodo";
import type { PendenciaDoOnboarding } from "@/lib/onboarding/conclusao";
import { SeletorDePeriodo } from "./SeletorDePeriodo";
import { AtualizarInicio } from "./AtualizarInicio";
import styles from "./ResumoMetaDoInicio.module.css";

const contar = (n: number | null) => n === null ? "Não medido" : n.toLocaleString("pt-BR");
const valor = (n: number | null, moeda: string | null) => n === null || !moeda ? "Não medido" : dinheiro(n / 100, moeda);

function GraficoDiario({ dias, moeda, inconsistente }: { dias: DiaMeta[]; moeda: string | null; inconsistente: boolean }) {
  const conhecidos = moeda ? dias.filter(d => d.gasto !== null) : [];
  const teto = Math.max(1, ...conhecidos.map(d => d.gasto!));
  return <section className={styles.grafico} aria-labelledby="inicio-grafico-titulo">
    <h2 id="inicio-grafico-titulo">Investimento por dia</h2>
    {!conhecidos.length ? <p className={styles.ausente}>{inconsistente
      ? "Não foi possível conferir a distribuição diária. Os totais válidos continuam no resumo."
      : "A distribuição diária ainda não está disponível nesta leitura. Os totais continuam no resumo."}</p> : <>
      <p className={styles.nota}>Cada barra representa um dia medido. Dias sem medição ficam em aberto.</p>
      <div className={styles.rolagem} tabIndex={0} role="region" aria-label="Gráfico diário; role horizontalmente em telas pequenas"><svg className={styles.desenho} viewBox="0 0 720 235" role="img" aria-label="Investimento diário; dias sem medição não são preenchidos">
        {[0, 0.5, 1].map(p => <g key={p}>
          <line x1="76" x2="704" y1={194 - p * 168} y2={194 - p * 168} className={styles.grade} />
          <text x="65" y={198 - p * 168} textAnchor="end">{valor(teto * p, moeda)}</text>
        </g>)}
        {dias.map((d, i) => {
          const x = 80 + (i + 0.5) * 620 / dias.length;
          return <g key={d.dia}>
            {d.gasto !== null ? d.gasto === 0
              ? <circle cx={x} cy="194" r="3" className={styles.barra} />
              : <rect x={x - Math.min(12, 220 / dias.length)} y={194 - d.gasto / teto * 168}
                width={Math.min(24, 440 / dias.length)} height={d.gasto / teto * 168} className={styles.barra} />
              : <text x={x} y="184" textAnchor="middle" aria-hidden="true">—</text>}
            {[0, Math.floor((dias.length - 1) / 2), dias.length - 1].includes(i)
              && <text x={x} y="224" textAnchor="middle">{diaCurto(d.dia)}</text>}
          </g>;
        })}
      </svg></div>
      <details className={styles.detalhes}><summary>Ver valores por dia</summary>
        <div className={styles.rolagem}><table><caption>Distribuição diária da conta consultada</caption>
          <thead><tr><th scope="col">Dia</th><th scope="col">Investido</th><th scope="col">Impressões</th><th scope="col">Cliques totais</th></tr></thead>
          <tbody>{dias.map(d => <tr key={d.dia}><th scope="row">{diaCurto(d.dia)}</th><td>{valor(d.gasto, moeda)}</td><td>{contar(d.impressoes)}</td><td>{contar(d.cliques)}</td></tr>)}</tbody>
        </table></div>
      </details>
    </>}
  </section>;
}

export function ResumoMetaDoInicio({ resultado, escopo, intervalo, pendencia, falhaPendencia, faixa, complemento }: {
  resultado: ResultadoInventarioMeta; escopo: EscopoInicioMeta; intervalo: IntervaloDoInicio;
  pendencia: PendenciaDoOnboarding | null; falhaPendencia: boolean; faixa: ReactNode; complemento: ReactNode;
}) {
  const chave = chaveDoEscopo(escopo);
  const [memoria, guardar] = useState<MemoriaInicioMeta>(null);
  const atual = resultado.ok && resultado.dados.businessId === escopo.businessId
    && resultado.dados.periodo.desde === escopo.desde && resultado.dados.periodo.ate === escopo.ate
    && (!escopo.conta || resultado.dados.contaId === escopo.conta) ? resultado.dados : null;
  useEffect(() => {
    if (atual) guardar({ chave, dados: atual });
    else if (!leituraAnteriorPermitida(resultado, escopo, memoria)) guardar(null);
  }, [atual, chave, resultado]);
  const anterior = leituraAnteriorPermitida(resultado, escopo, memoria);
  const dados = atual ?? anterior;
  const resumo = dados ? resumirMeta(dados) : null;
  const busca = new URLSearchParams({ desde: escopo.desde, ate: escopo.ate });
  if (dados?.contaId ?? escopo.conta) busca.set("conta", dados?.contaId ?? escopo.conta!);
  const anuncios = `/anuncios?${busca}`;

  return <div className={`inicio-editorial ${styles.raiz}`}>
    {faixa}
    <header className={styles.cabecalho}><h1>Início</h1><SeletorDePeriodo key={`${intervalo.desde}:${intervalo.ate}`} intervalo={intervalo} /></header>
    {intervalo.erro && <p className="form-error" role="alert">{intervalo.erro}</p>}
    {!resultado.ok && <div className="form-warning" role="status"><p>{resultado.mensagem}</p>
      {anterior && <p>Os números abaixo são da última consulta confirmada, com sua data original. Não são uma nova medição.</p>}
      <AtualizarInicio />
    </div>}
    {resultado.ok && !atual && <p className="form-error" role="alert">Não foi possível confirmar a conta e o período desta leitura.</p>}
    {(resultado.contas.length > 1 || !resultado.ok && resultado.contas.length > 0) && <form method="get" action="/inicio" className={styles.contas}>
      <label>Conta de anúncios<select name="conta" defaultValue={escopo.conta ?? dados?.contaId ?? resultado.contaSelecionada ?? ""}><option value="" disabled>Escolha uma conta</option>
        {resultado.contas.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}</select></label>
      <input type="hidden" name="desde" value={escopo.desde} /><input type="hidden" name="ate" value={escopo.ate} /><button className="cta">Consultar conta</button>
    </form>}
    {dados && resumo && <>
      <section className={styles.situacao} aria-label="Leitura das campanhas">
        <div><h2>{resumo.campanhas ? resumo.entregaHistorica ? "Houve entrega neste período" : "Campanhas encontradas na Meta" : "Nenhuma campanha retornou nesta consulta"}</h2>
          <p>{resumo.campanhas ? "A configuração das campanhas não confirma se há entrega agora." : "Isso descreve somente a conta e o período consultados."}</p></div>
        <a href={anuncios}>Ver anúncios</a>
      </section>
      <section aria-labelledby="inicio-resumo-titulo">
        <h2 id="inicio-resumo-titulo">Resumo do período</h2>
        <p className={styles.fonte}>Conta {dados.contaId} · {diaCurto(dados.periodo.desde)} a {diaCurto(dados.periodo.ate)}<br />
          Meta Marketing API · {dados.moeda ?? "Moeda não confirmada"} · Fuso: {dados.fuso ?? "Não confirmado"}<br />
          Consulta em {new Date(dados.coletadoEm).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília)</p>
        <dl className={styles.numeros}>
          <div><dt>Investido</dt><dd>{valor(resumo.gasto, dados.moeda)}</dd></div>
          <div><dt>Impressões</dt><dd>{contar(resumo.impressoes)}</dd></div>
          <div><dt>Cliques totais</dt><dd>{contar(resumo.cliques)}</dd></div>
        </dl>
        <p className={styles.nota}>{resumo.campanhasObservadas} de {resumo.campanhas} campanhas com observação no período. {resumo.parcial ? "Resumo parcial: somente as campanhas com observação entram na soma; um campo desconhecido nessas campanhas continua não medido. " : "Valores das campanhas com observação. "}Não somamos campanhas aos seus conjuntos ou anúncios. Cliques não representam pessoas únicas ou vendas.</p>
      </section>
      <GraficoDiario dias={resumo.dias} moeda={dados.moeda} inconsistente={resumo.serieInconsistente} />
    </>}
    {falhaPendencia && <p className="form-warning" role="status">Não conseguimos conferir as pendências do cadastro agora.</p>}
    {pendencia && <section className={styles.pendencia} aria-label="Pendência do cadastro"><div><h2>Pendência do cadastro</h2><h3>{pendencia.titulo}</h3><p>{pendencia.corpo}</p></div><a className="cta" href={pendencia.href}>{pendencia.rotulo}</a></section>}
    <nav className={styles.acoes} aria-label="Ações do negócio"><a href="/alertas">Ver avisos</a><a href="/criativos">Abrir criativos</a></nav>
    {complemento}
  </div>;
}
