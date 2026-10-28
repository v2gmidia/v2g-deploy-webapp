import { lerDocumentoContratante } from "../contratacao/documento-contratante.ts";
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

export type EventoExternoParaConciliar = {
  id: string; etag: string | null; status: string; resumo: string | null; descricao: string | null;
  inicio: string | null; fim: string | null; participantes: string[]; htmlLink: string | null;
};

export type ReservaExternaSelecionada = {
  status: "encontrada"; evento: EventoExternoParaConciliar;
} | { status: "ausente" } | { status: "revisao"; motivo: string };

function documentoDoFormulario(descricao: string | null): string | null {
  if (!descricao) return null;
  const legivel = descricao.replace(/<[^>]*>/g, " ").replace(/\*+/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ").replace(/\s+/g, " ");
  const trecho = legivel.match(/CNPJ do neg[oó]cio atendido\s*:?\s*(?:CNPJ|CPF)?\s*([0-9.\/-]+)/i)?.[1];
  return trecho ? lerDocumentoContratante(trecho)?.numero ?? null : null;
}

/**
 * Seleciona reserva criada pela página pública sem transformar coincidência em certeza.
 * Mais de um evento ou mais de um pedido compatível exige revisão humana.
 */
export function selecionarReservaExterna(
  eventos: EventoExternoParaConciliar[], calendarId: string, candidatos: VinculoEsperado[],
): ReservaExternaSelecionada {
  let encontrouIdentidadeExterna = false;
  const compativeis = eventos.flatMap((evento) => {
    if (evento.status !== "confirmed" || !evento.resumo?.startsWith("Reunião inicial V2G")
      || !evento.etag || !evento.inicio || !evento.fim) return [];
    const documentos = documentoDoFormulario(evento.descricao);
    if (!documentos) return [];
    const emails = [...new Set(evento.participantes.map((email) => email.trim().toLowerCase()))];
    if (candidatos.some((candidato) => cnpjNumerico(candidato.cnpj) === documentos
      && emails.includes(candidato.emailVerificado.trim().toLowerCase()))) encontrouIdentidadeExterna = true;
    const conciliacoes = emails.map((emailParticipante) => conciliarReserva({
      calendarId, eventId: evento.id, etag: evento.etag!, status: "confirmed",
      inicio: evento.inicio!, fim: evento.fim!, emailParticipante, cnpjInformado: documentos,
    }, calendarId, candidatos)).filter((resultado) => resultado.status === "reservado");
    return conciliacoes.length === 1 ? [evento] : [];
  });
  if (compativeis.length === 0) return encontrouIdentidadeExterna
    ? { status: "revisao", motivo: "vinculo_ambiguo_ou_ausente" }
    : { status: "ausente" };
  if (compativeis.length > 1) return { status: "revisao", motivo: "mais_de_um_evento" };
  return { status: "encontrada", evento: compativeis[0]! };
}

/** Uma mudança de calendário não prova que o evento antigo desapareceu. */
export function calendarioDaReservaAindaConfigurado(
  calendarIdDaReserva: string, calendarIdAtual: string | null,
): boolean {
  return Boolean(calendarIdAtual) && calendarIdDaReserva === calendarIdAtual;
}

function cnpjNumerico(valor: string): string | null {
  return lerDocumentoContratante(valor)?.numero ?? null;
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
