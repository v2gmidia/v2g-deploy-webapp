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
 * A arrumação da rodada 4 foi jogada fora: herói cobalto em caixa,
 * coluna da direita, cartão do comando ao lado da lista. Ela produzia os
 * três defeitos que a rodada manda consertar — vazio DENTRO do herói no
 * "no ar", sobra abaixo do comando no preparando, e "Em andamento"
 * quebrando porque quatro colunas não cabem em 343px.
 *
 * A página agora é uma coluna só, em quatro faixas, na mesma ordem em
 * todos os estados:
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
 * FAIXA (`@container`), não a da janela. A 900px a lateral come 245px, e
 * a janela diz "largo" enquanto o conteúdo é estreito — foi isso que fez
 * "Em andamento" quebrar.
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
 *               conclusão aparece UMA vez (decisão de 17/09)
 *   no-ar       esteve no ar e está agora. A trilha não existe mais; a
 *               âncora é investiu × voltou
 *   parado      esteve no ar e não está agora. A âncora é a ação de
 *               voltar, desabilitada com o motivo (decisão de 16/09)
 *
 * `mostrarConclusao` NÃO TEM FONTE HOJE. Nenhum campo do backend nem do
 * banco diz "o dono ainda não viu a conclusão", e a rodada proíbe guardar
 * isso no navegador ou inventar campo. Sem fonte, o padrão é `false`:
 * a produção cairia direto no `no-ar`. É o lado conservador, porque o
 * defeito que a decisão mata é o placar que NÃO some — uma conclusão que
 * nunca aparece é uma omissão; uma que aparece sempre é o defeito de
 * volta. O que o backend teria de mandar está na DUVIDA-11.
 * ============================================================
 */
type Momento = "preparando" | "concluiu" | "no-ar" | "parado";

