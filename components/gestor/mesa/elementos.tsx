"use client";

import { useState } from "react";
import type { EstadoMesa } from "@/lib/gestor/painel";
import styles from "./MesaDoGestor.module.css";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
export const moedaMesa = (centavos: number | null) => centavos === null ? "—" : brl.format(centavos / 100);
export const numeroMesa = (valor: number | null) => valor === null ? "—" : inteiro.format(valor);
export const percentualMesa = (valor: number | null) => valor === null ? "—" : `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
export const dataMesa = (data: string) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;
export const rotulosEstado: Record<EstadoMesa, string> = { critico: "Ação necessária", atencao: "Acompanhar", saudavel: "Dentro dos critérios", sem_dados: "Sem leitura completa" };

export function IconeMesa({ nome, tamanho = 18 }: { nome: "tabela" | "cartoes" | "busca" | "seta" | "voltar" | "calendario" | "filtro" | "alerta" | "check" | "relogio" | "imagem" | "grafico"; tamanho?: number }) {
  const caminhos = {
    tabela: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 14h18M9 4v16" /></>,
    cartoes: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    busca: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
    seta: <path d="M4 12h15m-6-6 6 6-6 6" />,
    voltar: <path d="M20 12H5m6-6-6 6 6 6" />,
    calendario: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 11h18" /></>,
    filtro: <><path d="M4 6h16M7 12h10m-7 6h4" /><circle cx="8" cy="6" r="2" /><circle cx="15" cy="12" r="2" /></>,
    alerta: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v5m0 3v1" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    imagem: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8" cy="9" r="2" /><path d="m3 17 6-5 4 3 3-3 5 5" /></>,
    grafico: <><path d="M4 3v17h17M8 15l4-5 4 2 5-7" /></>,
  };
  return <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{caminhos[nome]}</svg>;
}

export function SeloMesa({ estado, children }: { estado: EstadoMesa; children?: React.ReactNode }) {
  return <span className={styles.selo} data-estado={estado}><span className={styles.ponto} />{children ?? rotulosEstado[estado]}</span>;
}

export function VariacaoMesa({ valor, custo = false }: { valor: number | null; custo?: boolean }) {
  if (valor === null) return <span className={styles.variacao}>Sem base anterior</span>;
  const piorou = custo ? valor > 0 : valor < 0;
  return <span className={styles.variacao} data-tom={Math.abs(valor) < .5 ? "neutro" : piorou ? "ruim" : "bom"}>
    {valor > 0 ? "+" : ""}{valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% <span>vs. anterior</span>
  </span>;
}

export function MiniaturaCriativo({ conceito, titulo }: { conceito: "oferta" | "ambiente" | "prova"; titulo: string }) {
  return <svg viewBox="0 0 80 80" role="img" aria-label={`Imagem demonstrativa: ${titulo}`} className={styles.miniatura} data-conceito={conceito}>
    <rect width="80" height="80" fill="currentColor" />
    <circle cx="62" cy="18" r="20" fill="var(--ice)" opacity=".25" />
    <path d="M9 54h62M9 58h42" stroke="var(--white)" opacity=".5" />
    <text x="9" y="22" fill="var(--white)" fontSize="8" fontWeight="700">{conceito === "oferta" ? "OFERTA DA SEMANA" : conceito === "ambiente" ? "SEU MOMENTO" : "CADA DETALHE"}</text>
    <text x="9" y="36" fill="var(--white)" fontSize="7">{conceito === "oferta" ? "Uma nova experiência" : conceito === "ambiente" ? "Conheça nosso espaço" : "Conheça o resultado"}</text>
    <rect x="9" y="64" width="38" height="7" fill="var(--ice)" />
  </svg>;
}

export function GraficoMesa({ titulo, dados, monetario = false }: {
  titulo: string; dados: { data: string; valor: number | null }[]; monetario?: boolean;
}) {
  const [ativo, setAtivo] = useState<number | null>(null);
  const max = Math.max(...dados.map((d) => d.valor ?? 0), 1) * 1.15;
  const largura = 560, altura = 155, esquerda = 46, topo = 14;
  const pontos = dados.map((d, i) => ({ ...d, i, x: esquerda + i / Math.max(dados.length - 1, 1) * (largura - esquerda - 12), y: topo + altura - (d.valor ?? 0) / max * altura }));
  const linha = pontos.map((p, i) => p.valor === null ? "" : `${i && pontos[i - 1]?.valor !== null ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const indice = ativo !== null && ativo < dados.length ? ativo : Math.max(dados.length - 1, 0);
  const selecionado = dados[indice];
  const formatar = (v: number | null) => v === null ? "Não medido" : monetario ? moedaMesa(v) : numeroMesa(v);
  const ultimo = pontos.at(-1);
  return <figure className={styles.grafico}>
    <figcaption><h3>{titulo}</h3><span>{selecionado ? `${dataMesa(selecionado.data)} · ${formatar(selecionado.valor)}` : "Sem dados"}</span></figcaption>
    <svg viewBox="0 0 560 204" role="img" aria-label={`${titulo}: ${dados.length} dias. Valores disponíveis na tabela abaixo.`}>
      {[0, .5, 1].map((f) => <g key={f}><line x1={esquerda} x2={548} y1={topo + altura * f} y2={topo + altura * f} stroke="var(--line)" strokeDasharray="3 5" /><text x={0} y={topo + altura * f + 4} fill="var(--ink-mute)" fontSize="11">{monetario ? Math.round(max * (1 - f) / 100) : numeroMesa(Math.round(max * (1 - f)))}</text></g>)}
      {ultimo && pontos.length > 1 && <>{pontos.every((p) => p.valor !== null) && <path d={`${linha} L${ultimo.x},${topo + altura} L${esquerda},${topo + altura} Z`} fill="var(--cobalt-ink)" opacity=".07" />}<path d={linha} fill="none" stroke="var(--cobalt-ink)" strokeWidth="2.5" /></>}
      {pontos.map((p, i) => p.valor !== null && <circle key={i} cx={p.x} cy={p.y} r={indice === i ? 4.5 : 3} fill={indice === i ? "var(--cobalt-ink)" : "var(--surface-2)"} stroke="var(--cobalt-ink)" strokeWidth="1.5" onPointerEnter={() => setAtivo(i)}><title>{dataMesa(p.data)}: {formatar(p.valor)}</title></circle>)}
      {pontos.filter((p) => p.i === 0 || p.i === dados.length - 1 || p.i === Math.floor((dados.length - 1) / 2)).map((d) => <text key={d.data} x={d.x} y={196} textAnchor="middle" fill="var(--ink-mute)" fontSize="11">{dataMesa(d.data)}</text>)}
    </svg>
    <details className={styles.dadosGrafico}><summary>Ver valores por dia</summary><div className={styles.rolagem}><table><thead><tr><th>Data</th><th>Valor</th></tr></thead><tbody>{dados.map((d) => <tr key={d.data}><td>{dataMesa(d.data)}</td><td>{formatar(d.valor)}</td></tr>)}</tbody></table></div></details>
  </figure>;
}
