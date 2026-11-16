import type { ResultadoInventarioMeta } from "@/lib/anuncios/contrato-meta";
import type { IntervaloDoInicio } from "@/lib/inicio/periodo";
import { diasDoPeriodo } from "@/lib/inicio/serie-meta";

/** Somente bancada dev: valores sintéticos, nunca representam uma conta real. */
export function exemploMetaDoPeriodo(periodo: IntervaloDoInicio): ResultadoInventarioMeta {
  const dias = diasDoPeriodo(periodo.desde, periodo.ate).map((dia, i) => ({
    dia, gasto: 1200 + (i % 9) * 270, impressoes: 400 + (i % 7) * 90, cliques: 12 + (i % 11) * 3,
  }));
  return { ok: true, contas: [{ id: "act_10001" }], contaSelecionada: "act_10001", dados: {
    businessId: "11111111-1111-4111-8111-111111111111", contaId: "act_10001", periodo,
    moeda: "BRL", fuso: "America/Sao_Paulo", coletadoEm: "2026-11-16T12:00:00Z",
    campanhas: [{ id: "10001", nome: "Campanha de exemplo", statusConfigurado: "ACTIVE", statusEfetivo: "ACTIVE", conjuntos: [],
      metricas: { estado: "observado", gasto: dias.reduce((s, d) => s + d.gasto, 0),
        impressoes: dias.reduce((s, d) => s + d.impressoes, 0), cliques: dias.reduce((s, d) => s + d.cliques, 0),
        conversas: null, conversasMensagem: String(dias.length * 3), dias: dias.map(d => d.dia), entregaObservada: true,
        serieDiaria: { estado: "disponivel", dias } } }],
  } };
}
