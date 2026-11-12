"use client";
import { useState } from "react";
import { ResumoMetaDoInicio } from "@/app/(protected)/inicio/ResumoMetaDoInicio";
import type { CampanhaMeta, ResultadoInventarioMeta } from "@/lib/anuncios/contrato-meta";

// Sentinela dev-only: V2G_INICIO_META_FICTICIO_0911. Nenhuma série real de cliente.
const businessId = "11111111-1111-4111-8111-111111111111";
const intervalo = { desde: "2026-11-01", ate: "2026-11-07", hoje: "2026-11-09" };
const dias = [110, 250, 0, 190, 420, 320, 210].map((gasto, i) => ({
  dia: `2026-11-0${i + 1}`, gasto, impressoes: gasto * 2, cliques: gasto === 0 ? 0 : i + 2,
}));
const campanha: CampanhaMeta = { id: "10001", nome: "Campanha fictícia", statusConfigurado: "ACTIVE", statusEfetivo: "ACTIVE", conjuntos: [],
  metricas: { estado: "observado", gasto: 1500, impressoes: 3000, cliques: 31, conversas: null,
    dias: dias.map(d => d.dia), entregaObservada: true, serieDiaria: { estado: "disponivel", dias } } };
export function PreviaInicioMeta() {
  const [cenario, escolher] = useState("medido");
  const atual = structuredClone(campanha);
  if (cenario === "antigo") delete atual.metricas.serieDiaria;
  if (cenario === "lacunas") {
    atual.metricas.estado = "parcial";
    atual.metricas.gasto = null;
    atual.metricas.serieDiaria!.dias[2]!.gasto = null;
    atual.metricas.serieDiaria!.dias[4]!.gasto = 0;
  }
  const resultado: ResultadoInventarioMeta = cenario === "falha" || cenario === "falha-sem-conta" ? {
    ok: false, motivo: "fonte", mensagem: "A fonte desta consulta fictícia está indisponível.",
    contas: cenario === "falha" ? [{ id: "act_10001" }] : [],
    contaSelecionada: cenario === "falha" ? "act_10001" : null,
  } : {
    ok: true, contas: [{ id: "act_10001" }], contaSelecionada: "act_10001", dados: { businessId, contaId: "act_10001",
      periodo: intervalo, moeda: "BRL", fuso: "America/Sao_Paulo", coletadoEm: "2026-11-09T03:00:00Z", campanhas: [atual] },
  };
  return <div className="canvas"><div className="form-warning"><strong>Bancada fictícia · não é homologação do piloto</strong>
    <label> Cenário <select value={cenario} onChange={e => escolher(e.target.value)}>
      <option value="medido">Medição e cadastro pendente</option><option value="antigo">Backend sem série diária</option>
      <option value="lacunas">Lacunas, null e zero</option><option value="falha">Falha após leitura</option>
      <option value="falha-sem-conta">Falha antes de confirmar a conta</option>
    </select></label></div>
    <ResumoMetaDoInicio resultado={resultado} intervalo={intervalo} escopo={{ businessId, perfilId: "perfil-ficticio", ...intervalo }}
      pendencia={{ titulo: "Confirme as informações da marca", corpo: "Esta pendência fictícia não apaga campanhas observadas na fonte.", href: "/onboarding/marca", rotulo: "Conferir cadastro" }}
      falhaPendencia={false} faixa={null} complemento={null} />
  </div>;
}
