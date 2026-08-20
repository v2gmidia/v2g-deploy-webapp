import { tarja, type Etapa } from "@/lib/estado/frases";

/**
 * O herói de uma etapa da cadeia — a forma em que "o que falta" aparece.
 *
 * COMPONENTE, e não duas cópias: o `/inicio` e a `/anuncios` mostram a
 * mesma etapa e precisam mostrá-la igual. Duas cópias do mesmo JSX é como
 * as quatro frases divergentes começaram — cada uma certa no dia em que
 * foi escrita, e diferente na primeira edição seguinte.
 *
 * A TARJA VEM DE `tarja()`, não de um ternário na tela: ela diz de quem é
 * a bola, e "Seu próximo passo" em cima de uma etapa que depende da gente
 * seria mentir no rótulo com o texto certo embaixo.
 *
 * A ação sai do próprio `etapa.acao`, que é nulo quando a bola não é do
 * cliente. Nenhuma tela acrescenta botão por conta própria — um botão numa
 * etapa que espera a gente inventa trabalho para quem não tem o que fazer.
 */
export function HeroDaEtapa({ etapa }: { etapa: Etapa }) {
  return (
    <section className="hero-destaque">
      <span className="eyebrow">{tarja(etapa)}</span>
      <p className="hero-frase">{etapa.titulo}</p>
      <p className="hero-note">{etapa.corpo}</p>
      {etapa.acao && (
        <a
          className="cta"
          href={etapa.acao.href}
          style={{ width: "max-content", marginTop: 22 }}
        >
          {etapa.acao.rotulo}
        </a>
      )}
    </section>
  );
}
