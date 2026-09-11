/**
 * Enquanto os números não chegam.
 *
 * ============================================================
 * O ESQUELETO TEM A FORMA DA FICHA QUE VAI CHEGAR.
 *
 * A `/anuncios` faz quatro chamadas de rede antes de desenhar: o
 * consolidado do negócio e, para cada execução, a ficha e o consolidado
 * dela. Sem `loading.tsx` o App Router segura a rota inteira e o dono
 * olha para a página anterior sem saber se clicou.
 *
 * Mesma grade, mesma altura, mesmo raio — para a página não PULAR
 * quando o dado entra. Um esqueleto com forma diferente do conteúdo é
 * um segundo layout que ninguém mantém, e o salto que ele causa é
 * exatamente a sensação de "quebrou" que ele existia para evitar.
 *
 * SEM TEXTO. "Carregando..." em cima de um esqueleto que já se mexe diz
 * duas vezes a mesma coisa. Quem lê por leitor de tela recebe o aviso
 * uma vez, pelo `aria-busy`/`aria-live` do `<section>`.
 *
 * E sem número nenhum de mentira: nem "0", nem "R$ 0,00" de enfeite.
 * Número falso que aparece por meio segundo e vira outro é como o dono
 * aprende a não confiar no painel.
 * ============================================================
 */
export default function CarregandoAnuncios() {
  return (
    <>
      <div className="page-head">
        <h1>Seus anúncios</h1>
        <p>Cada anúncio e o que ele produziu até agora.</p>
      </div>

      <section className="res-lista" aria-busy="true" aria-live="polite" aria-label="Carregando seus anúncios">
        {/* Duas fichas porque duas é o que o negócio tem hoje. Não é
            promessa: se vierem três, a terceira entra sem esqueleto e
            ninguém percebe. Esqueleto é ritmo, não contagem. */}
        {[0, 1].map((i) => (
          <article className="res-ficha res-esqueleto" key={i}>
            <div className="res-ficha-head">
              <span className="res-barra" style={{ width: "42%" }} />
            </div>
            <p className="res-periodo">
              <span className="res-barra" style={{ width: "30%", display: "block", height: 9 }} />
            </p>
            <div className="res-grid">
              {[0, 1, 2, 3, 4, 5].map((j) => (
                <div className="res-num" key={j}>
                  <span className="res-num-ico" />
                  <span className="res-num-corpo" style={{ flex: 1 }}>
                    <span className="res-barra" style={{ width: "78%", height: 9, display: "block" }} />
                    <span
                      className="res-barra"
                      style={{ width: "52%", height: 16, display: "block", marginTop: 9 }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
