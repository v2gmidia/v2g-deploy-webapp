import { createClient } from "@/lib/supabase/server";
import { FaixaReconectar } from "@/components/ui/FaixaReconectar";
import { NumeroQueConta } from "@/components/ui/NumeroQueConta";
import { dinheiro, numero, retornoPorReal } from "@/lib/formato";

/**
 * Início / dashboard — porte de `tela-05-dashboard-desktop.html`.
 *
 * TRÊS ESTADOS, e o do meio é o que mais importa:
 *
 * 1. Sem campanha — a pessoa acabou de entrar. Mostra por onde começar.
 * 2. Campanha no ar, sem número ainda — o "dia zero". Ver a nota longa
 *    abaixo; é o estado que decide se o cliente fica ou desiste.
 * 3. Com número — o dashboard de verdade, com dados de `metrics_daily`.
 *
 * SOBRE O ESTADO 2. Nas primeiras 48h não há número porque o Facebook
 * ainda está aprendendo para quem mostrar o anúncio. É um vazio
 * legítimo, mas parece fracasso — e o comportamento mais destrutivo do
 * cliente ansioso é pausar tudo no dia 3, justamente quando o
 * aprendizado ia terminar. Pausar reinicia o aprendizado e joga fora o
 * que já foi gasto nele.
 *
 * Por isso este estado faz duas coisas de propósito: explica o motivo
 * do vazio em português simples, e oferece algo para fazer que NÃO seja
 * mexer na campanha. O espaço da missão (`.mission-slot`) fica
 * reservado para o wireframe do Figma — a mecânica de missão ainda não
 * existe, mas fechar a tela num vazio simples seria justamente o erro.
 */
