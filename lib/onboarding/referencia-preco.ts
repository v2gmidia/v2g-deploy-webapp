export type CertezaDoPreco = "confirmado" | "aproximado" | "nao_confirmado";
export interface ReferenciaDePreco {
  moeda: "BRL"; valor_min?: number; valor_max?: number; unidade: string;
  certeza: CertezaDoPreco; fonte: string; observado_em: string;
}
function dinheiroDeclarado(valor: string): number | null {
  const texto = valor.trim().replace(/^R\$\s*/i, "");
  if (!texto) return null;
  const brasileiro = /^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(texto);
  const normal = brasileiro ? texto.replaceAll(".", "").replace(",", ".") : texto.replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normal)) return NaN;
  const numero = Number(normal);
  return Number.isFinite(numero) && Number.isSafeInteger(Math.round(numero * 100)) ? numero : NaN;
}
export function prepararReferenciaDePreco(entrada: {
  minimo: string; maximo: string; unidade: string; certeza: string;
}, fonte: string, observadoEm: string):
  | { estado: "sem_alteracao" } | { estado: "erro"; erro: string }
  | { estado: "pronto"; referencia: ReferenciaDePreco } {
  if (!entrada.minimo.trim() && !entrada.maximo.trim()) return { estado: "sem_alteracao" };
  const min = dinheiroDeclarado(entrada.minimo), max = dinheiroDeclarado(entrada.maximo);
  if ((min !== null && !Number.isFinite(min)) || (max !== null && !Number.isFinite(max)))
    return { estado: "erro", erro: "Informe o preço em reais com até duas casas decimais, como 69,50." };
  const unidade = entrada.unidade.trim();
  if (!unidade || [...unidade].length > 120) return { estado: "erro", erro: "Informe a unidade desse preço, como fardo, produto ou serviço (até 120 caracteres)." };
  if (!["confirmado", "aproximado", "nao_confirmado"].includes(entrada.certeza))
    return { estado: "erro", erro: "Indique se o preço foi confirmado, é aproximado ou ainda precisa de confirmação." };
  if (min !== null && max !== null && min > max) return { estado: "erro", erro: "O valor inicial não pode ser maior que o final." };
  if ((min === 0 || max === 0) && entrada.certeza !== "confirmado") return { estado: "erro", erro: "Preço zero só pode ser salvo quando estiver confirmado. Para preço desconhecido, deixe os valores vazios." };
  return { estado: "pronto", referencia: { moeda: "BRL", ...(min !== null ? { valor_min: min } : {}),
    ...(max !== null ? { valor_max: max } : {}), unidade, certeza: entrada.certeza as CertezaDoPreco, fonte, observado_em: observadoEm } };
}
export function lerOfertaDoOnboarding(onboarding: unknown): Record<string, unknown> {
  if (!onboarding || typeof onboarding !== "object" || Array.isArray(onboarding)) return {};
  const doc = onboarding as Record<string, unknown>;
  const respostas = doc.respostas && typeof doc.respostas === "object" && !Array.isArray(doc.respostas) ? doc.respostas as Record<string, unknown> : {};
  const oferta = respostas._oferta ?? doc.oferta;
  return oferta && typeof oferta === "object" && !Array.isArray(oferta) ? oferta as Record<string, unknown> : {};
}
export function lerReferenciaDePreco(onboarding: unknown): ReferenciaDePreco | null {
  const bruto = lerOfertaDoOnboarding(onboarding).preco_referencia;
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return null;
  const p = bruto as Record<string, unknown>;
  const preparado = prepararReferenciaDePreco({ minimo: typeof p.valor_min === "number" ? String(p.valor_min) : "",
    maximo: typeof p.valor_max === "number" ? String(p.valor_max) : "", unidade: typeof p.unidade === "string" ? p.unidade : "",
    certeza: typeof p.certeza === "string" ? p.certeza : "" },
    typeof p.fonte === "string" ? p.fonte : "Fonte não registrada", typeof p.observado_em === "string" ? p.observado_em : "");
  return preparado.estado === "pronto" ? preparado.referencia : null;
}
