import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listarPaginas, type PaginaDoFacebook } from "@/lib/meta/graph";
import { registrarErroMeta } from "@/lib/meta/erros";
import { FormNegocio, FormPerfil } from "./Formularios";
import { TrocarPagina } from "./TrocarPagina";

/**
 * Sua conta — porte de `tela-09-conta-desktop.html`.
 *
 * O QUE É REAL E O QUE É ESTADO VAZIO:
 *
 * Real (lê e grava no banco): dados do negócio (`businesses`) e perfil
 * (`profiles`). São as mesmas colunas que o onboarding preenche — esta
 * é a tela onde a pessoa corrige depois o que respondeu no chat.
 *
 * Estado vazio: tudo que depende de assinatura — plano, forma de
 * pagamento, recibos, "já voltou R$ 3,40 por real investido", os 23
 * dias no ar, pausar e cancelar. Não existe tabela de assinatura nem
 * integração de pagamento no projeto; o protótipo mostrava R$ 490/mês e
 * um cartão final 4242, que são dados inventados. Aqui a tela diz que
 * ainda não há assinatura e o que vai aparecer quando houver.
 *
 * A porta de saída (cancelar) continua visível e no mesmo peso das
 * outras linhas, como no original — só desabilitada, porque não há o
 * que cancelar. Escondê-la seria mudar a intenção da tela.
 */
