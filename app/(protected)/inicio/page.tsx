import { createClient } from "@/lib/supabase/server";

/**
 * Única tela protegida deste PR. Server Component: busca o profile do
 * usuário logado (RLS garante que só a própria linha é lida — ver
 * supabase/migrations/0001_init.sql) e mostra o nome vindo do banco.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O layout já redireciona se não houver usuário; isto é só para o
  // TypeScript, que não sabe disso.
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome")
    .eq("id", user.id)
    .single();

  const nome = profile?.nome?.trim();

  return (
    <div className="auth-card" style={{ maxWidth: 480 }}>
      <h1 className="auth-h">Olá, {nome || "tudo bem"}!</h1>
      <p className="auth-sub">
        Sua conta está ativa. As próximas telas (onboarding, campanhas, criativos) ainda não
        existem — este PR entrega só cadastro, login e esta tela protegida.
      </p>
    </div>
  );
}
