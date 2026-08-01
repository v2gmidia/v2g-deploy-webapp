import { createClient } from "@/lib/supabase/server";
import { dinheiro, numero, retornoPorReal } from "@/lib/formato";

/**
 * Suas campanhas — porte de `tela-06-campanhas-desktop.html`.
 *
 * ESTADO VAZIO COMO CAMINHO PRINCIPAL: sem campanha nenhuma, a tela
 * explica o que falta para a primeira existir, em vez de mostrar uma
 * lista vazia.
 *
 * Quando houver campanha, o agrupamento do protótipo é respeitado —
 * "Esperando você" antes de "No ar" — porque o que pede ação da pessoa
 * vem primeiro. Os números por campanha saem de `metrics_daily`
 * agregado; campanha sem métrica aparece sem número, não com zero
 * (zero é um resultado, "ainda não mediu" é outro).
 */
export default async function CampanhasPage() {
  const supabase = await createClient();

  const { data: campanhas } = await supabase
    .from("campaigns")
    .select("id, name, status, meta_status, published_at, created_at")
    .order("created_at", { ascending: false });

  const lista = campanhas ?? [];

  if (lista.length === 0) {
    return (
      <>
        <Cabecalho />
        <div className="dash-grid">
          <div className="dash-main">
            <section className="empty-card">
              <div className="empty-ico">
                <svg width="34" height="34" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M3 8v4h3l8 4V4L6 8H3z" />
                  <path d="M16 8a3 3 0 0 1 0 4" />
                </svg>
              </div>
              <div className="empty-copy">
                <p className="empty-head">Sua primeira campanha ainda não existe.</p>
                <p className="empty-body">
                  Ela nasce depois que a IA lê o que você contou sobre o negócio e monta a
                  estrutura de anúncios. Nada vai ao ar sem você aprovar antes — texto e foto,
                  um de cada vez.
                </p>
                <a className="cta" href="/onboarding" style={{ width: "max-content" }}>
                  Contar sobre o meu negócio
                </a>
                <p className="empty-note">São quatro perguntas. Dá para parar no meio e voltar depois.</p>
              </div>
              <ul className="empty-list">
                <li>
                  <Tick />
                  <span>
                    <b>Você aprova cada peça</b> — o texto e a arte passam por você antes de
                    qualquer anúncio aparecer.
                  </span>
                </li>
                <li>
                  <Tick />
                  <span>
                    <b>Pausar mora dentro da campanha</b> — nunca solto numa lista, para não ser
                    clicado sem querer.
                  </span>
                </li>
                <li>
                  <Tick />
                  <span>
                    <b>O teto é seu</b> — a IA nunca passa do limite mensal que você definiu.
                  </span>
                </li>
              </ul>
            </section>
          </div>

          <aside className="dash-aside">
            <section className="trust support-block">
              <b>Ficou com dúvida?</b>
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

  // Métricas por campanha, para os números da lista.
  const { data: metricas } = await supabase
    .from("metrics_daily")
    .select("campaign_id, spend, conversions, revenue");

  const porCampanha = new Map<string, { investido: number; vendas: number; receita: number }>();
  for (const m of metricas ?? []) {
    if (!m.campaign_id) continue;
    const atual = porCampanha.get(m.campaign_id) ?? { investido: 0, vendas: 0, receita: 0 };
    atual.investido += Number(m.spend ?? 0);
    atual.vendas += Number(m.conversions ?? 0);
    atual.receita += Number(m.revenue ?? 0);
    porCampanha.set(m.campaign_id, atual);
  }

  const noAr = lista.filter((c) => c.published_at !== null);
  const esperando = lista.filter((c) => c.published_at === null);

  return (
    <>
      <Cabecalho />
      <div className="dash-grid">
        <div className="dash-main">
          {esperando.length > 0 && (
            <section>
              <div className="section-title">
                <h2>
                  <span className="grp-dot wait" />
                  Esperando você
                </h2>
                <span className="grp-count">
                  {esperando.length} {esperando.length === 1 ? "campanha" : "campanhas"}
                </span>
              </div>
              <div className="campaign-list">
                {esperando.map((c) => (
                  <Linha key={c.id} campanha={c} numeros={porCampanha.get(c.id)} />
                ))}
              </div>
            </section>
          )}

          {noAr.length > 0 && (
            <section>
              <div className="section-title">
                <h2>
                  <span className="grp-dot live" />
                  No ar
                </h2>
                <span className="grp-count">
                  {noAr.length} {noAr.length === 1 ? "campanha" : "campanhas"}
                </span>
              </div>
              <div className="campaign-list">
                {noAr.map((c) => (
                  <Linha key={c.id} campanha={c} numeros={porCampanha.get(c.id)} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="dash-aside">
          <section className="trust support-block">
            <b>Ficou com dúvida?</b>
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

function Cabecalho() {
  return (
    <div className="page-head">
      <h1>Suas campanhas</h1>
      <p>
        A lista, organizada por quem precisa de você agora. Pausar mora dentro de cada campanha,
        nunca solto numa lista rolável.
      </p>
    </div>
  );
}

interface LinhaProps {
  campanha: {
    id: string;
    name: string | null;
    status: string;
    meta_status: string | null;
    published_at: string | null;
  };
  numeros?: { investido: number; vendas: number; receita: number };
}

function Linha({ campanha, numeros }: LinhaProps) {
  const retorno = numeros ? retornoPorReal(numeros.receita, numeros.investido) : null;

  return (
    <div className="list-row">
      <div className="lr-head">
        <span className="lr-title">{campanha.name ?? "Campanha sem nome"}</span>
        <span className={`pill ${classeDoStatus(campanha)}`}>{rotuloDoStatus(campanha)}</span>
      </div>

      {numeros && numeros.investido > 0 ? (
        <div className="lr-nums">
          {retorno !== null && (
            <span>
              <b>{dinheiro(retorno)}</b> voltaram por R$1
            </span>
          )}
          <span>
            <b>{numero(numeros.vendas)}</b> vendas
          </span>
          <span>
            <b>{dinheiro(numeros.investido)}</b> investido
          </span>
        </div>
      ) : (
        <div className="lr-nums">
          <span>
            {campanha.published_at
              ? "No ar há pouco tempo — os primeiros números aparecem em até 48 horas."
              : "Ainda não foi ao ar, então não há número para mostrar."}
          </span>
        </div>
      )}
    </div>
  );
}

function rotuloDoStatus(c: { status: string; meta_status: string | null; published_at: string | null }): string {
  if (c.meta_status) return c.meta_status;
  if (c.published_at) return "No ar";
  if (c.status === "draft") return "Aguardando sua aprovação";
  return c.status;
}

function classeDoStatus(c: { published_at: string | null }): string {
  return c.published_at ? "ok" : "neutral";
}

const Tick = () => (
  <span className="tick">
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  </span>
);
