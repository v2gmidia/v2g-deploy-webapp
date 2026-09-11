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
import {
  concluidasPeloGasto,
  estadoNaLista,
  posicoesDaCadeia,
  type Etapa,
} from "@/lib/estado/frases";

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
 * 3. Com número — o dashboard de verdade, do CONSOLIDADO do backend.
 *    (Era `metrics_daily`, que tem zero linhas. Trocado em 10/09/2026.)
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
  const feitas = posicoes.filter((p) => p.posicao === "feita").length;

  return (
    <section className="trilha">
      <div className="section-title">
        <h2>Onde seu anúncio está</h2>
        <span className="side-note">
          {feitas} de {etapas.length} etapas
        </span>
      </div>
      <div className="card">
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

  const { resultado, temNumero } = estado;

  // ============================================================
  // A REGRA DE EVIDÊNCIA — APLICADA AQUI, E SÓ AQUI.
  //
  // `estado.etapas` fecha `peca` e `no_ar` lendo `creatives` e
  // `campaigns`, duas tabelas LOCAIS que o backend nunca escreve. Medido
  // em 11/09/2026: `campaigns` tem ZERO linhas na tabela inteira, e a V2G
  // (`a85c37a9`) não tem uma peça de `uso='campanha'` sequer — só logos.
  // Ver `docs/buraco-creatives-campanhas-sem-dono.md`.
  //
  // Enquanto isso o consolidado do backend, na MESMA conta, devolve
  // `tem_dado_da_plataforma: true` e `investiu_centavos: 1025`. A trilha
  // dizia que a peça não ficou pronta e o anúncio não subiu para quem já
  // gastou R$ 10,25 e apareceu 1.657 vezes.
  //
  // A regra e o porquê de ela não contrariar a Decisão 13 estão em
  // `concluidasPeloGasto()`. Aqui fica só o RECORTE: a correção é da
  // `/inicio`, então `montarEtapas` não mudou e a `/anuncios` e a
  // `/vendas` continuam lendo a cadeia local como sempre leram.
  //
  // Sem gasto isto é identidade: `houveGastoMedido` é falso e as etapas
  // saem intactas. E no ramo `!temNumero` a regra nunca dispara —
  // `investiuCentavos > 0` implica `temNumero`, por construção de
  // `estadoDoCliente()`.
  // ============================================================
  const acumulado = estado.diaSeguinte.acumulado;
  const etapas = concluidasPeloGasto(estado.etapas, acumulado);
  const proximo = etapas.find((e) => !e.concluida) ?? null;

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
  // E vai continuar sendo por subtração: `perguntas_apresentadas` registra
  // que a pergunta foi MOSTRADA, e dia em que o dono não abriu o app não
  // gera linha nenhuma. A tabela classifica o que já está nesta lista; ela
  // não a produz. Ver o bloco de `diasAtrasados`.
  //
  // Toda a dedução mora numa função só — é onde acrescentar a leitura
  // quando ela existir.
  // ============================================================
  // Sem execução não há card (a condição de baixo), logo não há atrasado a
  // oferecer — e o `idExecucao` da chave só existe aqui dentro.
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
    execucaoDoDia !== null ? (
      <PerguntaDoDia
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

            <TrilhaDaExecucao
              etapas={etapas}
              atual={proximo}
              andamento={andamentoDaExecucao}
            />

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
  const fraseDoRetorno = frasePorRealInvestido(
    acumulado?.retornoPorReal ?? null,
    acumulado?.moeda ?? null,
  );
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
        {conversas !== null && conversas > 0 ? (
          <>
            <NumeroQueConta valor={conversas} casas={0} className="hero-num" />
            <p className="hero-legenda">
              {conversas === 1 ? "pessoa começou" : "pessoas começaram"} uma conversa no seu
              WhatsApp pelo anúncio
            </p>
          </>
        ) : conversas === null ? (
          // AFIRMAÇÃO QUE ESTA TELA NÃO PODE MAIS FAZER. "Ninguém começou
          // conversa" é um zero que mente enquanto
          // `pessoas_que_chegaram_medido` não for `true`: pode ter começado
          // e ninguém estar contando. Ver `lib/resultado/ler.ts`.
          <p className="hero-frase">
            A gente ainda não consegue contar quem chegou pelo seu anúncio.
          </p>
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
                <span className="m-value">
                  {dinheiroOuAusencia(acumulado.voltouCentavos, acumulado.moeda)}
                </span>
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
            {/* ============================================================
                OS TRÊS CARTÕES LEEM O CONSOLIDADO, NÃO A `metrics_daily`.

                O que eles mostravam antes saía de `Number(m.spend ?? 0)`
                sobre uma tabela de ZERO LINHAS — três "0" com cara de
                medição. Agora `null` chega como `null` e vira o recado de
                ausência, que tem tom próprio.

                O RÓTULO DE "alcance" TAMBÉM MUDOU: era "Pessoas
                alcançadas" lendo `impressions`. Impressão é quantas VEZES
                o anúncio apareceu, e a mesma pessoa conta várias — dizer
                "pessoas" inflava o número na cabeça do dono.
                ============================================================ */}
            <div className="metric">
              {/* Era "Vendas geradas" lendo `conversions`. O dado sempre
                  foi conversa; só o rótulo é que dizia venda. */}
              <span className="m-label">Conversas iniciadas</span>
              <span className="m-value">{contagemOuAusencia(conversas)}</span>
              <span className="m-delta">no período do consolidado</span>
            </div>
            <div className="metric">
              <span className="m-label">Investido</span>
              <span className="m-value">
                {dinheiroOuAusencia(resultado.investidoCentavos, resultado.moeda)}
              </span>
              <span className="m-delta">
                {/* O TETO SÓ APARECE AO LADO DE DINHEIRO NA MESMA MOEDA.
                    Comparar A$ 113,45 com um teto de R$ 500 seria uma
                    conta que não existe. */}
                {estado.verbaMensal === null
                  ? "sem teto mensal definido"
                  : resultado.moeda === "BRL" || resultado.moeda === null
                    ? `de ${dinheiro(estado.verbaMensal, "BRL")} no mês`
                    : "seu teto mensal é em reais, e esta conta cobra em outra moeda"}
              </span>
            </div>
            <div className="metric">
              <span className="m-label">Vezes que o anúncio apareceu</span>
              <span className="m-value">{contagemOuAusencia(resultado.impressoes)}</span>
              <span className="m-delta">no período do consolidado</span>
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
                  {/* ============================================================
                      O SELO DE "NO AR" SAIU, E NÃO VOLTA — §4, conflito 1.

                      `status_na_plataforma` não é exposto por rota nenhuma:
                      zero ocorrências no `openapi.json` de produção, e o
                      coletor lê e descarta. O selo era, literalmente,
                      `?? "No ar"` — um padrão de texto afirmando que a
                      campanha está no ar sem nada que sustente a afirmação.

                      Omitido, não desabilitado: selo apagado ensina que o
                      estado existe e está a um passo de aparecer.
                      ============================================================ */}
                  <div className="lr-head">
                    <span className="lr-title">{c.nome ?? "Campanha sem nome"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* A cadeia continua VISÍVEL depois que o número chega. Ela deixou
              de decidir o ramo (ver o bloco da condição), e sumir com ela
              aqui trocaria um erro por outro: a pessoa perderia de vista que
              ainda há etapa aberta justamente quando passa a ter o que
              comemorar.

              O `{proximo && ...}` que guardava isto SAIU junto com a regra
              de evidência, e sair era obrigatório: com a cadeia fechada
              pelo gasto, `proximo` vira `null` — e a guarda escondia a
              trilha exatamente na conta em que ela passou a estar certa.
              Cadeia completa é justamente o que vale a pena mostrar; com
              `atual = null`, `posicoesDaCadeia` marca as seis como
              "feita". */}
          <TrilhaDaExecucao
            etapas={etapas}
            atual={proximo}
            andamento={andamentoDaExecucao}
          />
        </div>

        <aside className="dash-aside">
          <Noturno decisao={ultimaDecisao} />
          {/* O investido só vai para o Comando quando ele é comparável
              com a verba, que é em reais. Em outra moeda, o card mostra
              só o teto. */}
          <Comando
            verba={estado.verbaMensal}
            investido={
              resultado.moeda === null || resultado.moeda === "BRL"
                ? resultado.investidoCentavos === null
                  ? null
                  : resultado.investidoCentavos / 100
                : null
            }
          />
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
        {/* `"BRL"` nos dois: a verba é o que o cliente digitou em reais, e
            quem chama só passa `investido` quando ele é da mesma moeda. */}
        {verba === null
          ? "Você ainda não definiu um teto mensal. "
          : investido !== null
            ? `${dinheiro(investido, "BRL")} de ${dinheiro(verba, "BRL")} investidos este mês · `
            : `Seu teto do mês é ${dinheiro(verba, "BRL")}. `}
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
