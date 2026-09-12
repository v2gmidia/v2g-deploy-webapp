import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Marca } from "@/components/ui/Marca";
import { NavItem } from "@/components/ui/NavItem";
import { DataDeHoje, Saudacao } from "@/components/ui/Saudacao";
import { signOutAction } from "./actions";

const IcoInicio = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M3 9 10 3l7 6" />
    <path d="M5 8.5V16h10V8.5" />
  </svg>
);
/* `IcoVendas` saiu junto com o item da barra, em 12/09/2026. O ícone era
   usado só aqui, e componente que ninguém renderiza é código que envelhece
   sem ninguém notar. A rota `/vendas` continua no ar; se ela voltar para a
   barra, o ícone volta com ela — está no histórico do git. */
/** Criativos: uma imagem. É a peça que o dono mexe toda semana. */
const IcoCriativos = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <rect x="3" y="4" width="14" height="12" rx="2" />
    <circle cx="7.5" cy="8.5" r="1.3" />
    <path d="M3.5 13.5 8 10l3 2.5 2.5-2 3 3" />
  </svg>
);
const IcoAnuncios = () => (
  <svg className="ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
    <path d="M3 8v4h3l8 4V4L6 8H3z" />
    <path d="M16 8a3 3 0 0 1 0 4" />
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
    <div className="app-shell">
      <aside className="sidebar">
        <Marca href="/inicio" className="side-brand" />

        <nav className="side-nav">
          {/* CINCO ITENS, E CINCO É TETO — não meta. É o que cabe numa
              barra inferior de celular, e o produto é para ser usado no
              celular.

              A barra prevista aqui existe desde o lote QA-1: abaixo de
              900px esta mesma `.sidebar` vira a barra inferior, só por
              CSS — mesmo DOM, mesmo `NavItem`, mesmo item ativo. O
              desenho e as medições estão em docs/navegacao-mobile.md.
              Um sexto item quebra a conta: são cinco células de 64px na
              menor tela que a gente atende.

              Campanhas e Criativos viraram ANÚNCIOS. O cliente não separa
              a campanha do criativo: para ele, "meu anúncio" é a foto e o
              dinheiro por trás dela, junto. Dois itens para isso era
              raciocínio de gestor de tráfego vazando na interface.

              VENDAS SAIU E CRIATIVOS ENTROU — 12/09/2026, e a troca é de
              lugar, não de quantidade: continuam cinco.

              `/vendas` existe para a pergunta do dia, que está congelada, e
              a pergunta já vive num card do `/inicio`. Não há CRM atrás
              dela: a tela não mostra cliente, negociação nem histórico de
              venda, porque nada disso existe no produto. Um item de barra
              para uma tela nesse estado gasta uma das cinco células na
              coisa que o dono abre uma vez e não volta.

              Criativo é o oposto: é o que ele mexe toda semana, e a
              `/criativos` deixou de ser uma tarefa para ser a casa de três
              blocos — analisar peça pronta, ver as peças, criar peça nova.
              Casa é lugar, e lugar é o que merece item de barra.

              **`/vendas` NÃO foi apagada.** A rota continua no ar e nenhuma
              URL quebra; ela só saiu da barra. Ver docs/decisoes.md.

              Onboarding e Combinados NÃO entram: são passos únicos, não
              lugares. Quando pendentes, aparecem como tarefa no Início —
              que é o que aquela tela já faz. Item de menu para passo
              único vira um lugar que, depois de cumprido, só serve para
              o cliente se perguntar por que ainda está ali. */}
          <span className="nav-eyebrow">Seu negócio</span>
          <NavItem href="/inicio" icone={<IcoInicio />}>
            Início
          </NavItem>
          <NavItem href="/criativos" icone={<IcoCriativos />}>
            Criativos
          </NavItem>
          <NavItem href="/anuncios" icone={<IcoAnuncios />}>
            Anúncios
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
          <a className="cta ghost" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
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

          {/* AJUDA NO TOPO — só aparece abaixo de 900px, onde a sidebar
              virou barra inferior e o card `.side-support` não existe
              mais. Ver docs/navegacao-mobile.md §7.

              Por que não confiar no bloco de suporte do corpo das telas:
              porque ele não está em todos os ESTADOS. Medido — o vazio de
              `/anuncios` e o de `/meu-negocio` não têm nenhum, e é o
              cliente novo que cai neles. Quem mais precisa de ajuda era
              justamente quem ficava sem canal.

              O desenho não é invenção: é o mesmo do cabeçalho de
              `(fluxo)` — marca à esquerda, gente de verdade à direita. */}
          <div className="topbar-actions">
            <a
              className="topbar-help"
              href="https://wa.me/5521936182176"
              target="_blank"
              rel="noopener"
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <path d="M6 1a5 5 0 0 0-4.3 7.6L1 11l2.5-.7A5 5 0 1 0 6 1z" />
              </svg>
              Falar com uma pessoa
            </a>
          </div>
        </header>
        <div className="canvas">{children}</div>
      </div>
    </div>
  );
}
