import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavItem } from "@/components/ui/NavItem";
import { DataDeHoje, Saudacao } from "@/components/ui/Saudacao";
import { signOutAction } from "./actions";

const IcoInicio = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M3 9 10 3l7 6" />
    <path d="M5 8.5V16h10V8.5" />
  </svg>
);
const IcoCriativos = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="3" y="4" width="14" height="12" rx="1.5" />
    <circle cx="7.5" cy="8.5" r="1.4" />
    <path d="M4.5 14.5 8 11l3.5 3.5L14 12l2 2.5" />
  </svg>
);
const IcoAlertas = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M10 3a4.5 4.5 0 0 0-4.5 4.5V11L4 13.5h12L14.5 11V7.5A4.5 4.5 0 0 0 10 3z" />
    <path d="M8.3 16a1.9 1.9 0 0 0 3.4 0" />
  </svg>
);
const IcoConta = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <circle cx="10" cy="7" r="3" />
    <path d="M4 16.5a6 6 0 0 1 12 0" />
  </svg>
);

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

  const nome = profile?.full_name?.trim() || (user.email ?? "");
  const nomeNegocio = business?.name?.trim();
  const inicial = (nomeNegocio || nome || "?").charAt(0).toUpperCase();

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
          {/* Só rotas que existem de verdade. Campanhas e Dashboard
              entram quando forem migradas. As telas de FLUXO
              (/expectativas, /onboarding) não entram aqui de propósito:
              elas vivem no grupo `(fluxo)`, sem sidebar, porque pedem
              foco numa tarefa só. */}
          <span className="nav-eyebrow">Seu negócio</span>
          <NavItem href="/inicio" icone={<IcoInicio />}>
            Início
          </NavItem>
          <NavItem href="/criativos" icone={<IcoCriativos />}>
            Criativos
          </NavItem>
          <NavItem href="/alertas" icone={<IcoAlertas />}>
            Avisos
          </NavItem>
          <NavItem href="/conta" icone={<IcoConta />}>
            Conta
          </NavItem>
        </nav>

        <div className="side-spacer" />

        <div className="side-support">
          <b>Fala com gente de verdade</b>
          <p>Sem robô. Resposta em até 2 horas úteis, no WhatsApp.</p>
          <a className="cta ghost" href="https://wa.me/5521980351531" target="_blank" rel="noopener">
            Falar com uma pessoa
          </a>
        </div>

        <div className="side-account">
          <span className="avatar">{inicial}</span>
          <div className="who">
            <b>{nomeNegocio || user.email}</b>
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
          <div className="greet">
            <Saudacao nome={nome} />
            <div className="sub">
              {nomeNegocio && (
                <>
                  <b>{nomeNegocio}</b>
                  {" · "}
                </>
              )}
              <DataDeHoje />
            </div>
          </div>
        </header>
        <div className="canvas">{children}</div>
      </div>
    </div>
  );
}
