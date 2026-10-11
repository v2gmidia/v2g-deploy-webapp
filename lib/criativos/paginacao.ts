export const TAMANHO_PAGINA_CRIATIVOS = 100;
export const MAX_PAGINA_CRIATIVOS = 1000;

/** Entrada externa é limitada para não produzir range inválido ou desproporcional. */
export function paginaDeCriativos(valor: unknown): { numero: number; invalida: boolean } {
  if (valor === undefined) return { numero: 1, invalida: false };
  if (typeof valor !== "string" || !/^[1-9][0-9]{0,3}$/.test(valor)) return { numero: 1, invalida: true };
  const numero = Number(valor);
  return numero <= MAX_PAGINA_CRIATIVOS ? { numero, invalida: false } : { numero: 1, invalida: true };
}

export function ultimaPaginaCriativos(total: number, tamanho = TAMANHO_PAGINA_CRIATIVOS): number {
  return Math.max(1, Math.ceil(total / tamanho));
}

export function faixaDeCriativos(pagina: number, tamanho = TAMANHO_PAGINA_CRIATIVOS): { inicio: number; fim: number } {
  const inicio = (pagina - 1) * tamanho;
  return { inicio, fim: inicio + tamanho - 1 };
}

export function destinoPaginaCriativos(negocioId: string | null, pagina: number): string {
  const params = new URLSearchParams();
  if (negocioId) params.set("negocio", negocioId);
  params.set("pagina", String(pagina));
  return `/gestor/criativos?${params.toString()}`;
}
