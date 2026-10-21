/** Portão puro. Não cria envelope, e-mail, contrato assinado ou cobrança. */
export type DadosParaAssinatura = {
  orderId: string;
  businessId: string;
  paymentStatus: string;
  buyerEmailVerified: boolean;
  templateVersion: string;
  approvedTemplateVersion: string | null;
  pdfSha256: string;
  approvedPdfSha256: string | null;
  providerConfigured: boolean;
  signerName: string;
  signerEmail: string;
  signerCapacity: string;
  signerPowersVerified: boolean;
};

export type ResultadoPreparoAssinatura =
  | { pronto: false; pendencias: string[] }
  | { pronto: true; chaveIdempotencia: string };

export function prepararAssinatura(dados: DadosParaAssinatura): ResultadoPreparoAssinatura {
  const pendencias: string[] = [];
  if (!dados.orderId.trim() || !dados.businessId.trim()) pendencias.push("pedido_negocio");
  if (dados.paymentStatus !== "payment_approved") pendencias.push("pagamento");
  if (!dados.buyerEmailVerified) pendencias.push("email_comprador");
  if (!dados.templateVersion.trim()
    || /^(?:minuta-interna|teste-interno|contrato-v2g-teste)(?:-|$)/i.test(dados.templateVersion.trim())
    || dados.templateVersion !== dados.approvedTemplateVersion) pendencias.push("minuta_aprovada");
  if (!/^[0-9a-f]{64}$/i.test(dados.pdfSha256)
    || !dados.approvedPdfSha256
    || dados.pdfSha256.toLowerCase() !== dados.approvedPdfSha256.toLowerCase())
    pendencias.push("pdf_aprovado");
  if (!dados.providerConfigured) pendencias.push("provedor");
  if (!dados.signerName.trim()
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.signerEmail.trim())
    || !dados.signerCapacity.trim()) pendencias.push("signatario");
  if (!dados.signerPowersVerified) pendencias.push("poderes_representacao");
  if (pendencias.length) return { pronto: false, pendencias };
  return {
    pronto: true,
    chaveIdempotencia: `${dados.orderId}:${dados.templateVersion}`,
  };
}
