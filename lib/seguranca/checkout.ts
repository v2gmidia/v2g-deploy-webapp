import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { isIP } from "node:net";

type Cabecalhos = { get(nome: string): string | null };

export function segurancaCheckoutAtiva(): boolean {
  return process.env.V2G_CHECKOUT_SECURITY_ENABLED === "true";
}

/**
 * A Vercel sobrescreve x-forwarded-for para impedir spoofing. Quando a
 * proteção está ativa, não aceitamos cabeçalhos de origem fora desse proxy.
 */
export function ipConfiavelDaVercel(cabecalhos: Cabecalhos): string | null {
  if (process.env.VERCEL !== "1" || !cabecalhos.get("x-vercel-id")) return null;
  const bruto = cabecalhos.get("x-vercel-forwarded-for") ?? cabecalhos.get("x-forwarded-for") ?? "";
  const candidato = bruto.split(",")[0]?.trim() ?? "";
  return isIP(candidato) && candidato !== "127.0.0.1" && candidato !== "::1" ? candidato : null;
}

export function hashDeSeguranca(valor: string): string | null {
  const segredo = process.env.V2G_CHECKOUT_SECURITY_HASH_SECRET;
  if (!segredo || segredo.length < 32 || !valor) return null;
  return createHmac("sha256", segredo).update(valor).digest("hex");
}

type RespostaTurnstile = {
  success?: boolean;
  hostname?: string;
  action?: string;
};

export async function verificarTurnstile(token: string, ip: string): Promise<boolean> {
  const segredo = process.env.TURNSTILE_SECRET_KEY;
  const hosts = (process.env.V2G_TURNSTILE_ALLOWED_HOSTNAMES ?? "")
    .split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (!segredo || hosts.length === 0 || !token || token.length > 2048) return false;
  try {
    const resposta = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: segredo, response: token, remoteip: ip,
        idempotency_key: randomUUID() }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!resposta.ok) return false;
    const corpo = await resposta.json() as RespostaTurnstile;
    return corpo.success === true && corpo.action === "checkout"
      && typeof corpo.hostname === "string" && hosts.includes(corpo.hostname.toLowerCase());
  } catch {
    return false;
  }
}

