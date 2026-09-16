import { contagemOuAusencia, dinheiroOuAusencia } from "@/lib/dia-seguinte/exibir";
import { dinheiro } from "@/lib/formato";
import { estaNoArAgora, fraseDeVeiculacao } from "@/lib/veiculacao/estado";
import { fasesDaCadeia, tarja } from "@/lib/estado/frases";
import type { EstadoDoCliente } from "@/lib/estado/cliente";
import css from "./TelaCanonica.module.css";

/**
 * O INÍCIO CANÔNICO — laboratório visual, não produção.
 *
 * ============================================================
 * COMPOSIÇÃO NOVA. A arrumação da `TelaDoInicio.tsx` foi descartada de
 * propósito, com permissão explícita do briefing: o código antigo puxa
 * mais forte que a referência, e foi assim que seis lotes viraram "o app
 * velho com cosmética nova".
 *
 * O QUE FOI REAPROVEITADO, e só isto: a LÓGICA (a cadeia de
 * `lib/estado/frases.ts`, a fonte única de veiculação, os formatadores de
 * ausência) e o VOCABULÁRIO de classes utilitárias que já funciona nos
 * dois temas. Layout, hierarquia e ordem de leitura são novos.
 * ============================================================
 *
 * AS DUAS TRILHAS VIRARAM UMA (DUVIDA-2). Ficam as quatro fases, no
 * herói. A lista das seis etapas saiu da tela — `montarEtapas()` continua
 * inteiro e continua decidindo qual é a ação primária.
 */
