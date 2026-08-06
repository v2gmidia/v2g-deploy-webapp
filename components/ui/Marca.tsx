import Image from "next/image";

/**
 * A marca da V2G — o símbolo e o logotipo.
 *
 * ============================================================
 * ESTE É O ÚNICO LUGAR QUE DESENHA A MARCA.
 *
 * Antes ela estava copiada em três layouts — `(public)`, `(fluxo)` e
 * `(protected)` — cada um com o mesmo `<span className="glyph">V2G</span>`
 * escrito à mão. Trocar a arte significava lembrar dos três, e o terceiro
 * é o que alguém esquece.
 *
 * Para trocar o símbolo: substitua `public/marca.svg`. Nada mais.
 * ============================================================
 *
 * O SÍMBOLO AINDA É O PROVISÓRIO. Enquanto `public/marca.svg` não
 * existir, o componente cai no bloco cobalto com as letras — que é o que
 * está no ar hoje. Não inventei um traçado a partir da imagem: logo é
 * arte exata, e um símbolo "quase certo" é pior que o provisório honesto,
 * porque ninguém percebe que está errado.
 */

interface Props {
  /** Onde o clique leva. Sem isto, a marca não é link. */
  href?: string;
  /** Esconde o texto ao lado, para barras estreitas. */
  soSimbolo?: boolean;
  className?: string;
}

/**
 * Troque para `true` quando `public/marca.svg` existir. Uma linha, um
 * lugar — e a marca nova aparece nos três layouts de uma vez.
 */
const TEM_ARQUIVO = false;

function Simbolo() {
  if (!TEM_ARQUIVO) {
    return <span className="glyph">V2G</span>;
  }
  return (
    <Image
      className="glyph-img"
      src="/marca.svg"
      alt=""
      width={30}
      height={30}
      priority
    />
  );
}

export function Marca({ href, soSimbolo = false, className = "" }: Props) {
  const conteudo = (
    <>
      <Simbolo />
      {!soSimbolo && (
        <span className="wm">
          V2G
          <small>Tráfego no piloto</small>
        </span>
      )}
    </>
  );

  const classe = `wordmark${className ? ` ${className}` : ""}`;

  // `alt=""` no símbolo e o nome em texto ao lado: para o leitor de tela,
  // a marca é a palavra "V2G", não uma imagem a ser descrita. Quando
  // `soSimbolo` esconde o texto, quem nomeia o link é o `aria-label`.
  return href ? (
    <a className={classe} href={href} aria-label={soSimbolo ? "V2G" : undefined}>
      {conteudo}
    </a>
  ) : (
    <div className={classe}>{conteudo}</div>
  );
}