const WHATSAPP = "https://wa.me/5521936182176";

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

  return (
    <div className={css.tela}>
      {/* ============================================================
          1. ONDE ESTOU. Sem caixa: é texto, e texto sem moldura não deixa
          vazio desenhado à direita. O `h1` é a manchete; o cumprimento
          fica só no cabeçalho do casco.
          ============================================================ */}
      <header className={css.estado}>
        <span className={`${css.selo} ${noArAgora ? css.seloVivo : ""}`}>
          {fraseDeVeiculacao(veiculacao, "selo")}
        </span>
        <h1 className={css.manchete}>{fraseDeVeiculacao(veiculacao, "manchete")}</h1>
        {/* O apoio vem da fonte única, inteiro. No parado ele diz "Seu
            gestor pode retomar quando fizer sentido" — e o gestor é a
            V2G (decisão de 16/09): a frase é verdadeira e fica.
            DUVIDA-10 registra por que a rodada 4 a escondia e esta não. */}
        <p className={css.apoio}>{fraseDeVeiculacao(veiculacao, "apoio")}</p>
      </header>

      {/* ============================================================
          2. A ÂNCORA. Uma por momento.
          ============================================================ */}
      {(momento === "preparando" || momento === "concluiu") && (
        <section
          className={`${css.ancora} ${momento === "concluiu" ? css.ancoraConcluiu : css.ancoraPreparando}`}
          aria-labelledby="titulo-trilha"
        >
          <div className={css.ancoraMetade}>
            <h2 className={css.eyebrow} id="titulo-trilha">
              {momento === "concluiu" ? "A preparação terminou" : "A preparação"}
            </h2>
            <p className={css.contador}>
              {feitas} de {fases.length} etapas concluídas
            </p>

            {/* ============================================================
                A TRILHA MUDA DE FORMA COM A LARGURA, NÃO DE CONTEÚDO.

                Estreita: quatro barras e UMA linha com a fase de agora —
                é "quanto falta" de relance, e nenhum rótulo precisa caber
                em 80px. Larga: a lista, uma fase por linha, rótulo à
                direita sem quebrar. A lista é a MESMA marcação nas duas
                (quem ouve escuta as quatro fases sempre); na estreita os
                nomes ficam só para o leitor de tela, e a linha "Agora" é
                `aria-hidden` para não ser lida duas vezes.
                ============================================================ */}
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

          {momento === "preparando" && proximo && (
            <div className={`${css.ancoraMetade} ${css.vez}`}>
              <span className={css.eyebrow}>{tarja(proximo)}</span>
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

          {momento === "concluiu" && (
            <div className={`${css.ancoraMetade} ${css.vez}`}>
              {/* DUVIDA-12: texto desta rodada, esperando o Gabriel. */}
              <p className={css.textoForte}>
                Esta é a última vez que a preparação aparece aqui.
              </p>
              <p className={css.texto}>
                Daqui em diante, o Início mostra o que o anúncio está fazendo: quanto foi
                investido e quanto voltou para você.
              </p>
              <a className={css.link} href="/anuncios">
                Ver meus anúncios
              </a>
            </div>
          )}
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
          {/* A ÚNICA FRASE AUTORIZADA A DIZER SE ESTÁ BOM OU RUIM, como veio
              do backend. A tela não divide um pelo outro: os dois lados
              cobrem dias diferentes, e a conta seria uma mentira exata. */}
          <div className={css.ancoraRodape}>
            {acumulado.nivelFrase && <p className={css.ancoraFrase}>{acumulado.nivelFrase}</p>}
            <a className={css.link} href="/anuncios">
              Ver meus anúncios
            </a>
          </div>
        </section>
      )}

      {momento === "parado" && (
        <section className={css.ancora} aria-labelledby="titulo-voltar">
          <div className={`${css.ancoraMetade} ${css.voltar}`}>
            <h2 className={css.eyebrow} id="titulo-voltar">
              Voltar a anunciar
            </h2>
            {/* ============================================================
                EXCEÇÃO DELIBERADA À REGRA DE OMITIR — Victor, 16/09/2026,
                registrada em `docs/decisoes.md`.

                A ação vai existir e é do dono; o endpoint ainda não. Por
                isso o botão é a PRINCIPAL da tela, desabilitado, com o
                motivo escrito embaixo e amarrado por `aria-describedby`.
                Sem prazo: "em breve" é promessa, e ninguém mediu quando.
                A saída que funciona hoje vem logo abaixo, como secundária.
                ============================================================ */}
            <button
              type="button"
              className={`cta ${css.botao}`}
              disabled
              aria-describedby="motivo-voltar"
            >
              Voltar a anunciar
            </button>
            <p className={css.motivo} id="motivo-voltar">
              Este botão ainda não funciona por aqui. Enquanto isso, quem coloca seu anúncio
              de volta para rodar é a equipe da V2G — é só chamar.
            </p>
            <a
              className={`cta ghost ${css.botao}`}
              href={WHATSAPP}
              target="_blank"
              rel="noopener"
            >
              Falar com alguém
            </a>
          </div>
          {/* ============================================================
              O QUE ELE FEZ ENQUANTO RODOU — tudo o que a plataforma
              contou, NESTA metade. Na primeira versão da rodada 5 aqui
              ficava só o investido, e a metade era R$ 10,25 seguido de
              vazio até o fim da âncora — o defeito do "no ar" da rodada
              4, trocado de lado. Os números moram onde o assunto mora;
              a seção separada deixa de existir no parado.
              ============================================================ */}
          <div className={`${css.ancoraMetade} ${css.vez}`}>
            <span className={css.eyebrow}>Enquanto rodou</span>
            <span className={css.valorAncora}>
              {dinheiroOuAusencia(resultado.investidoCentavos, resultado.moeda)}
            </span>
            <span className={css.fonte}>
              investido, medido pela plataforma{periodo ? `, ${periodo}` : ""}
            </span>
            <Numeros resultado={resultado} investido={false} forma="lista" />
            {resultado.pessoas === null && <NotaConversas />}
          </div>
          {acumulado?.nivelFrase && (
            <div className={css.ancoraRodape}>
              <p className={css.ancoraFrase}>{acumulado.nivelFrase}</p>
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          A PERGUNTA DO DIA — o componente de produção, sem mudança.

          Só enquanto o anúncio roda AGORA. No parado a principal da tela
          é "Voltar a anunciar", e o "Guardar" da pergunta seria a segunda
          principal no mesmo campo de visão. DUVIDA-13.
          ============================================================ */}
      {noArAgora && execucao && (
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

          A AUSÊNCIA É TRAVESSÃO, com a linha explicando logo abaixo e
          amarrada por `aria-describedby`. Nunca zero, e nunca o tipo de
          número: ela não é um número.
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
          4. O RESTO. Três itens lado a lado no largo, lista no estreito.
          O comando virou FAIXA de uma linha no fim: como cartão ao lado
          da lista, ele era curto ao lado de comprido, e o resto da coluna
          ficava vazio (item 3 da rodada 4).
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
 * OS NÚMEROS DA PLATAFORMA. Uma marcação, duas formas.
 *
 * `lista`: rótulo à esquerda e valor à direita, em qualquer largura — é a
 * forma de dentro da âncora do parado. `grade`: lista no estreito, células
 * no largo (`@container`).
 *
 * A AUSÊNCIA É TRAVESSÃO, com a linha explicando e amarrada por
 * `aria-describedby`. Nunca zero, e nunca o tipo de número: ela não é um
 * número.
 */
function Numeros({
  resultado,
  investido,
  forma,
}: {
  resultado: EstadoDoCliente["resultado"];
  investido: boolean;
  forma: "lista" | "grade";
}) {
  const classe = [
    css.numeros,
    forma === "grade" ? css.numerosGrade : css.numerosLista,
    forma === "grade" && !investido ? css.numerosTres : "",
  ].join(" ");
  return (
    <dl className={classe}>
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

function NotaConversas() {
  return (
    <p className={css.nota} id="nota-conversas">
      <b>Conversas:</b> a contagem de quem chega pelo anúncio ainda não está de pé. Não quer
      dizer que ninguém chegou.
    </p>
  );
}
