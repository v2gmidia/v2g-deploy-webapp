import { deflateSync, inflateSync } from "node:zlib";

function crc(bytes: Uint8Array): number {
  let valor = 0xffffffff;
  for (const byte of bytes) {
    valor ^= byte;
    for (let i = 0; i < 8; i++) valor = (valor >>> 1) ^ ((valor & 1) ? 0xedb88320 : 0);
  }
  return (valor ^ 0xffffffff) >>> 0;
}
function bloco(tipo: string, bytes: Buffer): Buffer {
  const conteudo = Buffer.concat([Buffer.from(tipo), bytes]);
  const tamanho = Buffer.alloc(4), checksum = Buffer.alloc(4);
  tamanho.writeUInt32BE(bytes.length); checksum.writeUInt32BE(crc(conteudo));
  return Buffer.concat([tamanho, conteudo, checksum]);
}
const assinatura = Buffer.from("89504e470d0a1a0a", "hex");

/** Fixture técnica 64x64, não foto, mockup, anúncio nem imagem criada por IA. */
export function pngSimulado(): Uint8Array {
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(64, 0); cabecalho.writeUInt32BE(64, 4);
  cabecalho[8] = 8; cabecalho[9] = 6;
  const pixels = Buffer.alloc(64 * (64 * 4 + 1));
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const i = y * 257 + 1 + x * 4;
    const claro = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
    pixels.set(claro ? [255, 210, 0, 255] : [30, 30, 30, 255], i);
  }
  return Buffer.concat([assinatura, bloco("IHDR", cabecalho),
    bloco("tEXt", Buffer.from("Description\0SIMULACAO LOCAL - NAO E CRIATIVO REAL")),
    bloco("IDAT", deflateSync(pixels)), bloco("IEND", Buffer.alloc(0))]);
}

/** Decoder limitado ao PNG RGBA8 deste contrato local; não é validador genérico de imagens. */
export function conferirPngLocal(entrada: Uint8Array): { largura: number; altura: number } {
  const bytes = Buffer.from(entrada);
  if (bytes.length > 1_048_576 || !bytes.subarray(0, 8).equals(assinatura)) throw new Error("png_invalido");
  let pos = 8, largura = 0, altura = 0, fim = false;
  const dados: Buffer[] = [];
  while (pos + 12 <= bytes.length) {
    const tamanho = bytes.readUInt32BE(pos), tipo = bytes.toString("ascii", pos + 4, pos + 8);
    if (pos + 12 + tamanho > bytes.length || crc(bytes.subarray(pos + 4, pos + 8 + tamanho))
      !== bytes.readUInt32BE(pos + 8 + tamanho)) throw new Error("png_invalido");
    const b = bytes.subarray(pos + 8, pos + 8 + tamanho);
    if (pos === 8 && tipo !== "IHDR") throw new Error("png_invalido");
    if (tipo === "IHDR") {
      if (largura || tamanho !== 13 || b[8] !== 8 || b[9] !== 6 || b[10] || b[11] || b[12]) throw new Error("png_invalido");
      largura = b.readUInt32BE(0); altura = b.readUInt32BE(4);
      if (largura < 1 || altura < 1 || largura > 512 || altura > 512) throw new Error("png_invalido");
    } else if (tipo === "IDAT") dados.push(b);
    else if (tipo === "IEND") { if (tamanho) throw new Error("png_invalido"); fim = true; pos += 12; break; }
    else if (tipo !== "tEXt") throw new Error("png_invalido");
    pos += 12 + tamanho;
  }
  if (!fim || !largura || !dados.length || pos !== bytes.length) throw new Error("png_invalido");
  const linha = largura * 4 + 1, esperado = linha * altura;
  const pixels = inflateSync(Buffer.concat(dados), { maxOutputLength: esperado });
  if (pixels.length !== esperado) throw new Error("png_invalido");
  for (let y = 0; y < altura; y++) if (pixels[y * linha] !== 0) throw new Error("png_invalido");
  return { largura, altura };
}
