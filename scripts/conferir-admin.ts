/**
 * Quem depende do cliente admin — INCLUSIVE POR TABELA.
 *
 *   pnpm conferir:admin
 *
 * ============================================================
 * POR QUE ESTE CONFERIDOR EXISTE, E É UMA CICATRIZ DE MÉTODO.
 *
 * Em 02/09 a `/conta` estourava com `createAdminClient(): faltam ...`. Eu
 * envolvi em `try` a única chamada que aparecia no arquivo — e o erro
 * continuou, idêntico, com o deploy novo.
 *
 * A chamada que estourava era `listarIdentidade`, de
 * `lib/identidade/armazenar.ts`, 25 linhas ANTES. **`grep` no arquivo da
 * página dava zero.** Quem estoura não está no arquivo que estoura.
 *
 * Depois disso, o levantamento que eu tinha feito de "os oito lugares que
 * usam admin" também estava errado pelo mesmo motivo: era grep de chamada
 * DIRETA, e toda dependência indireta ficou de fora.
 * ============================================================
 *
 * O que ele faz: monta o grafo de imports do repositório, marca os módulos
 * que chamam `createAdminClient()`, e propaga a marca para quem importa,
 * até fechar. Depois lista os pontos de ENTRADA alcançados — `page.tsx`,
 * `layout.tsx`, `route.ts` e arquivos `"use server"`.
 *
 * GRANULARIDADE DE MÓDULO, e é escolha: um módulo entra na lista mesmo que
 * a função importada dele não toque no admin. Isso gera falso positivo, e
 * é o lado certo para errar — um falso positivo custa uma leitura, um
 * falso negativo custa uma tela em produção.
 *
 * Ele NÃO decide se a dependência está protegida: `try` é sintaxe e
 * proteção é semântica, e um conferidor que fingisse saber a diferença
 * daria confiança falsa. Ele responde "quem depende", que é a pergunta que
 * eu errei.
 *
 * Não toca no banco e não precisa de rede.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const PASTAS = ["app", "lib", "components"];

function arquivos(dir: string, achados: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      if (nome === "node_modules" || nome.startsWith(".")) continue;
      arquivos(caminho, achados);
    } else if (/\.tsx?$/.test(nome)) {
      achados.push(caminho);
    }
  }
  return achados;
}

const todos = PASTAS.flatMap((p) => arquivos(join(RAIZ, p)));
const conteudo = new Map<string, string>();
for (const f of todos) conteudo.set(f, readFileSync(f, "utf8"));

/** Resolve `@/x`, `./x` e `../x` para um caminho de arquivo real. */
function resolverImport(de: string, especificador: string): string | null {
  let base: string;
  if (especificador.startsWith("@/")) base = join(RAIZ, especificador.slice(2));
  else if (especificador.startsWith(".")) base = resolve(dirname(de), especificador);
  else return null; // pacote externo

  for (const tentativa of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
    // o repositório usa extensão `.ts` explícita em alguns imports
    base.replace(/\.ts$/, ".ts"),
  ]) {
    if (conteudo.has(tentativa)) return tentativa;
  }
  return null;
}

const importaDe = new Map<string, string[]>();
for (const [f, texto] of conteudo) {
  const alvos: string[] = [];
  for (const m of texto.matchAll(/from\s+["']([^"']+)["']/g)) {
    const r = resolverImport(f, m[1]!);
    if (r) alvos.push(r);
  }
  importaDe.set(f, alvos);
}

// ---- quem chama direto ----
const direto = new Set<string>();
for (const [f, texto] of conteudo) {
  if (/createAdminClient\s*\(/.test(texto) && !f.endsWith(join("lib", "supabase", "admin.ts"))) {
    direto.add(f);
  }
}

// ---- propaga para quem importa, até fechar ----
const dependem = new Set(direto);
let mudou = true;
while (mudou) {
  mudou = false;
  for (const [f, alvos] of importaDe) {
    if (dependem.has(f)) continue;
    if (alvos.some((a) => dependem.has(a))) {
      dependem.add(f);
      mudou = true;
    }
  }
}

const curto = (f: string) => relative(RAIZ, f).replace(/\\/g, "/");

function ehEntrada(f: string): string | null {
  const c = curto(f);
  if (/\/page\.tsx$/.test(c)) return "page";
  if (/\/layout\.tsx$/.test(c)) return "layout";
  if (/\/route\.ts$/.test(c)) return "route";
  if (/^"use server"/.test(conteudo.get(f)!.trimStart())) return "server action";
  return null;
}

console.log("\nQuem depende do cliente admin\n" + "=".repeat(66));

console.log(`\nChamam DIRETO (${direto.size}):`);
for (const f of [...direto].sort()) console.log("  ", curto(f));

const indiretos = [...dependem].filter((f) => !direto.has(f)).sort();
console.log(`\nDependem por IMPORT, sem citar a função (${indiretos.length}):`);
console.log("  — foi esta lista que o grep perdeu em 02/09 —");
for (const f of indiretos) console.log("  ", curto(f));

/**
 * Por ONDE a entrada chega no admin.
 *
 * Sem isto a lista é alarme sem endereço: dizer que a `/inicio` depende de
 * admin não ajuda quem precisa saber que ela depende POR
 * `execucao-do-cliente`, que já trata a falha. É a diferença entre
 * "confira esta tela" e "confira esta linha".
 */
function caminhosAteOAdmin(inicio: string): string[] {
  const achados = new Set<string>();
  const vistos = new Set<string>();
  const fila = [inicio];
  while (fila.length > 0) {
    const atual = fila.pop()!;
    if (vistos.has(atual)) continue;
    vistos.add(atual);
    if (direto.has(atual)) achados.add(atual);
    for (const a of importaDe.get(atual) ?? []) {
      if (dependem.has(a)) fila.push(a);
    }
  }
  return [...achados].sort();
}

console.log("\nPONTOS DE ENTRADA alcançados — é aqui que o 500 aparece:");
const entradas = [...dependem]
  .map((f) => [f, ehEntrada(f)] as const)
  .filter(([, t]) => t !== null)
  .sort((a, b) => curto(a[0]).localeCompare(curto(b[0])));

for (const [f, tipo] of entradas) {
  const texto = conteudo.get(f)!;
  const temTry = /\btry\s*\{/.test(texto);
  const via = direto.has(f) ? "direto" : "indireto";
  console.log(
    `   ${tipo.padEnd(14)} ${via.padEnd(9)} ${temTry ? "tem try" : "SEM TRY"}  ${curto(f)}`,
  );
  for (const c of caminhosAteOAdmin(f)) {
    if (c !== f) console.log(`                     via  ${curto(c)}`);
  }
}

console.log(
  `\n${entradas.length} ponto(s) de entrada, ${direto.size} direto(s) e ${indiretos.length} indireto(s).`,
);
console.log(
  "A coluna `try` diz se o ARQUIVO tem algum `try` — não se a dependência\n" +
    "está protegida. Isso continua sendo leitura humana, de propósito.\n",
);
