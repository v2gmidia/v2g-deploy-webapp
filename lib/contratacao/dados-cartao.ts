import { lerDocumentoContratante } from "./documento-contratante.ts";

export type DadosCartao = {
  holderName: string;
  holderDocument: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
  postalCode: string;
  addressNumber: string;
};

export function validarDadosCartao(form: FormData): { dados?: DadosCartao; erro?: string } {
  const somenteDigitos = (campo: string) => String(form.get(campo) ?? "").replace(/\D/g, "");
  const holderName = String(form.get("holderName") ?? "").trim();
  const documentoTitular = lerDocumentoContratante(form.get("holderDocument"));
  const cardNumber = somenteDigitos("cardNumber");
  const expiryMonth = somenteDigitos("expiryMonth");
  const expiryYear = somenteDigitos("expiryYear");
  const ccv = somenteDigitos("ccv");
  const postalCode = somenteDigitos("postalCode");
  const addressNumber = String(form.get("addressNumber") ?? "").trim();
  if (!/^\S+\s+\S+/.test(holderName) || holderName.length > 120)
    return { erro: "Informe o nome completo do titular do cartão." };
  if (!documentoTitular)
    return { erro: "Confira o CPF ou CNPJ do titular do cartão." };
  if (!/^\d{13,19}$/.test(cardNumber) || !/^\d{3,4}$/.test(ccv))
    return { erro: "Confira o número e o código de segurança do cartão." };
  const mes = Number(expiryMonth);
  const ano = Number(expiryYear);
  if (mes < 1 || mes > 12 || !/^\d{4}$/.test(expiryYear)
      || ano < new Date().getFullYear() || ano > new Date().getFullYear() + 25)
    return { erro: "Confira a validade do cartão." };
  if (!/^\d{8}$/.test(postalCode) || addressNumber.length < 1 || addressNumber.length > 20)
    return { erro: "Informe o CEP e o número do endereço de cobrança." };
  return { dados: { holderName, holderDocument: documentoTitular.numero, cardNumber,
    expiryMonth: String(mes).padStart(2, "0"), expiryYear, ccv, postalCode, addressNumber } };
}
