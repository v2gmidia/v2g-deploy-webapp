import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso em Server Components, Route Handlers e
 * Server Actions. Só a anon key — a autorização real vem do RLS,
 * lido a partir do JWT do usuário na sessão (cookies).
 *
 * `setAll` pode falhar quando chamado a partir de um Server Component
 * puro (que não pode escrever cookies) — isso é esperado e inofensivo
 * enquanto o middleware estiver renovando a sessão a cada request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Chamado a partir de um Server Component sem permissão de
            // escrita — sem problema, o middleware cuida da renovação.
          }
        },
      },
    },
  );
}
