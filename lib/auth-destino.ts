/** Mantém o retorno do login dentro do WebApp, inclusive com query e âncora. */
export function destinoLocalSeguro(valor: unknown, padrao = "/inicio"): string {
  if (typeof valor !== "string" || !valor.startsWith("/") || valor.startsWith("//")
      || valor.includes("\\") || /[\u0000-\u001f\u007f]/.test(valor)) return padrao;
  try {
    const base = "https://v2g.invalid";
    const destino = new URL(valor, base);
    if (destino.origin !== base || destino.pathname === "/entrar") return padrao;
    return destino.pathname + destino.search + destino.hash;
  } catch {
    return padrao;
  }
}
