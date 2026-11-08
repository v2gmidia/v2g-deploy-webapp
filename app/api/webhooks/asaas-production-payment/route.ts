import type { NextRequest } from "next/server";
import { processarWebhookPagamento } from "@/lib/contratacao/webhook-pagamento";

export const runtime = "nodejs";
export const maxDuration = 120;
/** Ambiente escolhido pelo endpoint e configuração, nunca pelo payload. */
export async function POST(req: NextRequest) {
  return processarWebhookPagamento(req, "production");
}
