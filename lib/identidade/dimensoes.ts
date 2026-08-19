/**
 * Largura e altura de PNG e JPEG, lidas do CABEÇALHO.
 *
 * Existe para não trazer uma biblioteca de processamento de imagem só para
 * responder "quantos pixels tem". Decodificar a imagem inteira para ler dois
 * números é caro em memória — um JPEG de 10 MB vira dezenas de MB
 * descomprimido — e num upload é exatamente o caminho por onde alguém
 * derruba o servidor mandando arquivos grandes de propósito.
 *
 * Aqui nada é decodificado: os dois formatos declaram o tamanho em bytes
 * fixos perto do começo do arquivo.
 *
 * NÃO importa `server-only`: é função pura sobre bytes, sem segredo. Mas o
 * uso é do lado do servidor por decisão de desenho — validação que roda no
 * navegador é conveniência, não garantia (docs/upload-identidade.md §2).
 */

export interface Dimensao {
  largura: number;
  altura: number;
}

/**
 * `null` quer dizer "não consegui ler", e quem chama trata como recusa.
 *
 * Nunca chute. Um palpite aqui aprova imagem pequena, e o cliente descobre
 * o borrado olhando o próprio anúncio.
 */
export function lerDimensao(bytes: Uint8Array): Dimensao | null {
  return lerPng(bytes) ?? lerJpeg(bytes) ?? null;
}

/**
 * PNG: assinatura de 8 bytes, e o IHDR é obrigatoriamente o primeiro
 * chunk. Largura e altura são big-endian nos bytes 16..23.
 */
function lerPng(b: Uint8Array): Dimensao | null {
  const ASSINATURA = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (b.length < 24) return null;
  for (let i = 0; i < 8; i++) if (b[i] !== ASSINATURA[i]) return null;

  const visao = new DataView(b.buffer, b.byteOffset, b.byteLength);
  return { largura: visao.getUint32(16), altura: visao.getUint32(20) };
}

/**
 * JPEG: sequência de segmentos. O tamanho vive num marcador SOF (Start Of
 * Frame), e há várias variantes — SOF0 baseline, SOF2 progressivo e outras.
 * Percorremos os segmentos até achar qualquer SOF.
 *
 * Ficam de fora, de propósito, os marcadores 0xC4 (tabela de Huffman),
 * 0xC8 (reservado) e 0xCC (definição aritmética): têm número na faixa do
 * SOF mas NÃO carregam dimensão. Confundi-los devolveria dois números
 * quaisquer lidos do lugar errado, que é pior que devolver `null`.
 */
function lerJpeg(b: Uint8Array): Dimensao | null {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;

  let i = 2;
  while (i + 9 < b.length) {
    // Segmento começa em 0xFF; preenchimento de 0xFF repetido é legal.
    if (b[i] !== 0xff) {
      i += 1;
      continue;
    }
    let marcador = b[i + 1]!;
    while (marcador === 0xff && i + 2 < b.length) {
      i += 1;
      marcador = b[i + 1]!;
    }

    const ehSof =
      marcador >= 0xc0 &&
      marcador <= 0xcf &&
      marcador !== 0xc4 &&
      marcador !== 0xc8 &&
      marcador !== 0xcc;

    if (ehSof) {
      // [FF][marcador][tamanho:2][precisão:1][altura:2][largura:2]
      const visao = new DataView(b.buffer, b.byteOffset, b.byteLength);
      return { altura: visao.getUint16(i + 5), largura: visao.getUint16(i + 7) };
    }

    // 0xD8 (início) e 0xD9 (fim) não têm corpo; os demais declaram tamanho.
    if (marcador === 0xd8 || marcador === 0xd9) {
      i += 2;
      continue;
    }
    const visao = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const tamanho = visao.getUint16(i + 2);
    if (tamanho < 2) return null; // segmento corrompido: não insista
    i += 2 + tamanho;
  }
  return null;
}

/**
 * O tipo real, lido dos bytes — não do nome do arquivo nem do `type` que o
 * navegador declara. Os dois são texto que quem envia controla: renomear
 * `.exe` para `.png` é trivial, e o `Content-Type` do multipart vem do
 * cliente.
 */
export function tipoReal(bytes: Uint8Array): "png" | "jpeg" | null {
  if (lerPng(bytes)) return "png";
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return "jpeg";
  return null;
}
