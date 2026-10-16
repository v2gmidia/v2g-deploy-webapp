import type { CorDaLogo } from "./cores-da-logo.ts";

export const MAX_CORES_DA_MARCA = 6;

function rgb(hex: string): number[] {
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}

export function juntarPaleta(atuais: string[], novas: CorDaLogo[]): string[] {
  const resultado: string[] = [];
  const propostas = [...novas].sort((a, b) => {
    const prioridadeA = a.origem === "logo-principal" ? 1 : 0;
    const prioridadeB = b.origem === "logo-principal" ? 1 : 0;
    return prioridadeB - prioridadeA || b.peso - a.peso;
  });
  for (const cor of [...atuais, ...propostas.map((item) => item.hex)]) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(cor)) continue;
    const normalizada = cor.toUpperCase();
    const canais = rgb(normalizada);
    if (resultado.some((outra) => {
      const anterior = rgb(outra);
      return Math.sqrt(canais.reduce((soma, valor, i) => soma + (valor - anterior[i]!) ** 2, 0)) < 48;
    })) continue;
    resultado.push(normalizada);
    if (resultado.length === MAX_CORES_DA_MARCA) break;
  }
  return resultado;
}
