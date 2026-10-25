export type TipoDocumentoContratante = "cpf" | "cnpj";
export type DocumentoContratante = { numero: string; tipo: TipoDocumentoContratante };

/** Retira apenas máscara/espaços; letras e outros caracteres não viram documento válido. */
export function normalizarDocumentoContratante(valor: unknown): string {
  if (typeof valor !== "string" || !/^[\d.\-/\s]+$/.test(valor)) return "";
  return valor.replace(/[.\-/\s]/g, "");
}
export function cpfTemDigitosValidos(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const tamanho of [9, 10]) {
    const soma = [...cpf.slice(0, tamanho)].reduce((total, d, i) => total + Number(d) * (tamanho + 1 - i), 0);
    const resto = (soma * 10) % 11;
    if (Number(cpf[tamanho]) !== (resto === 10 ? 0 : resto)) return false;
  }
  return true;
}
export function cnpjTemDigitosValidos(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digitos = [...cnpj].map(Number);
  for (const tamanho of [12, 13]) {
    const pesos = tamanho === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    const resto = digitos.slice(0, tamanho).reduce((soma, d, i) => soma + d * pesos[i]!, 0) % 11;
    if (digitos[tamanho] !== (resto < 2 ? 0 : 11 - resto)) return false;
  }
  return true;
}
/** Só dígitos verificadores. Não consulta Receita nem comprova titularidade/situação cadastral. */
export function lerDocumentoContratante(valor: unknown): DocumentoContratante | null {
  const numero = normalizarDocumentoContratante(valor);
  if (cpfTemDigitosValidos(numero)) return { numero, tipo: "cpf" };
  if (cnpjTemDigitosValidos(numero)) return { numero, tipo: "cnpj" };
  return null;
}
/** Formata inclusive o legado sem certificar validade ou situação cadastral. */
export function formatarDocumentoContratante(valor: unknown): string | null {
  const n = normalizarDocumentoContratante(valor);
  if (n.length === 11) return n.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (n.length === 14) return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return null;
}
export function identificarDocumentoContratante(valor: unknown): string {
  const n = normalizarDocumentoContratante(valor);
  const formato = formatarDocumentoContratante(n);
  return formato ? `${n.length === 11 ? "CPF" : "CNPJ"} ${formato}` : "Documento não informado";
}
