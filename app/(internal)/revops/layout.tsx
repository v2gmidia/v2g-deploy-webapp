import { notFound, redirect } from "next/navigation";
import { Marca } from "@/components/ui/Marca";
import { PreferenciaDeTema } from "@/components/ui/PreferenciaDeTema";
import { createClient } from "@/lib/supabase/server";
import { temAutorizacaoRevOps } from "@/lib/revops/autorizacao";

export default async function RevOpsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/revops");
  if (!temAutorizacaoRevOps(user)) notFound();

  return <div className="app-shell v2g-editorial revops-shell">
    <header className="revops-topo">
      <Marca className="revops-marca" editorial />
      <div className="revops-topo-acoes">
        <span>Área interna</span>
        <PreferenciaDeTema />
      </div>
    </header>
    <main id="conteudo-principal" className="revops-canvas">{children}</main>
  </div>;
}

