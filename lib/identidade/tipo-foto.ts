/** O tipo declarado pelo cliente. Não é uma classificação inferida da imagem. */
export type TipoFotoDoNegocio = "fachada" | "ambiente" | "produto";

export function tipoFotoValido(valor: unknown): TipoFotoDoNegocio | null {
  return valor === "fachada" || valor === "ambiente" || valor === "produto"
    ? valor
    : null;
}

/** Fotos anteriores ao campo novo continuam sem tipo, nunca viram fachada por suposição. */
export function tipoFotoRegistrado(copy: unknown): TipoFotoDoNegocio | null {
  if (!copy || typeof copy !== "object" || Array.isArray(copy)) return null;
  const identidade = (copy as Record<string, unknown>).identidade;
  if (!identidade || typeof identidade !== "object" || Array.isArray(identidade)) return null;
  return tipoFotoValido((identidade as Record<string, unknown>).tipoFoto);
}
