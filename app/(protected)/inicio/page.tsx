import { createClient } from "@/lib/supabase/server";
import { FaixaReconectar } from "@/components/ui/FaixaReconectar";
import { NumeroQueConta } from "@/components/ui/NumeroQueConta";
import { dinheiro, numero } from "@/lib/formato";
import {
  contagemOuAusencia,
  dinheiroOuAusencia,
  frasePorRealInvestido,
} from "@/lib/dia-seguinte/exibir";
import { diaDeOntemEmSaoPaulo } from "@/lib/dia-seguinte/dia";
import { diasAtrasados } from "@/lib/dia-seguinte/dias-em-aberto";
import { PerguntaDoDia } from "./PerguntaDoDia";
import { estadoDoCliente } from "@/lib/estado/cliente";
import { HeroDaEtapa } from "@/components/ui/HeroDaEtapa";
import { estadoNaLista, posicoesDaCadeia, type Etapa } from "@/lib/estado/frases";

/**
 * Início / dashboard — porte de `tela-05-dashboard-desktop.html`.
 *
 * ============================================================
 * ESTA TELA NÃO DECIDE MAIS O QUE FALTA. Ela mostra.
 *
 * Até 20/08/2026 ela decidia duas vezes, em dois lugares do mesmo
 * arquivo: um `<BlocoPendencias>` lendo `resumirPendencias`, e trinta
 * linhas abaixo um herói lendo `Object.keys(respostas).length >= 5`. As
 * duas falavam do mesmo assunto e podiam discordar — e discordavam. O
 * contador de chaves era o pior dos dois: ele lia o jsonb CRU, sem
 * `migrarChaves`, então cinco chaves do formato antigo (`"0".."4"`)
 * bastavam para a tela afirmar "a IA já sabe o essencial" a um negócio
 * sem nome e sem descrição. Medido em conta real em 20/08.
 *
 * Agora a única fonte é `estadoDoCliente()`, e o que esta tela escolhe é
 * FORMA, não fato: o `proximo` vai no herói, o resto da cadeia vira lista
 * secundária. Se a frase que você precisa não existe no estado, o lugar
 * de acrescentá-la é `lib/estado/frases.ts` — não aqui.
 * ============================================================
 *
 * OS TRÊS CORPOS DA TELA seguem existindo, e o do meio é o que mais
 * importa:
 *
 * 1. Sem campanha — a pessoa acabou de entrar.
 * 2. Campanha no ar, sem número — o "dia zero". O texto dele mora agora na
 *    etapa `numeros`, e é o herói que o mostra quando é a vez do Facebook.
 *    O comportamento mais destrutivo do cliente ansioso é pausar tudo no
 *    dia 3, justamente quando o aprendizado ia terminar.
 * 3. Com número — o dashboard de verdade, de `metrics_daily`.
 */

/**
 * O resto do caminho — a cadeia, sem peso.
 *
 * Existe para a pessoa saber que há uma sequência e onde ela está nela. O
 * que ela deve FAZER agora é o herói; isto é o mapa. Etapa concluída fica
 * na lista, marcada: sumir com ela encolheria a lista a cada visita e
 * tiraria justamente a sensação de ter andado.
 *
 * ============================================================
 * DUAS COISAS QUE ESTA LISTA ERRAVA, e as duas viraram regra em
 * `lib/estado/frases.ts` para não voltarem por outra tela:
 *
 * 1. Ela lia `etapa.titulo`, que é CHAMADO DE AÇÃO, e pareava com estado:
 *    "Falta conectar sua conta · Já está feito", duas vozes e uma
 *    contradição na mesma linha. Agora lê `etapa.nome`, que é substantivo
 *    e funciona nos três estados.
 * 2. Ela decidia por `etapa.concluida`, que é dois estados onde há três —
 *    e escrevia "Já está feito" para etapas que nunca aconteceram. Agora
 *    quem decide é a POSIÇÃO em relação à atual.
 * ============================================================
 */
