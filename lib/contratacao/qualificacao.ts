import { valorDoPedidoCentavos, type PeriodoDeCobranca } from "./preco.ts";
import { lerDocumentoContratante, type TipoDocumentoContratante } from "./documento-contratante.ts";
export { cnpjTemDigitosValidos } from "./documento-contratante.ts";

export type DadosDaCompra = {
  referencia: string;
  nome: string;
  email: string;
  whatsapp: string;
  razaoSocial: string;
  cnpj: string;
  documentoTipo: TipoDocumentoContratante;
  contas: number;
  periodo: PeriodoDeCobranca;
  metodo: "asaas_pix" | "asaas_card";
  totalCentavos: number;
};

/** Valida CPF/CNPJ do contratante; o campo técnico cnpj permanece por compatibilidade. */
export function validarCompra(form: FormData): { dados?: DadosDaCompra; erro?: string } {
  const referencia = String(form.get("referencia") ?? "").trim();
  const nome = String(form.get("nome") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const whatsapp = String(form.get("whatsapp") ?? "").replace(/\D/g, "");
  const razaoSocial = String(form.get("razaoSocial") ?? "").trim();
  const documento = lerDocumentoContratante(form.get("cnpj"));
  const contas = Number(form.get("contas"));
  const periodo = String(form.get("periodo") ?? "");
  const metodo = String(form.get("metodo") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(referencia)) return { erro: "Atualize a página e tente novamente." };
  if (nome.length > 120 || !/^\S+\s+\S+/.test(nome) || razaoSocial.length < 2 || razaoSocial.length > 200)
    return { erro: "Informe seu nome completo e o nome ou razão social do contratante." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return { erro: "Informe um e-mail válido." };
  if (whatsapp.length < 10 || whatsapp.length > 13)
    return { erro: "Informe o WhatsApp com DDD." };
  if (!documento) return { erro: "Confira os 11 dígitos do CPF ou os 14 dígitos do CNPJ do contratante." };
  if (form.get("vendeWhatsApp") !== "sim")
    return { erro: "Nesta fase, a contratação exige venda por conversa no WhatsApp." };
  if (!Number.isInteger(contas) || contas < 1 || contas > 100)
    return { erro: "Informe entre 1 e 100 contas de anúncios." };
  if (periodo !== "monthly" && periodo !== "semiannual_upfront" && periodo !== "annual_upfront")
    return { erro: "Escolha o período de cobrança." };
  if (metodo !== "asaas_pix" && metodo !== "asaas_card")
    return { erro: "Escolha Pix ou cartão." };
  if (periodo === "monthly" && metodo !== "asaas_card")
    return { erro: "A cobrança mensal automática está disponível apenas no cartão neste checkout." };
  return { dados: { referencia, nome, email, whatsapp, razaoSocial, cnpj: documento.numero, documentoTipo: documento.tipo, contas,
    periodo, metodo, totalCentavos: valorDoPedidoCentavos(contas, periodo) } };
}
