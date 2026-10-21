export type PagamentoParaEmail = {
  orderId: string; email: string; negocio: string; statusPedido: string;
  chargeId: string; customerId: string; subscriptionId: string | null;
  totalCentavos: number; primeiraCompra: boolean;
};

/** Somente fatos conciliados do pedido e da consulta canonica ao Asaas. */
export function prepararEmailPagamento(pedido: PagamentoParaEmail, pagamento: {
  id: string; customer: string; subscription?: string | null;
  status: string; value: number; deleted?: boolean;
}, siteUrl: string) {
  if (pedido.statusPedido !== "payment_approved" || !pedido.orderId
      || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(pedido.email) || pedido.email.length > 254
      || !/^pay_[A-Za-z0-9]+$/.test(pedido.chargeId)
      || pedido.chargeId !== pagamento.id || pedido.customerId !== pagamento.customer
      || pedido.subscriptionId !== (pagamento.subscription ?? null)
      || !["CONFIRMED", "RECEIVED"].includes(pagamento.status) || pagamento.deleted
      || !Number.isSafeInteger(pedido.totalCentavos) || pedido.totalCentavos < 1
      || !Number.isFinite(pagamento.value)
      || Math.abs(pagamento.value * 100 - pedido.totalCentavos) > 0.00001) return null;
  let site: URL;
  try { site = new URL(siteUrl); } catch { return null; }
  // Nao aceitar URLs/contatos fornecidos no webhook ou no formulario.
  if (site.protocol !== "https:" || !["v2g-deploy-webapp.vercel.app", "v2g-webapp-qa.vercel.app"].includes(site.hostname)
      || site.username || site.password || site.port || site.pathname !== "/" || site.search || site.hash) return null;
  const valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.totalCentavos / 100);
  return { to: [pedido.email], subject: "V2G | Pagamento confirmado",
    text: [`O Asaas confirmou seu pagamento de ${valor}.`, `Negócio: ${pedido.negocio}`,
      `Pedido: ${pedido.orderId}`, `Cobrança: ${pedido.chargeId}`, "",
      pedido.primeiraCompra
        ? `Para entrar ou criar seu primeiro acesso, use o e-mail desta compra em ${site.origin}/entrar . Confirme seu próprio e-mail quando solicitado.`
        : `Este pagamento corresponde a outro ciclo da sua contratação. Acesse sua conta em ${site.origin}/entrar .`,
      "Pagamento, confirmação de cadastro e assinatura contratual são etapas distintas.",
      "Esta é uma confirmação de pagamento, não uma nota fiscal de serviço.",
      "Atendimento: https://wa.me/5521980351531", "V2G",
    ].join("\n") };
}

export type EmailNaFila = { id: string; status: string; payload: { from: string; to: string[]; subject: string; text: string } };
export type DependenciasEnvio = {
  reservar(): Promise<boolean>;
  enviar(payload: EmailNaFila["payload"], chave: string): Promise<string | null>;
  registrar(status: "accepted" | "review", providerId: string | null): Promise<boolean>;
};

/** Uma reserva atomica por mensagem. Timeout fica para conciliacao, nunca libera novo envio. */
export async function despacharEmailPagamento(item: EmailNaFila, deps: DependenciasEnvio) {
  if (item.status === "accepted") return "accepted";
  if (item.status !== "queued") return "review";
  try {
    if (!await deps.reservar()) return "reserved_elsewhere";
    let id: string | null;
    try { id = await deps.enviar(item.payload, `payment-confirmation/${item.id}`); }
    catch { id = null; }
    if (!id) { await deps.registrar("review", null); return "review"; }
    return await deps.registrar("accepted", id) ? "accepted" : "review";
  } catch { return "review"; }
}
