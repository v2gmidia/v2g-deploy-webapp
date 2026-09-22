import { esteveNoAr } from "@/lib/veiculacao/estado";
import type { EstadoDoCliente } from "@/lib/estado/cliente";
import css from "./TelaDeChegada.module.css";

/**
 * O INÍCIO DE QUEM ACABOU DE CHEGAR — bancada, não produção.
 *
 * ============================================================
 * DOIS DEFEITOS DA `/inicio` DE HOJE, VISTOS NA TELA REAL.
 *
 * 1. DUAS COISAS AO MESMO TEMPO. Ela mostra "sua campanha está sendo
 *    preparada, 0 de 4 etapas" junto com "falta conectar sua conta". Uma
 *    frase diz para esperar, a outra diz para agir, e as duas têm o mesmo
 *    peso. O dono não sabe qual das duas é com ele.
 *
 * 2. A PERGUNTA DO DIA APARECE ANTES DE EXISTIR DIA. "Uma pergunta rápida
 *    sobre ontem: quantas conversas viraram venda?" aparece para quem
 *    nunca teve anúncio no ar. Não houve ontem, não houve conversa, e
 *    perguntar isso é a tela afirmando que algo rodou.
 * ============================================================
 *
 * ============================================================
 * AS DUAS REGRAS DESTA TELA.
 *
 * REGRA 1 — UMA AÇÃO. O herói tem exatamente um botão, e ele é o
 * `proximo` da cadeia. O resto da cadeia aparece como CONTEXTO: sem
 * botão, sem placar, sem número grande. "0 de 4" saiu inteiro — zero não
 * é progresso, é a ausência dele, e escrever zero em destaque para quem
 * acabou de chegar é dar má notícia sobre uma coisa que ele fez agora.
 *
 * REGRA 2 — A PERGUNTA DO DIA PEDE `esteveNoAr()`. Não "tem execução":
 * `esteveNoAr` é o predicado da fonte única (`lib/veiculacao/estado.ts`),
 * e é ele que distingue "o anúncio rodou" de "existe uma linha no banco".
 * A `/inicio` de hoje condiciona em `estado.diaSeguinte.execucao !== null`
 * (`TelaDoInicio.tsx:208`), e é daí que vem o defeito 2: a execução nasce
 * quando o pipeline DISPARA, muito antes de qualquer anúncio no ar.
 * ============================================================
 *
 * ============================================================
 * O QUE ESTA TELA NÃO FAZ, e é decisão e não esquecimento:
 *
 *   — não promete prazo. Nem "em alguns minutos", nem "até amanhã". A
 *     gente não mede quando a Meta aprova;
 *   — não mostra número de resultado, porque não há nenhum. Ausência é
 *     traço com uma linha explicando, nunca zero;
 *   — não comemora. O cadastro terminar não é conquista de campanha, e
 *     lima aqui seria festa antes da hora.
 * ============================================================
 */

/** O que a tela diz em cada momento. Texto num lugar só. */
const FALAS = {
  falta_conectar: {
    manchete: "Falta você conectar o Facebook.",
    apoio:
      "É a última coisa que depende de você. Sem essa autorização a gente não consegue criar o anúncio na conta do seu negócio — e nada começa.",
    acao: "Conectar meu Facebook",
    depois: "Assim que você conectar, a gente monta seu anúncio e te mostra antes de publicar.",
  },
  e_com_a_gente: {
    manchete: "Agora é com a gente.",
    apoio:
      "Você fez tudo o que dependia de você. A partir daqui quem trabalha somos nós: montamos o anúncio e trazemos para você aprovar antes de qualquer coisa ir ao ar.",
    acao: null,
    depois: "Você não precisa fazer nada agora. A gente te avisa quando tiver algo para ver.",
  },
} as const;

