import { createClient } from "@/lib/supabase/server";
import { FaixaReconectar } from "@/components/ui/FaixaReconectar";
import { NumeroQueConta } from "@/components/ui/NumeroQueConta";
import { numero } from "@/lib/formato";

/**
 * Vendas — quem chegou pelo anúncio.
 *
 * A tela existe porque o produto tem um buraco que nenhuma API preenche:
 * o Meta sabe quantas conversas começaram, e mais nada. Se a conversa
 * virou venda, quem sabe é o dono do negócio. Sem perguntar a ele, o
 * cálculo de retorno é chute — e foi por isso que o herói do Início
 * deixou de falar em venda atribuída.
 *
 * ESTADO VAZIO É O CAMINHO PRINCIPAL, e hoje é o único que existe de
 * verdade: nenhuma campanha foi publicada, então ninguém chegou. A tela
 * diz isso e diz o que falta acontecer — não mostra uma lista vazia com
 * cabeçalho de tabela, que é a forma educada de dizer "deveria ter algo
 * aqui e não tem".
 *
 * O QUE AINDA NÃO EXISTE, e por que não está simulado: não há tabela de
 * conversas. O Meta não entrega a lista de quem mandou mensagem — ele
 * entrega a CONTAGEM. Para ter nome e telefone é preciso a API do
 * WhatsApp Business, que é outro produto, outro App Review e outro lote.
 * Um botão "abrir conversa" que não abre nada seria repetir a mentira que
 * a migração do onboarding matou.
 */
export default async function VendasPage() {
  const supabase = await createClient();

  const [{ data: campanhas }, { data: metricas }] = await Promise.all([
    supabase.from("campaigns").select("id, published_at, publish_state"),
    supabase.from("metrics_daily").select("conversions, date"),
  ]);

  const publicadas = (campanhas ?? []).filter((c) => c.published_at !== null);
  const conversas = (metricas ?? []).reduce((s, m) => s + Number(m.conversions ?? 0), 0);

  return (
    <>
      <FaixaReconectar />
      <div className="page-head">
        <h1>Suas vendas</h1>
        <p>
          Quem chegou até você pelo anúncio, e o que aconteceu depois. Essa parte só você sabe —
          e é a que diz se valeu a pena.
        </p>
      </div>

      {/* A FAIXA. O que grita nesta tela é quantas pessoas chegaram — é a
          razão de ela existir. Quando ninguém chegou, grita o motivo, que
          é a única coisa útil a dizer. Ver docs/padrao-visual.md §5. */}
      <section className="hero-destaque">
        <span className="eyebrow">Chegaram até você</span>
        {conversas > 0 ? (
          <>
            <NumeroQueConta valor={conversas} casas={0} className="hero-num" />
            <p className="hero-legenda">
              {conversas === 1 ? "pessoa começou" : "pessoas começaram"} uma conversa no seu
              WhatsApp
            </p>
          </>
        ) : (
          <p className="hero-frase">
            {publicadas.length === 0 ? (
              <>
                Ninguém chegou ainda porque{" "}
                <span className="destaque">nenhum anúncio foi ao ar</span>.
              </>
            ) : (
              <>
                Seu anúncio está no ar. A <span className="destaque">primeira conversa</span> ainda
                não veio.
              </>
            )}
          </p>
        )}
        <p className="hero-note">
          O Facebook consegue contar quantas conversas começaram, mas não sabe quais viraram
          venda. Essa parte só você sabe — e é a que diz se valeu a pena.
        </p>
      </section>

      <div className="dash-grid">
        <div className="dash-main">
          {publicadas.length === 0 ? (
            <NinguemChegouAinda />
          ) : conversas === 0 ? (
            <NoArSemConversa />
          ) : (
            <ConversasSemLista quantas={conversas} />
          )}
        </div>

        <aside className="dash-aside">
          {/* O bloco "por que a gente pergunta" saiu: a nota da faixa já
              diz isso, e dizer duas vezes na mesma tela enfraquece as
              duas. */}
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

/** Estado 1: nada publicado. É o estado real hoje. */
function NinguemChegouAinda() {
  return (
    <section className="empty-card">
      <div className="empty-ico">
        <svg width="34" height="34" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M17 9.5c0 3-3.1 5.5-7 5.5-.8 0-1.6-.1-2.3-.3L3 16l1.1-2.7C3.4 12.4 3 11 3 9.5 3 6.5 6.1 4 10 4s7 2.5 7 5.5z" />
        </svg>
      </div>
      <div className="empty-copy">
        {/* O título saiu daqui: a faixa acima já diz que ninguém chegou e
            por quê. Repetir a manchete logo abaixo dela é ruído. */}
        <p className="empty-head">Como vai funcionar quando o primeiro subir</p>
        <p className="empty-body">
          Quem clicar no seu anúncio cai direto numa conversa no seu WhatsApp — e é essa pessoa
          que aparece aqui. Nada é automático depois: quem responde é você, do seu jeito.
        </p>
        <a className="cta" href="/anuncios" style={{ width: "max-content" }}>
          Ver meus anúncios
        </a>
      </div>
      <ul className="empty-list">
        <li>
          <Tick />
          <span>
            <b>A conversa é sua</b> — ela abre no seu WhatsApp normal, não numa caixa de entrada
            nossa.
          </span>
        </li>
        <li>
          <Tick />
          <span>
            <b>Uma pergunta por dia</b> — a gente vai te perguntar se fechou, e é só isso. Sem
            formulário, sem planilha.
          </span>
        </li>
        <li>
          <Tick />
          <span>
            <b>Você pode não responder</b> — a pergunta some no dia seguinte e nada trava por
            causa dela.
          </span>
        </li>
      </ul>
    </section>
  );
}

/** Estado 2: no ar, mas ainda sem conversa. */
function NoArSemConversa() {
  return (
    <section className="empty-card">
      <div className="empty-copy">
        <p className="empty-head">Seu anúncio está no ar, e ainda não veio conversa.</p>
        <p className="empty-body">
          Isso é normal nos primeiros dias: o Facebook leva um tempo até entender para quem vale
          a pena mostrar. As primeiras conversas costumam aparecer em até 48 horas.
        </p>
        <p className="empty-note">
          Quando a primeira chegar, ela aparece aqui e a gente te avisa.
        </p>
      </div>
    </section>
  );
}

/**
 * Estado 3: houve conversa, mas a lista de pessoas não existe.
 *
 * O número é real e vem de `metrics_daily`. O que falta é o nome de cada
 * uma — e isso a tela diz, em vez de inventar linhas.
 */
function ConversasSemLista({ quantas }: { quantas: number }) {
  return (
    <section className="empty-card">
      <div className="empty-copy">
        <p className="empty-head">
          {numero(quantas)} {quantas === 1 ? "pessoa começou" : "pessoas começaram"} uma conversa
          com você.
        </p>
        <p className="empty-body">
          Elas estão no seu WhatsApp, nas conversas normais — a gente ainda não consegue listar
          uma por uma aqui. O Facebook informa quantas foram, mas não quem foram.
        </p>
        <a
          className="cta"
          href="https://web.whatsapp.com"
          target="_blank"
          rel="noopener"
          style={{ width: "max-content" }}
        >
          Abrir meu WhatsApp
        </a>
        <p className="empty-note">
          Estamos trabalhando para trazer a lista para cá. Enquanto isso, ela vive onde sempre
          viveu: no seu WhatsApp.
        </p>
      </div>
    </section>
  );
}

const Tick = () => (
  <span className="tick">
    <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
    </svg>
  </span>
);
