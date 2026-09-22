import css from "./CobrancaDoMaterial.module.css";

/**
 * ONDE A COBRANÇA DO MATERIAL VOLTA — bancada, não produção.
 *
 * ============================================================
 * O PULO É REAL, E POR ISSO A VOLTA TAMBÉM PRECISA SER.
 *
 * O passo 10 do onboarding deixa pular por escrito ("Não tenho agora —
 * mando depois") e grava `material_depois`. Um pulo sem cobrança de volta
 * não é um pulo: é um buraco com nome bonito. A pessoa sai do cadastro
 * achando que terminou, e três dias depois descobre que nada andou.
 *
 * Então a cobrança volta em DOIS momentos, e eles são diferentes de
 * propósito:
 *
 *   1. NO INÍCIO, como próximo passo. Lembrete, não bloqueio. A pessoa
 *      abre o app e vê a única coisa que falta dela.
 *   2. ANTES DO CRIATIVO, como tranca. Aqui não é lembrete: sem arquivo
 *      a montagem não roda mesmo, e deixar o botão aceso seria a mesma
 *      mentira que o passo 10 tinha antes de 21/09.
 * ============================================================
 *
 * ============================================================
 * A TRANCA NÃO É INVENÇÃO DA TELA — É O BACKEND.
 *
 * `SemMaterialDoClienteError` existe no pipeline (medido no snapshot do
 * backend em 22/09/2026): a geração do criativo visual recusa quando o
 * cliente não tem material. Ou seja, o botão aceso levaria a pessoa a
 * uma recusa do outro lado, com um texto que ela não escolheu ler.
 *
 * Isto fecha a DUVIDA-ONB-16, que perguntava se "sem material o anúncio
 * não sai" era regra de verdade ou frase de tela. É regra.
 * ============================================================
 *
 * ============================================================
 * O QUE ESTA TELA NÃO FAZ, e é decisão e não esquecimento:
 *
 * — NÃO celebra. Não há conquista aqui: a pessoa está devendo uma coisa
 *   que ela mesma adiou, e confete em cima disso é deboche.
 * — NÃO conta dias ("faz 3 dias que você não manda"). Cobrança por
 *   contador é cobrança de agência, e o público deste produto já levou
 *   essa. A frase diz o que falta, não há quanto tempo.
 * — NÃO promete prazo depois do envio. A gente não mede isso.
 * — NÃO usa a palavra "erro" em lugar nenhum: não houve erro, houve uma
 *   escolha adiada.
 * ============================================================
 */
