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
 * COMPOSIÇÃO NOVA. A arrumação da `TelaDoInicio.tsx` foi descartada de
 * propósito: o código antigo puxa mais forte que a referência, e foi assim
 * que seis lotes viraram "o app velho com cosmética nova".
 *
 * REAPROVEITADO: a LÓGICA (a cadeia de `lib/estado/frases.ts`, a fonte
 * única de veiculação, os formatadores de ausência) e o VOCABULÁRIO de
 * classes que já funciona nos dois temas. Layout e hierarquia são novos.
 * ============================================================
 *
 * ============================================================
 * RODADA 4 — A TRILHA É DE PREPARAÇÃO, NÃO PLACAR PERMANENTE.
 *
 * Até a rodada 3 as quatro fases apareciam em todos os estados. Com o
 * anúncio parado isso virava "4 de 4 concluídas" sobre uma campanha que
 * não está rodando; com o anúncio no ar, carimbava "Otimizar: Concluído"
 * num trabalho que é contínuo e não termina.
 *
 * Agora a trilha só existe ENQUANTO ORIENTA A PREPARAÇÃO — ou seja, até a
 * primeira publicação (`esteveNoAr`). Depois disso o herói passa a mostrar
 * informação específica do estado, e o contador some junto: contador de
 * etapas sobre uma campanha publicada mede a coisa errada.
 *
 * A recomendação visual é esta; a POLÍTICA definitiva da trilha depois da
 * publicação é decisão de produto e está registrada como pendente no
 * `DUVIDAS.md` (DUVIDA-8).
 * ============================================================
 */
