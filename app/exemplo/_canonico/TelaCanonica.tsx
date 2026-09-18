import { PerguntaDoDia } from "@/app/(protected)/inicio/PerguntaDoDia";
import { contagemOuAusencia, dinheiroOuAusencia } from "@/lib/dia-seguinte/exibir";
import { diaCurto, dinheiro } from "@/lib/formato";
import { estaNoArAgora, esteveNoAr, fraseDeVeiculacao } from "@/lib/veiculacao/estado";
import { fasesDaCadeia, tarja } from "@/lib/estado/frases";
import type { EstadoDoCliente } from "@/lib/estado/cliente";
import css from "./TelaCanonica.module.css";

/**
 * O INÍCIO CANÔNICO — laboratório visual, não produção.
 *
 * ============================================================
 * RODADA 5 (17/09/2026). COMPOSIÇÃO REFEITA, DE NOVO, DO ZERO.
 *
 * A página é uma coluna só, em quatro faixas, na mesma ordem em todos os
 * estados:
 *
 *   1. ONDE ESTOU     selo + manchete + apoio, sem caixa. Tudo da fonte
 *                     única de veiculação; a tela não escreve frase de
 *                     estado.
 *   2. A ÂNCORA       UM bloco, e ele muda por momento — é a única
 *                     coisa que muda de forma entre os estados.
 *   3. OS NÚMEROS     quando existem.
 *   4. O RESTO        o que ajuda, e a faixa do comando.
 *
 * Quem decide a divisão interna de cada faixa é a LARGURA DA PRÓPRIA
 * FAIXA (`@container`), não a da janela.
 *
 * REAPROVEITADO: a lógica (a cadeia de `lib/estado/frases.ts`, a fonte
 * única de veiculação, os formatadores de ausência) e o COMPORTAMENTO da
 * pergunta do dia, que é o componente de produção sem mudança nenhuma.
 * ============================================================
 *
 * ============================================================
 * OS QUATRO MOMENTOS, E DE ONDE CADA UM SAI.
 *
 *   preparando  `!esteveNoAr(veiculacao)` — a trilha, com contador
 *               verdadeiro, ao lado da etapa aberta
 *   concluiu    esteve no ar + cadeia fechada + `mostrarConclusao`. A
 *               conclusão aparece UMA vez (decisão de 16/09)
 *   no-ar       esteve no ar e está agora. A trilha não existe mais; a
 *               âncora é investiu × voltou
 *   parado      esteve no ar e não está agora. A âncora é a ação de
 *               voltar, desabilitada com o motivo (decisão de 16/09)
 *
 * `mostrarConclusao` NÃO TEM FONTE HOJE — ver DUVIDA-11. Sem fonte, o
 * padrão é `false` e a produção cairia direto no `no-ar`.
 * ============================================================
 *
 * ============================================================
 * AUDITORIA DA R5 (`docs/v2g-wireframes/AUDITORIA-R5.md`) — o que ela
 * mudou aqui, com o achado ao lado de cada bloco: B1, B2, I1, I2, I3, I5,
 * I6, I7, D1 e D5. O que foi discordado está em `ENTREGA-R5-B.md`.
 * ============================================================
 */
type Momento = "preparando" | "concluiu" | "no-ar" | "parado";

const WHATSAPP = "https://wa.me/5521936182176";

/**
 * A fase que NÃO é preparação (achado B1).
 *
 * A partição de `lib/estado/frases.ts` tem quatro fases, e a quarta,
 * "Otimizar", fecha quando a etapa `numeros` fecha — quando o primeiro
 * número chega. Na trilha de preparação isso é verdade ("vai chegar a
 * hora de otimizar"). Na CONCLUSÃO, "Otimizar ✓" afirma que a otimização
 * acabou no minuto em que ela começa. A conclusão mostra só as três fases
 * que de fato terminam; a quarta vira uma frase no presente.
 *
 * O id é o da partição de produção. Se ele mudar lá, a conclusão volta a
 * mostrar quatro fases — e a DUVIDA-14 registra que o conserto de verdade
 * é na partição, não aqui.
 */
