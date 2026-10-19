import type { ReactNode } from "react";
import { diaCurto, dinheiro } from "@/lib/formato";
import { contagemOuAusencia, dinheiroOuAusencia } from "@/lib/dia-seguinte/exibir";
import { PerguntaDoDia } from "./PerguntaDoDia";
import { ConclusaoDaJornada } from "./ConclusaoDaJornada";
import type { EstadoDoCliente } from "@/lib/estado/cliente";
import type { DiaDoConsolidado } from "@/lib/dia-seguinte/tipos";
import type { IntervaloDoInicio } from "@/lib/inicio/periodo";
import type { ConsolidadoDoNegocio } from "@/lib/dia-seguinte/tipos";
import { SeletorDePeriodo } from "./SeletorDePeriodo";
import type { PendenciaDoOnboarding } from "@/lib/onboarding/conclusao";
import { esteveNoAr, fraseDeVeiculacao } from "@/lib/veiculacao/estado";
import {
  estadoNaLista,
  fasesDaCadeia,
  posicoesDaCadeia,
  type Etapa,
} from "@/lib/estado/frases";

/**
 * O DESENHO da `/inicio` — tudo o que a tela mostra, sem ler nada.
 *
 * ============================================================
 * SEPARADO DA PÁGINA EM 15/09/2026, para a bancada `/exemplo/inicio`.
 *
 * A `page.tsx` continua sendo a única que BUSCA: sessão, estado do cliente,
 * última decisão da IA, dias atrasados. Ela entrega tudo pronto aqui. A
 * `/exemplo/inicio` entrega dado falso de `lib/exemplo.ts` ao MESMO
 * componente — então o que se confere lá é o desenho de verdade, e não uma
 * cópia que envelhece separada.
 *
 * Nada aqui pode ler banco, sessão ou backend. A `<FaixaReconectar />`, que
 * lê, chega pronta por `faixa`; na bancada ela não vem.
 *
 * A trava `conferir:inicio` §5 e a lista do `conferir:resultado` §10 leem
 * este arquivo desde a separação.
 * ============================================================
 */

