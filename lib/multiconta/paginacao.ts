/** Lê todas as páginas necessárias; um erro em qualquer página invalida o conjunto. */
export async function lerTodasPaginas<T>(
  buscar: (inicio: number, fim: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[] | null> {
  const pagina = 1000;
  const maximoDePaginas = 50;
  const linhas: T[] = [];
  for (let numero = 0; numero < maximoDePaginas; numero++) {
    const inicio = numero * pagina;
    const resultado = await buscar(inicio, inicio + pagina - 1);
    if (resultado.error || !resultado.data) return null;
    linhas.push(...resultado.data);
    if (resultado.data.length < pagina) return linhas;
  }
  // Nunca tratar um recorte máximo como conjunto completo para autorização.
  return null;
}
