import "server-only";
import { cartaoRecusadoSemCobranca } from "./retentativa-cartao";

const BASE = "https://api-sandbox.asaas.com/v3";

export async function asaasSandbox(
  caminho: string, options: { method?: "GET" | "POST"; body?: unknown; timeoutMs?: number } = {},
): Promise<{ ok: boolean; status: number; body: unknown; cardDeclined: boolean }> {
  const chave = process.env.ASAAS_API_KEY;
  if (!chave || !caminho.startsWith("/") || caminho.startsWith("//"))
    return { ok: false, status: 0, body: null, cardDeclined: false };
  try {
    const resposta = await fetch(`${BASE}${caminho}`, {
      method: options.method ?? "GET",
      headers: { "Content-Type": "application/json", "User-Agent": "V2G-WebApp-Sandbox/1.0",
        access_token: chave },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
      cache: "no-store", signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
    });
    // O corpo pode conter dados pessoais. Nunca registrar ou devolver erros crus.
    const recebido: unknown = resposta.ok || resposta.status === 400 ? await resposta.json() : null;
    const body: unknown = resposta.ok ? recebido : null;
    const erros = !resposta.ok && recebido && typeof recebido === "object" && "errors" in recebido
      ? recebido.errors : null;
    const primeiro = Array.isArray(erros) && erros[0] && typeof erros[0] === "object" ? erros[0] : null;
    const errorCode = primeiro && typeof primeiro.code === "string" ? primeiro.code : null;
    const errorDescription = primeiro && typeof primeiro.description === "string"
      ? primeiro.description : null;
    return { ok: resposta.ok, status: resposta.status, body,
      cardDeclined: cartaoRecusadoSemCobranca(resposta.status, errorCode, errorDescription) };
  } catch {
    return { ok: false, status: 0, body: null, cardDeclined: false };
  }
}

export function idAsaas(valor: unknown, prefixo: "cus" | "pay" | "sub"): string | null {
  return typeof valor === "string" && new RegExp(`^${prefixo}_[A-Za-z0-9]+$`).test(valor)
    ? valor : null;
}
