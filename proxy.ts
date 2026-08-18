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
  "/vendas",
  "/anuncios",
  "/conta",
  "/alertas",
  // Tela de OPERADOR, fora do menu. Protegida por sessão como as outras,
  // mas isso é o piso, não o suficiente: qualquer cliente logado que
  // descubra a URL vê linguagem interna. A marcação de conta interna está
  // proposta no fim de app/(protected)/saude-meta/page.tsx.
  "/saude-meta",
  // Idem: revisão da proposta de perfil, tela de operador. Precisa estar
  // aqui porque OPERADOR_PREFIXES filtra SOBRE a checagem de sessão, não
  // no lugar dela — fora desta lista, o segundo filtro nunca rodaria.
  "/revisar-perfil",
  // `/campanhas` e `/criativos` viraram `/anuncios` no lote 8. Ficam aqui
  // porque continuam existindo como redirecionamento — e redirecionar
  // quem não tem sessão para o destino protegido seria vazar a rota.
  "/campanhas",
  "/criativos",
  // telas de fluxo — grupo `(fluxo)`, sem sidebar, mas igualmente com sessão
  "/onboarding",
  "/expectativas",
  "/processando",
  "/conectar",
  "/verba",
  "/aprovar",
  "/reprovado",
  "/sem-instagram",
  "/whatsapp-business",
];

/**
 * Rotas que exigem `app_metadata.papel === "operador"`.
 *
 * Precisam estar TAMBÉM em `PROTECTED_PREFIXES` — a checagem de sessão
 * vem primeiro, e esta é um segundo filtro sobre ela, não um substituto.
 */
const OPERADOR_PREFIXES = ["/saude-meta", "/revisar-perfil"];

/** O papel declarado no JWT, ou `null`. */
function obterPapel(user: { app_metadata?: Record<string, unknown> } | null): string | null {
  const papel = user?.app_metadata?.papel;
  return typeof papel === "string" ? papel : null;
}

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

  // ---------- rotas de OPERADOR ----------
  //
  // `app_metadata` e NÃO `user_metadata`: a diferença é a razão de a
  // marcação ficar ali. `user_metadata` é gravável pelo próprio usuário
  // (`auth.updateUser`), então qualquer cliente poderia se promover a
  // operador. `app_metadata` só a `service_role` escreve, e vem assinada
  // dentro do JWT — o `getUser()` acima já validou a assinatura contra o
  // servidor da Supabase.
  //
  // Quem está logado e não é operador vai para /inicio, não para /entrar:
  // mandar para o login alguém que já tem sessão é dizer "você não está
  // logado" quando ele está, e ele tentaria logar de novo para sempre.
  if (OPERADOR_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (obterPapel(user) !== "operador") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = user ? "/inicio" : "/entrar";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
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
