import { lerImagemGerada } from "@/lib/criativos/geracao/imagem-privada";

export async function GET(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const negocio = new URL(request.url).searchParams.get("negocio") ?? "";
  const bytes = await lerImagemGerada(requestId, negocio);
  const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", Vary: "Cookie" };
  if (!bytes) return new Response(null, { status: 404, headers });
  return new Response(new Uint8Array(bytes).buffer, { headers: { ...headers, "Content-Type": "image/png" } });
}