export function TelaCanonica({
  estado,
  nome,
}: {
  estado: EstadoDoCliente;
  nome: string;
}) {
  const { resultado, temNumero, veiculacao } = estado;
  const proximo = estado.etapas.find((e) => !e.concluida) ?? null;
  const fases = fasesDaCadeia(estado.etapas, proximo);
  const feitas = fases.filter((f) => f.estado === "feita").length;
  const acumulado = estado.diaSeguinte.acumulado;

  // ============================================================
  // DUVIDA-7 — LIMA SIGNIFICA "NO AR AGORA", E SÓ ISSO.
  //
  // Na rodada 1 as quatro fases saíam com marca limão de "Concluído" ao
  // lado da manchete "Seu anúncio já rodou e não está no ar agora". Era o
  // item 10.d do contrato reaparecendo pela minha mão: a cadeia FECHA
  // legitimamente (o anúncio chegou a rodar), e mesmo assim a impressão
  // geral virava conquista sobre uma campanha parada.
  //
  // O conserto não mexe na lógica nem em frase nenhuma — mexe no SINAL.
  // Lima só acende quando a plataforma diz que o anúncio está no ar
  // agora. Parado, as marcas ficam neutras: a informação continua lá
  // ("Concluído"), a comemoração não.
  //
  // É também o que devolve sentido à Signal Lime Rule do DESIGN.md:
  // quatro marcas limão seguidas não são sinal, são decoração.
  // ============================================================
  const noArAgora = estaNoArAgora(veiculacao);

  return (
    <div className={css.tela}>
      <header className={css.saudacao}>
        <h1>Oi, {nome}</h1>
      </header>

      <div className={css.topo}>
        {/* ============================================================
            O HERÓI RESPONDE "ONDE ESTOU".

            A manchete vem da FONTE ÚNICA de veiculação — a tela não
            escreve frase sobre o ar. O selo ao lado da etiqueta é a mesma
            fonte, no formato curto.
            ============================================================ */}
        <section className={`${css.heroi} ${noArAgora ? css.heroiVivo : ""}`}>
          <div className={css.heroiTopo}>
            <span className={css.heroiEtiqueta}>Sua campanha</span>
            <span className={css.heroiSelo}>{fraseDeVeiculacao(veiculacao, "selo")}</span>
          </div>

          <h2 className={css.heroiManchete}>
            {fraseDeVeiculacao(veiculacao, "manchete")}
          </h2>

          <ol className={css.fases}>
            {fases.map((f, i) => (
              <li
                className={`${css.fase} ${css[f.estado]} ${
                  f.estado === "feita" && noArAgora ? css.viva : ""
                }`}
                key={f.id}
              >
                <span className={css.faseMarca} aria-hidden="true">
                  {f.estado === "feita" ? "✓" : i + 1}
                </span>
                <span className={css.faseNome}>{f.nome}</span>
                <span className={css.faseRotulo}>{f.rotulo}</span>
              </li>
            ))}
          </ol>

          <p className={css.heroiContador}>
            {feitas} de {fases.length} etapas concluídas
          </p>
        </section>

        {/* ============================================================
            O CARTÃO DA DECISÃO RESPONDE "O QUE DEPENDE DE MIM".

            UMA ação cheia na tela inteira. Quando a bola não é do
            cliente, não há botão — há uma frase dizendo de quem é a vez.
            A etapa é quem sabe (`acao: null` quando não é dele), e a
            tela não inventa botão.

            DUVIDA-6: o estado pausado NÃO recebe "nada esperando por
            você". Ele declara o estado e oferece o caminho humano, que é
            a única saída que existe hoje no produto — não há rota de
            retomada em lugar nenhum do webapp.
            ============================================================ */}
        <section className={css.acao}>
          {proximo ? (
            <>
              <span className="eyebrow">{tarja(proximo)}</span>
              <h3 className={css.acaoTitulo}>{proximo.titulo}</h3>
              <p className={css.acaoCorpo}>{proximo.corpo}</p>
              {proximo.acao ? (
                <a className={`cta ${css.acaoBotao}`} href={proximo.acao.href}>
                  {proximo.acao.rotulo}
                </a>
              ) : (
                <p className={css.acaoNota}>
                  {proximo.bola === "facebook"
                    ? "Agora é com o Facebook. Não precisa fazer nada — e mexer na campanha agora atrasaria."
                    : "Agora é com a gente. Você não precisa fazer nada."}
                </p>
              )}
            </>
          ) : (
            <>
              {/* ============================================================
                  CADEIA FECHADA NÃO É "NADA ESPERANDO POR VOCÊ".

                  Na rodada 2 o título era "Nada, por enquanto", e ele
                  reencostava no defeito 10.b: com o anúncio parado, a
                  tela soava como quem terminou. O título agora nomeia o
                  que a pessoa PODE fazer, e a única saída que o produto
                  tem de fato — falar com gente — deixa de ser botão
                  fantasma no rodapé e vira a ação cheia desta tela.

                  A frase de apoio aparece UMA vez, e é aqui: na rodada 1
                  ela saía também no subtítulo da saudação.
                  ============================================================ */}
              <span className="eyebrow">O que depende de você</span>
              <h3 className={css.acaoTitulo}>
                Nada agora — e dá para mudar isso quando quiser
              </h3>
              <p className={css.acaoCorpo}>{fraseDeVeiculacao(veiculacao, "apoio")}</p>
              <a
                className={`cta ${css.acaoBotao}`}
                href="https://wa.me/5521936182176"
                target="_blank"
                rel="noopener"
              >
                Falar com uma pessoa
              </a>
            </>
          )}
        </section>
      </div>

      {/* ============================================================
          OS NÚMEROS — e um deles é uma AUSÊNCIA com explicação.

          Só aparecem quando há medição. Sem `temNumero` a seção inteira
          é omitida, e não renderizada vazia: o que não tem fonte é
          omitido, não desabilitado.
          ============================================================ */}
      {temNumero && (
        <section>
          <div className="section-title">
            <h2>Os primeiros sinais</h2>
          </div>
          <div className={css.numeros}>
            <div className={css.numero}>
              <span className={css.numeroRotulo}>Investido</span>
              <span className={css.numeroValor}>
                {dinheiroOuAusencia(resultado.investidoCentavos, resultado.moeda)}
              </span>
            </div>
            <div className={css.numero}>
              <span className={css.numeroRotulo}>Pessoas que clicaram</span>
              <span className={css.numeroValor}>
                {contagemOuAusencia(resultado.cliques)}
              </span>
            </div>
            <div className={css.numero}>
              <span className={css.numeroRotulo}>Vezes que apareceu</span>
              <span className={css.numeroValor}>
                {contagemOuAusencia(resultado.impressoes)}
              </span>
            </div>
            <div className={`${css.numero} ${css.numeroAusente}`}>
              <span className={css.numeroRotulo}>Conversas</span>
              <span className={css.numeroValorAusente}>
                {contagemOuAusencia(resultado.pessoas)}
              </span>
              {resultado.pessoas === null && (
                <span className={css.numeroNota}>
                  A contagem de quem chega pelo anúncio ainda não está de pé. Não quer dizer
                  que ninguém chegou.
                </span>
              )}
            </div>
          </div>
          {acumulado?.nivelFrase && <p className={css.frase}>{acumulado.nivelFrase}</p>}
        </section>
      )}

      {/* ============================================================
          O RODAPÉ DA TELA — o que ajuda e o que dá controle.

          Entrou na rodada 2: em 1280px a tela terminava depois do topo e
          sobravam mil pixels de vazio. Não é enchimento — são as duas
          coisas que o contrato lista como prioridade 6 e 7 (o que ajuda
          sem travar, e o controle da verba com a saída humana).
          ============================================================ */}
      <div className={css.rodape}>
        <section>
          <div className="section-title">
            <h2>Enquanto isso, se você quiser</h2>
            <span className="side-note">Ajuda, mas não trava nada</span>
          </div>
          <div className="card acct-list">
            <a className="acct-row" href="/conta">
              <span className="ar-text">
                <b>Separar fotos do seu negócio</b>
                <span>Quanto mais material, mais a IA tem de onde escolher.</span>
              </span>
            </a>
            <a className="acct-row" href="/meu-negocio">
              <span className="ar-text">
                <b>Conferir o que a gente entendeu do seu negócio</b>
                <span>Principalmente os números — é deles que sai a mira dos anúncios.</span>
              </span>
            </a>
          </div>
        </section>

        <section className={css.comando}>
          <b className="title">Você está no comando</b>
          <p className={css.comandoLinha}>
            {estado.verbaMensal === null
              ? "Você ainda não definiu um teto mensal. "
              : `Seu teto do mês é ${dinheiro(estado.verbaMensal, "BRL")}. `}
            <a href="/verba">{estado.verbaMensal === null ? "definir agora" : "mudar limite"}</a>
          </p>
          {/* SEM BOTÃO AQUI. Na rodada 2 "Falar com uma pessoa" aparecia
              duas vezes na mesma tela — neste cartão e na barra do casco.
              A ação humana tem um lugar só, e é o cartão de decisão, onde
              ela decide alguma coisa. */}
        </section>
      </div>
    </div>
  );
}
