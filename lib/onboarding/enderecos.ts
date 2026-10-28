/** Formatos compartilhados pelas perguntas e pela etapa da marca. */
export function validarInstagram(bruto: string): string | null {
  const texto = bruto.trim();
  const daUrl = texto.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{1,30})\/?(?:[?#].*)?$/i);
  if (/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i.test(texto) && !daUrl) return null;
  const usuario = (daUrl ? daUrl[1]! : texto).replace(/^@/, "");
  return /^[a-zA-Z0-9._]{1,30}$/.test(usuario) ? `@${usuario.toLowerCase()}` : null;
}

export function validarSite(bruto: string): string | null {
  try {
    const texto = bruto.trim();
    if (/\s/.test(texto)) return null;
    const url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i.test(url.hostname)) return null;
    return url.toString().replace(/\/$/, "");
  } catch { return null; }
}
