import type { InventarioMeta, MetricasMeta, ObjetoMeta, PeriodoMeta } from "./contrato-meta";
import { somarConversas } from "./conversas-meta";

/** A API continua recebendo no máximo 31 dias, sem sobreposição nas bordas. */
export function dividirPeriodo(periodo: PeriodoMeta): PeriodoMeta[] {
  const partes: PeriodoMeta[] = [];
  const fim = Date.parse(periodo.ate + "T00:00:00Z");
  for (let inicio = Date.parse(periodo.desde + "T00:00:00Z"); inicio <= fim; inicio += 31 * 86400000) {
    partes.push({ desde: new Date(inicio).toISOString().slice(0, 10),
      ate: new Date(Math.min(fim, inicio + 30 * 86400000)).toISOString().slice(0, 10) });
  }
  return partes;
}

/** Só recebe lotes validados. Mudança de escopo/moeda/fuso invalida a composição. */
export function reunirInventarios(partes: InventarioMeta[], periodo: PeriodoMeta): InventarioMeta | null {
  const primeiro = partes[0];
  const janelas = dividirPeriodo(periodo);
  if (!primeiro || partes.length !== janelas.length || partes.some((p, i) =>
    p.businessId !== primeiro.businessId || p.contaId !== primeiro.contaId || p.moeda !== primeiro.moeda || p.fuso !== primeiro.fuso
    || p.periodo.desde !== janelas[i]!.desde || p.periodo.ate !== janelas[i]!.ate)) return null;
  if (partes.length === 1) return primeiro;

  function metricas(itens: (ObjetoMeta | undefined)[]): MetricasMeta {
    const coberturaConfirmada = itens.every(i => i?.metricas.coberturaConfirmada === true);
    const diaEmAtualizacao = itens.find(i => i?.metricas.diaEmAtualizacao)?.metricas.diaEmAtualizacao ?? null;
    const leituraIncompleta = coberturaConfirmada ? itens.some(i => i!.metricas.leituraIncompleta) : undefined;
    const medidas = itens.flatMap(i => i && i.metricas.estado !== "sem_dados" ? [i.metricas] : []);
    const soma = (campo: "gasto" | "cliques" | "impressoes") => {
      if (!medidas.length || medidas.some(m => m[campo] === null)) return null;
      const n = medidas.reduce((t, m) => t + m[campo]!, 0);
      return Number.isSafeInteger(n) ? n : null;
    };
    const gasto = soma("gasto"), impressoes = soma("impressoes"), cliques = soma("cliques");
    const completa = medidas.length === partes.length && medidas.every(m => m.estado === "observado" || m.estado === "zero_medido")
      && [gasto, impressoes, cliques].every(n => n !== null);
    const serie = medidas.some(m => m.serieDiaria?.estado === "inconsistente") ? "inconsistente"
      : medidas.length && medidas.every(m => m.serieDiaria?.estado === "disponivel") ? "disponivel" : "ausente";
    return { gasto, impressoes, cliques, coberturaConfirmada, diaEmAtualizacao, leituraIncompleta,
      estado: !medidas.length ? "sem_dados" : !completa ? "parcial" : gasto === 0 && impressoes === 0 && cliques === 0 ? "zero_medido" : "observado",
      conversas: somarConversas(medidas.map(m => m.conversas)),
      conversasMensagem: somarConversas(medidas.map(m => m.conversasMensagem)),
      dias: medidas.flatMap(m => m.dias).sort(),
      entregaObservada: (gasto !== null && gasto > 0) || (impressoes !== null && impressoes > 0) ? true
        : completa && gasto === 0 && impressoes === 0 ? false : null,
      serieDiaria: { estado: serie, dias: serie === "disponivel" ? medidas.flatMap(m => m.serieDiaria!.dias).sort((a, b) => a.dia.localeCompare(b.dia)) : [] },
    };
  }
  function reunir<T extends ObjetoMeta>(listas: T[][]): (T & { ocorrencias: (T | undefined)[] })[] {
    const ids = new Set(listas.flatMap(l => l.map(o => o.id)));
    return [...ids].map(id => {
      const ocorrencias = listas.map(l => l.find(o => o.id === id));
      const ultimo = ocorrencias.filter((o): o is T => !!o).at(-1)!;
      const atual = ocorrencias.at(-1);
      return { ...ultimo, statusConfigurado: atual?.statusConfigurado ?? null, statusEfetivo: atual?.statusEfetivo ?? null,
        metricas: metricas(ocorrencias), ocorrencias };
    });
  }
  const campanhas = reunir(partes.map(p => p.campanhas)).map(({ ocorrencias, ...campanha }) => ({ ...campanha,
    conjuntos: reunir(ocorrencias.map(c => c?.conjuntos ?? [])).map(({ ocorrencias: grupos, ...conjunto }) => ({ ...conjunto,
      anuncios: reunir(grupos.map(g => g?.anuncios ?? [])).map(({ ocorrencias: _ocorrencias, ...anuncio }) => anuncio),
    })),
  }));
  const ids = campanhas.flatMap(c => [c.id, ...c.conjuntos.flatMap(g => [g.id, ...g.anuncios.map(a => a.id)])]);
  if (new Set(ids).size !== ids.length) return null;
  return { ...primeiro, periodo, campanhas,
    // A composição não se anuncia mais nova que sua parcela mais antiga.
    coletadoEm: partes.map(p => p.coletadoEm).sort((a, b) => Date.parse(a) - Date.parse(b))[0]!,
  };
}
