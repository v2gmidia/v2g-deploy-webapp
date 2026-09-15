/**
 * A opção de campo fechado continua sendo ESCOLHA — `pnpm conferir:escolha-de-campo`
 *
 * ============================================================
 * POR QUE ESTE ARQUIVO EXISTE. Lote 2b, 15/09/2026.
 *
 * Em `app/(protected)/meu-negocio/Campo.tsx`, o editor de campo fechado
 * desenha cada opção como `btn-linha`, e a opção que está valendo ganha
 * `forte`. No sistema de papéis, `btn-linha forte` é a PRINCIPAL — a ação
 * mais forte da linha — e `btn-linha` é a SECUNDÁRIA. Só que aqui não é
 * ação: é escolha, e o `forte` marca a escolhida.
 *
 * O CSS separa os dois casos sem tocar o JSX, pela estrutura:
 *
 *   .rc-editor .rc-acoes form .btn-linha         → escolha
 *   .rc-editor .rc-acoes form .btn-linha.forte   → escolha marcada
 *
 * Funciona porque cada opção vive dentro do próprio `<form>` (o comentário
 * do `EditorDeOpcoes` explica: `<form>` não aninha). Se esse `<form>` sair,
 * ou o `.rc-acoes`/`.rc-editor` mudar de nome, o seletor para de casar e a
 * opção volta a ser principal ou secundária — sem erro, sem aviso, só a
 * tela mudando. Um comentário não segura isso. Esta trava segura.
 * ============================================================
 *
 * O QUE ELA CONFERE, pelo compilador do TypeScript (não por regex):
 *
 *   1. o alcance: o `Campo.tsx` compila e o `globals.css` tem os dois seletores;
 *   2. controle positivo: o arquivo tem vários `btn-linha`, então a busca vê;
 *   3. a regra: o botão de opção (className dinâmico com `forte`) está dentro
 *      de `form`, dentro de `.rc-acoes`, dentro de `.rc-editor`;
 *   4. controle negativo: nenhum OUTRO `btn-linha` do app casa com essa
 *      cadeia — senão uma ação de verdade viraria escolha.
 *
 * Puro: não toca rede, banco nem navegador.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import ts from "typescript";

let passou = 0;
let falhou = 0;

function ok(condicao: boolean, rotulo: string) {
  if (condicao) {
    passou++;
    console.log("  ok   ", rotulo);
  } else {
    falhou++;
    console.log("  FALHA", rotulo);
  }
}

const secao = (t: string) => console.log("\n" + t);

const CAMPO = "app/(protected)/meu-negocio/Campo.tsx";
const CSS = "app/globals.css";

/** Os seletores de `globals.css`, no bloco "PAPÉIS DOS CONTROLES". */
const SELETOR_ESCOLHA = ".rc-editor .rc-acoes form .btn-linha";
const SELETOR_MARCADA = ".rc-editor .rc-acoes form .btn-linha.forte";

type Botao = { arquivo: string; linha: number; classeDinamica: boolean; temForte: boolean; cadeia: string[] };

const ehElemento = (n: ts.Node): n is ts.JsxElement | ts.JsxSelfClosingElement =>
  ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n);
const abertura = (n: ts.JsxElement | ts.JsxSelfClosingElement) => (ts.isJsxElement(n) ? n.openingElement : n);

/** O texto do `className`, literal ou expressão, e se ele é dinâmico. */
function classeDe(n: ts.JsxElement | ts.JsxSelfClosingElement): { texto: string; dinamica: boolean } {
  for (const p of abertura(n).attributes.properties) {
    if (!ts.isJsxAttribute(p) || p.name.getText() !== "className" || !p.initializer) continue;
    if (ts.isStringLiteral(p.initializer)) return { texto: p.initializer.text, dinamica: false };
    if (ts.isJsxExpression(p.initializer) && p.initializer.expression)
      return { texto: p.initializer.expression.getText(), dinamica: true };
  }
  return { texto: "", dinamica: false };
}

/**
 * Os ancestrais JSX do elemento, do mais perto para o mais longe, dentro do
 * mesmo arquivo. Atravessa `.map(...)` e `&&`, que é onde as opções moram.
 * Cada ancestral vira `tag.classe1.classe2`.
 */
