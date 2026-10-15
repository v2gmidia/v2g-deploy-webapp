/** Contrato normalizado: só um evento lido da agenda, nunca o clique no link. */
type IdentidadeDoEvento = {
  calendarId: string;
  eventId: string;
};

export type EventoDeReserva = IdentidadeDoEvento & ({
  etag: string;
  status: "confirmed";
  inicio: string;
  fim: string;
  emailParticipante: string | null;
  cnpjInformado: string | null;
} | {
  status: "cancelled";
  etag?: string;
});

/** Vínculo que a aplicação já persistiu após uma confirmação anterior. */
export type ReservaAnterior = {
  chaveEvento: string;
  businessId: string;
  orderId: string;
  status: "reservado" | "cancelado";
};

export type VinculoEsperado = {
  businessId: string;
  orderId: string;
  paymentStatus: string;
  emailVerificado: string;
  cnpj: string;
};

export type ConciliacaoDaReserva =
  | { status: "revisao"; motivo: string }
  | { status: "reservado"; businessId: string; orderId: string;
    chaveEvento: string; versao: string; inicio: string; fim: string }
  | { status: "cancelado"; businessId: string; orderId: string;
    chaveEvento: string; versao: string };

function cnpjNumerico(valor: string): string | null {
  if (!/^[\d.\-/\s]+$/.test(valor)) return null;
  const digitos = valor.replace(/\D/g, "");
  return digitos.length === 14 ? digitos : null;
}

function instanteComFuso(valor: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(valor)) return null;
  const instante = Date.parse(valor);
  return Number.isFinite(instante) ? instante : null;
}

/** Um evento movido no Google deve atualizar o horário mostrado, nunca manter o antigo. */
export function horarioConfirmadoGoogle(inicio: string | null, fim: string | null): {
  inicio: string; fim: string;
} | null {
  const inicioMs = inicio === null ? null : instanteComFuso(inicio);
  const fimMs = fim === null ? null : instanteComFuso(fim);
  if (inicioMs === null || fimMs === null || fimMs <= inicioMs) return null;
  return { inicio: new Date(inicioMs).toISOString(), fim: new Date(fimMs).toISOString() };
}

/** Falha fechada quando o Google não expõe o CNPJ ou a identidade completa. */
export function conciliarReserva(
  evento: EventoDeReserva, calendarId: string, candidatos: VinculoEsperado[],
  anterior?: ReservaAnterior,
): ConciliacaoDaReserva {
  if (!evento.calendarId || !evento.eventId || evento.calendarId !== calendarId)
    return { status: "revisao", motivo: "evento_ou_calendario" };
  const chaveEvento = `${evento.calendarId}:${evento.eventId}`;
  if (evento.status === "cancelled") {
    if (!anterior || anterior.status !== "reservado" || anterior.chaveEvento !== chaveEvento
      || !anterior.businessId || !anterior.orderId)
      return { status: "revisao", motivo: "cancelamento_sem_reserva" };
    return {
      status: "cancelado", businessId: anterior.businessId, orderId: anterior.orderId,
      chaveEvento, versao: evento.etag || "cancelled",
    };
  }
  if (!evento.etag) return { status: "revisao", motivo: "evento_ou_calendario" };
  if (!evento.emailParticipante)
    return { status: "revisao", motivo: "email" };
  const cnpj = evento.cnpjInformado ? cnpjNumerico(evento.cnpjInformado) : null;
  if (!cnpj)
    return { status: "revisao", motivo: "cnpj" };
  const correspondentes = candidatos.filter((candidato) => candidato.businessId && candidato.orderId
    && candidato.paymentStatus === "payment_approved"
    && candidato.emailVerificado.trim().toLowerCase() === evento.emailParticipante?.trim().toLowerCase()
    && cnpjNumerico(candidato.cnpj) === cnpj);
  if (correspondentes.length !== 1) return { status: "revisao", motivo: "vinculo_ambiguo_ou_ausente" };
  const vinculo = correspondentes[0]!;
  const inicioMs = instanteComFuso(evento.inicio);
  const fimMs = instanteComFuso(evento.fim);
  if (inicioMs === null || fimMs === null || fimMs <= inicioMs)
    return { status: "revisao", motivo: "horario" };
  return {
    status: "reservado",
    businessId: vinculo.businessId,
    orderId: vinculo.orderId,
    chaveEvento,
    versao: evento.etag,
    inicio: evento.inicio,
    fim: evento.fim,
  };
}
