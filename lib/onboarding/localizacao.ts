/** Validação compartilhada entre a pergunta de praça e a gravação no servidor. */
export function cidadeDeclaradaValida(valor: string): boolean {
  const cidade = valor.trim().replace(/\s+/g, " ");
  return cidade.length >= 2 && cidade.length <= 80 &&
    /^[\p{L}\p{M}][\p{L}\p{M} .'’-]*$/u.test(cidade);
}

export function formatarCep(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 8);
  return numeros.length > 5 ? `${numeros.slice(0, 5)}-${numeros.slice(5)}` : numeros;
}
