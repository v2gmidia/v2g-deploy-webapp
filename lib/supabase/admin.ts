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
 * NENHUMA rota deste PR usa este arquivo — /entrar e /inicio operam
 * inteiramente com o cliente de servidor comum (lib/supabase/server.ts),
 * respeitando RLS como qualquer usuário autenticado normal.
 *
 * Este cliente existe pronto para o dia em que uma tarefa administrativa
 * de servidor precisar deliberadamente ignorar RLS — por exemplo, uma
 * Route Handler de manutenção, ou uma integração futura com o worker
 * Python mencionado no roadmap do produto (ver docs/arquitetura.md).
 * Antes de usá-lo, pergunte: "isso realmente precisa ignorar RLS, ou
 * só preciso rodar como o próprio usuário logado?" — na dúvida, use
 * lib/supabase/server.ts.
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
