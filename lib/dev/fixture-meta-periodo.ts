import type { ResultadoInventarioMeta } from "@/lib/anuncios/contrato-meta";
import { lerInventarioMeta } from "@/lib/anuncios/contrato-meta";
import type { IntervaloDoInicio } from "@/lib/inicio/periodo";
import { diasDoPeriodo } from "@/lib/inicio/serie-meta";
import { dividirPeriodo, reunirInventarios } from "@/lib/anuncios/intervalo-amplo";

/** Somente bancada dev: valores sintéticos, nunca representam uma conta real. */
export function exemploMetaDoPeriodo(periodo: IntervaloDoInicio, serie?: string): ResultadoInventarioMeta {
  if (serie === "sem-veiculacao" || serie === "falha") return exemploCobertura(periodo, serie === "falha");
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

/** Passa pelo mesmo parser da resposta real. Dados inteiramente ilustrativos. */
function exemploCobertura(periodo: IntervaloDoInicio, falha: boolean): ResultadoInventarioMeta {
  const partes = dividirPeriodo(periodo).map(p => exemploCoberturaParte({ ...p, hoje: periodo.hoje }, falha));
  const dados = reunirInventarios(partes, periodo);
  if (!dados) throw new Error("Fixture de cobertura diária inválida");
  return { ok: true, contas: [{ id: dados.contaId }], contaSelecionada: dados.contaId, dados };
}

function exemploCoberturaParte(periodo: IntervaloDoInicio, falha: boolean) {
  const businessId = "11111111-1111-4111-8111-111111111111", contaId = "act_10001";
  const calendario = diasDoPeriodo(periodo.desde, periodo.ate);
  const primeiro = calendario[0]!;
  const zeros = calendario.filter(d => d !== primeiro && d < periodo.hoje);
  const raw = { versao: "e28-meta-ads-read-v1", business_id: businessId, conta_id: contaId,
    id_execucao: null, origem_vinculo: "ad_accounts", fonte: "meta_marketing_api", periodo,
    moeda: "BRL", fuso: "America/Sao_Paulo", coletado_em: `${periodo.hoje}T12:00:00Z`, avisos: [],
    campanhas: [{ id: "10001", nome: "Campanha de exemplo", status_configurado: "PAUSED", status_efetivo: "PAUSED", conjuntos: [],
      metricas: { estado: "parcial", gasto_centavos: falha ? null : 2500, impressoes: 1400, cliques_totais: 20,
        cliques_no_link: null, conversas_whatsapp: null, conversas_mensagem: "2",
        definicao_conversas_mensagem: "onsite_conversion.messaging_conversation_started_7d",
        dias_com_observacao: [primeiro], entrega_observada_no_periodo: true, motivos: ["cobertura_ou_campos_incompletos"],
        serie_diaria: [{ dia: primeiro, gasto_centavos: falha ? null : 2500, impressoes: 1400, cliques_totais: 20 }],
        cobertura_diaria: { versao: "meta-dias-fechados-v1", dias_sem_veiculacao: zeros,
          dia_em_atualizacao: calendario.includes(periodo.hoje) ? periodo.hoje : null },
      } }],
  };
  const dados = lerInventarioMeta(raw, { businessId, contaId, periodo });
  if (!dados) throw new Error("Fixture de cobertura diária inválida");
  return dados;
}