export function TelaDeChegada({
  estado,
  momento,
}: {
  estado: EstadoDoCliente;
  momento: keyof typeof FALAS;
}) {
  const fala = FALAS[momento];
  const proximo = estado.proximo;

  // ============================================================
  // O PORTÃO DA PERGUNTA DO DIA, numa linha e com o predicado certo.
  //
  // Escrito aqui em cima, e não enterrado no meio do JSX, porque é o
  // defeito 2 inteiro. Se um dia alguém precisar mostrar a pergunta antes
  // do primeiro anúncio, vai ter que mexer NESTA linha e explicar o
  // porquê — que é exatamente o atrito que faltava.
  // ============================================================
  const cabePerguntarSobreOntem = esteveNoAr(estado.veiculacao);

  return (
    <div className={css.tela}>
      <header className={css.topo}>
        <span className={css.marca}>V2G</span>
        <a className={css.humano} href="#" aria-disabled="true">
          Falar com uma pessoa
        </a>
      </header>

      {/* ---------- o herói: o que é verdade agora, e UMA ação ---------- */}
      <section className={css.heroi}>
        <h1 className={css.manchete}>{fala.manchete}</h1>
        <p className={css.apoio}>{fala.apoio}</p>

        {fala.acao ? (
          <a className={`cta ${css.botao}`} href="#" aria-disabled="true">
            {fala.acao}
          </a>
        ) : (
          /* Sem ação NÃO é sem resposta: a tela diz de quem é a vez. */
          <p className={css.semAcao}>
            <span className={css.pulso} aria-hidden="true" />
            Nada esperando por você
          </p>
        )}

        <p className={css.depois}>{fala.depois}</p>
      </section>

      {/* ============================================================
          A CADEIA COMO CONTEXTO, e não como placar.

          Sem "0 de 4", sem porcentagem, sem barra cheia pela metade. Ela
          responde "onde eu estou no caminho", que é outra pergunta de "o
          que eu faço agora" — e é por misturar as duas que a tela de hoje
          confunde.

          A etapa atual leva a marca; as futuras ficam quietas. Nenhuma
          delas tem botão: o único botão da tela é o do herói.
          ============================================================ */}
      <section className={css.caminho}>
        <h2 className={css.caminhoTitulo}>O caminho até seu anúncio no ar</h2>
        <ol className={css.etapas}>
          {estado.etapas.map((e, i) => {
            const atual = proximo != null && e.id === proximo.id;
            // ============================================================
            // FEITA SÓ ANTES DA ATUAL — e isto é decisão de EXIBIÇÃO, não
            // correção da lógica.
            //
            // `montarEtapas` marcou "A sua aprovação" como concluída
            // enquanto "A peça do seu anúncio" ainda não estava. Faz
            // sentido do lado do dado (`pecasParaAprovar: 0` — não há nada
            // esperando aprovação), e não faz nenhum na tela: o dono lê uma
            // lista em ordem e vê o quarto item marcado com o terceiro em
            // aberto.
            //
            // Corrigir `montarEtapas` seria mexer em produção, e o dado
            // dela não está errado — está respondendo outra pergunta. O que
            // esta tela faz é não AFIRMAR o que confunde: ela só carimba o
            // que veio antes de onde a pessoa está.
            //
            // O achado está registrado em DUVIDAS.md, DUVIDA-ONB-15.
            // ============================================================
            const posicaoAtual = proximo
              ? estado.etapas.findIndex((x) => x.id === proximo.id)
              : estado.etapas.length;
            const feita = i < posicaoAtual;
            return (
              <li
                key={e.id}
                className={`${css.etapa} ${feita ? css.feita : ""} ${
                  atual ? css.atual : ""
                }`}
              >
                <span className={css.marcaEtapa} aria-hidden="true" />
                <span className={css.etapaNome}>{e.nome}</span>
                {atual && <span className={css.vocEstaAqui}>você está aqui</span>}
              </li>
            );
          })}
        </ol>
      </section>

      {/* ============================================================
          A PERGUNTA DO DIA — e por que ela não está aqui.

          A linha abaixo é o que substitui o card. Ela não pergunta nada:
          diz QUANDO a pergunta vai existir. Sumir em silêncio deixaria o
          dono sem saber que um dia a gente vai perguntar, e a primeira
          vez que a pergunta aparecesse pareceria cobrança do nada.
          ============================================================ */}
      {cabePerguntarSobreOntem ? (
        <section className={css.pergunta}>
          <p className={css.perguntaTexto}>
            (Aqui entraria a pergunta do dia — esta tela nunca chega neste estado.)
          </p>
        </section>
      ) : (
        <section className={css.rodape}>
          <p className={css.aindaNao}>
            As perguntas sobre venda começam quando seu anúncio estiver no ar. Até lá não há o
            que contar.
          </p>
        </section>
      )}
    </div>
  );
}