export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, whatsapp")
    .eq("id", user.id)
    .maybeSingle();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, niche, city, radius_km, avg_ticket_min, avg_ticket_max, monthly_budget")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // As páginas alcançadas pela conexão. Precisa do token, que só o
  // `service_role` lê do Vault — daí o cliente admin. Falha aqui não
  // derruba a tela: o resto de /conta não depende do Facebook.
  let paginas: PaginaDoFacebook[] = [];
  let paginaAtual: string | null = null;

  if (business?.id) {
    const admin = createAdminClient();
    const { data: conexao } = await admin
      .from("meta_connections")
      .select("meta_page_id, status")
      .eq("business_id", business.id)
      .maybeSingle();

    paginaAtual = conexao?.meta_page_id ?? null;

    if (conexao?.status === "active") {
      try {
        const { data: token } = await admin.rpc("obter_token_meta", {
          p_business_id: business.id,
        });
        if (token && typeof token === "string") paginas = await listarPaginas(token);
      } catch (erro) {
        registrarErroMeta("conta:listar-paginas", erro);
      }
    }
  }

  // O onboarding grava faixa (min/max). Como campo único, o mais
  // informativo é o piso — e a legenda do campo explica a origem.
  const ticket = business?.avg_ticket_min ?? null;

  return (
    <>
      <div className="page-head">
        <h1>Sua conta, sem letra miúda.</h1>
        <p>
          Tudo que você paga, recebe e pode mudar — num só lugar. O preço mora ao lado do que ele
          já trouxe de volta, e a porta de saída fica na mesma lista de todo o resto.
        </p>
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          <section>
            <div className="section-title">
              <h2>Seu plano</h2>
              <span className="side-note">Nenhuma cobrança até aqui</span>
            </div>
            <div className="card">
              <p className="hint">
                Você ainda não tem assinatura ativa, então não há nada a pagar e nenhuma cobrança
                foi feita. Quando você assinar, aparecem aqui: o valor, a data da próxima
                cobrança, a forma de pagamento e todos os recibos, no mesmo dia em que cada
                cobrança acontecer.
              </p>
              <p className="foot-line">
                V2G é mês a mês. Você decide quando entra e quando sai — sempre por aqui, sem
                ligar para ninguém.
              </p>
            </div>
          </section>

          {business ? (
            <section>
              <div className="section-title">
                <h2>Dados do seu negócio</h2>
                <span className="side-note">É com isso que a IA pilota</span>
              </div>
              <FormNegocio
                nome={business.name ?? ""}
                segmento={business.niche ?? ""}
                cidade={business.city ?? ""}
                raio={business.radius_km}
                ticket={ticket}
                limite={business.monthly_budget}
              />
            </section>
          ) : (
            <section>
              <div className="section-title">
                <h2>Dados do seu negócio</h2>
              </div>
              <div className="card">
                <p className="hint">
                  Você ainda não contou sobre o seu negócio. São quatro perguntas rápidas, e é
                  delas que a IA parte para montar sua primeira campanha.
                </p>
                <a className="cta" href="/onboarding" style={{ width: "max-content" }}>
                  Começar agora
                </a>
              </div>
            </section>
          )}

          {/* Trocar a página sem refazer o OAuth. Antes, o único caminho
              era reconectar tudo — desproporcional para mudar um campo, e
              cada passagem pelo Facebook é uma chance de o cliente
              recusar ou cair num erro. */}
          {paginas.length > 0 && (
            <section>
              <div className="section-title">
                <h2>De qual página seus anúncios saem</h2>
              </div>
              <TrocarPagina paginas={paginas} atual={paginaAtual} />
            </section>
          )}

          {/* As telas de destravar. Ficam aqui, e não escondidas atrás de
              um erro, porque o cliente que trava geralmente trava ANTES
              de publicar — e nesse momento ele não tem erro nenhum para
              clicar, só a sensação de que não está andando. */}
          <section>
            <div className="section-title">
              <h2>Verba, cobrança e requisitos</h2>
            </div>
            <div className="card acct-list">
              <a className="acct-row" href="/verba">
                <span className="ar-text">
                  <b>Sua verba e o cartão</b>
                  <span>Quanto você investe por mês, e por que são duas cobranças.</span>
                </span>
                <Seta />
              </a>
              <a className="acct-row" href="/whatsapp-business">
                <span className="ar-text">
                  <b>Seu WhatsApp precisa ser o Business</b>
                  <span>Sem ele o anúncio não tem para onde mandar quem clica.</span>
                </span>
                <Seta />
              </a>
              <a className="acct-row" href="/sem-instagram">
                <span className="ar-text">
                  <b>Deixar seu Instagram profissional</b>
                  <span>É uma chavinha dentro do aplicativo, de graça.</span>
                </span>
                <Seta />
              </a>
            </div>
          </section>

          <section>
            <div className="section-title">
              <h2>Seu perfil</h2>
            </div>
            <FormPerfil
              nome={profile?.full_name ?? ""}
              whatsapp={profile?.whatsapp ?? ""}
              email={user.email ?? ""}
            />
          </section>

          <section className="trust support-block">
            <b>Fala com gente de verdade</b>
            Dúvida de cobrança, de resultado ou de saída: é a mesma pessoa que responde. WhatsApp,
            resposta em até 2 horas úteis, sem robô e sem menu de atendimento.
            <a className="wa" href="https://wa.me/5521980351531" target="_blank" rel="noopener">
              Chamar no WhatsApp &rarr;
            </a>
          </section>

          <section>
            <div className="section-title">
              <h2>Sua assinatura</h2>
            </div>
            <div className="card acct-list">
              <button className="acct-row" type="button" disabled>
                <span className="ar-text">
                  <b>Pausar os anúncios</b>
                  <span>Disponível quando houver campanha no ar.</span>
                </span>
                <Seta />
              </button>
              <button className="acct-row" type="button" disabled>
                <span className="ar-text">
                  <b>Cancelar assinatura</b>
                  <span>Disponível quando houver assinatura ativa. Serão 2 toques, sem ligação.</span>
                </span>
                <Seta />
              </button>
            </div>
            <p className="foot-line">
              Estas duas ficam aqui desde já, no mesmo peso do resto, para você saber onde
              procurar no dia em que precisar.
            </p>
          </section>
        </div>

        <aside className="dash-aside">
          <section className="card">
            <b className="pc-title" style={{ display: "block", marginBottom: 6 }}>
              O que aparece aqui depois
            </b>
            <p className="hint" style={{ marginBottom: 0 }}>
              Quando sua campanha estiver rodando, esta coluna mostra quanto você paga de um lado
              e quanto voltou do outro, lado a lado — para o preço nunca aparecer sozinho, sem o
              resultado ao lado dele.
            </p>
          </section>

          <section className="card">
            <b className="pc-title" style={{ display: "block", marginBottom: 6 }}>
              Sem fidelidade, sem multa
            </b>
            <p className="hint" style={{ marginBottom: 0 }}>
              Quando você assinar, cancela em 2 toques direto no app, sem ligar para ninguém. Se
              sair, os anúncios param e a gente guarda seus dados por 90 dias, caso você volte.
            </p>
          </section>
        </aside>
      </div>
    </>
  );
}

const Seta = () => (
  <svg
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 3l4 4-4 4" />
  </svg>
);