export function CobrancaDoMaterial() {
  return (
    <div className={css.tela}>
      <header className={css.topo}>
        <span className={css.marca}>V2G</span>
        <span className={css.nota}>bancada — os dois momentos da cobrança</span>
      </header>

      {/* ===================================================== momento 1 */}
      <section className={css.momento}>
        <h2 className={css.momentoTitulo}>1. No Início, como próximo passo</h2>
        <p className={css.momentoNota}>
          Aparece quando o cadastro foi fechado com <code>material_depois</code>. Ocupa o
          lugar do herói, porque é a única coisa que depende dela.
        </p>

        <div className={css.quadro}>
          <section className={css.heroi}>
            <h1 className={css.manchete}>Falta o material do seu anúncio</h1>
            <p className={css.apoio}>
              Você preferiu mandar depois. São as fotos do seu negócio e a sua logo — é
              com elas que a montagem começa.
            </p>
            <a className={`cta ${css.botao}`} href="#" aria-disabled="true">
              Mandar fotos e logo
            </a>
            {/* A porta de saída fica visível, e não é a mesma coisa que o
                botão: quem não tem foto pronta no celular precisa de um
                caminho que não seja "volte quando tiver". */}
            <p className={css.saida}>
              Se for mais fácil,{" "}
              <a className={css.saidaLinha} href="#" aria-disabled="true">
                manda pelo WhatsApp
              </a>{" "}
              que a gente coloca no lugar.
            </p>
          </section>

          {/* ============================================================
              O RESTO DA CADEIA CONTINUA SENDO CONTEXTO.

              Mesma regra da tela de chegada: uma ação só. As outras
              etapas aparecem cinzas e sem botão, e a atual é a do
              material. Duas etapas com botão seria a tela pedindo que a
              pessoa escolha por onde começar — e ela não tem como saber.
              ============================================================ */}
          <section className={css.caminho}>
            <h3 className={css.caminhoTitulo}>O caminho até seu anúncio no ar</h3>
            <ol className={css.etapas}>
              <li className={`${css.etapa} ${css.feita}`}>
                <span className={css.marcaEtapa} aria-hidden="true" />
                <span className={css.etapaNome}>Suas respostas</span>
              </li>
              <li className={`${css.etapa} ${css.atual}`}>
                <span className={css.marcaEtapa} aria-hidden="true" />
                <span className={css.etapaNome}>Seu material</span>
                <span className={css.vocEstaAqui}>você está aqui</span>
              </li>
              <li className={css.etapa}>
                <span className={css.marcaEtapa} aria-hidden="true" />
                <span className={css.etapaNome}>A montagem do anúncio</span>
              </li>
              <li className={css.etapa}>
                <span className={css.marcaEtapa} aria-hidden="true" />
                <span className={css.etapaNome}>A sua aprovação</span>
              </li>
            </ol>
          </section>
        </div>
      </section>

      {/* ===================================================== momento 2 */}
      <section className={css.momento}>
        <h2 className={css.momentoTitulo}>2. Antes de subir o criativo, como tranca</h2>
        <p className={css.momentoNota}>
          Aqui o botão da montagem está apagado de verdade, e o motivo fica colado nele —
          não num aviso que some.
        </p>

        <div className={css.quadro}>
          <section className={css.heroi}>
            <h1 className={css.manchete}>Antes de montar o anúncio</h1>
            <p className={css.apoio}>
              A montagem usa as suas fotos e a sua logo. Sem elas não há o que montar — a
              gente não inventa a cara do seu negócio.
            </p>

            <div className={css.acoes}>
              <a className={`cta ${css.botao}`} href="#" aria-disabled="true">
                Mandar fotos e logo
              </a>
              {/* ============================================================
                  O BOTÃO DESABILITADO DIZ POR QUÊ, COLADO NELE.

                  Botão apagado sem motivo é a tela recusando sem explicar,
                  e quem lê fica achando que quebrou. O motivo não é um
                  aviso vermelho em cima: é uma linha logo abaixo do botão,
                  no peso de legenda, porque não houve nada de errado.

                  E ele não manda a pessoa fazer nada. "Espera o material
                  chegar" era ordem para quem já sabe que precisa mandar;
                  o que falta é a tela dizer o que DESTRAVA o botão.
                  ============================================================ */}
              <span className={css.travado}>
                <button type="button" className={`cta ghost ${css.botao}`} disabled>
                  Montar meu anúncio
                </button>
                <span className={css.motivo}>Destrava quando o material chegar</span>
              </span>
            </div>
          </section>

          <section className={css.lista}>
            <h3 className={css.caminhoTitulo}>O que a montagem precisa</h3>
            <ul className={css.itens}>
              <li className={`${css.item} ${css.temNao}`}>
                <span className={css.marcaItem} aria-hidden="true" />
                <span>
                  A sua logo
                  {/* Ausência é travessão com linha que explica, nunca
                      "0 arquivos". Zero em tela é placar de derrota. */}
                  <span className={css.itemNota}>— ainda não chegou</span>
                </span>
              </li>
              <li className={`${css.item} ${css.temNao}`}>
                <span className={css.marcaItem} aria-hidden="true" />
                <span>
                  Fotos do seu negócio
                  <span className={css.itemNota}>— ainda não chegaram</span>
                </span>
              </li>
              <li className={`${css.item} ${css.temSim}`}>
                <span className={css.marcaItem} aria-hidden="true" />
                <span>
                  Suas respostas do cadastro
                  <span className={css.itemNota}>— com a gente</span>
                </span>
              </li>
            </ul>
          </section>
        </div>
      </section>
    </div>
  );
}
