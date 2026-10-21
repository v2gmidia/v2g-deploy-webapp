/** Confere o escopo dos arquivos antes de criar links privados com service_role. */
export function caminhosDaMarcaNoNegocio(
  businessId: string,
  arquivos: { storage_path: string | null }[],
): { ok: true; caminhos: string[] } | { ok: false } {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(businessId))
    return { ok: false };
  const prefixo = `identidade/${businessId}/`;
  const caminhos: string[] = [];
  for (const arquivo of arquivos) {
    const caminho = arquivo.storage_path;
    if (typeof caminho !== "string" || !caminho.startsWith(prefixo)) return { ok: false };
    const nome = caminho.slice(prefixo.length);
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(nome) || nome === "." || nome === "..")
      return { ok: false };
    caminhos.push(caminho);
  }
  return { ok: true, caminhos };
}
