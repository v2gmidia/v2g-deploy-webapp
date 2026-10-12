/** Formatos compartilhados pelas perguntas e pela etapa da marca. */
export function validarInstagram(bruto: string): string | null {
  const texto = bruto.trim().replace(/\s/g, "");
  const daUrl = texto.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#]+)/i);
  const usuario = (daUrl ? daUrl[1]! : texto).replace(/^@/, "").replace(/\/+$/, "");
  return /^[a-zA-Z0-9._]{1,30}$/.test(usuario) ? `@${usuario.toLowerCase()}` : null;
}

export function validarSite(bruto: string): string | null {
  try {
    const url = new URL(/^https?:\/\//i.test(bruto) ? bruto : `https://${bruto}`);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(url.hostname)) return null;
    return url.toString().replace(/\/$/, "");
  } catch { return null; }
}
