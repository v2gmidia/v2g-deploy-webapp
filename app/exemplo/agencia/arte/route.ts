import { tipoRealDaImagem, TAMANHO_MAXIMO_REVISAO } from "@/lib/criativos/revisao";

export async function GET() {
  if (process.env.NODE_ENV === "production" || !process.env.V2G_AGENCY_FIXTURE_ART) return new Response(null, { status: 404 });
  try {
    const { readFile } = await import("node:fs/promises");
    const bytes = await readFile(process.env.V2G_AGENCY_FIXTURE_ART);
    const tipo = tipoRealDaImagem(bytes);
    if (!tipo || bytes.length > TAMANHO_MAXIMO_REVISAO) return new Response(null, { status: 404 });
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": tipo, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}
