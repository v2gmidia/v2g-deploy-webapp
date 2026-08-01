import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Alvo do link enviado por e-mail (cadastro e recuperação de senha).
 * O template padrão do Supabase Auth aponta para cá com
 * `token_hash` + `type` — verificamos aqui e só então redirecionamos,
 * já com a sessão criada via cookie (necessário para /redefinir poder
 * chamar `auth.updateUser` depois).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  const invalidUrl = new URL("/redefinir", origin);
  invalidUrl.searchParams.set("erro", "invalido");
  return NextResponse.redirect(invalidUrl);
}
