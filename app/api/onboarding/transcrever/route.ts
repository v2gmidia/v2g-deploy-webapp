import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";

const MAX_AUDIO = 3 * 1024 * 1024;
const MIME = new Set(["audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/mpeg"]);
const semCache = { "Cache-Control": "no-store" };

function recado(motivo: string, status: number) {
  return NextResponse.json({ motivo }, { status, headers: semCache });
}

export async function POST(request: Request) {
  if (process.env.V2G_VOICE_TRANSCRIPTION_ENABLED !== "true" || !process.env.OPENAI_API_KEY)
    return recado("A resposta por voz ainda não está disponível aqui. Você pode escrever normalmente.", 501);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return recado("Sua sessão terminou. Entre novamente para continuar.", 401);
  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado") return recado("Escolha um negócio antes de continuar.", 403);

  const declarado = Number(request.headers.get("content-length") ?? 0);
  if (declarado > MAX_AUDIO + 64 * 1024)
    return recado("O áudio ficou longo. Grave um trecho mais curto.", 413);
  const dados = await request.formData().catch(() => null);
  const audio = dados?.get("audio");
  if (!(audio instanceof File) || audio.size === 0)
    return recado("Não chegou áudio. Tente gravar novamente.", 400);
  if (audio.size > MAX_AUDIO)
    return recado("O áudio ficou longo. Grave um trecho mais curto.", 413);
  const tipo = audio.type.split(";")[0]?.toLowerCase();
  if (!tipo || !MIME.has(tipo)) return recado("Esse formato de áudio não é aceito.", 415);

  const corpo = new FormData();
  corpo.set("file", audio, audio.name);
  corpo.set("model", "gpt-4o-mini-transcribe");
  corpo.set("language", "pt");
  try {
    const resposta = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: corpo,
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    if (!resposta.ok) {
      console.error("[onboarding:transcricao] provedor recusou", resposta.status);
      if (resposta.status === 429) return recado("Muitas transcrições agora. Aguarde um minuto ou escreva a resposta.", 429);
      return recado("Não consegui transcrever agora. Você pode escrever sua resposta.", 502);
    }
    const payload = (await resposta.json()) as { text?: unknown };
    const texto = typeof payload.text === "string" ? payload.text.trim() : "";
    if (!texto) return recado("Não encontrei fala nesse trecho. Tente novamente ou escreva.", 422);
    return NextResponse.json({ texto }, { headers: semCache });
  } catch {
    return recado("Não consegui transcrever agora. Você pode escrever sua resposta.", 503);
  }
}
