import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "./actions";

/**
 * Layout do grupo de rotas protegido — visual `.app-shell` (sidebar +
 * topbar). Ver docs/arquitetura.md, Decisão 1.
 *
 * 2ª camada de proteção (defesa em profundidade — ver Decisão 3):
 * o middleware já deveria ter barrado quem não tem sessão antes de
 * chegar aqui, mas este layout verifica de novo, independentemente.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="side-brand wordmark">
          <span className="glyph">V2G</span>
          <span className="wm">
            V2G
            <small>Tráfego no piloto</small>
          </span>
        </div>

        <nav className="side-nav">
          {/* Só "Início" existe de verdade neste PR — ver
              docs/arquitetura.md ("O que NÃO existe aqui e por quê").
              Novos itens entram aqui só quando a rota existir. */}
          <a className="nav-item active" href="/inicio" aria-current="page">
            Início
          </a>
        </nav>

        <div className="side-spacer" />

        <div className="side-account">
          <span className="avatar">{(user.email ?? "?").charAt(0).toUpperCase()}</span>
          <div className="who">
            <b>{user.email}</b>
            <form action={signOutAction}>
              <button type="submit" className="link-btn">
                Sair
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="hi">V2G</span>
        </header>
        <div className="canvas">{children}</div>
      </div>
    </div>
  );
}
