import { lerDimensao, tipoReal } from "./dimensoes";

/**
 * As regras do que entra, e a frase de recusa de cada uma.
 *
 * MENSAGEM COM MOTIVO E SAÍDA, sempre. "Arquivo inválido" faz a pessoa
 * tentar de novo com o mesmo arquivo — a recusa precisa dizer o que houve e
 * o que fazer. Ver docs/upload-identidade.md §3.
 *
 * Sem `server-only`: é função pura sobre bytes. Roda no servidor por
 * decisão de desenho, não por conter segredo.
 */

export type UsoDeIdentidade = "logo" | "identidade";

interface Limite {
  mb: number;
  ladoMinimo: number;
  rotulo: string;
}

/**
 * 1080 é o piso do META, não preferência nossa: abaixo disso a imagem é
 * reamostrada para cima na entrega e sai borrada no feed. Como a peça pode
 * sair 1:1, 4:5 ou 9:16, exigir 1080 no MENOR lado cobre os três formatos
 * sem recorte que perca conteúdo.
 *
 * O logo aceita 512 porque nunca ocupa a arte inteira — entra como selo ou
 * marca d'água. Exigir 1080 recusaria logo bom à toa.
 */
const LIMITES: Record<UsoDeIdentidade, Limite> = {
  logo: { mb: 5, ladoMinimo: 512, rotulo: "logo" },
  identidade: { mb: 10, ladoMinimo: 1080, rotulo: "foto" },
};

/** Quantas fotos de identidade cabem por negócio. O logo é sempre 1. */
export const MAXIMO_DE_FOTOS = 10;

export interface Aceito {
  ok: true;
  tipo: "png" | "jpeg";
  extensao: "png" | "jpg";
  largura: number;
  altura: number;
}

export interface Recusado {
  ok: false;
  mensagem: string;
}

export function validar(
  bytes: Uint8Array,
  uso: UsoDeIdentidade,
): Aceito | Recusado {
  const limite = LIMITES[uso];

  if (bytes.length === 0) {
    return { ok: false, mensagem: "O arquivo chegou vazio. Tente enviar de novo." };
  }

  const tetoEmBytes = limite.mb * 1024 * 1024;
  if (bytes.length > tetoEmBytes) {
    const mb = (bytes.length / 1024 / 1024).toFixed(1);
    return {
      ok: false,
      mensagem: `Esse arquivo tem ${mb} MB e o limite é ${limite.mb} MB. Uma foto tirada pelo celular normalmente já está abaixo disso.`,
    };
  }

  const tipo = tipoReal(bytes);

  // O SVG tem frase PRÓPRIA, e não é firula: quem tem o logo em SVG tem
  // um arquivo legítimo e vai tentar de novo se ouvir "formato inválido".
  // Dizer "manda em PNG" resolve numa tentativa.
  if (tipo === null && pareceSvg(bytes)) {
    return {
      ok: false,
      mensagem:
        "Esse logo está em SVG e aqui a gente aceita PNG. Abra o arquivo no programa onde ele foi feito e exporte como PNG com fundo transparente, com pelo menos 512 pixels de lado. Se não tiver como, fala com a gente que a gente converte.",
    };
  }

  if (tipo === null) {
    return {
      ok: false,
      mensagem:
        uso === "logo"
          ? "Não consegui ler esse arquivo como imagem. O logo precisa ser PNG."
          : "Não consegui ler esse arquivo como imagem. A foto precisa ser JPG ou PNG.",
    };
  }

  // O logo entra só em PNG. JPEG não guarda transparência, e o logo precisa
  // dela para entrar em cima da arte sem um retângulo branco em volta.
  if (uso === "logo" && tipo !== "png") {
    return {
      ok: false,
      mensagem:
        "O logo precisa ser PNG. JPG não guarda fundo transparente, e sem isso ele entra no anúncio dentro de um retângulo branco.",
    };
  }

  const dim = lerDimensao(bytes);
  if (!dim) {
    return {
      ok: false,
      mensagem:
        "Não consegui ler o tamanho dessa imagem — o arquivo pode estar corrompido. Tente exportar de novo.",
    };
  }

  const menorLado = Math.min(dim.largura, dim.altura);
  if (menorLado < limite.ladoMinimo) {
    return {
      ok: false,
      mensagem: `Essa imagem tem ${dim.largura} × ${dim.altura}. Para o anúncio não sair borrado, ela precisa ter pelo menos ${limite.ladoMinimo} pixels de largura e de altura. Se você tiver o arquivo original da ${limite.rotulo}, ele costuma servir.`,
    };
  }

  return {
    ok: true,
    tipo,
    extensao: tipo === "png" ? "png" : "jpg",
    largura: dim.largura,
    altura: dim.altura,
  };
}

/**
 * SVG é XML e não tem número mágico. Olhar os primeiros bytes por `<svg` ou
 * por declaração XML é o suficiente para a mensagem certa — e serve só para
 * ESCOLHER A FRASE, nunca para aceitar o arquivo.
 */
function pareceSvg(bytes: Uint8Array): boolean {
  const inicio = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.slice(0, 300))
    .toLowerCase();
  return inicio.includes("<svg") || (inicio.includes("<?xml") && inicio.includes("svg"));
}
