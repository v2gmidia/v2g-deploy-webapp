/**
 * Bloco 3 da casa do criativo — o desenho de "criar uma peça nova".
 *
 * ============================================================
 * ESTRUTURA, NÃO FORMULÁRIO. E a diferença é o ponto do bloco.
 *
 * O backend de geração não existe para cliente: `POST
 * /agentes/gerar-criativo-visual` está na API, e o que falta é tudo o que
 * vem antes e depois dele — o dono escolher a foto, a oferta e o destino,
 * e a peça voltar para ele aprovar.
 *
 * Então aqui **não há um único controle**: nenhum `<input>`, nenhum
 * `<button>`, nenhum `<label for>`, nenhum alvo clicável. Três proibições
 * do briefing, e as três são a mesma:
 *
 *   - botão que parece funcionar e não faz nada
 *   - campo que aceita texto e descarta
 *   - imagem de exemplo que pareça peça gerada pela V2G
 *
 * A terceira é a mais fácil de violar sem querer. O wireframe
 * `docs/v2g-wireframes/v2g-gerar-criativo-mobile-v1.png` mostra uma grade
 * de fotos de padaria e uma oferta de café — bonito, e mentiroso aqui: o
 * dono leria como "a V2G já fez isto". Por isso este bloco desenha o
 * FLUXO em texto e forma, e nenhuma peça.
 *
 * ============================================================
 * DE ONDE VEIO O CONTEÚDO
 *
 * Do wireframe acima, que existe e é o fluxo pedido — o briefing falava de
 * `v2g-configurar-criativo`, que **não existe** em docs/v2g-wireframes; o
 * que existe é `v2g-gerar-criativo-{desktop,mobile}-v1.png`, com os três
 * passos Foto -> Oferta -> Gerar, a seção "A V2G já preparou isso" e o
 * aviso "Você não precisa escrever um prompt".
 *
 * Mantive os três passos e a promessa de que o dono não escreve prompt.
 * Tirei os controles, a grade de fotos e o "Gerar 3 opções".
 *
 * ============================================================
 * A CONDIÇÃO DE REMOÇÃO
 *
 * Está em docs/criativos-casa-do-criativo.md §3, com a data em branco
 * para o Victor preencher. Bloco que descreve o que não existe tem prazo,
 * senão vira promessa permanente — que é o que "em breve" faz, e é por
 * isso que a expressão está proibida aqui.
 * ============================================================
 */
const PASSOS = [
  {
    titulo: "O que você vende",
    corpo:
      "A gente já tem isso da sua conta — o que o seu negócio faz, onde atende e para quem. " +
      "Você confere e corrige se estiver diferente.",
  },
  {
    titulo: "O que você quer anunciar",
    corpo:
      "Qual serviço ou produto entra nesse anúncio, e o que a pessoa faz depois de ver: " +
      "chamar no WhatsApp ou abrir o seu Instagram.",
  },
  {
    titulo: "Que material você tem",
    corpo:
      "As fotos do seu negócio que já estão na sua conta, e as que você quiser mandar. " +
      "Se não tiver foto de alguma coisa, a gente diz qual falta em vez de inventar.",
  },
] as const;

export function CriarPeca() {
  return (
    <section className="casa-bloco" aria-labelledby="casa-criar">
      <div className="casa-bloco-head">
        <h2 id="casa-criar" className="section-title">
          Criar uma peça nova
        </h2>
        <p>Como vai funcionar quando estiver de pé.</p>
      </div>

      {/* O aviso vem ANTES do desenho, e não depois. Quem lê de cima para
          baixo no celular precisa saber o que está olhando antes de
          formar expectativa — aviso no rodapé chega tarde. */}
      <p className="casa-obra" role="status">
        <b>Esta parte ainda está sendo construída.</b> O que já funciona hoje é conferir uma peça
        que você tem pronta, aqui em cima. Nada nesta seção envia nem gera nada — é o desenho do
        que a gente vai te perguntar.
      </p>

      <div className="casa-desenho" aria-label="Desenho do fluxo de criação, sem função">
        <ol className="casa-passos">
          {PASSOS.map((passo, i) => (
            <li key={passo.titulo}>
              <span className="casa-passo-num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="casa-passo-texto">
                <b>{passo.titulo}</b>
                <span>{passo.corpo}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="casa-volta">
          <b>E depois a peça volta para você</b>
          <p>
            A gente monta as opções e te mostra cada uma antes de qualquer coisa ir ao ar. Você
            olha, escolhe a que serve e aprova — ou pede outra. Nenhuma peça é publicada sem você
            dizer que pode.
          </p>
          <p className="casa-volta-nota">
            Você não escreve nada para a IA. Os pedidos acima são sobre o seu negócio, em
            português, e a gente faz o resto.
          </p>
        </div>
      </div>
    </section>
  );
}
