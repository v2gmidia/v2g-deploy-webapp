import type { ContextoMeta, MetricasMeta } from "./contrato-meta";
import { diasDoPeriodo } from "../inicio/serie-meta";

/** Só a confirmação explícita do backend pode completar a série com zeros. */
export function aplicarCoberturaDiaria(m: MetricasMeta, raw: unknown, contexto: Pick<ContextoMeta, "periodo" | "fuso" | "moeda" | "coletadoEm">): MetricasMeta | null {
  if (raw === undefined || raw === null) return m; // Backend anterior: lacunas continuam desconhecidas.
  if (typeof raw !== "object" || Array.isArray(raw) || !contexto.fuso || !contexto.moeda) return null;
  const c = raw as Record<string, unknown>;
  let hoje: string;
  try {
    hoje = new Intl.DateTimeFormat("en-CA", { timeZone: contexto.fuso, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(contexto.coletadoEm));
  } catch { return null; }
  const calendario = diasDoPeriodo(contexto.periodo.desde, contexto.periodo.ate);
  const diaEmAtualizacao = calendario.includes(hoje) ? hoje : null;
  if (c.versao !== "meta-dias-fechados-v1" || !Array.isArray(c.dias_sem_veiculacao)
    || c.dia_em_atualizacao !== diaEmAtualizacao
    || !c.dias_sem_veiculacao.every(d => typeof d === "string" && calendario.includes(d) && d < hoje && !m.dias.includes(d))
    || new Set(c.dias_sem_veiculacao).size !== c.dias_sem_veiculacao.length) return null;
  const zeros = new Set(c.dias_sem_veiculacao as string[]);
  if (calendario.some(d => d < hoje && !m.dias.includes(d) && !zeros.has(d))) return null;
  // Série inválida mantém os totais válidos, mas não sustenta zeros no gráfico.
  if (m.serieDiaria?.estado !== "disponivel") return { ...m, leituraIncompleta: true };
  const dias = m.serieDiaria.dias.map(d => zeros.has(d.dia)
    ? { dia: d.dia, gasto: 0, impressoes: 0, cliques: 0, situacao: "sem_veiculacao" as const }
    : { ...d, ...(d.dia === diaEmAtualizacao ? { situacao: "atualizando" as const } : {}) });
  const semObservacoes = m.dias.length === 0 && zeros.size > 0;
  const gasto = semObservacoes ? 0 : m.gasto;
  const impressoes = semObservacoes ? 0 : m.impressoes;
  const cliques = semObservacoes ? 0 : m.cliques;
  const leituraIncompleta = dias.some(d => d.dia !== diaEmAtualizacao && [d.gasto, d.impressoes, d.cliques].includes(null))
    || m.dias.length > 0 && [gasto, impressoes, cliques].includes(null);
  const semEntregaNoPeriodo = zeros.size === calendario.length;
  const estado = leituraIncompleta || diaEmAtualizacao ? (m.dias.length || zeros.size ? "parcial" : "sem_dados")
    : gasto === 0 && impressoes === 0 && cliques === 0 ? "zero_medido" : "observado";
  return { ...m, estado, gasto, impressoes, cliques,
    conversasMensagem: semEntregaNoPeriodo ? "0" : m.conversasMensagem,
    entregaObservada: semEntregaNoPeriodo ? false : m.entregaObservada,
    leituraIncompleta, diaEmAtualizacao, coberturaConfirmada: true,
    serieDiaria: { estado: "disponivel", dias } };
}
