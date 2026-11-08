import type { NextRequest } from "next/server";
import { processarWebhookPagamento } from "@/lib/contratacao/webhook-pagamento";

export const runtime = "nodejs";
export const maxDuration = 120;
/** Endpoint legado permanece exclusivo do Sandbox. */
export async function POST(req: NextRequest) {
  return processarWebhookPagamento(req, "sandbox");
}
