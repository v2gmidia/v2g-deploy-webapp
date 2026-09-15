import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Casco } from "@/components/ui/Casco";
import { signOutAction } from "./actions";


/**
 * Layout do grupo de rotas de APP — visual `.app-shell` (sidebar +
 * topbar). Ver docs/arquitetura.md, Decisão 1.
 *
 * 2ª camada de proteção (defesa em profundidade — ver Decisão 3):
 * o proxy já deveria ter barrado quem não tem sessão antes de chegar
 * aqui, mas este layout verifica de novo, independentemente.
 *
 * Telas de FLUXO (uma tarefa por vez, sem fuga) não moram aqui — vão
 * para o grupo `(fluxo)`, que exige sessão mas não tem sidebar.
 *
 * ============================================================
 * CORREÇÃO DE UM COMENTÁRIO QUE ESTEVE AQUI — 11/09/2026.
 *
 * Entre 72bb099 e hoje havia neste lugar um portão de fixture, e o
 * comentário dele dizia: "o `proxy.ts` deixou a fixture passar; ESTE
 * layout barrou mesmo assim", oferecido como prova de que a defesa em
 * profundidade funcionava.
 *
 * NÃO BARRAVA. O portão estava escrito aqui também, com os mesmos dois
 * trincos — e um `if` que não roda não barra nada. As duas camadas
 * tinham o mesmo buraco no mesmo lugar, que é o oposto de defesa em
 * profundidade: camada repetida com a exceção repetida junto é uma
 * camada só, escrita duas vezes.
 *
 * Os dois portões saíram. O que sobrou é o da própria
 * `app/(protected)/inicio/page.tsx`, e ele não decide quem entra: decide
 * o que a página LÊ depois que a sessão já foi exigida — aqui e no
 * proxy. Ver docs/estado/inicio-recomposto-11-09.md §3.
 * ============================================================
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: business } = await supabase
    .from("businesses")
    .select("name")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Sem cair no e-mail. Se o nome não vier, a saudação fica sem nome —
  // "Boa tarde" sozinho é melhor que "Boa tarde, fulano@provedor.com",
  // que além de feio joga o e-mail da pessoa na tela para quem estiver
  // olhando por cima do ombro dela.
  const nome = profile?.full_name?.trim() ?? "";
  const nomeNegocio = business?.name?.trim();
  const inicial = (nomeNegocio || nome || user.email || "?").charAt(0).toUpperCase();

  return (
    <Casco
      nome={nome}
      nomeNegocio={nomeNegocio}
      rotuloDaConta={nomeNegocio || user.email || ""}
      inicial={inicial}
      acaoSair={signOutAction}
    >
      {children}
    </Casco>
  );
}