/**
 * O resto do caminho — a cadeia, sem peso.
 *
 * Existe para a pessoa saber que há uma sequência e onde ela está nela.
 * Enquanto existe etapa aberta, o detalhe fica disponível por divulgação
 * progressiva. Quando a cadeia fecha, a trilha sai do Início: o histórico
 * cumpriu sua função e os resultados passam a ser a informação principal.
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
function TrilhaDaExecucao({
  etapas,
  atual,
  andamento,
}: {
  etapas: Etapa[];
  atual: Etapa | null;
  andamento: string | null;
}) {
  const posicoes = posicoesDaCadeia(etapas, atual);

  return (
    <details className="trilha">
      <summary>Ver todas as etapas da preparação</summary>
      <div className="trilha-conteudo">
        {/* A frase do backend encabeça a trilha: é a única linha aqui que
            sabe o que o pipeline está fazendo AGORA. As seis abaixo são a
            cadeia local, que sabe a ordem. */}
        {andamento && <p className="trilha-andamento">{andamento}</p>}

        <ol className="trilha-lista">
          {posicoes.map(({ etapa, posicao }) => (
            <li className={`trilha-item e-${posicao}`} key={etapa.id}>
              <span className="trilha-marca" aria-hidden="true" />
              <span className="trilha-texto">
                <b>{etapa.nome}</b>
                <span>{estadoNaLista(etapa, posicao)}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}

function CabecalhoDoInicio({ intervalo }: { intervalo?: IntervaloDoInicio }) {
  return <>
    <header className="inicio-cabecalho">
      <h1>Início<span className="inicio-quadrado" aria-hidden="true" /></h1>
      {intervalo && <SeletorDePeriodo key={intervalo.desde + intervalo.ate} intervalo={intervalo} />}
    </header>
    {intervalo?.erro && <p className="form-error" role="alert">{intervalo.erro}</p>}
  </>;
}

type TipoDeSinal = "investido" | "cliques" | "impressoes" | "conversas";

function IconeDoSinal({ tipo }: { tipo: TipoDeSinal }) {
  const corpo = {
    investido: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 14h6" /></>,
    cliques: <><path d="m6 3 11 9-5 .8-2.5 4.7L6 3Z" /><path d="m13 13 4 5" /></>,
    impressoes: <><path d="M5 19v-5M10 19V9M15 19V5M20 19V11" /><path d="M3 19h19" /></>,
    conversas: <path d="M20.5 11.5a8.5 8.5 0 0 1-11.7 7.9L4 21l1.6-4.2A8.5 8.5 0 1 1 20.5 11.5Z" />,
  }[tipo];

  return (
    <span className="sinal-icone" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {corpo}
      </svg>
    </span>
  );
}

function GraficoDeInvestimento({ dias }: { dias: DiaDoConsolidado[] }) {
  const serie = dias.flatMap((dia) =>
    dia.investiuCentavos === null ? [] : [{ dia: dia.dia, valor: dia.investiuCentavos }],
  );

  if (serie.length < 2) {
    return (
      <section className="desempenho-card" aria-labelledby="desempenho-titulo">
        <div className="desempenho-cabecalho">
          <h2 id="desempenho-titulo">Investimento ao longo do tempo</h2>
          <span>por dia</span>
        </div>
        <p className="grafico-vazio">O gráfico aparece quando houver investimento medido em pelo menos dois dias.</p>
      </section>
    );
  }

  let maior = 0;
  for (const ponto of serie) maior = Math.max(maior, ponto.valor);
  const teto = Math.max(maior, 1);
  const largura = 720;
  const altura = 250;
  const esquerda = 62;
  const direita = 18;
  const topo = 16;
  const base = 210;
  const faixaX = largura - esquerda - direita;
  const faixaY = base - topo;
  const coordenadas = serie.map((ponto, indice) => ({
    ...ponto,
    x: esquerda + (indice / (serie.length - 1)) * faixaX,
    y: base - (ponto.valor / teto) * faixaY,
  }));
  const caminho = coordenadas
    .map((ponto, indice) => `${indice === 0 ? "M" : "L"}${ponto.x.toFixed(1)} ${ponto.y.toFixed(1)}`)
    .join(" ");
  const meio = Math.floor((serie.length - 1) / 2);
  const marcasY = [0, 0.5, 1];

  return (
    <section className="desempenho-card" aria-labelledby="desempenho-titulo">
      <div className="desempenho-cabecalho">
        <h2 id="desempenho-titulo">Investimento ao longo do tempo</h2>
        <span><i aria-hidden="true" /> por dia</span>
      </div>
      <svg className="grafico-investimento" viewBox={`0 0 ${largura} ${altura}`} role="img" aria-label={`Investimento diário de ${diaCurto(serie[0]!.dia)} a ${diaCurto(serie[serie.length - 1]!.dia)}`}>
        {marcasY.map((proporcao) => {
          const y = base - proporcao * faixaY;
          return (
            <g key={proporcao}>
              <line x1={esquerda} x2={largura - direita} y1={y} y2={y} className="grafico-grade" />
              <text x={esquerda - 10} y={y + 4} textAnchor="end">{dinheiro((teto * proporcao) / 100, "BRL")}</text>
            </g>
          );
        })}
        <path d={caminho} className="grafico-linha" />
        {coordenadas.map((ponto) => <circle key={ponto.dia} cx={ponto.x} cy={ponto.y} r="3.5" className="grafico-ponto" />)}
        {Array.from(new Set([0, meio, serie.length - 1])).map((indice) => (
          <text key={serie[indice]!.dia} x={coordenadas[indice]!.x} y={238} textAnchor={indice === 0 ? "start" : indice === serie.length - 1 ? "end" : "middle"}>
            {diaCurto(serie[indice]!.dia)}
          </text>
        ))}
      </svg>
    </section>
  );
}

/** As mesmas quatro fases da cadeia, em uma linha de acompanhamento. */
function FasesDaCampanha({ fases }: { fases: ReturnType<typeof fasesDaCadeia> }) {
  const feitas = fases.filter((fase) => fase.estado === "feita").length;
  if (feitas === fases.length) return null;

  return (
    <section className="inicio-jornada" aria-labelledby="inicio-jornada-titulo">
      <div className="inicio-jornada-cabecalho">
        <h2 id="inicio-jornada-titulo">Sua jornada</h2>
        <span>{feitas} de {fases.length} etapas concluídas</span>
      </div>
      <ol className="inicio-fases" aria-label="Etapas da campanha">
        {fases.map((f) => (
          <li
            className={`inicio-fase f-${f.estado}`}
            key={f.id}
            aria-current={f.estado === "atual" ? "step" : undefined}
          >
            <span className="inicio-fase-marca" aria-hidden="true">
              {f.estado === "feita" && (
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="m2.5 6 2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )}
            </span>
            <b>{f.nome}</b>
            <span className="inicio-fase-rotulo">{f.rotulo}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ProximoPasso({
  pendencia,
  proximo,
}: {
  pendencia: PendenciaDoOnboarding | null;
  proximo: Etapa | null;
}) {
  if (pendencia) return (
    <section className="inicio-proximo" aria-labelledby="inicio-proximo-titulo">
      <h2 id="inicio-proximo-titulo">Seu próximo passo</h2>
      <h3>{pendencia.titulo}</h3>
      <p>{pendencia.corpo}</p>
      <a className="cta" href={pendencia.href}>{pendencia.rotulo}</a>
    </section>
  );

  if (proximo?.acao) return (
    <section className="inicio-proximo" aria-labelledby="inicio-proximo-titulo">
      <h2 id="inicio-proximo-titulo">Seu próximo passo</h2>
      <h3>{proximo.titulo}</h3>
      <p>{proximo.corpo}</p>
      <a className="cta" href={proximo.acao.href}>{proximo.acao.rotulo}</a>
    </section>
  );

  return null;
}

export function TelaDoInicio({
  estado,
  ultimaDecisao,
  falhaAtualizacoes = false,
  diaDaPergunta,
  atrasados,
  pendenciaOnboarding = null,
  intervalo,
  acumuladoDoPeriodo,
  investidoNoMesCentavos = null,
  faixa,
}: {
  estado: EstadoDoCliente;
  ultimaDecisao: { payload: unknown } | null;
  falhaAtualizacoes?: boolean;
  /** o dia que a pergunta pergunta — ONTEM em São Paulo, calculado na busca */
  diaDaPergunta: string;
  atrasados: string[];
  pendenciaOnboarding?: PendenciaDoOnboarding | null;
  intervalo?: IntervaloDoInicio;
  /** Só os resultados mudam com as datas; jornada e perguntas usam o estado atual. */
  acumuladoDoPeriodo?: ConsolidadoDoNegocio | null;
  investidoNoMesCentavos?: number | null;
  /** a faixa de reconexão, que lê sessão: a página passa, a bancada não */
  faixa: ReactNode;
}) {
  const acumulado = acumuladoDoPeriodo === undefined ? estado.diaSeguinte.acumulado : acumuladoDoPeriodo;
  const resultado = acumuladoDoPeriodo === undefined ? estado.resultado : {
    investidoCentavos: acumulado?.investiuCentavos ?? null,
    moeda: acumulado?.moeda ?? null,
    cliques: acumulado?.cliques ?? null,
    impressoes: acumulado?.impressoes ?? null,
    pessoas: null,
  };
  const temNumero = estado.temNumero || Boolean(acumulado &&
    (acumulado.investiuCentavos !== null || acumulado.voltouCentavos !== null || acumulado.dias.length > 0));

  // ============================================================
  // A CADEIA VEM PRONTA. A tela não aplica mais regra nenhuma sobre ela.
  //
  // Até 11/09 esta linha era `concluidasPeloGasto(estado.etapas, ...)` —
  // a `/inicio` fechando `peca` e `no_ar` por conta própria, porque as
  // duas liam `creatives` e `campaigns`, tabelas locais que o backend
  // nunca escreve. Era recorte de UMA tela, e a `/anuncios` lia a mesma
  // cadeia sem ele.
  //
  // A regra passou para dentro de `montarEtapas`, onde vale para todo
  // mundo que lê a cadeia, e a fonte deixou de ser o gasto: agora é
  // `veiculacao`, que o backend expõe. Ver `lib/veiculacao/estado.ts`.
  // ============================================================
  const etapas = estado.etapas;
  const proximo = etapas.find((e) => !e.concluida) ?? null;

  // As quatro fases do wireframe, sobre as seis etapas da cadeia. Quem
  // agrupa é `lib/estado/frases.ts` — a tela não decide o que é fase.
  const fases = fasesDaCadeia(etapas, proximo);
  const jornadaConcluida = fases.every((fase) => fase.estado === "feita");
  const temProximoAcionavel = pendenciaOnboarding !== null || Boolean(proximo?.acao);

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
  const linhaDeOntem = estado.diaSeguinte.acumulado?.dias.find(
    (d) => d.dia === diaDaPergunta,
  );
  const vendasDeOntem = linhaDeOntem?.viraramVenda ?? null;
  const receitaDeOntem = linhaDeOntem?.voltouCentavos ?? null;

  const execucaoDoDia = estado.diaSeguinte.execucao;

  // ============================================================
  // A FRASE DO ANDAMENTO É DO BACKEND, E A TELA NÃO A REESCREVE.
  //
  // `lib/dia-seguinte/tipos.ts` guarda o contrato por extenso: "não use
  // `status` para montar texto de tela". O `status` serve para ramificar;
  // quem escreve para o dono é o backend, do mesmo jeito que faz com
  // `nivel_frase`. Traduzir os nove `EstadoExecucao` aqui recriaria o
  // defeito que `lib/resultado/nivel.ts` acabou de corrigir — sete frases
  // próprias contra catorze níveis, e as que faltavam derrubavam a página.
  //
  // Medido em 11/09 na V2G: "Tudo anotado. Começando a montar seu anúncio".
  // ============================================================
  const andamentoDaExecucao = execucaoDoDia?.andamento ?? null;
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
  // ============================================================
  // O PORTÃO DA PERGUNTA — `esteveNoAr()`, e não "tem execução".
  //
  // Até 22/09 a condição era `execucaoDoDia !== null`. A execução nasce
  // quando o PIPELINE DISPARA — muito antes de qualquer anúncio existir —,
  // então quem acabou de terminar o cadastro lia:
  //
  //     "Uma pergunta rápida sobre ontem:
  //      Quantas dessas conversas viraram venda ontem?"
  //
  // Não houve ontem, não houve conversa e não houve anúncio. A pergunta
  // não era só inútil: ela AFIRMA que algo rodou, numa tela que na linha
  // de cima diz "sua campanha está sendo preparada".
  //
  // `esteveNoAr` é o predicado da fonte única (`lib/veiculacao/estado.ts`)
  // e cobre os dois casos em que a pergunta faz sentido: `no_ar` e
  // `ja_foi_ao_ar`. Ele devolve `false` para `nao_sabemos` — não saber
  // não é prova, e perguntar sobre um dia que talvez não tenha existido é
  // o mesmo defeito com outra roupa.
  //
  // A execução continua sendo necessária: é dela que sai o `idExecucao`
  // que a resposta endereça. As duas condições juntas, e não uma no lugar
  // da outra.
  // ============================================================
  const cabePerguntarSobreOntem = esteveNoAr(estado.veiculacao);

  const cardDaPergunta =
    cabePerguntarSobreOntem && execucaoDoDia !== null && estado.negocioId ? (
      <PerguntaDoDia
        businessId={estado.negocioId}
        idExecucao={execucaoDoDia.idExecucao}
        dia={diaDaPergunta}
        vendasAtuais={vendasDeOntem}
        receitaAtualCentavos={receitaDeOntem}
        respondeuAlgo={vendasDeOntem !== null || receitaDeOntem !== null}
        atrasados={atrasados}
        valoresPorDia={valoresPorDia}
      />
    ) : null;

  // ============================================================
  // QUEM DECIDE O RAMO É `temNumero`, SOZINHO. O `proximo ||` SAIU.
  //
  // Ele estava aqui desde que a tela tinha dois corpos, e parecia inofensivo:
  // "se ainda falta etapa, mostre o que falta". Só que `proximo` NÃO fala do
  // mesmo assunto que `temNumero`. Ele sai de `montarEtapas`, que lê duas
  // tabelas LOCAIS do Supabase — `creatives` e `campaigns` — enquanto o
  // dinheiro vem do backend, que nunca escreve nessas duas.
  //
  // MEDIDO EM 11/09/2026, na conta da V2G (`a85c37a9`):
  //
  //   backend  aed42ce7 · status=cadastro_completo · tem_dado_da_plataforma=true
  //            R$ 10,25 investidos · 64 cliques · 1.657 impressões
  //   local    creatives ativos = 1, e é um LOGO (uso='campanha' = 0)
  //            campaigns = 0 linhas — na tabela inteira, não só nesta conta
  //
  //   → proximo = 'peca'  ·  temNumero = true  →  caía no ramo "preparando"
  //
  // Uma conta que gastou, foi clicada 64 vezes e apareceu 1.657 vezes lia
  // "sua primeira campanha ainda não está no ar". E como `campaigns` tem zero
  // linha no total, `publicadaEm` é `null` para TODA conta: com o `proximo ||`
  // no lugar, o ramo de resultado era inalcançável para todo mundo — código
  // morto em produção, não um caso da V2G.
  //
  // O §5 do `docs/v2g-wireframes/IMPLEMENTATION-PLAN.md` já dizia qual é o
  // interruptor: *"o único interruptor honesto entre os dois ramos é
  // `tem_dado_da_plataforma` — mais o `temNumero` de `estadoDoCliente()`"*.
  // `proximo` não aparece lá. Decidido pelo Victor em 11/09, após a medição.
  //
  // A CADEIA NÃO SE PERDE: ela deixa de decidir o ramo e passa a aparecer
  // DENTRO dos dois, como trilha — ver `TrilhaDaExecucao`. Etapa aberta com
  // número na mão é informação, não motivo para esconder o número.
  //
  // `proximo` é não-nulo aqui por construção: `etapaNumeros.concluida` é o
  // próprio `temNumero`, então `!temNumero` garante que ao menos ela está
  // aberta. As guardas de baixo ficam porque quem lê não deve precisar
  // reconstruir essa prova.
  // ============================================================
  if (!temNumero) {
    // O bloco "não mexa na campanha" só existe quando há campanha para
    // mexer e a espera é do Facebook. Antes disso ele assustaria sem
    // motivo.
    const diaZero = proximo?.id === "numeros";

    return (
      <div className="inicio-editorial">
        {faixa}
        <CabecalhoDoInicio intervalo={intervalo} />
        {acumuladoDoPeriodo === null && <p className="form-warning" role="status">Não foi possível carregar os resultados deste período. Tente novamente.</p>}

        {/* A tarefa vem da pendência real do onboarding ou da cadeia de execução. */}
        <div className={`inicio-topo${temProximoAcionavel ? " com-acao" : ""}`}>
          <section className="inicio-estado" aria-label={pendenciaOnboarding ? "Seu negócio" : "Sua campanha"}>
            {/* ============================================================
                A MANCHETE DE VEICULAÇÃO VEM DA FONTE ÚNICA. ITEM B3.

                Era `diaZero ? "Seu anúncio já está no ar" : …`, e
                `diaZero` é `proximo?.id === "numeros"` — a POSIÇÃO DA
                CADEIA. Posição de cadeia não sabe o que a Meta fez com o
                anúncio: na conta da V2G ela dizia "já está no ar" com o
                anúncio em `PAUSED`, enquanto a `/alertas` dizia o
                contrário sobre a mesma conta.

                `diaZero` continua decidindo o resto do ramo — o bloco "o
                que não fazer agora", a sub-linha —, que é o que ele de
                fato sabe: que a cadeia chegou nos números. Só a frase
                sobre o AR trocou de dono.
                ============================================================ */}
            <p>Estado do {pendenciaOnboarding ? "negócio" : "anúncio"}</p>
            <h2>
              {pendenciaOnboarding
                ? "Seu negócio está em preparação"
                : diaZero
                  ? fraseDeVeiculacao(estado.veiculacao, "manchete")
                  : "Sua campanha está sendo preparada"}
            </h2>
          </section>
          {temProximoAcionavel && (
            <ProximoPasso pendencia={pendenciaOnboarding} proximo={proximo} />
          )}
        </div>
        <FasesDaCampanha fases={fases} />

        {/* Ver o bloco de `cardDaPergunta`: aqui NÃO é redundância. Sem o
            card nesta tela, o cliente nunca chegaria à outra para poder
            responder a primeira vez. */}
        {cardDaPergunta}
        {/* ============================================================
          SEM A PERGUNTA, UMA LINHA DIZENDO QUANDO ELA VAI EXISTIR.

          Sumir em silêncio deixaria o dono sem saber que um dia a gente
          vai perguntar — e a primeira vez que a pergunta aparecesse
          pareceria cobrança do nada.

          Ela NÃO promete prazo: diz a condição ("quando seu anúncio
          estiver no ar"), não a data.
          ============================================================ */}
        {!cabePerguntarSobreOntem && (
          <p className="foot-line">
            As perguntas sobre vendas começam quando o anúncio estiver no ar.
          </p>
        )}


        <div className="inicio-cols">
          <div className="inicio-col">
            {diaZero && (
              <>
                <div
                  className="fail-block"
                  style={{ background: "var(--warn-soft)", borderColor: "var(--warn)" }}
                >
                  <b className="title">O que não fazer agora</b>
                  <p>
                    Evite pausar ou mudar o investimento sem conversar com a equipe.
                    Mudanças frequentes podem dificultar a leitura dos primeiros resultados.
                  </p>
                </div>

              </>
            )}

            <TrilhaDaExecucao
              etapas={etapas}
              atual={proximo}
              andamento={andamentoDaExecucao}
            />

            <Melhoras fotos={estado.melhoras.fotos} />
          </div>

          <div className="inicio-col">
            <Comando verba={estado.verbaMensal} investido={null} />
            {diaZero && <Noturno decisao={ultimaDecisao} falha={falhaAtualizacoes} />}
          </div>
        </div>
      </div>
    );
  }

  // ---------- com número ----------
  // O herói mede CONVERSA, não venda. A campanha é click-to-WhatsApp
  // otimizada para CONVERSATIONS: o evento que o Meta conta e otimiza é
  // "alguém abriu conversa", e é só isso que a plataforma sabe. Se a
  // pessoa comprou depois, quem sabe é o dono do negócio, não o Meta.
  //
  // ============================================================
  // O CUSTO POR CONVERSA SAIU DAQUI, E NÃO VOLTA.
  //
  // Eram duas linhas: `resultado.investido / conversas`, e o render
  // `a {dinheiro(custoPorConversa ?? 0)} cada` — o `?? 0` fazendo
  // "não sabemos" virar "a R$ 0,00 cada", na manchete, em letra grande.
  //
  // O contrato do dashboard proíbe o número em si, não só o `?? 0`: custo
  // derivado é a porta de entrada para o dono comparar com um número que
  // ouviu de alguém, e o produto compara com o CPL-alvo DELE — que não
  // existe em nenhuma das campanhas reais (medido, 10/09/2026). Sem alvo,
  // "R$ 0,16 por conversa" é uma opinião fingindo ser medida.
  //
  // Quem julga é o backend, em `nivelFrase`. `pnpm conferir:resultado` §10
  // lê este arquivo e reprova se o cálculo voltar.
  // ============================================================
  const conversas = resultado.pessoas;

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
  //
  // `acumulado` já está declarado lá em cima, no bloco da regra de
  // evidência: é a MESMA leitura, e as duas coisas que esta tela faz com
  // ele — fechar a cadeia e escrever os números — têm que sair da mesma
  // resposta, ou a trilha e o painel podem discordar.
  // ============================================================
  // ============================================================
  // O PERÍODO É O QUE TEM DADO, não o que a gente pediu.
  //
  // `desde`/`ate` são a janela SOLICITADA — 30 dias. Escrever "12/08 a
  // 10/09" ao lado de R$ 10,25 diz que a campanha rodou trinta dias
  // gastando dez reais, o que é falso: ela tem gasto em três dias.
  //
  // A mesma decisão já existe em `ResultadoParaTela.periodoComDado`, na
  // camada de leitura da `/anuncios`. Aqui é a versão curta, sobre o
  // acumulado do negócio.
  // ============================================================
  const diasComGasto = (acumulado?.dias ?? []).filter((d) => d.investiuCentavos !== null);
  const primeiroDia = diasComGasto[0]?.dia ?? null;
  const ultimoDia = diasComGasto[diasComGasto.length - 1]?.dia ?? null;
  const periodoMedido =
    primeiroDia === null || ultimoDia === null
      ? null
      : primeiroDia === ultimoDia
        ? `em ${diaCurto(primeiroDia)}`
        : `${diaCurto(primeiroDia)} a ${diaCurto(ultimoDia)}`;

  const donoRespondeu =
    acumulado !== null && (acumulado.vendas !== null || acumulado.voltouCentavos !== null);

  return (
    <div className="inicio-editorial">
      {faixa}
      <CabecalhoDoInicio intervalo={intervalo} />
        {acumuladoDoPeriodo === null && <p className="form-warning" role="status">Não foi possível carregar os resultados deste período. Tente novamente.</p>}

      {/* A mesma composição do estado sem números: estado, tarefa e
          acompanhamento. Os números continuam condicionados a temNumero. */}
      {jornadaConcluida && estado.negocioId && (
        <ConclusaoDaJornada businessId={estado.negocioId} />
      )}

      <div className={`inicio-topo${temProximoAcionavel ? " com-acao" : ""}`}>
        <section className="inicio-estado" aria-label="Sua campanha">
          {/* ============================================================
              UMA REDAÇÃO SÓ PARA VEICULAÇÃO — item N7 do QA.

              Esta manchete vinha do `andamento` do backend, e ele escreve
              "Seu anúncio já rodou e **está pausado no momento**". A
              `lib/veiculacao` escreve "já rodou e **não está no ar
              agora**". As duas falam do mesmo fato, com palavras
              diferentes, e conviviam — às vezes na mesma tela.

              Não é questão de qual frase é melhor: é que veiculação tem
              UMA fonte, e `andamento` não é ela. `andamento` descreve o
              estágio do PIPELINE; quando ele fala do ar, está invadindo
              assunto de outro módulo.

              O `andamento` não foi descartado do produto — ele continua
              sendo a frase do pipeline. O que saiu daqui é o uso dele
              como manchete de veiculação.
              ============================================================ */}
          <div className="inicio-estado-texto">
            <p>Estado do anúncio</p>
            <h2>{fraseDeVeiculacao(estado.veiculacao, "manchete")}</h2>
          </div>
          <a className="inicio-estado-link" href="/anuncios">Ver anúncios</a>
        </section>
        {temProximoAcionavel && (
          <ProximoPasso pendencia={pendenciaOnboarding} proximo={proximo} />
        )}
      </div>
      <FasesDaCampanha fases={fases} />

      {/* ============================================================
          OS PRIMEIROS SINAIS — quatro números, e um deles é uma ausência.

          `cliques` entra aqui por pedido do QA (item B6): ele já aparecia
          na `/anuncios` e não no Início, e é o número que o dono entende
          sem tradução nenhuma — "tantas pessoas clicaram".

          `conversas` sai como ausência enquanto `pessoas_que_chegaram_medido`
          não for `true`, e a rota do NEGÓCIO nem manda esse campo — por
          isso é `null` sempre, hoje. A linha de explicação ao lado não é
          decoração: sem ela, o "—" vira um número que faltou carregar.
          ============================================================ */}
      <section className="sinais-bloco">
        <div className="section-title">
          <h2>Resumo do período</h2>
          {periodoMedido && <span className="side-note">{periodoMedido}</span>}
        </div>
        <div className="sinais">
          <div className="sinal">
            <div className="sinal-cabecalho"><IconeDoSinal tipo="investido" /><span className="s-label">Investido</span></div>
            <span className="s-valor">
              {resultado.investidoCentavos === null
                ? "—"
                : dinheiroOuAusencia(resultado.investidoCentavos, resultado.moeda)}
            </span>
          </div>
          <div className="sinal">
            <div className="sinal-cabecalho"><IconeDoSinal tipo="cliques" /><span className="s-label">Cliques</span></div>
            <span className="s-valor">
              {resultado.cliques === null ? "—" : contagemOuAusencia(resultado.cliques)}
            </span>
          </div>
          <div className="sinal">
            <div className="sinal-cabecalho"><IconeDoSinal tipo="impressoes" /><span className="s-label">Impressões</span></div>
            <span className="s-valor">
              {resultado.impressoes === null ? "—" : contagemOuAusencia(resultado.impressoes)}
            </span>
          </div>
          <div className={`sinal${conversas === null ? " s-ausente" : ""}`}>
            <div className="sinal-cabecalho"><IconeDoSinal tipo="conversas" /><span className="s-label">Conversas</span></div>
            <span className="s-valor">{conversas === null ? "—" : contagemOuAusencia(conversas)}</span>
          </div>
        </div>

        {(resultado.investidoCentavos === null ||
          resultado.cliques === null ||
          resultado.impressoes === null ||
          conversas === null) && (
          <p className="sinais-ausencia">— indica dado que ainda não está disponível.</p>
        )}

        {/* A FRASE DO NÍVEL, COMO VEIO. Sem tradução, sem cor, sem nota.
            Ela é a única coisa nesta tela autorizada a dizer se está bom
            ou ruim — e hoje ela diz que ainda não dá para dizer. */}
        {acumulado?.nivelFrase && <p className="sinal-frase">{acumulado.nivelFrase}</p>}
      </section>

      <div className={`resultado-grade${donoRespondeu ? " com-vendas" : ""}`}>
        <GraficoDeInvestimento dias={acumulado?.dias ?? []} />
        {donoRespondeu && acumulado && (
          <section className="vendas-card" aria-labelledby="vendas-informadas-titulo">
            <div className="vendas-cabecalho">
              <h2 id="vendas-informadas-titulo">Vendas informadas</h2>
              <span>informado por você</span>
            </div>
            <div className="venda-dado">
              <IconeDoSinal tipo="conversas" />
              <p><strong>{contagemOuAusencia(acumulado.vendas)}</strong><span>vendas</span></p>
            </div>
            <div className="venda-dado">
              <IconeDoSinal tipo="investido" />
              <p><strong>{dinheiroOuAusencia(acumulado.voltouCentavos, acumulado.moeda)}</strong><span>em receita informada</span></p>
            </div>
          </section>
        )}
      </div>

      {cardDaPergunta}
      {!cabePerguntarSobreOntem && (
        <p className="foot-line">
          As perguntas sobre vendas começam quando o anúncio estiver no ar.
        </p>
      )}

      <Comando
        verba={estado.verbaMensal}
        investido={
          estado.resultado.moeda === null || estado.resultado.moeda === "BRL"
            ? investidoNoMesCentavos === null
              ? null
              : investidoNoMesCentavos / 100
            : null
        }
      />

      <Noturno decisao={ultimaDecisao} falha={falhaAtualizacoes} />
      {proximo && (
        <TrilhaDaExecucao etapas={etapas} atual={proximo} andamento={andamentoDaExecucao} />
      )}
      <Melhoras fotos={estado.melhoras.fotos} />
    </div>
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
    <details className="inicio-extras">
      <summary>Outras ações para este negócio</summary>
      <div className="acct-list">
        <a className="acct-row" href="/conta">
          <span className="ar-text">
            <b>Fotos do negócio</b>
            <span>{fotos === 0 ? "Nenhuma enviada" : `${fotos} ${fotos === 1 ? "foto enviada" : "fotos enviadas"}`}</span>
          </span>
          <Seta />
        </a>
        {/* ============================================================
            A ÚNICA PORTA PARA A /criativos NO INÍCIO — item do QA de
            11/09/2026: a tela existia e NÃO tinha como chegar nela pelo
            app. Nenhum menu, nenhum link, nenhuma tela apontando. O dono
            teria que digitar a URL, o que não acontece no celular.

            Aqui e não no herói de propósito: analisar peça pronta é
            tarefa de quem JÁ TEM a peça, e a ação principal da tela
            continua sendo a etapa aberta. Esta lista é o lugar do
            "se você quiser" — e é a mesma decisão que o docstring da
            /criativos registra ao recusar virar item de menu (os cinco
            do QA-1 continuam cinco).
            ============================================================ */}
        <a className="acct-row" href="/criativos">
          <span className="ar-text">
            <b>Conferir uma peça</b>
            <span>Analisar uma imagem antes de anunciar</span>
          </span>
          <Seta />
        </a>
        <a className="acct-row" href="/meu-negocio">
          <span className="ar-text">
            <b>Dados do negócio</b>
            <span>Rever informações e valores</span>
          </span>
          <Seta />
        </a>
        <a className="acct-row" href="/expectativas">
          <span className="ar-text">
            <b>Ler os combinados</b>
            <span>Como funciona o serviço</span>
          </span>
          <Seta />
        </a>
      </div>
    </details>
  );
}

function Noturno({ decisao, falha }: { decisao: { payload: unknown } | null; falha: boolean }) {
  if (!falha && !decisao) return null;

  return (
    <section className="card noturno">
      <div className="nc-head">
        <svg width="16" height="16" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          <path d="M9 1a5 5 0 1 0 2 8.5A5.5 5.5 0 0 1 9 1z" />
        </svg>
        Atualizações deste negócio
      </div>
      {falha ? (
        <p>Não conseguimos carregar as atualizações agora. Tente novamente em instantes.</p>
      ) : decisao ? (
        <p>{resumoDaDecisao(decisao.payload)}</p>
      ) : null}
      <p className="nc-foot">
        <a href="/alertas">ver todos os avisos</a>
      </p>
    </section>
  );
}

function Comando({ verba, investido }: { verba: number | null; investido: number | null }) {
  const percentual = verba !== null && verba > 0 && investido !== null
    ? Math.min(Math.max((investido / verba) * 100, 0), 100)
    : null;

  return (
    <section className="command-card">
      <div className="limite-texto">
        <b className="title">Limite mensal</b>
        <p className="limit">
          {verba === null
            ? "Você ainda não definiu um teto mensal."
            : investido !== null
              ? <><strong>{dinheiro(investido, "BRL")}</strong> de {dinheiro(verba, "BRL")}</>
              : <>Seu teto do mês é <strong>{dinheiro(verba, "BRL")}</strong>.</>}
        </p>
      </div>
      {percentual !== null && (
        <div className="limite-progresso" role="progressbar" aria-label="Limite mensal utilizado" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentual)}>
          <span style={{ width: `${percentual}%` }} />
        </div>
      )}
      <a className="limite-link" href="/verba">{verba === null ? "Definir agora" : "Mudar limite"}</a>
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
