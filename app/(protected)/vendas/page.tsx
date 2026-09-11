import { createClient } from "@/lib/supabase/server";
import { FaixaReconectar } from "@/components/ui/FaixaReconectar";
import { NumeroQueConta } from "@/components/ui/NumeroQueConta";
import { numero } from "@/lib/formato";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { resultadoDoNegocio } from "@/lib/resultado/do-negocio";
import { esteveNoAr, fraseDeVeiculacao } from "@/lib/veiculacao/estado";
import type { EstadoDeVeiculacao } from "@/lib/veiculacao/estado";

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
 *
 * ============================================================
 * A FONTE SAIU DA `metrics_daily` EM 10/09/2026.
 *
 * Ela lia `conversions` com `Number(m.conversions ?? 0)`, de uma tabela
 * com ZERO LINHAS, e o `?? 0` fazia "não sabemos" virar "ninguém
 * chegou" — que esta tela então afirmava na manchete, em letra grande.
 *
 * Agora a contagem vem de `pessoas_que_chegaram` do consolidado, e ela
 * passa pela trava de `pessoas_que_chegaram_medido`: **enquanto a
 * plataforma não PROVAR que conta contato, o número é `null` e a tela diz
 * que não sabe** em vez de dizer que foi zero. Ver `lib/resultado/ler.ts`.
 *
 * Consequência hoje, e ela é correta: `medido` vem `null` nas campanhas
 * reais, então esta tela não afirma mais "ninguém chegou". Ela diz que a
 * medição ainda não está de pé.
 * ============================================================
 */
