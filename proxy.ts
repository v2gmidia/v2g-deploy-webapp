import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 1ª camada de proteção (ver docs/arquitetura.md, Decisão 3).
 * A 2ª camada vive na própria page.tsx de cada rota protegida —
 * defesa em profundidade, não confiamos só nisto aqui.
 *
 * Rotas sob PROTECTED_PREFIXES exigem sessão. Todo o resto é público.
 *
 * Nota: este arquivo se chama `proxy.ts`, não `middleware.ts`. No
 * Next.js 16, `middleware.ts` foi renomeado para `proxy.ts` (mesmo
 * mecanismo, arquivo/export renomeados) — como este projeto nasce
 * direto na v16, usamos a convenção atual em vez de começar já com
 * o nome depreciado. Ver https://nextjs.org/docs/messages/middleware-to-proxy
 */
const PROTECTED_PREFIXES = [
  "/inicio",
  "/conta",
  "/alertas",
  "/criativos",
  // telas de fluxo — grupo `(fluxo)`, sem sidebar, mas igualmente com sessão
  "/onboarding",
  "/expectativas",
];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // getUser() (não getSession()) valida o token contra o servidor da
  // Supabase a cada request — mais lento que ler o cookie cru, mas é
  // o único jeito confiável de saber que a sessão não foi revogada.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/entrar";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === "/entrar" && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/inicio";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Roda em tudo exceto arquivos estáticos internos do Next e
     * assets públicos óbvios (imagens, favicon), para não gastar uma
     * chamada de rede (getUser) em cada asset.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
