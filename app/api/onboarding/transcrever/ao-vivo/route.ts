import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";

const semCache = { "Cache-Control": "no-store" };

function recado(motivo: string, status: number) {
  return NextResponse.json({ motivo }, { status, headers: semCache });
}

export async function POST() {
  if (process.env.V2G_VOICE_TRANSCRIPTION_ENABLED === "false" || !process.env.OPENAI_API_KEY)
    return recado("A resposta por voz ainda não está disponível aqui. Você pode escrever normalmente.", 501);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return recado("Sua sessão terminou. Entre novamente para continuar.", 401);
  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado") return recado("Escolha um negócio antes de continuar.", 403);

  try {
    const resposta = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Safety-Identifier": createHash("sha256").update(user.id).digest("hex"),
      },
      body: JSON.stringify({
        expires_after: { anchor: "created_at", seconds: 60 },
        session: {
          type: "transcription",
          audio: { input: {
            format: { type: "audio/pcm", rate: 24000 },
            transcription: { model: "gpt-live-transcribe", language: "pt" },
            turn_detection: null,
          } },
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!resposta.ok) {
      console.error("[onboarding:transcricao-ao-vivo] provedor recusou", resposta.status);
      return recado("Não consegui iniciar a transcrição ao vivo. Tente novamente ou escreva a resposta.", 502);
    }
    const payload = await resposta.json() as { value?: unknown; expires_at?: unknown };
    if (typeof payload.value !== "string" || !payload.value) return recado("Não consegui iniciar a transcrição ao vivo.", 502);
    return NextResponse.json({ token: payload.value,
      expiresAt: typeof payload.expires_at === "number" ? payload.expires_at * 1000 : Date.now() + 45_000 }, { headers: semCache });
  } catch {
    return recado("A conexão para transcrição ao vivo falhou. Tente novamente ou escreva.", 503);
  }
}