export default async function VendasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const estado = await estadoDoCliente(new Date());
  const resultado =
    user && estado.negocioId
      ? await resultadoDoNegocio({ businessId: estado.negocioId, profileId: user.id })
      : null;

  const campanhas = resultado?.campanhas ?? [];

  // ============================================================
  // "FOI AO AR" DEIXOU DE SER INFERÊNCIA DESTA TELA. ITEM B3.
  //
  // Era `campanhas.filter((c) => c.estado !== "sem-campanha")` — ou seja,
  // esta tela deduzia veiculação a partir do `status` do pipeline, a
  // mesma inferência que `lib/resultado/do-negocio.ts` declara, por
  // escrito, incapaz de distinguir no ar de pausada.
  //
  // O estrago era concreto e estava em produção: na conta da V2G o
  // anúncio rodou e a Meta o mantém em `PAUSED`, e esta tela dizia "Seu
  // anúncio está no ar" — duas vezes — enquanto a `/alertas` dizia
  // "Seus anúncios ainda não estão no ar" sobre a mesma conta.
  //
  // Agora vem de `estado.veiculacao`, que é a fonte única.
  // ============================================================
  const veiculacao = estado.veiculacao;

  // ============================================================
  // SOMA DE CONTAGEM, E SO DE CONTAGEM.
  //
  // Pessoa e pessoa em qualquer moeda, entao isto pode somar entre
  // campanhas - ao contrario do dinheiro, que nunca soma entre moedas.
  //
  // `null` quando NENHUMA campanha tem medicao provada, e `null` aqui e
  // "nao sabemos", nunca "zero".
  // ============================================================
  const medidas = campanhas
    .map((c) => c.resultado.pessoasQueChegaram)
    .filter((n): n is number => n !== null);
  const conversas = medidas.length === 0 ? null : medidas.reduce((a, b) => a + b, 0);

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
        {conversas !== null && conversas > 0 ? (
          <>
            <NumeroQueConta valor={conversas} casas={0} className="hero-num" />
            <p className="hero-legenda">
              {conversas === 1 ? "pessoa começou" : "pessoas começaram"} uma conversa no seu
              WhatsApp
            </p>
          </>
        ) : (
          <p className="hero-frase">
            {/* ============================================================
                A FRASE DE VEICULAÇÃO VEM DO BANCO DE FRASES, INTEIRA.

                As três variações abaixo diferem no que esta tela tem a
                dizer sobre CONTAGEM — que é o assunto dela. A parte sobre
                o ar é sempre a mesma string, vinda de um lugar só, e é
                por isso que ela não pode mais contradizer a `/alertas`.

                O `<span className="destaque">` ficou só no pedaço de
                contagem: destacar dentro da frase do módulo exigiria
                fatiá-la aqui, e fatiar texto de outro dono é como uma
                frase volta a ter dois autores.
                ============================================================ */}
            {!esteveNoAr(veiculacao) ? (
              <>{fraseDeVeiculacao(veiculacao, "manchete")} Ninguém chegou por ele ainda.</>
            ) : conversas === null ? (
              // A AFIRMAÇÃO QUE ESTA TELA NÃO PODE FAZER. Com o anúncio no
              // ar e a medição não provada, "a primeira conversa ainda não
              // veio" é um zero que mente: pode ter vindo e ninguém estar
              // contando. Ver o bloco do topo do arquivo.
              <>
                {fraseDeVeiculacao(veiculacao, "manchete")} A gente{" "}
                <span className="destaque">ainda não consegue contar</span> quem chegou por ele.
              </>
            ) : (
              <>
                {fraseDeVeiculacao(veiculacao, "manchete")} A{" "}
                <span className="destaque">primeira conversa</span> ainda não veio.
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
          {!esteveNoAr(veiculacao) ? (
            <NinguemChegouAinda />
          ) : conversas === null || conversas === 0 ? (
            <NoArSemConversa aindaNaoConta={conversas === null} veiculacao={veiculacao} />
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

/**
 * Estado 2: no ar, e sem conversa para mostrar.
 *
 * ============================================================
 * DUAS CAUSAS OPOSTAS, E A TELA NÃO PODE DIZER A ERRADA.
 *
 *   medido = true, contagem 0   veio zero, e é um resultado
 *   medido != true              não dá para afirmar que veio zero
 *
 * A PROMESSA DE 48 HORAS SAIU. Ela dizia "as primeiras conversas costumam
 * aparecer em até 48 horas" — prazo que ninguém aqui mede, para um evento
 * que a gente nem consegue contar ainda. O contrato do dashboard é
 * explícito sobre o que não acrescentar: prazo, desculpa, ou ação que o
 * dono não pode executar sozinho.
 * ============================================================
 */
function NoArSemConversa({
  aindaNaoConta,
  veiculacao,
}: {
  aindaNaoConta: boolean;
  veiculacao: EstadoDeVeiculacao;
}) {
  // A frase do ar vem do módulo; o que este componente escreve é o que
  // ele sabe sobre CONTAGEM. Antes as duas estavam grudadas na mesma
  // string — e era assim que "está no ar" sobrevivia a um anúncio pausado.
  const noAr = fraseDeVeiculacao(veiculacao, "manchete");

  return (
    <section className="empty-card">
      <div className="empty-copy">
        {aindaNaoConta ? (
          <>
            <p className="empty-head">
              {noAr} A contagem de quem chega ainda não está de pé.
            </p>
            <p className="empty-body">
              Falta terminar de configurar o que conta um contato vindo do anúncio. Enquanto
              isso, a gente prefere não dizer um número — dizer zero seria afirmar que ninguém
              chegou, e a gente não sabe disso. É trabalho nosso, e já está em andamento.
            </p>
          </>
        ) : (
          <>
            <p className="empty-head">{noAr} Ainda não veio conversa.</p>
            <p className="empty-body">
              Isso é normal nos primeiros dias: o Facebook leva um tempo até entender para quem
              vale a pena mostrar.
            </p>
            <p className="empty-note">
              Quando a primeira chegar, ela aparece aqui e a gente te avisa.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

/**
 * Estado 3: houve conversa, mas a lista de pessoas não existe.
 *
 * O número é real e vem de `pessoas_que_chegaram` do consolidado, já
 * travado por `pessoas_que_chegaram_medido`. O que falta é o nome de cada
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
