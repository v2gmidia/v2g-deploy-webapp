import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * ============================================================
 * CLIENTE ADMIN — usa a service_role key, que IGNORA RLS por completo.
 * ============================================================
 *
 * `import "server-only"` acima faz o build do Next.js FALHAR se este
 * arquivo for importado, direta ou indiretamente, por qualquer código
 * que possa acabar num bundle enviado ao navegador (Client Component,
 * ou um módulo importado por um). Isso é a regra inegociável nº 3 do
 * projeto: a service_role key nunca roda no cliente.
 *
 * Rotas administrativas e integrações usam este cliente depois de conferir
 * a sessão e o papel no servidor. Leituras de dados do cliente devem usar
 * lib/supabase/server.ts sob RLS, exceto quando precisam enxergar um pedido
 * ainda não vinculado ao perfil para decidir acesso daquele negócio.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "createAdminClient(): faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no ambiente.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
