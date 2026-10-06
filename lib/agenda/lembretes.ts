/** Planejamento puro. Nenhuma mensagem ou convite é enviado daqui. */

export type MarcoDeLembrete = "um_dia" | "duas_horas" | "trinta_minutos" | "cinco_minutos";

export interface LembretePlanejado {
  marco: MarcoDeLembrete;
  previstoPara: Date;
}

const MARCOS: readonly { marco: MarcoDeLembrete; antesEmMinutos: number }[] = [
  { marco: "um_dia", antesEmMinutos: 24 * 60 },
  { marco: "duas_horas", antesEmMinutos: 2 * 60 },
  { marco: "trinta_minutos", antesEmMinutos: 30 },
  { marco: "cinco_minutos", antesEmMinutos: 5 },
];

export type PlanoDeLembretes =
  | { ok: true; lembretes: LembretePlanejado[] }
  | { ok: false; motivo: "data_invalida" | "reuniao_ja_iniciada" };

/**
 * Planeja os quatro marcos pedidos, mantendo apenas os que ainda podem
 * acontecer após a confirmação. O convite imediato é outro evento.
 * O chamador deverá persistir, entregar e reconciliar por canal.
 */
export function planejarLembretes(inicio: Date, confirmadoEm: Date): PlanoDeLembretes {
  const inicioMs = inicio.getTime();
  const confirmadoMs = confirmadoEm.getTime();
  if (!Number.isFinite(inicioMs) || !Number.isFinite(confirmadoMs)) {
    return { ok: false, motivo: "data_invalida" };
  }
  if (inicioMs <= confirmadoMs) {
    return { ok: false, motivo: "reuniao_ja_iniciada" };
  }

  return {
    ok: true,
    lembretes: MARCOS.flatMap(({ marco, antesEmMinutos }) => {
      const previstoMs = inicioMs - antesEmMinutos * 60_000;
      return previstoMs > confirmadoMs
        ? [{ marco, previstoPara: new Date(previstoMs) }]
        : [];
    }),
  };
}
