import { notFound, redirect } from "next/navigation";
import { signOutAction } from "@/app/(protected)/actions";
import { createClient } from "@/lib/supabase/server";
import { temAcessoWebApp } from "@/lib/contratacao/acesso";
import { MesaShell } from "./MesaShell";

/** Área interna independente da seleção de negócio do aplicativo do cliente. */
export default async function SupergestorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/supergestor");
  if (!(await temAcessoWebApp(supabase, user))) redirect("/acesso-pendente");
  // Não conceder este papel a agências: a carteira atual ainda lê o conjunto interno inteiro.
  if (user.app_metadata?.papel !== "operador") notFound();

  const { data: profile } = await supabase.from("profiles")
    .select("full_name").eq("id", user.id).maybeSingle();
  const nome = profile?.full_name?.trim() || "Gestor";

  return <MesaShell nome={nome} acaoSair={signOutAction}>{children}</MesaShell>;
}
