import { createClient } from "@/lib/supabase/server";

/**
 * Início. Hoje é um ponto de partida: mostra o que falta fazer para a
 * primeira campanha existir. Quando a tela 05 (dashboard) for migrada,
 * é aqui que os números da semana entram — por isso a rota já se chama
 * `/inicio` e não `/dashboard`.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O layout já redireciona se não houver usuário; isto é só para o
  // TypeScript, que não sabe disso.
  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, onboarding")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const respostas =
    business?.onboarding && typeof business.onboarding === "object"
      ? ((business.onboarding as { respostas?: Record<string, unknown> }).respostas ?? {})
      : {};
  const onboardingCompleto = Object.keys(respostas).length >= 5;

  return (
    <>
      <div className="page-head">
        <h1>Sua primeira campanha ainda não está no ar.</h1>
        <p>
          Falta pouco. Abaixo está o que já foi feito e o que ainda depende de você — nesta
          ordem, sem pular etapa.
        </p>
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          <section>
            <div className="section-title">
              <h2>Por onde começar</h2>
            </div>

            <div className="card acct-list">
              <a className="acct-row" href="/expectativas">
                <span className="ar-text">
                  <b>Ler os combinados</b>
                  <span>Os 4 acordos, antes de qualquer cobrança. Leva 2 minutos.</span>
                </span>
                <Seta />
              </a>

              <a className="acct-row" href="/onboarding">
                <span className="ar-text">
                  <b>
                    {onboardingCompleto
                      ? "Rever o que você contou sobre o negócio"
                      : "Contar sobre o seu negócio"}
                  </b>
                  <span>
                    {onboardingCompleto
                      ? "As quatro perguntas já estão respondidas — dá para mudar quando quiser."
                      : "Quatro perguntas rápidas. É delas que a IA parte para montar sua campanha."}
                  </span>
                </span>
                <Seta />
              </a>

              <a className="acct-row" href="/criativos">
                <span className="ar-text">
                  <b>Separar suas fotos</b>
                  <span>O produto pronto, a fachada, um vídeo curto de celular.</span>
                </span>
                <Seta />
              </a>
            </div>
          </section>
        </div>

        <aside className="dash-aside">
          <section className="trust support-block">
            <b>Travou em alguma parte?</b>
            Gente de verdade responde, sem robô, em até 2 horas úteis.
            <a className="wa" href="https://wa.me/5521980351531" target="_blank" rel="noopener">
              Chamar no WhatsApp &rarr;
            </a>
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
