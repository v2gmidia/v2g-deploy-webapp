/** Dados diários da fonte; ausência nunca vira zero nem interpolação. */
export type DiaMeta = { dia: string; gasto: number | null; impressoes: number | null; cliques: number | null };
export type SerieMeta = { estado: "ausente" | "inconsistente" | "disponivel"; dias: DiaMeta[] };
type Totais = { gasto: number | null; impressoes: number | null; cliques: number | null };
const inteiro = (v: unknown): v is number | null => v === null || typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
export function diasDoPeriodo(desde: string, ate: string): string[] {
  const dias: string[] = [];
  for (let t = Date.parse(desde + "T00:00:00Z"); t <= Date.parse(ate + "T00:00:00Z") && dias.length < 31; t += 86400000)
    dias.push(new Date(t).toISOString().slice(0, 10));
  return dias;
}
/** Série inválida recusa o gráfico, sem descartar os totais já validados pelo contrato. */
export function lerSerieMeta(raw: unknown, periodo: { desde: string; ate: string }, totais: Totais, observados?: string[]): SerieMeta {
  if (raw === undefined) return { estado: "ausente", dias: [] };
  const invalida = (): SerieMeta => ({ estado: "inconsistente", dias: [] });
  const esperados = diasDoPeriodo(periodo.desde, periodo.ate);
  if (!Array.isArray(raw) || raw.length > esperados.length) return invalida();
  const porDia = new Map<string, DiaMeta>();
  let anterior = "";
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return invalida();
    const d = item as Record<string, unknown>;
    if (typeof d.dia !== "string" || !esperados.includes(d.dia) || porDia.has(d.dia) || d.dia <= anterior
      || !inteiro(d.gasto_centavos) || !inteiro(d.impressoes) || !inteiro(d.cliques_totais)) return invalida();
    porDia.set(d.dia, { dia: d.dia, gasto: d.gasto_centavos, impressoes: d.impressoes, cliques: d.cliques_totais });
    anterior = d.dia;
  }
  if (observados && (observados.length !== porDia.size || observados.some(d => !porDia.has(d)))) return invalida();
  const dias = esperados.map(dia => porDia.get(dia) ?? { dia, gasto: null, impressoes: null, cliques: null });
  for (const chave of ["gasto", "impressoes", "cliques"] as const) {
    const conhecidos = dias.map(d => d[chave]).filter((v): v is number => v !== null);
    const soma = conhecidos.reduce((a, b) => a + b, 0);
    const total = totais[chave];
    // O total da fonte soma as linhas observadas, não dias sem observação.
    // Total desconhecido não invalida pontos individuais seguros de outro campo.
    if (total !== null && (!Number.isSafeInteger(soma) || soma > total
      || conhecidos.length === porDia.size && soma !== total)) return invalida();
  }
  return { estado: "disponivel", dias };
}
