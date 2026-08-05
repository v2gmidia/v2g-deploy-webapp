import { createClient } from "@/lib/supabase/server";
import { FaixaReconectar } from "@/components/ui/FaixaReconectar";
import { dinheiro, numero } from "@/lib/formato";

/**
 * Seus anúncios — a fusão de `/campanhas` e `/criativos`.
 *
 * POR QUE FUNDIR: o cliente não separa a campanha do criativo. Para ele,
 * "meu anúncio" é a foto e o dinheiro por trás dela, juntos. Ter dois
 * itens de menu para isso era raciocínio de gestor de tráfego vazando na
 * interface — quem trabalha com tráfego separa porque precisa mexer nas
 * duas coisas em momentos diferentes; o dono da pizzaria olha o anúncio e
 * pergunta "está rendendo?".
 *
 * A tela mantém as duas leituras, mas numa hierarquia só: o anúncio no
 * topo, com o número que ele produziu, e a foto como parte dele.
 *
 * ESTADO VAZIO COMO CAMINHO PRINCIPAL: sem anúncio nenhum, a tela explica
 * o que falta para o primeiro existir, em vez de mostrar lista vazia.
 */
export default async function AnunciosPage() {
  const supabase = await createClient();

  const [{ data: campanhas }, { data: criativos }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, status, meta_status, published_at, publish_state, publish_error, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("creatives")
      .select("id, campaign_id, file_name, vision_description, status, meta_status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const lista = campanhas ?? [];
  const pecas = criativos ?? [];

  if (lista.length === 0) {
    return <SemAnuncioNenhum temFoto={pecas.length > 0} quantasFotos={pecas.length} />;
  }

  const { data: metricas } = await supabase
    .from("metrics_daily")
    .select("campaign_id, spend, conversions");

  const porCampanha = new Map<string, { investido: number; conversas: number }>();
  for (const m of metricas ?? []) {
    if (!m.campaign_id) continue;
    const atual = porCampanha.get(m.campaign_id) ?? { investido: 0, conversas: 0 };
    atual.investido += Number(m.spend ?? 0);
    // `conversions` guarda conversa iniciada, não venda. Ver a nota em
    // app/(protected)/inicio/page.tsx.
    atual.conversas += Number(m.conversions ?? 0);
    porCampanha.set(m.campaign_id, atual);
  }

  const pecasPorCampanha = new Map<string, typeof pecas>();
  for (const p of pecas) {
    if (!p.campaign_id) continue;
    pecasPorCampanha.set(p.campaign_id, [...(pecasPorCampanha.get(p.campaign_id) ?? []), p]);
  }

  // Quem precisa de você vem antes de quem já está rodando.
  const esperando = lista.filter((c) => c.published_at === null);
  const noAr = lista.filter((c) => c.published_at !== null);

  // FAIXA CONDICIONAL. O conteúdo normal desta tela é uma lista, e lista
  // não grita — faixa permanente aqui viraria moldura decorativa. Ela só
  // aparece quando alguma coisa espera o cliente AGORA.
  // Ver docs/padrao-visual.md §5.
  const falhou = lista.filter((c) => c.publish_state === "failed");
  const reprovadas = pecas.filter((p) => p.status === "rejected");
  const aprovar = pecas.filter((p) => p.status === "draft");

  const pendencia =
    falhou.length > 0
      ? {
          eyebrow: "Precisa de você",
          frase: (
            <>
              Uma publicação <span className="destaque">não deu certo</span>.
            </>
          ),
          nota: "Nada foi ativado e nenhuma verba foi gasta. O motivo está na linha do anúncio, logo abaixo.",
          href: null,
          rotulo: null,
        }
      : reprovadas.length > 0
        ? {
            eyebrow: "Precisa de você",
            frase: (
              <>
                {reprovadas.length === 1 ? "Uma peça" : `${reprovadas.length} peças`} não{" "}
                {reprovadas.length === 1 ? "passou" : "passaram"} na{" "}
                <span className="destaque">revisão do Facebook</span>.
              </>
            ),
            nota: "Acontece com frequência e seus outros anúncios não são afetados. A IA já está refazendo.",
            href: "/reprovado",
            rotulo: "Ver o que aconteceu",
          }
        : aprovar.length > 0
          ? {
              eyebrow: "Esperando você",
              frase: (
                <>
                  Tem peça <span className="destaque">esperando sua aprovação</span>.
                </>
              ),
              nota: "Nada vai ao ar sem você dizer que sim — texto e foto, um de cada vez.",
              href: "/aprovar",
              rotulo: "Ver a peça",
            }
          : null;

  return (
    <>
      <FaixaReconectar />
      <div className="page-head">
        <h1>Seus anúncios</h1>
        <p>
          Cada anúncio com a foto que ele usa e o que ele produziu até agora. Primeiro os que
          esperam alguma coisa de você.
        </p>
      </div>

      {pendencia && (
        <section className="hero-destaque">
          <span className="eyebrow">{pendencia.eyebrow}</span>
          <p className="hero-frase">{pendencia.frase}</p>
          <p className="hero-note">{pendencia.nota}</p>
          {pendencia.href && (
            <a className="cta" href={pendencia.href} style={{ marginTop: 22, width: "max-content" }}>
              {pendencia.rotulo}
            </a>
          )}
        </section>
      )}

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
                  {esperando.length} {esperando.length === 1 ? "anúncio" : "anúncios"}
                </span>
              </div>
              <div className="campaign-list">
                {esperando.map((c) => (
                  <Linha
                    key={c.id}
                    campanha={c}
                    numeros={porCampanha.get(c.id)}
                    pecas={pecasPorCampanha.get(c.id) ?? []}
                  />
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
                  {noAr.length} {noAr.length === 1 ? "anúncio" : "anúncios"}
                </span>
              </div>
              <div className="campaign-list">
                {noAr.map((c) => (
                  <Linha
                    key={c.id}
                    campanha={c}
                    numeros={porCampanha.get(c.id)}
                    pecas={pecasPorCampanha.get(c.id) ?? []}
                  />
                ))}
              </div>
            </section>
          )}

          {/* O aviso de peça reprovada subiu para a faixa condicional lá
              em cima. Ele era um segundo bloco de destaque no meio da
              lista, competindo com ela — e a regra é uma coisa gritando
              por tela. A rota /reprovado continua alcançável pelo botão
              da faixa. */}

          <SemCampanhaAssociada
            pecas={pecas.filter((p) => !p.campaign_id || !lista.some((c) => c.id === p.campaign_id))}
          />
        </div>

        <aside className="dash-aside">
          <DicasDeFoto />
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

interface LinhaProps {
  campanha: {
    id: string;
    name: string | null;
    status: string;
    meta_status: string | null;
    published_at: string | null;
    publish_state: string;
    publish_error: string | null;
  };
  numeros?: { investido: number; conversas: number };
  pecas: Array<{ id: string; file_name: string | null; status: string }>;
}

function Linha({ campanha, numeros, pecas }: LinhaProps) {
  const custoPorConversa =
    numeros && numeros.conversas > 0 ? numeros.investido / numeros.conversas : null;

  return (
    <div className="list-row">
      <div className="lr-head">
        <span className="lr-title">{campanha.name ?? "Anúncio sem nome"}</span>
        <span className={`pill ${campanha.published_at ? "ok" : "neutral"}`}>
          {rotuloDoStatus(campanha)}
        </span>
      </div>

      {/* A publicação que falhou não some: sem isto, o cliente vê um
          anúncio parado e nenhuma explicação. */}
      {campanha.publish_state === "failed" && campanha.publish_error && (
        <p className="lr-erro">{campanha.publish_error}</p>
      )}

      {numeros && numeros.investido > 0 ? (
        <div className="lr-nums">
          <span>
            <b>{numero(numeros.conversas)}</b>{" "}
            {numeros.conversas === 1 ? "conversa" : "conversas"}
          </span>
          {custoPorConversa !== null && (
            <span>
              <b>{dinheiro(custoPorConversa)}</b> por conversa
            </span>
          )}
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

      {pecas.length > 0 && (
        <p className="lr-pecas">
          {pecas.length === 1 ? "Foto: " : "Fotos: "}
          {pecas.map((p) => p.file_name ?? "sem nome").join(", ")}
        </p>
      )}
    </div>
  );
}

function rotuloDoStatus(c: {
  status: string;
  meta_status: string | null;
  published_at: string | null;
  publish_state: string;
}): string {
  if (c.publish_state === "failed") return "Não conseguimos publicar";
  if (c.publish_state === "publishing") return "Publicando…";
  if (c.meta_status) return c.meta_status;
  if (c.published_at) return "No ar";
  if (c.status === "draft") return "Aguardando sua aprovação";
  return c.status;
}

/**
 * Fotos que existem mas ainda não pertencem a nenhum anúncio.
 *
 * Só aparece quando existem. Uma seção vazia permanente diria ao cliente
 * que falta alguma coisa quando não falta.
 */
function SemCampanhaAssociada({
  pecas,
}: {
  pecas: Array<{ id: string; file_name: string | null }>;
}) {
  if (pecas.length === 0) return null;
  return (
    <section>
      <div className="section-title">
        <h2>Fotos guardadas</h2>
        <span className="grp-count">
          {pecas.length} {pecas.length === 1 ? "foto" : "fotos"}
        </span>
      </div>
      <div className="card">
        {pecas.map((p) => (
          <div className="log-row" key={p.id}>
            {p.file_name ?? "Arquivo sem nome"}
          </div>
        ))}
      </div>
      <p className="hint">
        Ainda não estão em nenhum anúncio. A IA usa elas quando montar a próxima peça.
      </p>
    </section>
  );
}

function SemAnuncioNenhum({ temFoto, quantasFotos }: { temFoto: boolean; quantasFotos: number }) {
  return (
    <>
      <FaixaReconectar />
      <div className="page-head">
        <h1>Seus anúncios</h1>
        <p>Aqui ficam seus anúncios: a foto, o texto e o que cada um produziu.</p>
      </div>

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
              <p className="empty-head">Seu primeiro anúncio ainda não existe.</p>
              <p className="empty-body">
                Ele nasce depois que a IA lê o que você contou sobre o negócio e monta a peça —
                foto e texto. Nada vai ao ar sem você aprovar antes.
              </p>
              <a className="cta" href="/onboarding" style={{ width: "max-content" }}>
                Contar sobre o meu negócio
              </a>
              <p className="empty-note">
                {temFoto
                  ? `Você já tem ${quantasFotos} ${quantasFotos === 1 ? "foto guardada" : "fotos guardadas"}. Falta a IA conhecer o negócio para montar o anúncio.`
                  : "São quatro perguntas. Dá para parar no meio e voltar depois."}
              </p>
            </div>
            <ul className="empty-list">
              <li>
                <Tick />
                <span>
                  <b>Você aprova cada peça</b> — o texto e a foto passam por você antes de
                  qualquer anúncio aparecer.
                </span>
              </li>
              <li>
                <Tick />
                <span>
                  <b>Pausar mora dentro do anúncio</b> — nunca solto numa lista, para não ser
                  clicado sem querer.
                </span>
              </li>
              <li>
                <Tick />
                <span>
                  <b>O teto é seu</b> — no fim do mês, o gasto fecha no limite que você definiu.
                </span>
              </li>
            </ul>
          </section>
        </div>

        <aside className="dash-aside">
          <DicasDeFoto />
          <section className="trust support-block">
            <b>Sua privacidade</b>
            Suas fotos são usadas só para criar os seus anúncios. Nada é compartilhado com outras
            empresas, e você pode tirar qualquer foto de circulação quando quiser.
          </section>
        </aside>
      </div>
    </>
  );
}

function DicasDeFoto() {
  return (
    <div className="tips-card">
      <p className="tips-title">3 coisas que ajudam sua foto a ir mais longe</p>
      <ul className="tips-list">
        <li>
          <Tick />
          Luz natural, de dia, perto de uma janela.
        </li>
        <li>
          <Tick />O produto ocupando o centro da imagem.
        </li>
        <li>
          <Tick />
          Sem textos ou adesivos em cima da foto — a IA adiciona o que for preciso depois.
        </li>
      </ul>
    </div>
  );
}

const Tick = () => (
  <span className="tick">
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  </span>
);