const FASE_CONTINUA = "otimizar";

export function TelaCanonica({
  estado,
  mostrarConclusao = false,
  diaDaPergunta,
}: {
  estado: EstadoDoCliente;
  /** DUVIDA-11: sem fonte hoje. Em produção seria sempre `false`. */
  mostrarConclusao?: boolean;
  /** o dia que a pergunta do dia pergunta — ontem, em São Paulo */
  diaDaPergunta: string;
}) {
  const { resultado, veiculacao } = estado;
  const acumulado = estado.diaSeguinte.acumulado;
  const execucao = estado.diaSeguinte.execucao;

  const proximo = estado.etapas.find((e) => !e.concluida) ?? null;
  const fases = fasesDaCadeia(estado.etapas, proximo);
  const feitas = fases.filter((f) => f.estado === "feita").length;
  const faseAtual = fases.find((f) => f.estado === "atual") ?? null;
  const fasesDaPreparacao = fases.filter((f) => f.id !== FASE_CONTINUA);

  const noArAgora = estaNoArAgora(veiculacao);
  const momento: Momento = !esteveNoAr(veiculacao)
    ? "preparando"
    : mostrarConclusao && proximo === null
      ? "concluiu"
      : noArAgora
        ? "no-ar"
        : "parado";

  // ============================================================
  // O PERÍODO É O QUE TEM DADO, não o que a gente pediu (rodada 4).
  // `desde`/`ate` são a janela SOLICITADA; a tela diz os dias em que
  // houve gasto medido.
  // ============================================================
  const dias = acumulado?.dias ?? [];
  const diasComGasto = dias.filter((d) => d.investiuCentavos !== null);
  const primeiro = diasComGasto[0]?.dia ?? null;
  const ultimo = diasComGasto[diasComGasto.length - 1]?.dia ?? null;
  const periodo =
    primeiro === null || ultimo === null
      ? null
      : primeiro === ultimo
        ? `em ${diaCurto(primeiro)}`
        : `de ${diaCurto(primeiro)} a ${diaCurto(ultimo)}`;

  // Quantos dias têm o lado do dono. É o que impede "voltou" de parecer
  // a outra metade de uma conta que ele não é.
  const diasRespondidos = dias.filter(
    (d) => d.viraramVenda !== null || d.voltouCentavos !== null,
  ).length;

  // ============================================================
  // O RÓTULO NÃO REPETE O TÍTULO (achado D1).
  //
  // A tarja diz de quem é a vez, e quase sempre acrescenta alguma coisa.
  // Quando o título da etapa JÁ COMEÇA com ela ("A gente está devendo" /
  // "A gente está devendo o seu primeiro anúncio"), ela é a mesma frase
  // duas vezes, uma em cima da outra, e sai.
  // ============================================================
  const tarjaDaEtapa = proximo ? tarja(proximo) : null;
  const tarjaRepete =
    proximo !== null &&
    tarjaDaEtapa !== null &&
    proximo.titulo.toLocaleLowerCase("pt-BR").startsWith(tarjaDaEtapa.toLocaleLowerCase("pt-BR"));

  return (
    <div className={css.tela}>
      {/* ============================================================
          1. ONDE ESTOU. Sem caixa. O `h1` é a manchete; o cumprimento
          fica só no cabeçalho do casco. O apoio vem da fonte única,
          inteiro — no parado ele diz "Seu gestor pode retomar quando
          fizer sentido", e o gestor é a V2G (decisão de 16/09).
          ============================================================ */}
      <header className={css.estado}>
        <span className={`${css.selo} ${noArAgora ? css.seloVivo : ""}`}>
          {fraseDeVeiculacao(veiculacao, "selo")}
        </span>
        <h1 className={css.manchete}>{fraseDeVeiculacao(veiculacao, "manchete")}</h1>
        <p className={css.apoio}>{fraseDeVeiculacao(veiculacao, "apoio")}</p>
      </header>

      {/* ============================================================
          2. A ÂNCORA. Uma por momento.
          ============================================================ */}
      {momento === "preparando" && (
        <section className={`${css.ancora} ${css.ancoraPreparando}`} aria-labelledby="titulo-trilha">
          <div className={css.ancoraMetade}>
            {/* N3 da R5-b: o rótulo fica só para leitor de tela. Visível, ele
                empurrava "1 de 4" para baixo do título da metade direita. */}
            <h2 className={css.soLeitor} id="titulo-trilha">
              A preparação
            </h2>
            <p className={css.contador}>
              {feitas} de {fases.length} etapas concluídas
            </p>

            {/* A trilha muda de forma com a largura, não de conteúdo:
                barras + "Agora" no estreito, lista no largo. A lista é a
                MESMA marcação nas duas; a linha "Agora" é `aria-hidden`
                para não ser lida duas vezes. */}
            <ol className={css.fases}>
              {fases.map((f, i) => (
                <li className={`${css.fase} ${css[f.estado]}`} key={f.id}>
                  <span className={css.faseMarca} aria-hidden="true">
                    {f.estado === "feita" ? "✓" : i + 1}
                  </span>
                  <span className={css.faseNome}>{f.nome}</span>
                  <span className={css.faseRotulo}>{f.rotulo}</span>
                </li>
              ))}
            </ol>
            {faseAtual && (
              <p className={css.faseAgora} aria-hidden="true">
                Agora: <b>{faseAtual.nome}</b> · {faseAtual.rotulo.toLowerCase()}
              </p>
            )}
          </div>

          {proximo && (
            <div className={`${css.ancoraMetade} ${css.vez}`}>
              {!tarjaRepete && <span className={css.eyebrow}>{tarjaDaEtapa}</span>}
              <h2 className={css.vezTitulo}>{proximo.titulo}</h2>
              <p className={css.texto}>{proximo.corpo}</p>
              {proximo.acao ? (
                <a className={`cta ${css.botao}`} href={proximo.acao.href}>
                  {proximo.acao.rotulo}
                </a>
              ) : (
                <p className={css.nota}>
                  {proximo.bola === "facebook"
                    ? "Agora é com o Facebook. Não precisa fazer nada — e mexer na campanha agora atrasaria."
                    : "Agora é com a gente. Você não precisa fazer nada."}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          CONCLUIU — achados B1 e I6.

          Três fases, com nome, em TODAS as larguras: a 375 a rodada 5
          mostrava quatro barras cheias sem dizer o que tinha acabado, e é
          a largura de projeto. "Otimizar" sai da lista de coisas feitas
          e vira a frase do que começa agora.

          Sem pergunta do dia neste momento (DUVIDA-13): a caixa dela era
          maior que a âncora e tinha o único botão da tela, e a conclusão
          perdia a disputa. A pergunta aparece a partir da visita seguinte.
          ============================================================ */}
      {momento === "concluiu" && (
        <section className={`${css.ancora} ${css.ancoraConcluiu}`} aria-labelledby="titulo-trilha">
          <div className={css.ancoraMetade}>
            <h2 className={css.eyebrow} id="titulo-trilha">
              A preparação terminou
            </h2>
            <ol className={`${css.fases} ${css.fasesFeitas}`}>
              {fasesDaPreparacao.map((f) => (
                <li className={`${css.fase} ${css[f.estado]}`} key={f.id}>
                  <span className={css.faseMarca} aria-hidden="true">
                    {f.estado === "feita" ? "✓" : "·"}
                  </span>
                  <span className={css.faseNome}>{f.nome}</span>
                  <span className={css.faseRotulo}>{f.rotulo}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className={`${css.ancoraMetade} ${css.vez}`}>
            {/* DUVIDA-12: texto desta rodada, esperando o Gabriel. */}
            <p className={css.textoForte}>A otimização começa agora.</p>
            <p className={css.texto}>
              Ela acontece enquanto o anúncio roda. Daqui em diante, o Início mostra o que ele
              está fazendo: quanto foi investido e quanto voltou para você. Esta é a última vez
              que a preparação aparece aqui.
            </p>
            <a className={css.link} href="/anuncios">
              Ver meus anúncios
            </a>
          </div>
        </section>
      )}

      {momento === "no-ar" && acumulado && (
        <section className={css.ancora} aria-label="Quanto investiu e quanto voltou">
          <div className={css.ancoraMetade}>
            <span className={css.eyebrow}>Investido</span>
            <span className={css.valorAncora}>
              {dinheiroOuAusencia(resultado.investidoCentavos, resultado.moeda)}
            </span>
            <span className={css.fonte}>
              medido pela plataforma{periodo ? `, ${periodo}` : ""}
            </span>
          </div>
          <div className={`${css.ancoraMetade} ${css.vez}`}>
            <span className={css.eyebrow}>Voltou</span>
            {acumulado.voltouCentavos === null ? (
              <>
                <span className={css.valorAncoraAusente}>
                  <span aria-hidden="true">—</span>
                  <span className={css.soLeitor}>ainda não contado</span>
                </span>
                <span className={css.fonte}>
                  Você ainda não contou nenhuma venda. É pela pergunta logo abaixo que isso
                  entra.
                </span>
              </>
            ) : (
              <>
                <span className={css.valorAncora}>
                  {dinheiroOuAusencia(acumulado.voltouCentavos, acumulado.moeda)}
                </span>
                <span className={css.fonte}>
                  {contagemOuAusencia(acumulado.vendas)}{" "}
                  {acumulado.vendas === 1 ? "venda" : "vendas"}, pelo que você contou em{" "}
                  {diasRespondidos} de {dias.length} dias
                </span>
              </>
            )}
          </div>
          {/* A única frase autorizada a dizer se está bom ou ruim, como veio
              do backend. A tela não divide um pelo outro. */}
          <div className={css.ancoraRodape}>
            {acumulado.nivelFrase && <p className={css.ancoraFrase}>{acumulado.nivelFrase}</p>}
            <a className={css.link} href="/anuncios">
              Ver meus anúncios
            </a>
          </div>
        </section>
      )}

      {/* ============================================================
          PARADO — achados B2, I1 e I5.

          A âncora é SÓ a ação. Na primeira versão da R5 ela dividia a
          caixa com o R$ 10,25 em tipo de destaque, e o número ganhava a
          tela; a metade da ação ainda sobrava 79px (I5). O dinheiro desceu
          para a grade de números, no tamanho dos outros.

          EXCEÇÃO DELIBERADA À REGRA DE OMITIR — Victor, 16/09/2026, em
          `docs/decisoes.md`. "Voltar a anunciar" é a principal,
          desabilitada, com o motivo amarrado por `aria-describedby`.
          "Falar com alguém" é a secundária, como a decisão manda — e o
          motivo termina apontando para ela. O que a auditoria pede além
          disso (a saída que funciona VESTIDA de dominante) inverte a
          decisão, e está em DUVIDA-15.
          ============================================================ */}
      {momento === "parado" && (
        <section className={`${css.ancora} ${css.ancoraParado}`} aria-label="Voltar a anunciar">
          <div className={`${css.ancoraMetade} ${css.ancoraAcao}`}>
            <button
              type="button"
              className={`cta ${css.botao} ${css.botaoLargo}`}
              disabled
              aria-describedby="motivo-voltar"
            >
              Voltar a anunciar
            </button>
            {/* DUVIDA-12: texto desta rodada, esperando o Gabriel. Um nome
                só para quem executa — "seu gestor, a V2G" — o mesmo do
                apoio do topo (I1). */}
            <p className={css.motivo} id="motivo-voltar">
              Este botão ainda não funciona por aqui. Até funcionar, o pedido continua sendo
              seu: quem coloca o anúncio para rodar de novo é o seu gestor, a V2G. É só chamar.
            </p>
            <a
              className={`cta ghost ${css.botao} ${css.botaoLargo}`}
              href={WHATSAPP}
              target="_blank"
              rel="noopener"
            >
              Falar com alguém
            </a>
          </div>
          {/* ============================================================
              N1 DA R5-b — a metade direita é o que ele fez enquanto rodou.

              Com a âncora de 480px sobravam 462px vazios ao lado dela. Os
              números da plataforma vêm para cá, em LISTA, no tamanho de
              lista (20px) — abaixo dos 30px da manchete, para o dinheiro
              não voltar a dominar a tela (B2). A seção de números separada
              deixa de existir no parado.
              ============================================================ */}
          {estado.temNumero && (
            <div className={`${css.ancoraMetade} ${css.vez}`}>
              <h2 className={css.eyebrow}>O que ele fez enquanto rodou</h2>
              {periodo && <span className={css.fonte}>com gasto medido {periodo}</span>}
              <Numeros resultado={resultado} investido forma="lista" />
            </div>
          )}
          {/* As duas explicações descem para o rodapé da âncora, embaixo das
              DUAS metades: dentro da metade dos números, a nota a deixava
              102px mais alta que a da ação, e a ação sobrava por dentro
              (medido na R5-b, a família do I5). */}
          {(resultado.pessoas === null || acumulado?.nivelFrase) && (
            <div className={css.ancoraRodape}>
              {resultado.pessoas === null && <NotaConversas rodape />}
              {acumulado?.nivelFrase && <p className={css.ancoraFrase}>{acumulado.nivelFrase}</p>}
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          A PERGUNTA DO DIA — o componente de produção, sem mudança.

          Só no `no-ar` (DUVIDA-13): no parado o "Guardar" seria a segunda
          principal; no concluiu ela disputava a âncora.

          O invólucro corrige por fora duas coisas da auditoria: a sobra
          de 28px abaixo da caixa (I2, o `margin-bottom` do `.rc-bloco`) e
          o vazio de 343px à direita dos campos (I3).
          ============================================================ */}
      {momento === "no-ar" && execucao && (
        <div className={css.pergunta}>
          <PerguntaDoDia
            idExecucao={execucao.idExecucao}
            dia={diaDaPergunta}
            vendasAtuais={null}
            receitaAtualCentavos={null}
            respondeuAlgo={false}
            atrasados={[]}
            valoresPorDia={{}}
          />
        </div>
      )}

      {/* ============================================================
          3. OS NÚMEROS. Lista no celular, grade no largo.
          ============================================================ */}
      {estado.temNumero && momento !== "parado" && (
        <section aria-labelledby="titulo-numeros">
          <div className={css.faixaTitulo}>
            <h2 id="titulo-numeros">
              {momento === "concluiu" ? "Os primeiros sinais" : "O que a plataforma contou"}
            </h2>
            {periodo && <span className={css.faixaNota}>com gasto medido {periodo}</span>}
          </div>

          <Numeros resultado={resultado} investido={momento !== "no-ar"} forma="grade" />
          {resultado.pessoas === null && <NotaConversas />}

          {/* No `no-ar` a frase de nível já está na âncora. */}
          {momento !== "no-ar" && acumulado?.nivelFrase && (
            <p className={css.nota}>{acumulado.nivelFrase}</p>
          )}
        </section>
      )}

      {/* ============================================================
          4. O RESTO. O comando é faixa de uma linha no fim.
          ============================================================ */}
      <section aria-labelledby="titulo-quiser">
        <div className={css.faixaTitulo}>
          <h2 id="titulo-quiser">Enquanto isso, se você quiser</h2>
          <span className={css.faixaNota}>Ajuda, mas não trava nada</span>
        </div>
        <ul className={css.quiser}>
          <li>
            <a className={css.quiserItem} href="/conta">
              <b>Separar fotos do seu negócio</b>
              <span>Quanto mais material, mais a IA tem de onde escolher.</span>
            </a>
          </li>
          <li>
            <a className={css.quiserItem} href="/meu-negocio">
              <b>Conferir o que a gente entendeu do seu negócio</b>
              <span>Principalmente os números — é deles que sai a mira dos anúncios.</span>
            </a>
          </li>
          <li>
            <a className={css.quiserItem} href="/criativos">
              <b>Conferir uma peça que você já tem</b>
              <span>A gente diz se ela serve — antes de você gastar com ela.</span>
            </a>
          </li>
        </ul>
      </section>

      <section className={css.comando} aria-label="Você está no comando">
        <b className={css.comandoTitulo}>Você está no comando</b>
        <span className={css.comandoLinha}>
          {estado.verbaMensal === null
            ? "Você ainda não definiu um teto mensal."
            : `Seu teto do mês é ${dinheiro(estado.verbaMensal, "BRL")}.`}{" "}
          <a className={css.link} href="/verba">
            {estado.verbaMensal === null ? "Definir agora" : "Mudar limite"}
          </a>
        </span>
      </section>
    </div>
  );
}

/**
 * OS NÚMEROS DA PLATAFORMA. Lista no estreito, células no largo
 * (`@container`).
 *
 * A AUSÊNCIA É TRAVESSÃO, com a linha explicando e amarrada por
 * `aria-describedby`. Nunca zero, e nunca o tipo de número.
 */
function Numeros({
  resultado,
  investido,
  forma,
}: {
  resultado: EstadoDoCliente["resultado"];
  investido: boolean;
  /** `lista` em qualquer largura (dentro da âncora); `grade` vira células no largo */
  forma: "lista" | "grade";
}) {
  const classes = [
    css.numeros,
    forma === "lista" ? css.numerosLista : css.numerosGrade,
    forma === "grade" && !investido ? css.numerosTres : "",
  ].join(" ");
  return (
    <dl className={classes}>
      {investido && (
        <div className={css.numero}>
          <dt className={css.numeroRotulo}>Investido</dt>
          <dd className={css.numeroValor}>
            {dinheiroOuAusencia(resultado.investidoCentavos, resultado.moeda)}
          </dd>
        </div>
      )}
      <div className={css.numero}>
        <dt className={css.numeroRotulo}>Cliques</dt>
        <dd className={css.numeroValor}>{contagemOuAusencia(resultado.cliques)}</dd>
      </div>
      <div className={css.numero}>
        <dt className={css.numeroRotulo}>Exibições</dt>
        <dd className={css.numeroValor}>{contagemOuAusencia(resultado.impressoes)}</dd>
      </div>
      <div className={css.numero}>
        <dt className={css.numeroRotulo}>Conversas</dt>
        {resultado.pessoas === null ? (
          <dd className={css.numeroAusente} aria-describedby="nota-conversas">
            <span aria-hidden="true">—</span>
            <span className={css.soLeitor}>não medido</span>
          </dd>
        ) : (
          <dd className={css.numeroValor}>{contagemOuAusencia(resultado.pessoas)}</dd>
        )}
      </div>
    </dl>
  );
}

function NotaConversas({ rodape = false }: { rodape?: boolean }) {
  return (
    <p className={rodape ? css.ancoraFrase : css.nota} id="nota-conversas">
      <b>Conversas:</b> a contagem de quem chega pelo anúncio ainda não está de pé. Não quer
      dizer que ninguém chegou.
    </p>
  );
}
