import type { DiaMeta } from "@/lib/inicio/serie-meta";
import { dinheiro, diaCurto } from "@/lib/formato";
import styles from "./inicio-cliente.module.css";

/** Coordenada temporal fixa: lacunas interrompem a linha em vez de unir dias. */
export function caminhosDiarios(dias: DiaMeta[], teto: number) {
  const caminhos: string[] = [];
  let atual = "";
  dias.forEach((d, i) => {
    if (d.gasto === null) { if (atual) caminhos.push(atual); atual = ""; return; }
    const x = dias.length === 1 ? 300 : 10 + i / (dias.length - 1) * 580;
    const y = 190 - d.gasto / teto * 170;
    atual += `${atual ? " L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  if (atual) caminhos.push(atual);
  return caminhos;
}
export function GraficoInvestimento({ dias, moeda, inconsistente }: { dias: DiaMeta[]; moeda: string | null; inconsistente: boolean }) {
  const conhecidos = moeda ? dias.filter(d => d.gasto !== null) : [];
  const teto = Math.max(100, Math.ceil(Math.max(0, ...conhecidos.map(d => d.gasto!)) / 2500) * 2500);
  const marcas = [1, 2 / 3, 1 / 3, 0];
  return <section className={styles.grafico} aria-labelledby="agencia-grafico-titulo"><div className={styles.graficoCabecalho}>
    <h2 id="agencia-grafico-titulo">Investimento ao longo do tempo</h2><span>{moeda ?? "Moeda não confirmada"} por dia</span></div>
    {!conhecidos.length ? <p className={styles.nota}>{inconsistente ? "Não foi possível conferir a distribuição diária. Os totais válidos continuam no resumo." : "A distribuição diária ainda não está disponível nesta leitura. Os totais continuam no resumo."}</p> : <>
      <div className={styles.areaGrafico}><div className={styles.eixoY} aria-hidden="true">{marcas.map(p => <span key={p} style={{ top: `${(190 - p * 170) / 2}%` }}>{dinheiro(teto * p / 100, moeda!)}</span>)}</div>
        <div className={styles.desenho}><svg viewBox="0 0 600 200" preserveAspectRatio="none" role="img" aria-label="Investimento diário; dias sem medição interrompem a linha">
          {marcas.map(p => <line key={p} x1="0" x2="600" y1={190 - p * 170} y2={190 - p * 170} className={styles.grade} />)}
          {caminhosDiarios(dias, teto).map((d, i) => <path key={i} d={d} className={styles.linha} vectorEffect="non-scaling-stroke" />)}
          {dias.map((d, i) => d.gasto !== null ? <circle key={d.dia} cx={dias.length === 1 ? 300 : 10 + i / (dias.length - 1) * 580} cy={190 - d.gasto / teto * 170} r="4" className={styles.ponto}>
            <title>{`${diaCurto(d.dia)}: ${dinheiro(d.gasto / 100, moeda!)}`}</title></circle> : null)}
        </svg><div className={styles.eixoX} aria-hidden="true">{[...new Set([0, Math.floor((dias.length - 1) / 2), dias.length - 1])].map(i => <span key={i}>{diaCurto(dias[i]!.dia)}</span>)}</div></div>
      </div><p className={styles.nota}>Dias sem medição ficam em aberto.</p>
      <details className={styles.detalhes}><summary>Ver valores por dia</summary><div className={styles.rolagem}><table><caption>Valores diários da conta consultada</caption><thead><tr><th scope="col">Dia</th><th scope="col">Investido</th><th scope="col">Impressões</th><th scope="col">Cliques totais</th></tr></thead>
        <tbody>{dias.map(d => <tr key={d.dia}><th scope="row">{diaCurto(d.dia)}</th><td>{d.gasto === null ? "Não medido" : dinheiro(d.gasto / 100, moeda!)}</td><td>{d.impressoes === null ? "Não medido" : d.impressoes.toLocaleString("pt-BR")}</td><td>{d.cliques === null ? "Não medido" : d.cliques.toLocaleString("pt-BR")}</td></tr>)}</tbody></table></div></details>
    </>}
  </section>;
}
