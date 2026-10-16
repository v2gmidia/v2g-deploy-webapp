export type EtapaCartaoMensal =
  | { tipo: "criar_cobranca_avulsa_3ds" }
  | { tipo: "aguardar_pagamento_confirmado" }
  | { tipo: "bloqueado_token_ausente" }
  | { tipo: "criar_assinatura"; primeiroVencimento: string; chaveIdempotencia: string }
  | { tipo: "revisar_vencimento_assinatura"; primeiroVencimentoEsperado: string }
  | { tipo: "concluido" };

function dataIsoValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const ano = Number(valor.slice(0, 4));
  const mes = Number(valor.slice(5, 7));
  const dia = Number(valor.slice(8, 10));
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  return data.getUTCFullYear() === ano
    && data.getUTCMonth() === mes - 1
    && data.getUTCDate() === dia;
}

export function vencimentoNoMesSeguinte(vencimentoInicial: string): string {
  if (!dataIsoValida(vencimentoInicial)) throw new Error("Vencimento inicial inválido.");
  const ano = Number(vencimentoInicial.slice(0, 4));
  const mes = Number(vencimentoInicial.slice(5, 7));
  const dia = Number(vencimentoInicial.slice(8, 10));
  const primeiroDiaDoMesSeguinte = new Date(Date.UTC(ano, mes, 1));
  const ultimoDiaDoMesSeguinte = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  primeiroDiaDoMesSeguinte.setUTCDate(Math.min(dia, ultimoDiaDoMesSeguinte));
  return primeiroDiaDoMesSeguinte.toISOString().slice(0, 10);
}

/**
 * Política pura baseada no ticket Asaas 1835325. Não chama o provedor e não
 * guarda o token: só permite planejar a assinatura depois de conciliar o
 * PAYMENT_CONFIRMED da cobrança avulsa e confirmar que o token está disponível.
 */
export function avaliarFluxoCartaoMensal(dados: {
  orderId: string;
  primeiraCobrancaId: string | null;
  primeiroVencimentoCobranca: string;
  eventoPagamentoConfirmadoId: string | null;
  tokenCartaoDisponivel: boolean;
  assinaturaId: string | null;
  primeiroVencimentoAssinatura: string | null;
}): EtapaCartaoMensal {
  if (!dados.orderId.trim()) throw new Error("Pedido obrigatório.");
  if (!dados.primeiraCobrancaId) return { tipo: "criar_cobranca_avulsa_3ds" };
  if (!dados.eventoPagamentoConfirmadoId) return { tipo: "aguardar_pagamento_confirmado" };
  if (!dados.tokenCartaoDisponivel) return { tipo: "bloqueado_token_ausente" };

  const primeiroVencimento = vencimentoNoMesSeguinte(dados.primeiroVencimentoCobranca);
  if (!dados.assinaturaId) return {
    tipo: "criar_assinatura",
    primeiroVencimento,
    chaveIdempotencia: `${dados.orderId}:assinatura-mensal`,
  };
  if (dados.primeiroVencimentoAssinatura !== primeiroVencimento) return {
    tipo: "revisar_vencimento_assinatura",
    primeiroVencimentoEsperado: primeiroVencimento,
  };
  return { tipo: "concluido" };
}
