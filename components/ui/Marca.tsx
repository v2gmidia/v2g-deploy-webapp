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
 * Para trocar o símbolo: substitua `public/marca.png`. Nada mais —
 * exceto as dimensões abaixo, se a arte nova não for 612×612.
 * ============================================================
 *
 * O ARQUIVO: `public/marca.png`, 612×612, fundo transparente.
 *
 * Veio da arte em alta — o símbolo preto sobre cobalto, 1254×1254. A
 * transparência foi obtida projetando cada pixel no eixo traço→fundo, e
 * não por limiar seco: limiar serrilharia os cantos arredondados, que
 * são a assinatura do desenho. O fundo do arquivo original tem ruído de
 * compressão, então abaixo de 12% de opacidade vira vazio e acima de 92%
 * vira sólido; a faixa do meio sobrevive e é ela que mantém a borda
 * suave.
 *
 * Recortado pela caixa real do conteúdo e centralizado num quadrado —
 * assim qualquer caixa quadrada no CSS nunca desloca o desenho.
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
      width={612}
      height={612}
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
