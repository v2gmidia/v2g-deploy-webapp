import type { InventarioMeta, ResultadoInventarioMeta } from "../anuncios/contrato-meta";
import { diasDoPeriodo, type DiaMeta } from "./serie-meta";
import { somarConversas } from "../anuncios/conversas-meta";

/** Soma apenas campanhas: nunca soma uma campanha aos seus conjuntos/anúncios. */
export function resumirMeta(inventario: InventarioMeta) {
  const metricas = inventario.campanhas.map(c => c.metricas);
  const observadas = metricas.filter(m => m.estado !== "sem_dados");
  const somar = (chave: "gasto" | "impressoes" | "cliques") => {
    // Uma campanha COM observação e campo desconhecido não vira parcela zero.
    if (observadas.some(m => m[chave] === null)) return null;
    const valores = observadas.map(m => m[chave]).filter((v): v is number => v !== null);
    const soma = valores.reduce((a, b) => a + b, 0);
    return valores.length && Number.isSafeInteger(soma) ? soma : null;
  };
  const parcial = observadas.some(m => m.leituraIncompleta ?? (m.estado === "parcial" || [m.gasto, m.impressoes, m.cliques].includes(null)));
  const diaEmAtualizacao = metricas.find(m => m.diaEmAtualizacao)?.diaEmAtualizacao ?? null;
  const seriesDisponiveis = observadas.length > 0 && observadas.every(m => m.serieDiaria?.estado === "disponivel");
  const dias: DiaMeta[] = seriesDisponiveis ? diasDoPeriodo(inventario.periodo.desde, inventario.periodo.ate).map(dia => {
    const linhas = observadas.map(m => m.serieDiaria!.dias.find(d => d.dia === dia));
    const valor = (chave: "gasto" | "impressoes" | "cliques") => {
      if (linhas.some(d => !d || d[chave] === null)) return null;
      const soma = linhas.reduce((t, d) => t + d![chave]!, 0);
      return Number.isSafeInteger(soma) ? soma : null;
    };
    return { dia, gasto: valor("gasto"), impressoes: valor("impressoes"), cliques: valor("cliques"),
      ...(dia === diaEmAtualizacao ? { situacao: "atualizando" as const }
        : linhas.every(d => d?.situacao === "sem_veiculacao") ? { situacao: "sem_veiculacao" as const } : {}) };
  }) : [];
  return { gasto: somar("gasto"), impressoes: somar("impressoes"), cliques: somar("cliques"), parcial, dias, diaEmAtualizacao,
    conversasMensagem: somarConversas(observadas.filter(m => !m.coberturaConfirmada || m.dias.length > 0 || m.conversasMensagem !== null).map(m => m.conversasMensagem)),
    campanhas: metricas.length, campanhasObservadas: observadas.length, campanhasSemDados: metricas.length - observadas.length,
    entregaHistorica: metricas.some(m => m.entregaObservada === true),
    serieInconsistente: observadas.some(m => m.serieDiaria?.estado === "inconsistente") };
}

export function textoCoberturaMeta(r: ReturnType<typeof resumirMeta>): string {
  const comDados = r.campanhasObservadas === 1 ? "1 campanha com dados no período" : `${r.campanhasObservadas} campanhas com dados no período`;
  const semDados = r.campanhasSemDados ? `; ${r.campanhasSemDados} sem registros neste período` : "";
  return `${comDados}${semDados}.${r.parcial ? " A leitura das campanhas com dados está incompleta." : ""}`;
}

export type EscopoInicioMeta = { businessId: string; perfilId: string; desde: string; ate: string; conta?: string };
export function chaveDoEscopo(e: EscopoInicioMeta) { return JSON.stringify([e.perfilId, e.businessId, e.desde, e.ate, e.conta ?? null]); }
export type MemoriaInicioMeta = { chave: string; dados: InventarioMeta } | null;
export function leituraAnteriorPermitida(atual: ResultadoInventarioMeta, escopo: EscopoInicioMeta, memoria: MemoriaInicioMeta) {
  return !atual.ok && ["indisponivel", "fonte", "resposta"].includes(atual.motivo)
    && memoria?.chave === chaveDoEscopo(escopo) && memoria.dados.businessId === escopo.businessId
    && atual.contaSelecionada === memoria.dados.contaId
    && atual.contas.some(c => c.id === memoria.dados.contaId)
    && (!escopo.conta || memoria.dados.contaId === escopo.conta) ? memoria.dados : null;
}
