/**
 * Regra local da jornada comercial. Não consulta provedor nem altera banco.
 * A origem de cada evento precisa ser verificada antes de aplicar este reducer.
 */
export type EstadoDaContratacao = {
  eventosAplicados: string[];
  comprovantePixRecebido: boolean;
  pagamentoAprovado: boolean;
  contratoAssinado: boolean;
  notaAutorizada: boolean;
};

export type EventoDaContratacao =
  | { id: string; tipo: "comprovante_pix_recebido" }
  | { id: string; tipo: "pix_aprovado_por_operador"; operadorId: string }
  | { id: string; tipo: "pagamento_asaas_confirmado"; cobrancaId: string }
  | { id: string; tipo: "contrato_assinado_confirmado"; documentoId: string }
  | { id: string; tipo: "nota_fiscal_autorizada"; notaId: string };

export function contratacaoInicial(): EstadoDaContratacao {
  return {
    eventosAplicados: [],
    comprovantePixRecebido: false,
    pagamentoAprovado: false,
    contratoAssinado: false,
    notaAutorizada: false,
  };
}

export function aplicarEvento(
  estado: EstadoDaContratacao,
  evento: EventoDaContratacao,
): EstadoDaContratacao {
  if (!evento.id.trim() || estado.eventosAplicados.includes(evento.id)) return estado;

  const proximo = {
    ...estado,
    eventosAplicados: [...estado.eventosAplicados, evento.id],
  };

  switch (evento.tipo) {
    case "comprovante_pix_recebido":
      return { ...proximo, comprovantePixRecebido: true };
    case "pix_aprovado_por_operador":
      return evento.operadorId.trim()
        ? { ...proximo, pagamentoAprovado: true }
        : estado;
    case "pagamento_asaas_confirmado":
      return evento.cobrancaId.trim()
        ? { ...proximo, pagamentoAprovado: true }
        : estado;
    case "contrato_assinado_confirmado":
      return evento.documentoId.trim()
        ? { ...proximo, contratoAssinado: true }
        : estado;
    case "nota_fiscal_autorizada":
      return evento.notaId.trim()
        ? { ...proximo, notaAutorizada: true }
        : estado;
  }
}

export function permissoesDaContratacao(estado: EstadoDaContratacao) {
  return {
    acessoWebApp: estado.pagamentoAprovado,
    primeiraCampanha: estado.pagamentoAprovado && estado.contratoAssinado,
    mostrarNotaEmitida: estado.notaAutorizada,
  };
}
