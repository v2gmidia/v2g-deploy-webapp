"use client";

import { useReducer, useId, type PointerEvent, type MouseEvent } from "react";
import { dinheiro, diaCurto } from "@/lib/formato";
import type { DiaMeta } from "@/lib/inicio/serie-meta";
import styles from "./ResumoMetaDoInicio.module.css";

const valor = (n: number | null, moeda: string | null) => n === null || !moeda ? "Não medido" : dinheiro(n / 100, moeda);
const dataCompleta = (dia: string) => new Date(`${dia}T12:00:00Z`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const contar = (n: number | null) => n === null ? "Não medido" : n.toLocaleString("pt-BR");

export function GraficoDiario({ dias, moeda, inconsistente, diaEmAtualizacao }: {
  dias: DiaMeta[]; moeda: string | null; inconsistente: boolean; diaEmAtualizacao?: string | null;
}) {
  const [selecao, selecionar] = useReducer((_anterior: { indice: number; fixo: boolean } | null, proximo: { indice: number; fixo: boolean } | null) => proximo, null);
  const id = useId();
  const conhecidos = moeda ? dias.filter(d => d.gasto !== null) : [];
  const teto = Math.max(1, ...conhecidos.map(d => d.gasto!));
  const pontos = dias.map((dia, i) => ({ ...dia,
    x: dias.length === 1 ? 390 : 80 + i * 620 / (dias.length - 1),
    y: dia.gasto === null ? null : 194 - dia.gasto / teto * 168,
  }));
  // Uma lacuna interrompe a linha: não inventa zero nem une dias sem medição.
  const caminho = pontos.map((p, i) => p.y === null ? "" : `${i === 0 || pontos[i - 1]!.y === null ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const ativo = selecao ? pontos[selecao.indice] : null;
  function indiceDoEvento(event: PointerEvent<SVGSVGElement> | MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 720;
    return Math.max(0, Math.min(dias.length - 1, Math.round((x - 80) / 620 * (dias.length - 1))));
  }
  const situacao = (d: DiaMeta) => d.situacao === "atualizando" ? "Em atualização" : d.situacao === "sem_veiculacao" ? "Sem veiculação" : "";
  const valorDoDia = (d: DiaMeta) => d.situacao === "atualizando" && d.gasto === null ? "Aguardando atualização" : valor(d.gasto, moeda);
  const textoAtivo = ativo ? `${dataCompleta(ativo.dia)}. Investido: ${valorDoDia(ativo)}. ${situacao(ativo)}` : "Selecione um dia";

  return <section className={styles.grafico} aria-labelledby={`${id}-titulo`}>
    <h2 id={`${id}-titulo`}>Investimento por dia</h2>
    {diaEmAtualizacao && <p className={styles.nota}>Hoje, {diaCurto(diaEmAtualizacao)} · em atualização.</p>}
    {!conhecidos.length ? <p className={styles.ausente}>{inconsistente
      ? "Não foi possível conferir a distribuição diária. Os totais válidos continuam no resumo."
      : "A distribuição diária ainda não está disponível nesta leitura. Os totais continuam no resumo."}</p> : <>
      <p className={styles.nota}>Passe o mouse ou toque para ver os valores do dia.</p>
      <div className={styles.graficoInterativo} onPointerLeave={() => { if (!selecao?.fixo) selecionar(null); }}>
        <div className={styles.rolagem}>
          <svg className={styles.desenho} viewBox="0 0 720 235" tabIndex={0} role="slider"
            aria-label="Dia do gráfico" aria-valuemin={1} aria-valuemax={dias.length} aria-valuenow={(selecao?.indice ?? 0) + 1}
            aria-valuetext={textoAtivo} aria-describedby={`${id}-ajuda`}
            onFocus={() => { if (!selecao) selecionar({ indice: 0, fixo: false }); }}
            onBlur={() => { if (!selecao?.fixo) selecionar(null); }}
            onPointerMove={event => { if (event.pointerType === "mouse" && !selecao?.fixo) selecionar({ indice: indiceDoEvento(event), fixo: false }); }}
            onClick={event => { const indice = indiceDoEvento(event); selecionar(selecao?.fixo && selecao.indice === indice ? null : { indice, fixo: true }); }}
            onKeyDown={event => {
              if (event.key === "Escape") { event.preventDefault(); selecionar(null); return; }
              const atual = selecao?.indice ?? 0;
              const destino = event.key === "Home" ? 0 : event.key === "End" ? dias.length - 1
                : event.key === "ArrowRight" || event.key === "ArrowUp" ? Math.min(dias.length - 1, atual + 1)
                : event.key === "ArrowLeft" || event.key === "ArrowDown" ? Math.max(0, atual - 1) : null;
              if (destino !== null) { event.preventDefault(); selecionar({ indice: destino, fixo: true }); }
            }}>
            {[0, 0.5, 1].map(p => <g key={p} aria-hidden="true">
              <line x1="76" x2="704" y1={194 - p * 168} y2={194 - p * 168} className={styles.grade} />
              <text x="65" y={198 - p * 168} textAnchor="end">{valor(teto * p, moeda)}</text>
            </g>)}
            <path d={caminho} className={styles.linha} aria-hidden="true" />
            {pontos.map((d, i) => <g key={d.dia} aria-hidden="true">
              {d.y !== null ? <circle cx={d.x} cy={d.y} r={dias.length > 45 ? 2 : 3.5} className={styles.ponto} />
                : <text x={d.x} y="184" textAnchor="middle">—</text>}
              {[0, Math.floor((dias.length - 1) / 2), dias.length - 1].includes(i)
                && <text x={d.x} y="224" textAnchor={i === 0 ? "start" : i === dias.length - 1 ? "end" : "middle"}>{diaCurto(d.dia)}</text>}
            </g>)}
            {ativo && <g aria-hidden="true">
              <line x1={ativo.x} x2={ativo.x} y1="22" y2="194" className={styles.marcador} />
              {ativo.y !== null && <circle cx={ativo.x} cy={ativo.y} r="6" className={styles.pontoAtivo} />}
            </g>}
          </svg>
        </div>
        {ativo && <div className={styles.detalheDoDia}>
          <strong>{dataCompleta(ativo.dia)}</strong>
          <dl><div><dt>Investido</dt><dd>{valorDoDia(ativo)}</dd></div></dl>
          {situacao(ativo) && <span className={styles.nota}>{situacao(ativo)}</span>}
          {selecao?.fixo && <button type="button" onClick={() => selecionar(null)} aria-label="Fechar detalhe do dia">×</button>}
        </div>}
      </div>
      <span className={styles.somenteLeitor} id={`${id}-ajuda`}>Use as setas para escolher o dia. Home e End vão ao início e ao fim. Escape fecha o detalhe. Dias sem medição ficam em aberto.</span>
      <details className={styles.detalhes}><summary>Ver valores por dia</summary>
        <div className={styles.rolagem}><table><caption>Investimento e impressões por dia da conta consultada.</caption>
          <thead><tr><th scope="col">Dia</th><th scope="col">Investido</th><th scope="col">Impressões</th></tr></thead>
          <tbody>{dias.map(d => <tr key={d.dia}><th scope="row">{dataCompleta(d.dia)}{situacao(d) && <small> · {situacao(d)}</small>}</th><td>{valorDoDia(d)}</td><td>{d.situacao === "atualizando" && d.impressoes === null ? "Em atualização" : contar(d.impressoes)}</td></tr>)}</tbody>
        </table></div>
      </details>
    </>}
  </section>;
}
