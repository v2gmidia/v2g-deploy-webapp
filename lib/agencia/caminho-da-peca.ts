import { UUID_AGENCIA } from "./contexto.ts";

/** Imagem legada só é assinada quando o namespace privado comprova o titular. */
export function caminhoDaPecaPertenceAoCliente(businessId: string, caminho: unknown): caminho is string {
  if (!UUID_AGENCIA.test(businessId) || typeof caminho !== "string" || !caminho.startsWith(`${businessId}/`)) return false;
  const partes = caminho.split("/");
  return partes.length >= 2 && partes.every(p => p !== "." && p !== ".." && /^[a-zA-Z0-9._-]+$/.test(p));
}
