import { createClient } from "@/lib/supabase/server";
import { FaixaReconectar } from "@/components/ui/FaixaReconectar";
import { dinheiro, numero } from "@/lib/formato";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { HeroDaEtapa } from "@/components/ui/HeroDaEtapa";
import type { Etapa } from "@/lib/estado/frases";

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
 *
 * ============================================================
 * O "O QUE FALTA" NÃO É ESCRITO AQUI — vem de `estadoDoCliente()`.
 *
 * Até 20/08/2026 esta tela AFIRMAVA, sem consultar nada: a frase "Falta a
 * IA conhecer o negócio" estava escrita dentro do ramo "não existe
 * campanha" e não lia o cadastro em lugar nenhum. Numa conta com os seis
 * obrigatórios preenchidos e a execução já criada, ela era simplesmente
 * falsa — e não havia leitura para corrigir, só uma frase.
 *
 * A outra metade do defeito era a contagem: `pecas.length` contava TODA
 * linha de `creatives`, inclusive `uso = 'logo'` e inclusive arquivada.
 * Numa conta cujas duas linhas eram logos (uma removida), esta tela dizia
 * "você já tem 2 fotos guardadas" enquanto a `/conta` dizia "nenhuma foto
 * ainda". As duas liam a mesma tabela.
 * ============================================================
 */
export default async function AnunciosPage() {
  const supabase = await createClient();

  // A resposta para "o que falta" vem pronta e é a MESMA que o `/inicio` e
  // a trilha do onboarding leem. O que muda daqui para lá é o
  // enquadramento, não o fato — ver docs/estado-do-cliente.md §3.
  const estado = await estadoDoCliente(new Date());

  const [{ data: campanhas }, { data: criativos }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name, status, meta_status, published_at, publish_state, publish_error, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("creatives")
      .select("id, campaign_id, file_name, vision_description, status, meta_status, uso, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const lista = campanhas ?? [];
  const pecas = criativos ?? [];

  if (lista.length === 0) {
    return <SemAnuncioNenhum proximo={estado.proximo} fotos={estado.melhoras.fotos} />;
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
  //
  // O QUE SOBROU DE LOCAL AQUI: só a peça reprovada pela revisão do
  // Facebook. Ela é evento de LINHA — aconteceu com uma peça, tem rota
  // própria, e não é elo da cadeia: a campanha pode seguir no ar com as
  // outras peças.
  //
  // O que era calculado aqui e não é mais: "publicação falhou" e "peça
  // esperando aprovação". As duas viraram elo da cadeia
  // (`lib/estado/frases.ts`), porque as duas respondem à pergunta "o que
  // falta pra sair anúncio?" — e essa pergunta tem um dono só.
  const reprovadas = pecas.filter((p) => p.status === "rejected");

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

      {reprovadas.length > 0 ? (
        <section className="hero-destaque">
          <span className="eyebrow">Precisa de você</span>
          <p className="hero-frase">
            {reprovadas.length === 1 ? "Uma peça" : `${reprovadas.length} peças`} não{" "}
            {reprovadas.length === 1 ? "passou" : "passaram"} na{" "}
            <span className="destaque">revisão do Facebook</span>.
          </p>
          <p className="hero-note">
            Acontece com frequência e seus outros anúncios não são afetados. A IA já está
            refazendo.
          </p>
          <a className="cta cta-faixa" href="/reprovado">
            Ver o que aconteceu
          </a>
        </section>
      ) : (
        estado.proximo && <HeroDaEtapa etapa={estado.proximo} />
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

          {/* SÓ peça de anúncio. O filtro por `uso` é o conserto: sem ele,
              esta seção listava o logo do cliente sob o título "Fotos
              guardadas" — e era a mesma contagem crua que fazia a tela
              dizer "você já tem 2 fotos". As fotos do cliente moram na
              `/conta`, e é lá que elas são contadas. */}
          <PecasSemAnuncio
            pecas={pecas.filter(
              (p) =>
                p.uso === "campanha" &&
                (!p.campaign_id || !lista.some((c) => c.id === p.campaign_id)),
            )}
          />
        </div>

        <aside className="dash-aside">
          <DicasDeFoto />
          <section className="trust support-block">
            <b>Ficou com dúvida?</b>
            Gente de verdade responde, sem robô, em até 2 horas úteis.
            <a className="wa" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
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
        <span className={`pill ${campanha.published_at ? "ok" : "off"}`}>
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
 * Peças de anúncio que existem e ainda não pertencem a nenhum anúncio.
 *
 * Só aparece quando existem. Uma seção vazia permanente diria ao cliente
 * que falta alguma coisa quando não falta.
 *
 * O NOME MUDOU DE "Fotos guardadas" e a mudança é o conserto: as linhas que
 * apareciam aqui incluíam o logo e a identidade visual, que não são peça de
 * anúncio nenhuma. Quem conta foto do cliente é o `estadoDoCliente`, com
 * `uso = 'identidade'`, e quem as mostra é a `/conta`.
 */
function PecasSemAnuncio({
  pecas,
}: {
  pecas: Array<{ id: string; file_name: string | null }>;
}) {
  if (pecas.length === 0) return null;
  return (
    <section>
      <div className="section-title">
        <h2>Peças ainda sem anúncio</h2>
        <span className="grp-count">
          {pecas.length} {pecas.length === 1 ? "peça" : "peças"}
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

function SemAnuncioNenhum({
  proximo,
  fotos,
}: {
  proximo: Etapa | null;
  fotos: number;
}) {
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

              {/* O ENQUADRAMENTO É DAQUI; O FATO VEM DO ESTADO. A tela diz
                  por que o anúncio não existe — e quem sabe por quê é a
                  cadeia, não esta função. Antes havia aqui uma frase fixa
                  ("Falta a IA conhecer o negócio") que não consultava
                  nada e mentia para todo cliente com cadastro completo. */}
              {proximo ? (
                <>
                  <p className="empty-body">{proximo.titulo}</p>
                  <p className="empty-body">{proximo.corpo}</p>
                  {proximo.acao && (
                    <a className="cta" href={proximo.acao.href} style={{ width: "max-content" }}>
                      {proximo.acao.rotulo}
                    </a>
                  )}
                </>
              ) : (
                <p className="empty-body">
                  Está tudo certo do seu lado. Assim que a primeira peça ficar pronta, ela
                  aparece aqui para você aprovar.
                </p>
              )}

              <p className="empty-note">
                {fotos === 0
                  ? "Nada vai ao ar sem você aprovar antes."
                  : `Suas ${fotos} ${fotos === 1 ? "foto" : "fotos"} já estão guardadas e a IA usa quando montar a peça. Nada vai ao ar sem você aprovar antes.`}
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
