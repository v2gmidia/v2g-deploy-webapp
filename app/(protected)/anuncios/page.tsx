import { createClient } from "@/lib/supabase/server";
import { FaixaReconectar } from "@/components/ui/FaixaReconectar";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { COLUNAS_DO_JULGAMENTO, foiReprovada } from "@/lib/criativos/peca";
import { HeroDaEtapa } from "@/components/ui/HeroDaEtapa";
import { resultadoDoNegocio } from "@/lib/resultado/do-negocio";
import { diaPorExtenso } from "@/lib/formato";
import type { CampanhaNaTela } from "@/lib/resultado/do-negocio";
import type { ValorNaTela } from "@/lib/resultado/tipos";
import type { Etapa } from "@/lib/estado/frases";

/**
 * Seus anúncios — e, desde 10/09/2026, **a tela de resultado**.
 *
 * POR QUE FUNDIR: o cliente não separa a campanha do criativo. Para ele,
 * "meu anúncio" é a foto e o dinheiro por trás dela, juntos. Ter dois
 * itens de menu para isso era raciocínio de gestor de tráfego vazando na
 * interface — quem trabalha com tráfego separa porque precisa mexer nas
 * duas coisas em momentos diferentes; o dono da pizzaria olha o anúncio e
 * pergunta "está rendendo?".
 *
 * ============================================================
 * A FONTE É A API DO BACKEND. `metrics_daily` SAIU.
 *
 * Até 10/09/2026 os números desta tela vinham de `metrics_daily`, com
 * `Number(m.spend ?? 0)` somando — e essa tabela tem ZERO LINHAS. Cada
 * `?? 0` transformava "não sabemos" em "R$ 0,00 investido", que é uma
 * afirmação sobre o dinheiro do cliente, e falsa.
 *
 * Agora quem responde é `lib/resultado/do-negocio.ts`, que lê
 * `GET /negocios/{id}/consolidado` e, para cada ficha de `porExecucao`,
 * `GET /execucoes/{id}/consolidado`. **A ordem é a segurança** — ver o
 * bloco daquele arquivo.
 * ============================================================
 *
 * ============================================================
 * O QUE ESTA TELA NÃO MOSTRA MAIS, E POR QUÊ.
 *
 *   "R$ X por conversa"   custo derivado. O contrato do dashboard proíbe:
 *                         é a porta de entrada para o dono comparar com um
 *                         número que ouviu de alguém, e o produto compara
 *                         com o CPL-alvo DELE, que ainda não existe.
 *
 *   "os primeiros números  promessa de prazo. Ninguém aqui mede quando a
 *    aparecem em até 48    plataforma entrega — e o contrato é explícito:
 *    horas"                nada de prazo, desculpa, ou ação que o dono não
 *                         possa executar sozinho.
 *
 *   pílula verde/vermelha  semáforo. Sem CPL-alvo, cor é opinião fingindo
 *                         ser medida. A pílula aqui é `off` — cinza — para
 *                         TODOS os estados, sempre.
 *
 * `pnpm conferir:resultado` §10 lê este arquivo e reprova se voltarem.
 * ============================================================
 */