export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, onboarding, monthly_budget")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: campanhas } = await supabase
    .from("campaigns")
    .select("id, name, published_at, meta_status")
    .order("created_at", { ascending: false });

  const noAr = (campanhas ?? []).filter((c) => c.published_at !== null);

  // Últimos 7 dias. `date` é `date` no banco, então a comparação é por
  // string ISO de data — sem hora, sem fuso no meio.
  const seteDiasAtras = new Date();
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
  const desde = seteDiasAtras.toISOString().slice(0, 10);

  const { data: metricas } = await supabase
    .from("metrics_daily")
    .select("spend, conversions, revenue, impressions, date")
    .gte("date", desde);

  const total = (metricas ?? []).reduce(
    (acc, m) => ({
      investido: acc.investido + Number(m.spend ?? 0),
      vendas: acc.vendas + Number(m.conversions ?? 0),
      receita: acc.receita + Number(m.revenue ?? 0),
      alcance: acc.alcance + Number(m.impressions ?? 0),
    }),
    { investido: 0, vendas: 0, receita: 0, alcance: 0 },
  );

  const temNumero = total.investido > 0;

  const { data: ultimaDecisao } = await supabase
    .from("decisions")
    .select("kind, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const respostas =
    business?.onboarding && typeof business.onboarding === "object"
      ? ((business.onboarding as { respostas?: Record<string, unknown> }).respostas ?? {})
      : {};
  const onboardingCompleto = Object.keys(respostas).length >= 5;

  // ---------- ESTADO 1: nenhuma campanha ----------
  if (noAr.length === 0) {
    return (
      <>
        {/* A faixa vale mesmo sem campanha: se a pessoa conectou e a
            conexão caiu, ela precisa saber agora — e não descobrir
            quando a primeira campanha não subir. */}
        <FaixaReconectar />
        <div className="page-head">
          <h1>Sua primeira campanha ainda não está no ar.</h1>
          <p>
            Falta pouco. Abaixo está o que ainda depende de você — nesta ordem, sem pular etapa.
          </p>
        </div>

        <div className="dash-grid">
          <div className="dash-main">
            {/* O destaque aqui é o PRÓXIMO passo, não a lista inteira.
                Antes os três tinham o mesmo peso e a pessoa escolhia no
                escuro. */}
            <section className="hero-dark">
              <span className="eyebrow">Seu próximo passo</span>
              <p className="hero-frase">
                {onboardingCompleto ? (
                  <>
                    Falta <span className="destaque">separar suas fotos</span>.
                  </>
                ) : (
                  <>
                    Comece <span className="destaque">contando do seu negócio</span>.
                  </>
                )}
              </p>
              <p className="hero-note">
                {onboardingCompleto
                  ? "A IA já sabe o essencial. O que falta é material visual: o produto pronto, a fachada, um vídeo curto de celular."
                  : "São quatro perguntas rápidas. É delas que a IA parte para montar sua primeira campanha — dá para parar no meio e voltar depois."}
              </p>
              <a
                className="cta"
                href={onboardingCompleto ? "/criativos" : "/onboarding"}
                style={{ width: "max-content", marginTop: 22 }}
              >
                {onboardingCompleto ? "Separar minhas fotos" : "Começar agora"}
              </a>
            </section>

            <section>
              <div className="section-title">
                <h2>O resto do caminho</h2>
              </div>
              <div className="card acct-list">
                <a className="acct-row" href="/expectativas">
                  <span className="ar-text">
                    <b>Ler os combinados</b>
                    <span>Os 4 acordos, antes de qualquer cobrança. Leva 2 minutos.</span>
                  </span>
                  <Seta />
                </a>
                <a className="acct-row" href={onboardingCompleto ? "/onboarding" : "/criativos"}>
                  <span className="ar-text">
                    <b>
                      {onboardingCompleto
                        ? "Rever o que você contou sobre o negócio"
                        : "Separar suas fotos"}
                    </b>
                    <span>
                      {onboardingCompleto
                        ? "As quatro perguntas já estão respondidas — dá para mudar quando quiser."
                        : "Pode ir juntando desde já; a IA usa depois."}
                    </span>
                  </span>
                  <Seta />
                </a>
                <a className="acct-row" href="/conta">
                  <span className="ar-text">
                    <b>Conferir seus dados</b>
                    <span>Nome do negócio, cidade e ticket médio.</span>
                  </span>
                  <Seta />
                </a>
              </div>
            </section>
          </div>

          <aside className="dash-aside">
            <Suporte />
          </aside>
        </div>
      </>
    );
  }

  // ---------- ESTADO 2: campanha no ar, sem número (o "dia zero") ----------
  if (!temNumero) {
    return (
      <>
        <FaixaReconectar />
        <div className="page-head">
          <h1>Seus anúncios estão no ar. Os números ainda não.</h1>
          <p>
            É assim que começa para todo mundo — e é o momento em que mais vale não mexer em
            nada.
          </p>
        </div>

        <div className="dash-grid">
          <div className="dash-main">
            {/* O que grita nesta tela é o MOTIVO do vazio. Sem ele, a
                pessoa lê a ausência de número como fracasso e vai mexer
                na campanha — que é o que não pode acontecer. */}
            <section className="hero-dark">
              <span className="eyebrow">Por que ainda não há número</span>
              <p className="hero-frase">
                O Facebook está <span className="destaque">aprendendo</span> quem é o seu cliente.
              </p>
              <p className="hero-note">
                Nos primeiros dias ele mostra seu anúncio para perfis diferentes de pessoas só
                para descobrir quem responde. Enquanto esse teste roda, o custo fica mais alto e a
                venda demora — não porque a campanha está ruim, mas porque ela ainda não sabe para
                quem falar. Costuma levar de 2 a 3 dias.
              </p>
            </section>

            <div className="fail-block" style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}>
              <b>O que não fazer agora</b>
              <p>
                Não pause e não mexa no investimento nestes primeiros dias. Cada mudança
                reinicia o aprendizado do zero, e o que já foi gasto nele se perde. É a coisa
                mais cara que dá para fazer aqui — e a mais tentadora.
              </p>
            </div>

            {/* Espaço reservado da missão do dia zero (wireframe do Figma).
                A mecânica ainda não existe; o lugar dela sim, para a tela
                não terminar num vazio que empurra a pessoa para a campanha. */}
            <section className="mission-slot">
              <span className="ms-tag">Enquanto isso</span>
              <b>Adiante o que vai fazer falta depois</b>
              <p>
                O melhor uso destes dias não é olhar a campanha — é deixar pronto o que ela vai
                pedir a seguir: mais fotos para a IA ter de onde escolher, e seus dados de
                negócio conferidos, que é de onde ela decide para quem mostrar.
              </p>
            </section>

            <div className="card acct-list">
              <a className="acct-row" href="/criativos">
                <span className="ar-text">
                  <b>Separar mais fotos</b>
                  <span>Quanto mais material, mais a IA tem de onde escolher.</span>
                </span>
                <Seta />
              </a>
              <a className="acct-row" href="/conta">
                <span className="ar-text">
                  <b>Conferir os dados do negócio</b>
                  <span>Ticket médio, cidade e raio — é daí que sai a mira dos anúncios.</span>
                </span>
                <Seta />
              </a>
            </div>
          </div>

          <aside className="dash-aside">
            <section className="card noturno">
              <div className="nc-head">
                <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                  <path d="M9 1a5 5 0 1 0 2 8.5A5.5 5.5 0 0 1 9 1z" />
                </svg>
                Enquanto você dormia
              </div>
              {ultimaDecisao ? (
                <p>{resumoDaDecisao(ultimaDecisao.payload)}</p>
              ) : (
                <p>
                  A IA ainda não tomou nenhuma decisão. Quando tomar — remanejar investimento,
                  pausar o que não rende — aparece aqui, com data, hora e motivo.
                </p>
              )}
              <p className="nc-foot">
                <a href="/alertas">ver tudo que a IA já fez</a>
              </p>
            </section>

            <section className="command-card">
              <b className="title">Você está no comando</b>
              <p className="limit">
                {business?.monthly_budget
                  ? `Seu teto do mês é ${dinheiro(Number(business.monthly_budget))}. `
                  : "Você ainda não definiu um teto mensal. "}
                <a href="/conta">
                  {business?.monthly_budget ? "mudar limite" : "definir agora"}
                </a>
              </p>
              <a
                className="cta quiet"
                href="https://wa.me/5521980351531"
                target="_blank"
                rel="noopener"
              >
                Falar com uma pessoa
              </a>
              <p className="note">Gente de verdade, sem robô. Resposta em até 2 horas úteis.</p>
            </section>
          </aside>
        </div>
      </>
    );
  }

  // ---------- ESTADO 3: com número ----------
  const retorno = retornoPorReal(total.receita, total.investido);

  return (
    <>
      <FaixaReconectar />
      <div className="page-head">
        <h1>Seu resultado essa semana</h1>
        <p>
          Primeiro a resposta que importa — valeu a pena? — só depois os números soltos e a
          prestação de contas do que a IA fez por você.
        </p>
      </div>

      <div className="dash-grid">
        <div className="dash-main">
          {/* A resposta que importa — "valeu a pena?" — é o maior
              elemento da tela, e o único lugar onde o lima aparece. */}
          <section className="hero-dark">
            <span className="eyebrow">Em uma frase</span>
            {retorno !== null ? (
              <>
                <NumeroQueConta
                  valor={retorno}
                  prefixo="R$ "
                  casas={2}
                  className="hero-num"
                />
                <p className="hero-legenda">voltaram pra cada R$ 1 que você colocou</p>
              </>
            ) : (
              <p className="hero-frase">Ainda não dá para dizer se valeu a pena.</p>
            )}
            <p className="hero-note">
              Estimado a partir das vendas que as plataformas conseguiram atribuir aos seus
              anúncios. Pode faltar venda nessa conta, nunca sobrar — na dúvida, arredondamos para
              baixo.
            </p>
          </section>

          <div className="metrics">
            <div className="metric">
              <span className="m-label">Vendas geradas</span>
              <span className="m-value">{numero(total.vendas)}</span>
              <span className="m-delta">nos últimos 7 dias</span>
            </div>
            <div className="metric">
              <span className="m-label">Investido</span>
              <span className="m-value">{dinheiro(total.investido)}</span>
              <span className="m-delta">
                {business?.monthly_budget
                  ? `de ${dinheiro(Number(business.monthly_budget))} no mês`
                  : "sem teto mensal definido"}
              </span>
            </div>
            <div className="metric">
              <span className="m-label">Pessoas alcançadas</span>
              <span className="m-value">{numero(total.alcance)}</span>
              <span className="m-delta">nos últimos 7 dias</span>
            </div>
          </div>

          <section>
            <div className="section-title">
              <h2>Suas campanhas</h2>
              <a href="/campanhas">Ver todas &rarr;</a>
            </div>
            <div className="campaign-list">
              {noAr.map((c) => (
                <div className="list-row" key={c.id}>
                  <div className="lr-head">
                    <span className="lr-title">{c.name ?? "Campanha sem nome"}</span>
                    <span className="pill ok">{c.meta_status ?? "No ar"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="dash-aside">
          <section className="card noturno">
            <div className="nc-head">
              <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <path d="M9 1a5 5 0 1 0 2 8.5A5.5 5.5 0 0 1 9 1z" />
              </svg>
              Enquanto você dormia
            </div>
            {ultimaDecisao ? (
              <p>{resumoDaDecisao(ultimaDecisao.payload)}</p>
            ) : (
              <p>A IA ainda não registrou nenhuma decisão nesta semana.</p>
            )}
            <p className="nc-foot">
              <a href="/alertas">ver tudo que a IA já fez</a>
            </p>
          </section>

          <section className="command-card">
            <b className="title">Você está no comando</b>
            <p className="limit">
              {business?.monthly_budget
                ? `${dinheiro(total.investido)} de ${dinheiro(Number(business.monthly_budget))} investidos este mês · `
                : ""}
              <a href="/conta">mudar limite</a>
            </p>
            <a
              className="cta quiet"
              href="https://wa.me/5521980351531"
              target="_blank"
              rel="noopener"
            >
              Falar com uma pessoa
            </a>
            <p className="note">Gente de verdade, sem robô. Resposta em até 2 horas úteis.</p>
          </section>
        </aside>
      </div>
    </>
  );
}

function resumoDaDecisao(payload: unknown): string {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    for (const chave of ["resumo", "summary", "mensagem", "texto"]) {
      if (typeof p[chave] === "string" && p[chave]) return p[chave] as string;
    }
  }
  return "Abra os avisos para ver o detalhe.";
}

function Suporte() {
  return (
    <section className="trust support-block">
      <b>Travou em alguma parte?</b>
      Gente de verdade responde, sem robô, em até 2 horas úteis.
      <a className="wa" href="https://wa.me/5521980351531" target="_blank" rel="noopener">
        Chamar no WhatsApp &rarr;
      </a>
    </section>
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