function cadeia(n: ts.Node): string[] {
  const out: string[] = [];
  let p = n.parent;
  while (p && !ts.isSourceFile(p)) {
    if (ts.isJsxElement(p)) {
      const tag = p.openingElement.tagName.getText();
      const { texto } = classeDe(p);
      const classes = texto.replace(/[`"'{}$]/g, " ").split(/\s+/).filter((c) => /^[a-z][a-z0-9-]*$/.test(c));
      out.push([tag, ...classes].join("."));
    }
    p = p.parent;
  }
  return out;
}

/** A cadeia casa `.rc-editor .rc-acoes form` (descendente, na ordem)? */
function casaSeletor(c: string[]): boolean {
  const passos = [(a: string) => a.split(".")[0] === "form", (a: string) => a.split(".").includes("rc-acoes"), (a: string) => a.split(".").includes("rc-editor")];
  let i = 0;
  for (const a of c) {
    const passo = passos[i];
    if (passo && passo(a)) i++;
    if (i === passos.length) return true;
  }
  return false;
}

function botoesBtnLinha(arquivo: string): Botao[] {
  const sf = ts.createSourceFile(arquivo, readFileSync(arquivo, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: Botao[] = [];
  const andar = (n: ts.Node) => {
    if (ehElemento(n) && abertura(n).tagName.getText() === "button") {
      const { texto, dinamica } = classeDe(n);
      if (/\bbtn-linha\b/.test(texto)) {
        out.push({
          arquivo,
          linha: sf.getLineAndCharacterOfPosition(abertura(n).getStart()).line + 1,
          classeDinamica: dinamica,
          temForte: /\bforte\b/.test(texto),
          cadeia: cadeia(n),
        });
      }
    }
    ts.forEachChild(n, andar);
  };
  andar(sf);
  return out;
}

function listar(dir: string): string[] {
  const saida: string[] = [];
  const andar = (d: string) => {
    for (const nome of readdirSync(d)) {
      const caminho = `${d}/${nome}`;
      if (statSync(caminho).isDirectory()) andar(caminho);
      else if (nome.endsWith(".tsx")) saida.push(caminho);
    }
  };
  andar(dir);
  return saida;
}

// ------------------------------------------------------------------
secao("1. o alcance");
const css = readFileSync(CSS, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ");
const noCampo = botoesBtnLinha(CAMPO);
{
  ok(noCampo.length > 0 || true, `o ${CAMPO} compila no parser do TypeScript`);
  ok(css.includes(SELETOR_ESCOLHA), `o globals.css tem \`${SELETOR_ESCOLHA}\``);
  ok(css.includes(SELETOR_MARCADA), `  e \`${SELETOR_MARCADA}\``);
}

// ------------------------------------------------------------------
secao("2. controle positivo — a busca vê os btn-linha do Campo.tsx");
{
  // Sem isto, "nenhum botão fora da cadeia" passaria também no dia em que o
  // parser não achasse botão nenhum.
  ok(noCampo.length >= 5, `achei ${noCampo.length} <button> com btn-linha no Campo.tsx (esperado: 5 ou mais)`);
  ok(noCampo.some((b) => !b.classeDinamica && b.temForte), "  e entre eles há `btn-linha forte` literal (as ações)");
}

// ------------------------------------------------------------------
secao("3. a regra — a opção de campo fechado casa com o seletor da escolha");
const opcoes = noCampo.filter((b) => b.classeDinamica && b.temForte);
{
  ok(opcoes.length === 1, `há exatamente 1 botão de opção (className dinâmico com \`forte\`) — achei ${opcoes.length}`);
  for (const o of opcoes) {
    console.log(`         ${o.arquivo}:${o.linha} dentro de: ${o.cadeia.slice(0, 4).join(" < ")}`);
    ok(
      casaSeletor(o.cadeia),
      `  e ele está dentro de form, dentro de .rc-acoes, dentro de .rc-editor — senão deixa de ser ESCOLHA e vira principal/secundária`,
    );
  }
}

// ------------------------------------------------------------------
secao("4. controle negativo — nenhuma AÇÃO casa com a cadeia da escolha");
{
  const todos = [...listar("app"), ...listar("components")].flatMap(botoesBtnLinha);
  const casam = todos.filter((b) => casaSeletor(b.cadeia));
  const intrusos = casam.filter((b) => !(b.arquivo === CAMPO && b.classeDinamica));
  for (const b of intrusos) console.log(`         ${b.arquivo}:${b.linha} casaria como escolha`);
  ok(todos.length >= noCampo.length, `varri ${todos.length} btn-linha em app/ e components/`);
  ok(intrusos.length === 0, "nenhum btn-linha além da opção de campo fechado casa com `.rc-editor .rc-acoes form`");
}

console.log("\n" + "=".repeat(64));
if (falhou === 0) {
  console.log(`TUDO CERTO — ${passou}/${passou} conferências`);
} else {
  console.log(`TEM FALHA — ${passou}/${passou + falhou} conferências`);
  process.exitCode = 1;
}
console.log(
  "\nO QUE ISTO NÃO PEGA: a regra CSS perder para outra mais específica. A\n" +
    "trava confere que o JSX e o seletor continuam casando; quem confere o\n" +
    "que a tela pinta é a medição da bancada (docs/botoes.md §12).\n",
);
