import "server-only";

const BASE = "https://api-sandbox.asaas.com/v3";

export async function asaasSandbox(
  caminho: string, options: { method?: "GET" | "POST"; body?: unknown; timeoutMs?: number } = {},
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const chave = process.env.ASAAS_API_KEY;
  if (!chave || !caminho.startsWith("/") || caminho.startsWith("//"))
    return { ok: false, status: 0, body: null };
  try {
    const resposta = await fetch(`${BASE}${caminho}`, {
      method: options.method ?? "GET",
      headers: { "Content-Type": "application/json", "User-Agent": "V2G-WebApp-Sandbox/1.0",
        access_token: chave },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      cache: "no-store", signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
    });
    // O corpo pode conter dados pessoais. Nunca registrar ou devolver erros crus.
    const body: unknown = resposta.ok ? await resposta.json() : null;
    return { ok: resposta.ok, status: resposta.status, body };
  } catch {
    return { ok: false, status: 0, body: null };
  }
}

export function idAsaas(valor: unknown, prefixo: "cus" | "pay" | "sub"): string | null {
  return typeof valor === "string" && new RegExp(`^${prefixo}_[A-Za-z0-9]+$`).test(valor)
    ? valor : null;
}
