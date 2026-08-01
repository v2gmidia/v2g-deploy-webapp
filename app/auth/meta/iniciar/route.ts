import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { urlDeConsentimento } from "@/lib/meta/oauth";

/**
 * Início do OAuth do Meta.
 *
 * Route Handler, não Server Action: o fluxo termina com o navegador do
 * usuário sendo redirecionado para o Facebook, e volta como um GET
 * externo — formato que Server Action não atende.
 */

export const COOKIE_STATE = "meta_oauth_state";
const VALIDADE_SEGUNDOS = 600;

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/entrar?next=/conectar`);
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!business) {
    return NextResponse.redirect(`${origin}/conectar?erro=negocio`);
  }

  // 32 bytes de aleatoriedade real. `randomUUID` daria 122 bits e um
  // formato previsível; aqui não custa nada usar o gerador cru.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const nonce = Buffer.from(bytes).toString("base64url");

  // Sem META_APP_ID/SECRET no ambiente isto lançaria e a rota devolveria
  // 500. Um erro de configuração nossa não deve aparecer como tela
  // quebrada para o cliente — vira aviso na própria /conectar.
  let destino: string;
  try {
    destino = urlDeConsentimento(nonce);
  } catch (erro) {
    console.error(
      `[meta:iniciar] configuracao ausente :: ${erro instanceof Error ? erro.message : "desconhecido"}`,
    );
    return NextResponse.redirect(`${origin}/conectar?erro=config`);
  }

  const resposta = NextResponse.redirect(destino);

  resposta.cookies.set({
    name: COOKIE_STATE,
    value: JSON.stringify({ nonce, businessId: business.id }),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // ============================================================
    // NÃO TROQUE PARA `strict`. Parece mais seguro e quebra o fluxo
    // inteiro, 100% das vezes.
    //
    // O usuário volta do domínio do Facebook por uma navegação de topo.
    // Com `strict`, o navegador NÃO manda o cookie em navegação que veio
    // de outro site — o callback não acha o state e a conexão falha
    // sempre, com um erro que parece de configuração do Meta.
    //
    // `lax` permite exatamente este caso (navegação de topo, método GET)
    // e continua barrando requisição cross-site de terceiro, que é o
    // ataque de que o state protege.
    // ============================================================
    sameSite: "lax",
    maxAge: VALIDADE_SEGUNDOS,
    path: "/auth/meta",
  });

  return resposta;
}
