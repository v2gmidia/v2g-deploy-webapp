/**
 * AS CORES DA EMPRESA, TIRADAS DA LOGO — no navegador, sem API.
 *
 * ============================================================
 * SEM BIBLIOTECA E SEM SERVIÇO. Um canvas, os pixels, e uma contagem. O
 * briefing de 21/09 pede "no navegador, sem API paga" — e não há motivo
 * para mandar a logo de alguém para um terceiro só para contar cor.
 * ============================================================
 *
 * ============================================================
 * O QUE O ALGORITMO FAZ, E O QUE ELE NÃO SABE FAZER.
 *
 * Ele reduz a imagem, joga fora o que não é cor de marca, agrupa o que
 * sobrou em caixas grossas e devolve as caixas mais cheias. É contagem,
 * não percepção: ele não sabe qual cor o dono chamaria de "a nossa".
 *
 * Por isso a tela PERGUNTA em vez de afirmar, e por isso cada cor é
 * ajustável. O que a gente propõe é um palpite bom o bastante para a
 * pessoa dizer "é isso" ou mexer — nunca uma decisão tomada por ela.
 *
 * O que ele descarta, e por quê:
 *   transparente      — fundo de PNG, que é a maioria das logos;
 *   quase branco      — fundo, papel, respiro;
 *   quase preto       — contorno e sombra;
 *   quase cinza       — texto e traço, que raramente são A cor da marca.
 *
 * Uma logo preta e branca devolve lista VAZIA, e isso é resposta: a tela
 * diz que não achou cor e segue. Não inventa um azul.
 * ============================================================
 */

/** Uma cor proposta, com o quanto ela ocupa da logo. */
export interface CorDaLogo {
  /** `#RRGGBB`, maiúsculo */
  hex: string;
  /** fração da imagem que ela ocupa, de 0 a 1 */
  peso: number;
}

/** O lado da imagem reduzida. 120px basta para contar cor e é instantâneo. */
const LADO = 120;

/** Quantas caixas por canal. 6 níveis dá 216 caixas — grosso de propósito. */
const NIVEIS = 6;

/** Abaixo disso a cor é fundo, não marca. */
const PESO_MINIMO = 0.02;

function hex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("").toUpperCase()
  );
}

/** Saturação e brilho, para separar cor de marca de cinza e de fundo. */
function satBrilho(r: number, g: number, b: number): { sat: number; brilho: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return { sat: max === 0 ? 0 : (max - min) / max, brilho: max / 255 };
}

/**
 * Distância entre duas cores, em RGB mesmo.
 *
 * RGB e não Lab: a conta é dez vezes mais simples e o uso aqui é só
 * "estas duas caixas são a mesma cor?". Para essa pergunta, RGB erra
 * pouco — e errar aqui custa uma bolinha repetida, não um anúncio errado.
 */
function distancia(a: number[], b: number[]): number {
  return Math.sqrt((a[0]! - b[0]!) ** 2 + (a[1]! - b[1]!) ** 2 + (a[2]! - b[2]!) ** 2);
}

/** Duas caixas mais perto que isto viram uma só. */
const PERTO_DEMAIS = 60;

/**
 * As 2 ou 3 cores principais de uma imagem já desenhada num canvas.
 *
 * Recebe `ImageData` em vez do arquivo para poder ser exercitada fora do
 * navegador — é o que deixa esta função ter conferidor.
 */
export function coresDeImageData(dados: ImageData, quantas = 3): CorDaLogo[] {
  const caixas = new Map<number, { soma: number[]; n: number }>();
  let considerados = 0;

  for (let i = 0; i < dados.data.length; i += 4) {
    const r = dados.data[i]!;
    const g = dados.data[i + 1]!;
    const b = dados.data[i + 2]!;
    const a = dados.data[i + 3]!;

    if (a < 128) continue; // transparente: fundo de PNG
    const { sat, brilho } = satBrilho(r, g, b);
    if (brilho > 0.94 && sat < 0.12) continue; // quase branco
    if (brilho < 0.12) continue; // quase preto
    if (sat < 0.15) continue; // cinza: texto e traço

    considerados++;
    const chave =
      Math.floor((r / 256) * NIVEIS) * NIVEIS * NIVEIS +
      Math.floor((g / 256) * NIVEIS) * NIVEIS +
      Math.floor((b / 256) * NIVEIS);
    const atual = caixas.get(chave);
    if (atual) {
      atual.soma[0]! += r;
      atual.soma[1]! += g;
      atual.soma[2]! += b;
      atual.n++;
    } else {
      caixas.set(chave, { soma: [r, g, b], n: 1 });
    }
  }

  if (considerados === 0) return [];

  // A cor de cada caixa é a MÉDIA do que caiu nela, e não o centro da
  // caixa: o centro devolveria um tom que não existe na logo.
  const candidatas = [...caixas.values()]
    .map((c) => ({ rgb: c.soma.map((x) => x / c.n), peso: c.n / considerados }))
    .sort((a, b) => b.peso - a.peso);

  const escolhidas: { rgb: number[]; peso: number }[] = [];
  for (const c of candidatas) {
    if (c.peso < PESO_MINIMO) break;
    if (escolhidas.some((e) => distancia(e.rgb, c.rgb) < PERTO_DEMAIS)) continue;
    escolhidas.push(c);
    if (escolhidas.length === quantas) break;
  }

  return escolhidas.map((c) => ({
    hex: hex(c.rgb[0]!, c.rgb[1]!, c.rgb[2]!),
    peso: Math.round(c.peso * 100) / 100,
  }));
}

/**
 * O mesmo, a partir do arquivo que a pessoa escolheu.
 *
 * Devolve lista vazia quando não dá — arquivo que não é imagem, imagem
 * que o navegador não abre, logo em preto e branco. Vazio é resposta: a
 * tela diz que não achou cor, e segue.
 */
export async function coresDaLogo(arquivo: File, quantas = 3): Promise<CorDaLogo[]> {
  if (!arquivo.type.startsWith("image/")) return [];
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("imagem ilegivel"));
      el.src = url;
    });
    const tela = document.createElement("canvas");
    const escala = Math.min(1, LADO / Math.max(img.width, img.height, 1));
    tela.width = Math.max(1, Math.round(img.width * escala));
    tela.height = Math.max(1, Math.round(img.height * escala));
    const ctx = tela.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, tela.width, tela.height);
    return coresDeImageData(ctx.getImageData(0, 0, tela.width, tela.height), quantas);
  } catch {
    return [];
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Os papéis, na ordem em que as cores saem. */
export const PAPEIS_DA_COR = ["Principal", "Segunda", "Destaque"] as const;