function RestoDoCaminho({ etapas, atual }: { etapas: Etapa[]; atual: Etapa }) {
  const outras = posicoesDaCadeia(etapas, atual).filter((p) => p.posicao !== "atual");
  if (outras.length === 0) return null;

  return (
    <section>
      <div className="section-title">
        <h2>O resto do caminho</h2>
      </div>
      <div className="card acct-list">
        {outras.map(({ etapa, posicao }) => (
          <div className="acct-row" key={etapa.id}>
            <span className="ar-text">
              <b>{etapa.nome}</b>
              <span>{estadoNaLista(etapa, posicao)}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function InicioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // UMA leitura, uma resposta. O `agora` é parâmetro até o fim da cadeia.
  const agora = new Date();
  const estado = await estadoDoCliente(agora);

  const { data: ultimaDecisao } = await supabase
    .from("decisions")
    .select("kind, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { proximo, resultado, temNumero } = estado;

  // ============================================================
  // O CARD DA PERGUNTA DIÁRIA APARECE NAS DUAS TELAS DA `/inicio`.
  //
  // E isso não é redundância — é o que impede um ciclo fechado. A tela de
  // resultado só é alcançada com `temNumero`, e hoje `temNumero` só fica
  // verdadeiro quando o acumulado tem dado — que só existe DEPOIS de ele
  // responder. Card só na tela de resultado seria uma porta trancada por
  // dentro: ele nunca chegaria lá para poder responder a primeira vez.
  //
  // O dia é ONTEM, no fuso de São Paulo — ver `lib/dia-seguinte/dia.ts`.
  // ============================================================
  const diaDaPergunta = diaDeOntemEmSaoPaulo(agora);
  const linhaDeOntem = estado.diaSeguinte.acumulado?.dias.find(
    (d) => d.dia === diaDaPergunta,
  );
  const vendasDeOntem = linhaDeOntem?.viraramVenda ?? null;
  const receitaDeOntem = linhaDeOntem?.voltouCentavos ?? null;

  // ============================================================
  // OS DIAS QUE ELE PERDEU — por subtração de calendário.
  //
  // Não dá para ler "a quem a pergunta foi feita": o backend tem
  // `execucoes_de_rotina` com chave `(tarefa, dia)`, mas ela registra que a
  // ROTINA rodou, não que a pergunta chegou a um cliente. O registro por
  // cliente foi pedido e não existe (03/09).
  //
  // Toda a dedução mora em `diasAtrasados`, uma função só — para o dia em
  // que o registro existir, a troca custar um arquivo. Ver o bloco dela.
  // ============================================================
  // Sem execução não há card (a condição de baixo), logo não há atrasado a
  // oferecer — e o `idExecucao` que a lista vai passar a usar como chave
  // só existe aqui dentro. Ver o bloco PARA A TROCA em `diasAtrasados`.
  const execucaoDoDia = estado.diaSeguinte.execucao;
  const atrasados = execucaoDoDia
    ? await diasAtrasados({
        idExecucao: execucaoDoDia.idExecucao,
        consolidado: estado.diaSeguinte.acumulado,
        ontem: diaDaPergunta,
      })
    : [];

  // Os valores já gravados de cada atrasado, para o campo nascer cheio
  // quando ele abrir — mesma regra do card de ontem.
  const valoresPorDia: Record<string, { vendas: number | null; receita: number | null }> = {};
  for (const d of atrasados) {
    const linha = estado.diaSeguinte.acumulado?.dias.find((x) => x.dia === d);
    valoresPorDia[d] = {
      vendas: linha?.viraramVenda ?? null,
      receita: linha?.voltouCentavos ?? null,
    };
  }

  // ============================================================
  // O CARD FICA MESMO COM OS DOIS RESPONDIDOS. Decisão do Victor, 01/09.
  //
  // Ele sumia quando os dois campos estavam preenchidos, e isso era
  // desenho meu — errado por um motivo que só aparece com dedo em tela de
  // celular: **o dono vai errar**. Digitar 10 quando era 12, ou 200 quando
  // era 2.000. Sem o card, não há como corrigir, e errar em campo de
  // DINHEIRO sem poder corrigir é pior que perguntar de novo.
  //
  // Some junto o efeito colateral: sem card não dava para reenviar um
  // campo só, e o merge por campo — que o backend fez justamente para a
  // correção existir — ficava impossível de exercitar pela tela.
  //
  // Respondido, ele encolhe para uma linha. Ver `PerguntaDoDia`.
  // ============================================================
  const cardDaPergunta =
    estado.diaSeguinte.execucao !== null ? (
      <PerguntaDoDia
        dia={diaDaPergunta}
        vendasAtuais={vendasDeOntem}
        receitaAtualCentavos={receitaDeOntem}
        respondeuAlgo={vendasDeOntem !== null || receitaDeOntem !== null}
        atrasados={atrasados}
        valoresPorDia={valoresPorDia}
      />
    ) : null;

  // ---------- ainda falta alguma coisa: o herói é a próxima etapa ----------
  if (proximo || !temNumero) {
    // O bloco "não mexa na campanha" só existe quando há campanha para
    // mexer e a espera é do Facebook. Antes disso ele assustaria sem
    // motivo.
    const diaZero = proximo?.id === "numeros";

    return (
      <>
        <FaixaReconectar />
        <div className="page-head">
          <h1>
            {diaZero
              ? "Seus anúncios estão no ar. Os números ainda não."
              : "Sua primeira campanha ainda não está no ar."}
          </h1>
          <p>
            {diaZero
              ? "É assim que começa para todo mundo — e é o momento em que mais vale não mexer em nada."
              : "Abaixo está o próximo passo, e de quem ele depende. Nesta ordem, sem pular etapa."}
          </p>
        </div>

        {proximo && <HeroDaEtapa etapa={proximo} />}

        {/* Ver o bloco de `cardDaPergunta`: aqui NÃO é redundância. Sem o
            card nesta tela, o cliente nunca chegaria à outra para poder
            responder a primeira vez. */}
        {cardDaPergunta}

        <div className="dash-grid">
          <div className="dash-main">
            {diaZero && (
              <>
                <div
                  className="fail-block"
                  style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}
                >
                  <b className="title">O que não fazer agora</b>
                  <p>
                    Não pause e não mexa no investimento nestes primeiros dias. Cada mudança
                    reinicia o aprendizado do zero, e o que já foi gasto nele se perde. É a
                    coisa mais cara que dá para fazer aqui — e a mais tentadora.
                  </p>
                </div>

                {/* Espaço reservado da missão do dia zero (wireframe do
                    Figma). A mecânica ainda não existe; o lugar dela sim,
                    para a tela não terminar num vazio que empurra a pessoa
                    para a campanha. */}
                <section className="mission-slot">
                  <span className="ms-tag">Enquanto isso</span>
                  <b>Adiante o que vai fazer falta depois</b>
                  <p>
                    O melhor uso destes dias não é olhar a campanha — é deixar pronto o que ela
                    vai pedir a seguir: mais fotos para a IA ter de onde escolher, e seus dados
                    de negócio conferidos, que é de onde ela decide para quem mostrar.
                  </p>
                </section>
              </>
            )}

            {proximo && <RestoDoCaminho etapas={estado.etapas} atual={proximo} />}

            <Melhoras fotos={estado.melhoras.fotos} />
          </div>

          <aside className="dash-aside">
            {diaZero ? <Noturno decisao={ultimaDecisao} /> : <Suporte />}
            <Comando verba={estado.verbaMensal} investido={null} />
          </aside>
        </div>
      </>
    );
  }

  // ---------- com número ----------
  // O herói mede CONVERSA, não venda. A campanha é click-to-WhatsApp
  // otimizada para CONVERSATIONS: o evento que o Meta conta e otimiza é
  // "alguém abriu conversa", e é só isso que a plataforma sabe. Se a
  // pessoa comprou depois, quem sabe é o dono do negócio, não o Meta.
  const conversas = resultado.conversas;
  const custoPorConversa = conversas > 0 ? resultado.investido / conversas : null;

  // ============================================================
  // O ACUMULADO DO NEGÓCIO — o lado que a `metrics_daily` nunca terá.
  //
  // `metrics_daily` só teria o lado da PLATAFORMA, e tem zero linhas
  // (medido em 01/09/2026). O acumulado traz o lado do DONO — quantas
  // viraram venda e quanto entrou — que é o que ele respondeu, e o único
  // lado que existe hoje: o coletor da Meta está desligado até o App
  // Review.
  //
  // É por NEGÓCIO, e não por execução, de propósito: esta tela diz "quanto
  // eu já investi e quanto voltou", e com duas rodadas a versão por
  // execução esconderia a anterior.
  // ============================================================
  const acumulado = estado.diaSeguinte.acumulado;
  const fraseDoRetorno = frasePorRealInvestido(acumulado?.retornoPorReal ?? null);
  const donoRespondeu =
    acumulado !== null && (acumulado.vendas !== null || acumulado.voltouCentavos !== null);

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

      {/* A resposta que importa — "valeu a pena?" — é o maior elemento da
          tela: faixa cobalto de ponta a ponta, valor em branco, rótulo em
          lima. É o único lugar onde o lima aparece. */}
      <section className="hero-destaque">
        <span className="eyebrow">Em uma frase</span>
        {conversas > 0 ? (
          <>
            <NumeroQueConta valor={conversas} casas={0} className="hero-num" />
            <p className="hero-legenda">
              {conversas === 1 ? "pessoa começou" : "pessoas começaram"} uma conversa no seu
              WhatsApp pelo anúncio
            </p>
            <p className="hero-sub">a {dinheiro(custoPorConversa ?? 0)} cada</p>
          </>
        ) : (
          <p className="hero-frase">Ninguém começou conversa pelo anúncio ainda.</p>
        )}
        <p className="hero-note">
          Esse é o número de pessoas que clicaram no anúncio e abriram uma conversa com você no
          WhatsApp. É o que o Facebook consegue medir. Quantas dessas viraram venda, quem sabe é
          você — e é isso que a gente te pergunta todo dia.
        </p>
      </section>

      {/*
        O QUE O DONO RESPONDEU. Só aparece quando ele respondeu alguma
        coisa — um bloco vazio prometendo número é pior que bloco nenhum.

        `null` NUNCA vira R$ 0,00 aqui: `dinheiroOuAusencia` escreve
        "ainda não sabemos", porque dizer R$ 0,00 sobre o dinheiro do
        cliente quando não se sabe é afirmação falsa. Ver
        `lib/dia-seguinte/exibir.ts`.
      */}
      {cardDaPergunta}

      {donoRespondeu && acumulado && (
        <section className="rc-bloco">
          <div className="section-title">
            <h2>O que você me contou</h2>
          </div>
          <div className="card">
            <div className="metrics">
              <div className="metric">
                <span className="m-label">Viraram venda</span>
                <span className="m-value">{contagemOuAusencia(acumulado.vendas)}</span>
                <span className="m-delta">do que você respondeu</span>
              </div>
              <div className="metric">
                <span className="m-label">Voltou</span>
                <span className="m-value">{dinheiroOuAusencia(acumulado.voltouCentavos)}</span>
                <span className="m-delta">
                  {acumulado.diasComOsDoisLados > 0
                    ? `${acumulado.diasComOsDoisLados} dia(s) com os dois lados`
                    : "ainda sem o lado da plataforma"}
                </span>
              </div>
            </div>

            {/* O retorno vem CALCULADO do backend. Se ele é nulo, falta um
                lado ou o investimento é zero — e a tela não inventa a
                conta. */}
            {fraseDoRetorno && <p className="rc-abertura">{fraseDoRetorno}</p>}

            {/* Enquanto o coletor da Meta estiver desligado, dizer isso é
                melhor que deixar o cliente achar que a metade que falta é
                culpa dele. */}
            {!acumulado.temDadoDaPlataforma && (
              <p className="rc-tranquilo">
                O quanto foi investido ainda não chega automático — por isso a conta de
                retorno fica incompleta por enquanto.
              </p>
            )}
          </div>
        </section>
      )}

      <div className="dash-grid">
        <div className="dash-main">
          <div className="metrics">
            <div className="metric">
              {/* Era "Vendas geradas" lendo `conversions`. O dado sempre
                  foi conversa; só o rótulo é que dizia venda. */}
              <span className="m-label">Conversas iniciadas</span>
              <span className="m-value">{numero(conversas)}</span>
              <span className="m-delta">nos últimos 7 dias</span>
            </div>
            <div className="metric">
              <span className="m-label">Investido</span>
              <span className="m-value">{dinheiro(resultado.investido)}</span>
              <span className="m-delta">
                {estado.verbaMensal !== null
                  ? `de ${dinheiro(estado.verbaMensal)} no mês`
                  : "sem teto mensal definido"}
              </span>
            </div>
            <div className="metric">
              <span className="m-label">Pessoas alcançadas</span>
              <span className="m-value">{numero(resultado.alcance)}</span>
              <span className="m-delta">nos últimos 7 dias</span>
            </div>
          </div>

          <section>
            <div className="section-title">
              <h2>Suas campanhas</h2>
              <a href="/anuncios">Ver todas &rarr;</a>
            </div>
            <div className="campaign-list">
              {estado.campanhasNoAr.map((c) => (
                <div className="list-row" key={c.id}>
                  <div className="lr-head">
                    <span className="lr-title">{c.nome ?? "Campanha sem nome"}</span>
                    <span className="pill ok">{c.metaStatus ?? "No ar"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="dash-aside">
          <Noturno decisao={ultimaDecisao} />
          <Comando verba={estado.verbaMensal} investido={resultado.investido} />
        </aside>
      </div>
    </>
  );
}

/**
 * O que melhora o anúncio e não o trava.
 *
 * FOTO MORA AQUI, e a mudança de lugar é a decisão: até 20/08 ela era o
 * herói da tela, com tarja de "Seu próximo passo" e botão. Ela não bloqueia
 * nada — o `origem_criativo` é fixo em `"gerar"` e a IA monta a peça sem
 * foto do cliente. Prometer que o anúncio depende dela é fazer a pessoa
 * cumprir uma tarefa e não ver resultado nenhum.
 *
 * A contagem vem do estado, com o MESMO filtro que a `/conta` usa.
 */
function Melhoras({ fotos }: { fotos: number }) {
  return (
    <section>
      <div className="section-title">
        <h2>Enquanto isso, se você quiser</h2>
        <span className="side-note">Ajuda, mas não trava nada</span>
      </div>
      <div className="card acct-list">
        <a className="acct-row" href="/conta">
          <span className="ar-text">
            <b>Separar fotos do seu negócio</b>
            <span>
              {fotos === 0
                ? "Você ainda não mandou nenhuma. Quanto mais material, mais a IA tem de onde escolher."
                : `Você já mandou ${fotos} ${fotos === 1 ? "foto" : "fotos"}. Quanto mais material, mais a IA tem de onde escolher.`}
            </span>
          </span>
          <Seta />
        </a>
        <a className="acct-row" href="/meu-negocio">
          <span className="ar-text">
            <b>Conferir o que a gente entendeu do seu negócio</b>
            <span>Principalmente os números — é deles que sai a mira dos anúncios.</span>
          </span>
          <Seta />
        </a>
        <a className="acct-row" href="/expectativas">
          <span className="ar-text">
            <b>Ler os combinados</b>
            <span>Os 4 acordos, antes de qualquer cobrança. Leva 2 minutos.</span>
          </span>
          <Seta />
        </a>
      </div>
    </section>
  );
}

function Noturno({ decisao }: { decisao: { payload: unknown } | null }) {
  return (
    <section className="card noturno">
      <div className="nc-head">
        <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M9 1a5 5 0 1 0 2 8.5A5.5 5.5 0 0 1 9 1z" />
        </svg>
        Enquanto você dormia
      </div>
      {decisao ? (
        <p>{resumoDaDecisao(decisao.payload)}</p>
      ) : (
        <p>
          A IA ainda não tomou nenhuma decisão. Quando tomar — remanejar investimento, pausar o
          que não rende — aparece aqui, com data, hora e motivo.
        </p>
      )}
      <p className="nc-foot">
        <a href="/alertas">ver tudo que a IA já fez</a>
      </p>
    </section>
  );
}

function Comando({ verba, investido }: { verba: number | null; investido: number | null }) {
  return (
    <section className="command-card">
      <b className="title">Você está no comando</b>
      <p className="limit">
        {verba === null
          ? "Você ainda não definiu um teto mensal. "
          : investido !== null
            ? `${dinheiro(investido)} de ${dinheiro(verba)} investidos este mês · `
            : `Seu teto do mês é ${dinheiro(verba)}. `}
        <a href="/verba">{verba === null ? "definir agora" : "mudar limite"}</a>
      </p>
      <a className="cta quiet" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
        Falar com uma pessoa
      </a>
      <p className="note">Gente de verdade, sem robô. Resposta em até 2 horas úteis.</p>
    </section>
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
      <b className="title">Travou em alguma parte?</b>
      Gente de verdade responde, sem robô, em até 2 horas úteis.
      <a className="wa" href="https://wa.me/5521936182176" target="_blank" rel="noopener">
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
