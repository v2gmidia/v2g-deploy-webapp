import type { ContaMesa, DiaMesa, CriativoMesa } from "@/lib/gestor/painel";

/** Dados inteiramente sintéticos. Este módulo só é importado na bancada de desenvolvimento. */
export const REFERENCIA_MESA = "2026-10-20";
const onda = [.85, 1.06, 1.12, .98, 1.23, 1.36, .72];
function serie(gasto: number, resultados: number, ctr: number, queda = 1): DiaMesa[] {
  return Array.from({ length: 60 }, (_, i) => {
    const data = new Date(Date.UTC(2026, 7, 22 + i)).toISOString().slice(0, 10);
    const fator = onda[i % onda.length] ?? 1;
    const gastoCentavos = Math.round(gasto * fator);
    const impressoes = Math.round(gastoCentavos / 1.25);
    return { data, gastoCentavos, impressoes,
      cliquesLink: Math.round(impressoes * ctr / 100 * (i >= 53 ? queda : 1)),
      resultados: Math.round(resultados * fator * (i >= 53 ? queda : 1)) };
  });
}
function pecas(dias: DiaMesa[]): CriativoMesa[] {
  return ["oferta", "ambiente", "prova"].map((conceito, index) => ({
    id: `peca-${index + 1}`, nome: ["Oferta da semana", "Conheça o espaço", "O resultado em destaque"][index] ?? "Peça demonstrativa",
    conceito: conceito as CriativoMesa["conceito"], titulo: ["Uma nova experiência", "Um espaço para você", "Detalhes que fazem diferença"][index] ?? "Criativo de exemplo",
    ativo: true, formato: "Imagem", dias: dias.map((dia) => {
      // O restante fica na terceira peça, preservando os totais aditivos da conta.
      const partes = [0.48, 0.32] as const;
      const dividir = (valor: number) => index < 2 ? Math.floor(valor * (partes[index] ?? 0))
        : valor - Math.floor(valor * partes[0]) - Math.floor(valor * partes[1]);
      return { data: dia.data, gastoCentavos: dividir(dia.gastoCentavos), impressoes: dividir(dia.impressoes),
        cliquesLink: dividir(dia.cliquesLink), resultados: index === 0 ? Math.floor(dia.resultados * .28)
          : index === 1 ? Math.floor(dia.resultados * .52)
          : dia.resultados - Math.floor(dia.resultados * .28) - Math.floor(dia.resultados * .52) };
    }),
  }));
}
const definicoes = [
  { negocio: "Barbearia Horizonte", nicho: "Barbearia", responsavel: "Cauã", gasto: 6400, resultados: 7, ctr: 1.8, queda: .38, teto: 200000, meta: 1600, saldo: 62000, frequencia: 2.1 },
  { negocio: "Studio Linha", nicho: "Arquitetura", responsavel: "Cauã", gasto: 4800, resultados: 4, ctr: 1.9, queda: 1, teto: 150000, meta: 1800, saldo: 2800, frequencia: 1.7 },
  { negocio: "Oficina Norte", nicho: "Serviços automotivos", responsavel: "Victor", gasto: 7200, resultados: 6, ctr: 2.1, queda: .87, teto: 225000, meta: 1900, saldo: 85000, frequencia: 4.2 },
  { negocio: "Restaurante Pátio", nicho: "Restaurante", responsavel: "Cauã", gasto: 5300, resultados: 8, ctr: 2.8, queda: 1, teto: 120000, meta: 1300, saldo: 54000, frequencia: 2.2 },
  { negocio: "Barbearia Alameda", nicho: "Barbearia", responsavel: "Cauã", gasto: 4200, resultados: 6, ctr: 2.4, queda: 1, teto: 132000, meta: 1400, saldo: 36000, frequencia: 1.9 },
  { negocio: "Movimento Elétrico", nicho: "Mobilidade elétrica", responsavel: "Victor", gasto: 8800, resultados: 7, ctr: 1.9, queda: 1, teto: 276000, meta: 2200, saldo: 120000, frequencia: 2.0 },
  { negocio: "Seguro Essencial", nicho: "Seguros", responsavel: "Cauã", gasto: 3600, resultados: 5, ctr: 2.2, queda: 1, teto: 114000, meta: 1600, saldo: 0, frequencia: 1.6 },
  { negocio: "Estúdio Forma", nicho: "Design", responsavel: "Victor", gasto: 0, resultados: 0, ctr: 0, queda: 1, teto: 90000, meta: 1800, saldo: 25000, frequencia: 0 },
];

export const CONTAS_DEMONSTRACAO: ContaMesa[] = definicoes.map((item, i) => {
  const dias = i === 7 ? [] : serie(item.gasto, item.resultados, item.ctr, item.queda);
  return { id: `demonstracao-${i + 1}`, negocio: item.negocio, nicho: item.nicho,
    nomeConta: `Conta de anúncios ${String(i + 1).padStart(2, "0")}`, responsavel: item.responsavel, canal: "Meta Ads",
    tipoResultado: "conversas", moeda: "BRL", atualizadoEm: i === 7 ? null : "2026-10-20T13:15:00Z",
    leitura: i === 7 ? "indisponivel" : "disponivel", dias,
    frequenciaPorPeriodo: { 7: i === 7 ? null : item.frequencia, 14: i === 7 ? null : item.frequencia + .2, 30: i === 7 ? null : item.frequencia + .4 },
    tetoMensalCentavos: item.teto,
    cobranca: i === 6 ? { tipo: "pos_pago", emAbertoCentavos: 23840 } : { tipo: "pre_pago", saldoCentavos: item.saldo },
    metas: { custoResultadoMaxCentavos: item.meta, ctrMin: 1, frequenciaMax: 3.5, amostraMinimaResultados: 10 },
    criativos: pecas(dias),
  };
});
