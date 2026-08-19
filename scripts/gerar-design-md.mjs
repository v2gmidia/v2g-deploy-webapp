#!/usr/bin/env node
/**
 * Regenera o frontmatter de DESIGN.md a partir de app/globals.css.
 *
 * POR QUE POR SCRIPT E NÃO À MÃO: são 58 chaves de cor. Copiar a dedo erra
 * em silêncio, e um valor errado aqui não dá erro — ele reprova cor legítima
 * (ruído que faz alguém desligar a regra) ou aprova cor que não existe (a
 * regra passa a não verificar nada). Os dois modos de falha são invisíveis.
 *
 * A PROSA É PRESERVADA. O script troca só o bloco entre os `---`; o texto
 * abaixo dele é escrito por gente e explica as decisões, inclusive o que
 * este arquivo deliberadamente NÃO declara.
 */
import { readFileSync, writeFileSync } from "node:fs";

const CSS = "app/globals.css";
const MD = "DESIGN.md";

// COMENTÁRIO FORA ANTES DE QUALQUER COISA. O `globals.css` é mais comentário
// que regra, e os comentários citam tokens pelo nome — `--fs-corpo: 13px era o
// valor mais usado` é prosa, não declaração. Sem esta linha o regex casa dentro
// do comentário e engole a declaração seguinte junto: foi assim que o
// `--fs-legenda` sumiu da escala na primeira geração, sem erro nenhum.
// Substituído por espaço, não removido, para os índices continuarem valendo.
const css = readFileSync(CSS, "utf8").replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
const inicioEscuro = css.indexOf("prefers-color-scheme: dark");
const ehCor = /^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\()/;

const claro = new Map();
const escuro = new Map();
for (const m of css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
  const valor = m[2].trim();
  if (!ehCor.test(valor)) continue;
  const alvo = inicioEscuro > 0 && m.index > inicioEscuro ? escuro : claro;
  if (!alvo.has(m[1])) alvo.set(m[1], valor);
}

const linhas = [
  "---",
  "# GERADO por scripts/gerar-design-md.mjs a partir de app/globals.css.",
  "# Não edite este bloco à mão — a prosa abaixo dos --- é que é escrita por gente.",
  "colors:",
];
for (const nome of [...claro.keys()].sort()) linhas.push(`  ${nome}: "${claro.get(nome)}"`);
for (const nome of [...escuro.keys()].sort()) {
  if (escuro.get(nome) !== claro.get(nome)) linhas.push(`  ${nome}-escuro: "${escuro.get(nome)}"`);
}

// As famílias não têm token no :root (o display vem do next/font, a mono está
// solta nas regras), então ficam declaradas aqui. Ao acrescentar família nova
// no CSS, acrescente aqui também — senão a varredura reprova uso legítimo.
linhas.push(
  "typography:",
  "  display:",
  '    fontFamily: "Archivo, system-ui, sans-serif"',
  "  body:",
  '    fontFamily: "Segoe UI, system-ui, -apple-system, Roboto, sans-serif"',
  "  mono:",
  '    fontFamily: "ui-monospace, Cascadia Mono, Consolas, monospace"',
  "  monoLegado:",
  '    fontFamily: "Consolas, SFMono-Regular, Courier New, monospace"',
);

// A ESCALA É LIDA DO CSS, pelo mesmo motivo que as cores são: degrau copiado
// à mão erra em silêncio, e um degrau errado aqui reprova tamanho legítimo ou
// aprova tamanho que não existe.
//
// Só os degraus FIXOS entram. Os `--fs-hero-*` são `clamp()` e o `--fs-code` é
// `em`; nenhum dos dois é um degrau, e declará-los teria efeito colateral: o
// detector trata as duas pontas de um `clamp()` declarado como tamanhos
// válidos em qualquer lugar, o que devolveria 14px e 16px à rampa — justo os
// valores que este lote acabou de tirar de circulação.
const degraus = new Map();
const pulados = [];
const fimClaro = inicioEscuro > 0 ? inicioEscuro : css.length;
for (const m of css.slice(0, fimClaro).matchAll(/--fs-([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
  const nome = m[1];
  const valor = m[2].trim();
  if (/^[\d.]+px$/.test(valor)) degraus.set(nome, valor);
  else pulados.push(`${nome} (${valor})`);
}
if (degraus.size === 0) throw new Error("nenhum --fs-* fixo achado no :root — o CSS mudou de forma?");
linhas.push("  scale:");
for (const [nome, valor] of degraus) linhas.push(`    ${nome}: "${valor}"`);

linhas.push("---");

const md = readFileSync(MD, "utf8");
const fim = md.indexOf("\n---", md.indexOf("---") + 3);
const prosa = md.slice(fim + 4);
writeFileSync(MD, linhas.join("\n") + prosa);

const escurasDistintas = [...escuro.keys()].filter((n) => escuro.get(n) !== claro.get(n)).length;
console.log(`DESIGN.md: ${claro.size} cores claras + ${escurasDistintas} variantes escuras = ${claro.size + escurasDistintas} chaves`);
console.log(`escala: ${degraus.size} degraus (${[...degraus.values()].join(", ")})`);
if (pulados.length) console.log(`fora da escala, de propósito: ${pulados.join(", ")}`);