export default async function AnunciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A resposta para "o que falta" vem pronta e é a MESMA que o `/inicio` e
  // a trilha do onboarding leem. O que muda daqui para lá é o
  // enquadramento, não o fato — ver docs/estado-do-cliente.md §3.
  const estado = await estadoDoCliente(new Date());

  const { data: criativos } = await supabase
    .from("creatives")
    // `COLUNAS_DO_JULGAMENTO` traz `uso, status, arquivado_em` — sem
    // `arquivado_em` no select, o `foiReprovada` lá embaixo vira regra
    // inerte em silêncio.
    .select(`id, campaign_id, file_name, ${COLUNAS_DO_JULGAMENTO}`)
    .order("created_at", { ascending: false });

  const pecas = criativos ?? [];

  const resultado =
    user && estado.negocioId
      ? await resultadoDoNegocio({ businessId: estado.negocioId, profileId: user.id })
      : null;

  // ============================================================
  // "NÃO TEM CAMPANHA" E "O BACKEND ESTÁ FORA" SÃO TELAS DIFERENTES.
  //
  // Confundir os dois faria a tela dizer a um cliente pagante que ele não
  // tem anúncio nenhum porque um servidor piscou. É a mesma família da
  // `/inicio` degradando calada, que este repositório já pagou.
  // ============================================================
  if (resultado === null || resultado.estado === "sem-execucao") {
    return <SemAnuncioNenhum proximo={estado.proximo} fotos={estado.melhoras.fotos} />;
  }

  // O `foiReprovada` no lugar do `p.status === "rejected"` escrito à mão:
  // peça de campanha ARQUIVADA e reprovada vazava e continuaria aparecendo
  // em "precisa de você" para sempre. Ver docs/lote-leitura-de-peca.md §5.1.
  const reprovadas = pecas.filter(foiReprovada);

  return (
    <>
      <FaixaReconectar />
      <div className="page-head">
        <h1>Seus anúncios</h1>
        <p>Cada anúncio e o que ele produziu até agora.</p>
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
          {resultado.estado === "indisponivel" ? (
            <section className="card">
              <p className="hint">
                Não conseguimos buscar os números dos seus anúncios agora. Eles não sumiram — é
                a nossa conexão com o Facebook que não respondeu. Tente de novo daqui a pouco.
              </p>
            </section>
          ) : (
            <>
              {/* ============================================================
                  UM CARD POR CAMPANHA, E É ISSO QUE IMPEDE A SOMA ENTRE
                  MOEDAS.

                  Cada card carrega a própria moeda, vinda do topo do
                  consolidado daquela execução. Não existe totalizador nesta
                  tela — e por isso não existe o lugar onde R$ 73,25 e
                  A$ 113,45 virariam um número que não existe.
                  ============================================================ */}
              <section>
                <div className="section-title">
                  <h2>Seus anúncios</h2>
                  <span className="grp-count">
                    {resultado.campanhas.length}{" "}
                    {resultado.campanhas.length === 1 ? "anúncio" : "anúncios"}
                  </span>
                </div>
                <div className="campaign-list">
                  {resultado.campanhas.map((c) => (
                    <Campanha key={c.idExecucao} campanha={c} />
                  ))}
                </div>
              </section>

              {resultado.moedasMisturadas && (
                <p className="hint">
                  Seus anúncios cobram em moedas diferentes ({resultado.moedas.join(", ")}), então
                  eles aparecem separados. Somar um com o outro daria um número que não existe.
                </p>
              )}
            </>
          )}

          {/* SÓ peça de anúncio. O filtro por `uso` é o conserto: sem ele,
              esta seção listava o logo do cliente sob o título "Fotos
              guardadas". As fotos do cliente moram na `/conta`. */}
          <PecasSemAnuncio pecas={pecas.filter((p) => p.uso === "campanha" && !p.campaign_id)} />
        </div>

        <aside className="dash-aside">
          <DicasDeFoto />
          <section className="trust support-block">
            <b className="title">Ficou com dúvida?</b>
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

/**
 * Um número da campanha.
 *
 * ============================================================
 * PRESENTE É NÚMERO GRANDE; AUSENTE É TEXTO MIÚDO. E A DIFERENÇA VEM DO
 * CAMPO `ausente`, NUNCA DE COMPARAR O TEXTO.
 *
 * `.lr-nums b` já é o número de display desta folha de estilo, e texto
 * sem `<b>` já é miúdo e apagado. Então a distinção de TOM que o contrato
 * pede — "ausência é cinza e discreta, zero é um número como qualquer
 * outro" — sai sem uma linha de CSS nova.
 *
 * Uma tela que comparasse `texto === "ainda não sabemos"` para descobrir
 * isso quebraria no dia em que a frase mudasse.
 * ============================================================
 */
function Numero({ valor, rotulo }: { valor: ValorNaTela; rotulo: string }) {
  if (valor.ausente) {
    return (
      <span>
        {rotulo} — {valor.texto}
      </span>
    );
  }
  return (
    <span>
      <b>{valor.texto}</b> {rotulo}
    </span>
  );
}

/** O que a pílula diz. CINZA SEMPRE — ver o bloco do topo do arquivo. */
const ROTULO_DO_ESTADO = {
  "sem-campanha": "Ainda não foi ao ar",
  "sem-dado": "Sem números ainda",
  "com-dado": "Com números",
} as const;

function Campanha({ campanha }: { campanha: CampanhaNaTela }) {
  const { resultado: r } = campanha;

  return (
    <div className="list-row">
      <div className="lr-head">
        {/* `nome` vindo `null` não vira "Anúncio sem nome": inventar rótulo
            para ausência é o mesmo defeito de inventar zero para ausência. */}
        {campanha.nome && <span className="lr-title">{campanha.nome}</span>}
        <span className="pill off">{ROTULO_DO_ESTADO[campanha.estado]}</span>
      </div>

      {/* CANAL SÓ APARECE SE VIER. `canal_confirmado` é `null` nas duas
          execuções da V2G, medido em 10/09/2026 — e `null` não vira
          "Facebook" por palpite. Está na lista de pedidos ao backend. */}
      {(campanha.canal || r.periodoComDado) && (
        <p className="lr-fresh">
          {campanha.canal}
          {campanha.canal && r.periodoComDado ? " · " : ""}
          {r.periodoComDado &&
            (r.periodoComDado.desde === r.periodoComDado.ate
              ? diaPorExtenso(r.periodoComDado.desde)
              : `${diaPorExtenso(r.periodoComDado.desde)} a ${diaPorExtenso(r.periodoComDado.ate)}`)}
        </p>
      )}

      <div className="lr-nums">
        <Numero valor={r.bloco.investido} rotulo="investido" />
        <Numero valor={r.bloco.cliques} rotulo="cliques" />
        <Numero valor={r.bloco.impressoes} rotulo="vezes que apareceu" />
        <Numero valor={r.bloco.pessoas} rotulo="pessoas que chegaram" />
      </div>

      {/* ============================================================
          A FRASE É DO BACKEND, INTEIRA.

          Esta tela não traduz o nível e não tem tabela de frase nenhuma.
          `nivelFrase` vindo `null` não vira frase de degradação escrita
          aqui — vira silêncio, que é honesto. Ver `lib/resultado/nivel.ts`.
          ============================================================ */}
      {r.nivelFrase && <p className="lr-pecas">{r.nivelFrase}</p>}
    </div>
  );
}

/**
 * Peças de anúncio que existem e ainda não pertencem a nenhum anúncio.
 *
 * ============================================================
 * ELA NÃO SE LIGA MAIS À CAMPANHA, e a perda está dita aqui.
 *
 * `creatives.campaign_id` aponta para `campaigns.id`, do banco do webapp.
 * A campanha que esta tela mostra agora é a EXECUÇÃO do backend, com id
 * de outro espaço. Não há chave que ligue as duas — então a foto que
 * aparecia dentro do card do anúncio não tem mais onde aparecer.
 *
 * Ligar as duas exigiria o backend devolver o `campaign_id` local na
 * ficha da execução. **Está na lista de pedidos.** Até lá, a seção
 * abaixo é a única que fala de peça, e ela não afirma vínculo nenhum.
 * ============================================================
 */
function PecasSemAnuncio({ pecas }: { pecas: Array<{ id: string; file_name: string | null }> }) {
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

function SemAnuncioNenhum({ proximo, fotos }: { proximo: Etapa | null; fotos: number }) {
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
                  cadeia, não esta função. */}
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
            <b className="title">Sua privacidade</b>
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
