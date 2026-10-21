import { valorDoPedidoCentavos } from "./preco.ts";
import { cnpjTemDigitosValidos } from "./qualificacao.ts";

type DadosPedidoAssistido = {
  ref: string; email: string; legalName: string; cnpj: string;
  unitCount: number; billingPeriod: "monthly" | "semiannual_upfront" | "annual_upfront";
  lead: { id: number; whatsapp: string } | null;
};

/** Origem explícita: nunca descarta um ID informado para contornar o vínculo. */
export function validarPedidoAssistido(form: FormData, vinculoLeadAtivo: boolean, asaas = false):
  { dados: DadosPedidoAssistido; erro?: never } | { erro: string; dados?: never } {
  const ref = String(form.get("ref") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const legalName = String(form.get("legalName") ?? "").trim();
  const cnpj = String(form.get("cnpj") ?? "").replace(/\D/g, "");
  const unitCount = Number(form.get("unitCount"));
  const billingPeriod = String(form.get("billingPeriod") ?? "");
  if (form.get("declaresCnpj") !== "yes" || form.get("sellsByWhatsApp") !== "yes")
    return { erro: "Confirme as declarações de CNPJ e venda por WhatsApp antes de registrar." };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254
      || legalName.length < 2 || legalName.length > 200 || !cnpjTemDigitosValidos(cnpj))
    return { erro: "Confira e-mail, razão social e os dígitos do CNPJ." };
  if (billingPeriod !== "monthly" && billingPeriod !== "annual_upfront" && !(asaas && billingPeriod === "semiannual_upfront"))
    return { erro: "Escolha o período disponível para o Pix assistido." };
  if (!Number.isSafeInteger(unitCount) || unitCount < 1 || unitCount > 100)
    return { erro: "Informe entre 1 e 100 contas de anúncio." };
  try { valorDoPedidoCentavos(unitCount, billingPeriod); }
  catch { return { erro: "Informe uma quantidade válida de contas de anúncio." }; }

  const origem = String(form.get("vinculoLead") ?? "");
  const idInformado = String(form.get("sourceLeadId") ?? "").trim();
  const whatsapp = String(form.get("whatsapp") ?? "").replace(/\D/g, "");
  let lead: DadosPedidoAssistido["lead"] = null;
  if (origem === "v2g_site") {
    const id = Number(idInformado);
    if (!vinculoLeadAtivo) return { erro: "O vínculo com a LP está indisponível. Não registre a mesma venda sem o lead." };
    if (!/^[1-9][0-9]*$/.test(idInformado) || !Number.isSafeInteger(id)
        || !/^[1-9][0-9]{9,10}$/.test(whatsapp))
      return { erro: "Informe o ID e o WhatsApp exatos do pré-cadastro da LP." };
    lead = { id, whatsapp };
  } else {
    if ((vinculoLeadAtivo && origem !== "atendimento_direto")
        || (!vinculoLeadAtivo && origem !== "" && origem !== "atendimento_direto"))
      return { erro: "Informe se a venda veio da LP ou de atendimento direto sem pré-cadastro." };
    if (idInformado || (!asaas && whatsapp))
      return { erro: "Há dados de pré-cadastro informados. Selecione a origem LP para preservar o vínculo." };
  }
  return { dados: { ref, email, legalName, cnpj, unitCount, billingPeriod: billingPeriod as DadosPedidoAssistido["billingPeriod"], lead } };
}

export function validarPedidoAsaasAssistido(form: FormData, vinculoLeadAtivo: boolean) {
  const base = validarPedidoAssistido(form, vinculoLeadAtivo, true);
  if (!base.dados) return { erro: base.erro };
  const buyerName = String(form.get("buyerName") ?? "").trim();
  const whatsapp = String(form.get("whatsapp") ?? "").replace(/\D/g, "");
  const paymentMethod = String(form.get("paymentMethod") ?? "");
  if (buyerName.length < 3 || buyerName.length > 120 || !/\S+\s+\S+/.test(buyerName)
      || !/^[1-9][0-9]{9,10}$/.test(whatsapp))
    return { erro: "Informe nome completo e WhatsApp do comprador." };
  if ((paymentMethod !== "asaas_pix" && paymentMethod !== "asaas_card")
      || (base.dados.billingPeriod === "monthly" && paymentMethod !== "asaas_card"))
    return { erro: "Escolha cartão para o mensal, ou Pix/cartão para o plano à vista." };
  return { dados: { ...base.dados, buyerName, whatsapp, paymentMethod } };
}

/** A declaração é humana, não uma consulta bancária automática. */
export function validarConferenciaPix(form: FormData): string | null {
  return form.get("pagamentoConferido") === "yes" ? null
    : "Confira o crédito na conta recebedora, valor, identificação e pedido antes de aprovar.";
}