export function TelaCanonica({ estado }: { estado: EstadoDoCliente }) {
  const { resultado, temNumero, veiculacao } = estado;
  const proximo = estado.etapas.find((e) => !e.concluida) ?? null;
  const fases = fasesDaCadeia(estado.etapas, proximo);
  const feitas = fases.filter((f) => f.estado === "feita").length;
  const acumulado = estado.diaSeguinte.acumulado;

  // Lima significa "no ar agora", e só isso (DUVIDA-7). Quatro marcas
  // limão sobre uma campanha parada não são sinal, são decoração.
  const noArAgora = estaNoArAgora(veiculacao);

  // A trilha some depois da primeira publicação — ver o bloco do topo.
  const jaPublicou = esteveNoAr(veiculacao);
  const mostrarTrilha = !jaPublicou;

  // ============================================================
  // O PERÍODO É O QUE TEM DADO, não o que a gente pediu.
  //
  // `desde`/`ate` do consolidado são a janela SOLICITADA (30 dias).
  // Escrevê-la ao lado de R$ 10,25 diria que a campanha rodou trinta dias
  // gastando dez reais. O que a tela mostra são os dias em que houve
  // gasto medido.
  // ============================================================
  const diasComGasto = (acumulado?.dias ?? []).filter((d) => d.investiuCentavos !== null);
  const primeiro = diasComGasto[0]?.dia ?? null;
  const ultimo = diasComGasto[diasComGasto.length - 1]?.dia ?? null;
  const periodoMedido =
    primeiro === null || ultimo === null
      ? null
      : primeiro === ultimo
        ? `com gasto medido em ${diaCurto(primeiro)}`
        : `com gasto medido de ${diaCurto(primeiro)} a ${diaCurto(ultimo)}`;

  return (
    <div className={css.tela}>
      <div className={`${css.topo} ${proximo ? "" : css.topoSozinho}`}>
        {/* ============================================================
            O HERÓI RESPONDE "ONDE ESTOU".

            A manchete vem da FONTE ÚNICA de veiculação e é o `h1` do
            corpo: a saudação já existe no cabeçalho do casco, e repetir
            "Oi, Piligrin" aqui era o segundo cumprimento da mesma tela
            (conserto 2 da rodada 4).
            ============================================================ */}
        <section className={`${css.heroi} ${noArAgora ? css.heroiVivo : ""}`}>
          <div className={css.heroiTopo}>
            <span className={css.heroiEtiqueta}>Sua campanha</span>
            <span className={css.heroiSelo}>{fraseDeVeiculacao(veiculacao, "selo")}</span>
          </div>

          <h1 className={css.heroiManchete}>
            {fraseDeVeiculacao(veiculacao, "manchete")}
          </h1>

          {mostrarTrilha ? (
            <>
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
              <p className={css.heroiContador}>
                {feitas} de {fases.length} etapas concluídas
              </p>
            </>
          ) : (
            /* ============================================================
               O QUE SUBSTITUI A TRILHA DEPOIS DA PUBLICAÇÃO.

               NO AR: o número âncora com o período que ele cobre, e a
               porta para o detalhe. É "status presente + sinal
               mensurável + acesso ao detalhe" sem inventar métrica.

               PAUSADO: o que já aconteceu, e a única ação que o produto
               tem de fato. A tela NÃO afirma que não há gasto agora —
               nenhuma fonte consultada sustenta isso; o consolidado é
               histórico, não estado corrente.
               ============================================================ */
            <div className={css.heroiDepois}>
              {noArAgora ? (
                <>
                  <span className={css.heroiNumeroRotulo}>Investido até agora</span>
                  <span className={css.heroiNumero}>
                    {dinheiroOuAusencia(resultado.investidoCentavos, resultado.moeda)}
                  </span>
                  {periodoMedido && <span className={css.heroiLegenda}>{periodoMedido}</span>}
                  <a className={css.heroiLink} href="/anuncios">
                    Ver meus anúncios
                  </a>
                </>
              ) : (
                <>
                  <p className={css.heroiTexto}>
                    Para voltar a anunciar, fale com a V2G. Hoje essa decisão não se aperta
                    sozinha aqui dentro.
                  </p>
                  <a
                    className={css.heroiBotao}
                    href="https://wa.me/5521936182176"
                    target="_blank"
                    rel="noopener"
                  >
                    Falar com alguém
                  </a>
                </>
              )}
            </div>
          )}
        </section>

        {/* ============================================================
            A COLUNA DA DIREITA.

            Com etapa aberta: o cartão de decisão, com UMA ação. Sem etapa
            aberta: só o comando — a ação humana já está no herói, e dois
            botões de suporte no mesmo campo de visão era a duplicata que
            o conserto 4 manda evitar.
            ============================================================ */}
        {proximo && (
          <div className={css.coluna}>
            <section className={css.acao}>
              <span className="eyebrow">{tarja(proximo)}</span>
              <h2 className={css.acaoTitulo}>{proximo.titulo}</h2>
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
            </section>
          </div>
        )}
      </div>

      {/* ============================================================
          OS QUATRO NÚMEROS — grade 2 × 2 no celular, quatro células de
          altura igual, rótulo de uma linha.

          A AUSÊNCIA É CÉLULA COMO AS OUTRAS. Na rodada 3 ela ocupava a
          linha inteira e carregava a explicação dentro, o que deformava a
          grade. Agora a ressalva mora LOGO ABAIXO da grade e está ligada
          ao cartão por `aria-describedby` — visível para quem lê e para
          quem ouve, sem esticar célula nenhuma.

          "Não medido" e não "0": zero é afirmação sobre o negócio dele.
          ============================================================ */}
      {temNumero && (
        <section>
          <div className="section-title">
            <h2>Os primeiros sinais</h2>
            {periodoMedido && <span className="side-note">{periodoMedido}</span>}
          </div>

          <div className={css.numeros}>
            <div className={css.numero}>
              <span className={css.numeroRotulo}>Investido</span>
              <span className={css.numeroValor}>
                {dinheiroOuAusencia(resultado.investidoCentavos, resultado.moeda)}
              </span>
            </div>
            <div className={css.numero}>
              <span className={css.numeroRotulo}>Cliques</span>
              <span className={css.numeroValor}>{contagemOuAusencia(resultado.cliques)}</span>
            </div>
            <div className={css.numero}>
              <span className={css.numeroRotulo}>Exibições</span>
              <span className={css.numeroValor}>
                {contagemOuAusencia(resultado.impressoes)}
              </span>
            </div>
            <div className={css.numero} aria-describedby="nota-conversas">
              <span className={css.numeroRotulo}>Conversas</span>
              <span
                className={
                  resultado.pessoas === null ? css.numeroValorAusente : css.numeroValor
                }
              >
                {resultado.pessoas === null
                  ? "Não medido"
                  : contagemOuAusencia(resultado.pessoas)}
              </span>
            </div>
          </div>

          {resultado.pessoas === null && (
            <p className={css.notaGrade} id="nota-conversas">
              <b>Conversas:</b> a contagem de quem chega pelo anúncio ainda não está de pé.
              Não quer dizer que ninguém chegou.
            </p>
          )}

          {acumulado?.nivelFrase && <p className={css.frase}>{acumulado.nivelFrase}</p>}
        </section>
      )}

      {/* ============================================================
          O RODAPÉ — o que ajuda, e o controle.

          O comando desceu para cá na rodada 4. Enquanto ele morava na
          coluna da direita, os estados sem cartão de decisão ficavam com
          um cartão curto ao lado de um herói alto, e o resto da coluna
          era vazio até o fim da tela. Aqui ele emparelha com a lista, e o
          herói ocupa a largura inteira quando não há decisão a tomar.
          ============================================================ */}
      <div className={css.rodape}>
      <section>
        <div className="section-title">
          <h2>Enquanto isso, se você quiser</h2>
          <span className="side-note">Ajuda, mas não trava nada</span>
        </div>
        <div className={`card acct-list ${css.listaLarga}`}>
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
          <a className="acct-row" href="/criativos">
            <span className="ar-text">
              <b>Conferir uma peça que você já tem</b>
              <span>A gente diz se ela serve — antes de você gastar com ela.</span>
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
          <a href="/verba">
            {estado.verbaMensal === null ? "definir agora" : "mudar limite"}
          </a>
        </p>
      </section>
      </div>
    </div>
  );
}
