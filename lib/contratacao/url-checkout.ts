/** Retomada de pedidos antigos sem aceitar um destino externo arbitrário. */
export function urlCheckoutHospedadoSandbox(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  try {
    const url = new URL(valor);
    return url.protocol === "https:" && url.hostname === "sandbox.asaas.com"
      ? url.toString() : null;
  } catch { return null; }
}
