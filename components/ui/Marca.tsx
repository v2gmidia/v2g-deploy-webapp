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
 * O ARQUIVO: `public/marca.png`, 240×242, fundo transparente. É o
 * original recortado — a arte vinha numa tela de 500×500 com margem
 * transparente em volta, e essa margem faria o símbolo aparecer pequeno
 * e fora de eixo dentro de qualquer caixa. O recorte é pela caixa real
 * do conteúdo, não por olho.
 *
 * A tinta do traço é `#0A0C00` — preto. Em fundo claro ele vai como
 * está; sobre a sidebar cobalto, o CSS o inverte para branco com
 * `filter: brightness(0) invert(1)`. Inverter um traço 100% preto dá
 * branco exato, sem chute de tom, e é por isso que funciona aqui e não
 * funcionaria com uma arte de duas cores.
 */

interface Props {
  /** Onde o clique leva. Sem isto, a marca não é link. */
  href?: string;
  /** Esconde o texto ao lado, para barras estreitas. */
  soSimbolo?: boolean;
  className?: string;
}

function Simbolo() {
  return (
    <Image
      className="glyph-img"
      src="/marca.png"
      alt=""
      width={240}
      height={242}
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
