/** Campos do dispositivo são contexto de risco, nunca prova de pagamento. */
export function lerDispositivo3ds(bruto: string, remoteIp: string, userAgent: string) {
  if (bruto.length > 2000 || !userAgent || userAgent.length > 1000) return null;
  let dados: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(bruto);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    dados = parsed as Record<string, unknown>;
  } catch { return null; }
  const { colorDepth, screenHeight, screenWidth, timeZoneOffset, language } = dados;
  if (typeof colorDepth !== "number" || ![1, 4, 8, 15, 16, 24, 30, 32, 48].includes(colorDepth)
      || typeof screenHeight !== "number" || !Number.isInteger(screenHeight) || screenHeight < 1 || screenHeight > 16384
      || typeof screenWidth !== "number" || !Number.isInteger(screenWidth) || screenWidth < 1 || screenWidth > 16384
      || typeof timeZoneOffset !== "number" || !Number.isFinite(timeZoneOffset) || Math.abs(timeZoneOffset) > 14
      || typeof language !== "string" || !/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(language) || language.length > 35)
    return null;
  // remoteIp e userAgent sempre vêm do servidor, não de campos editáveis.
  return { colorDepth, screenHeight, screenWidth, timeZoneOffset, language, remoteIp, userAgent };
}

/** Somente uma URL devolvida pela API autenticada do Asaas pode chegar aqui.
 * O emissor pode ter domínio próprio; não aceitamos URL fornecida pelo formulário.
 */
export function urlDesafio3ds(valor: unknown): string | null {
  if (typeof valor !== "string" || valor.length > 4096 || /[\s\\]/.test(valor)) return null;
  try {
    const url = new URL(valor);
    if (url.protocol !== "https:" || url.username || url.password || url.port
        || !/^[a-z0-9.-]+$/i.test(url.hostname) || !url.hostname.includes(".")
        || /^(?:\d+\.){3}\d+$/.test(url.hostname)
        || /(?:^|\.)(?:localhost|local|internal|invalid|test)$/.test(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}

export function callback3dsQa(referencia: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(referencia)) throw new Error("Referência inválida.");
  return `https://v2g-webapp-qa.vercel.app/contratar/pagamento?ref=${referencia}`;
}
