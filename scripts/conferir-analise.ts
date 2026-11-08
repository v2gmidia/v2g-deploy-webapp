/**
 * A análise de peça — `pnpm conferir:analise`
 *
 * ============================================================
 * ESTE CONFERIDOR NASCEU DE UMA TELA QUE GIRAVA PARA SEMPRE.
 *
 * 12/09/2026: o cliente subiu foto do celular em `/criativos` e a tela
 * nunca voltou. A causa medida: o limite de corpo de Server Action do
 * Next é **1 MB** quando não configurado, a validação do navegador não
 * tinha teto de tamanho, e a função que envia não tinha `try`.
 *
 * Foto de celular tem 2 a 8 MB → passava da validação → o Next recusava
 * com `Body exceeded 1 MB limit.` → o `await` rejeitava → a linha
 * seguinte, que tirava a tela do "analisando", não rodava.
 *
 * **O teto de 1 MB era o gatilho; o defeito era não haver caminho de
 * erro.** Perda de rede, aba suspensa e 500 do framework rejeitam igual.
 * Por isso este arquivo trava as duas coisas, e a segunda com mais
 * cuidado que a primeira.
 * ============================================================
 *
 * Puro: não toca rede, banco, nem navegador.
 */

import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import {
  ESPERA_DO_BACKEND_MS,
  FOLGA_DO_CORPO_BYTES,
  TETO_DA_ESPERA_MS,
  TETO_DO_NAVEGADOR_BYTES,
  TETO_DO_NAVEGADOR_MB,
  TETO_DO_SERVIDOR_BYTES,
  TETO_DO_SERVIDOR_TEXTO,
} from "../lib/criativos/limites.mjs";
import { conferirAntesDeLer } from "../lib/criativos/envio.ts";

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

/** O arquivo, sem comentário — para o grep não achar a própria explicação. */
function fonte(caminho: string): string {
  return readFileSync(caminho, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const TELA = "app/(protected)/criativos/Analisar.tsx";
const ACTION = "app/(protected)/criativos/actions.ts";
const HELPER_ESPERA = "lib/criativos/espera.ts";

/** AST ignora comentários e frases: mencionar uma proteção não a executa. */
function contemNo(no: ts.Node, atende: (no: ts.Node) => boolean): boolean {
  return atende(no) || Boolean(ts.forEachChild(no, filho => contemNo(filho, atende) || undefined));
}
function importado(arquivo: ts.SourceFile, origem: string, nome: string): string | null {
  for (const no of arquivo.statements) {
    if (!ts.isImportDeclaration(no) || !ts.isStringLiteral(no.moduleSpecifier)
      || no.moduleSpecifier.text !== origem) continue;
    const nomes = no.importClause?.namedBindings;
    if (!nomes || !ts.isNamedImports(nomes)) continue;
    const item = nomes.elements.find(e => (e.propertyName ?? e.name).text === nome);
    if (item) return item.name.text;
  }
  return null;
}
function protecaoDeEspera(tela: string, helper: string, limites: string): boolean {
  const parse = (nome: string, texto: string) => ts.createSourceFile(nome, texto, ts.ScriptTarget.Latest, true);
  const t = parse("Analisar.tsx", tela), h = parse("espera.ts", helper), l = parse("limites.mjs", limites);
  const envolver = importado(t, "@/lib/criativos/espera", "comTetoDeEspera");
  const analisar = importado(t, "./actions", "analisarPecaAction");
  const teto = importado(h, "./limites.mjs", "TETO_DA_ESPERA_MS");
  const escolheu = t.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === "escolheu");
  // O handler é interno ao componente; não basta uma chamada solta em outro lugar.
  let handler: ts.Node | undefined = escolheu;
  contemNo(t, n => {
    if (ts.isFunctionDeclaration(n) && n.name?.text === "escolheu") handler = n;
    return false;
  });
  if (!envolver || !analisar || !teto || !handler) return false;
  const chamadas = new Set<string>();
  contemNo(handler, n => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer
      && ts.isCallExpression(n.initializer) && ts.isIdentifier(n.initializer.expression)
      && n.initializer.expression.text === analisar) chamadas.add(n.name.text);
    return false;
  });
  const aguardaProtegida = contemNo(handler, n => ts.isAwaitExpression(n)
    && ts.isCallExpression(n.expression) && ts.isIdentifier(n.expression.expression)
    && n.expression.expression.text === envolver && n.expression.arguments.length === 1
    && ts.isIdentifier(n.expression.arguments[0]!) && chamadas.has(n.expression.arguments[0]!.text));
  const funcao = h.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === "comTetoDeEspera");
  const timeout = Boolean(funcao && contemNo(funcao, n => ts.isCallExpression(n)
    && ts.isPropertyAccessExpression(n.expression) && ts.isIdentifier(n.expression.expression)
    && n.expression.expression.text === "AbortSignal" && n.expression.name.text === "timeout"
    && n.arguments.length === 1 && ts.isIdentifier(n.arguments[0]!) && n.arguments[0]!.text === teto));
  const exportaTeto = l.statements.some(n => ts.isVariableStatement(n)
    && n.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
    && n.declarationList.declarations.some(d => ts.isIdentifier(d.name)
      && d.name.text === "TETO_DA_ESPERA_MS" && Boolean(d.initializer)));
  return aguardaProtegida && timeout && exportaTeto;
}

type HelperDeEspera = {
  comTetoDeEspera<T>(promessa: Promise<T>): Promise<T>;
  EsperaEstourou: new () => Error;
};
/** Executa o helper real; só o módulo numérico e o relógio são portas de teste. */
function carregarEspera(codigo: string, sinal: typeof AbortSignal, teto = TETO_DA_ESPERA_MS): HelperDeEspera {
  const exports = {};
  const js = ts.transpileModule(codigo, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  vm.runInNewContext(js, { exports, AbortSignal: sinal, AbortController, require(nome: string) {
    if (nome !== "./limites.mjs") throw Error("Import inesperado no ensaio local");
    return { TETO_DA_ESPERA_MS: teto };
  } });
  return exports as HelperDeEspera;
}

console.log("\nA análise de peça\n" + "=".repeat(64));

secao("0. controle negativo — a asserção pega erro quando existe");
ok(true, "`ok(true, …)` conta como acerto");
{
  const antes = falhou;
  ok(false, "ESTA LINHA TEM QUE FALHAR (se ela passar, ignore o resto)");
  const pegou = falhou === antes + 1;
  falhou = antes;
  ok(pegou, "e a falha foi contada — o placar abaixo vale alguma coisa");
}

// ------------------------------------------------------------------
secao("1. UM NÚMERO SÓ — o teto do navegador é derivado do do servidor");
{
  const config = fonte("next.config.mjs");
  const envio = fonte("lib/criativos/envio.ts");
  const limites = fonte("lib/criativos/limites.mjs");

  ok(
    /TETO_DO_SERVIDOR_TEXTO/.test(config) && /limites\.mjs/.test(config),
    "`next.config.mjs` importa o teto de `limites.mjs` em vez de digitar",
  );
  ok(
    !/bodySizeLimit:\s*["'`]/.test(config),
    "  e não há literal de tamanho no `bodySizeLimit`",
  );
  ok(
    /TETO_DO_NAVEGADOR_BYTES/.test(envio) && /limites\.mjs/.test(envio),
    "`envio.ts` importa o teto do navegador do mesmo módulo",
  );

  // A derivação é o que impede os dois de divergirem: o segundo número
  // não existe como literal em lugar nenhum.
  ok(
    /TETO_DO_NAVEGADOR_BYTES\s*=\s*TETO_DO_SERVIDOR_BYTES\s*-\s*FOLGA_DO_CORPO_BYTES/.test(limites),
    "o teto do navegador é SUBTRAÇÃO do teto do servidor, não um literal",
  );
  ok(
    TETO_DO_NAVEGADOR_BYTES === TETO_DO_SERVIDOR_BYTES - FOLGA_DO_CORPO_BYTES,
    `  e a conta fecha: ${TETO_DO_SERVIDOR_BYTES} − ${FOLGA_DO_CORPO_BYTES} = ${TETO_DO_NAVEGADOR_BYTES}`,
  );
  ok(
    TETO_DO_NAVEGADOR_BYTES < TETO_DO_SERVIDOR_BYTES,
    "  o navegador recusa ANTES do servidor — nunca o contrário",
  );
  ok(FOLGA_DO_CORPO_BYTES > 0, "  e a folga é positiva");

  // A declaração de tipos cobre tudo que o `.mjs` exporta.
  const decl = fonte("lib/criativos/limites.d.mts");
  const exportados = [...limites.matchAll(/export const (\w+)/g)].map((m) => m[1]);
  const faltando = exportados.filter((n) => !new RegExp(`declare const ${n}\\b`).test(decl));
  ok(
    faltando.length === 0,
    `a declaração cobre os ${exportados.length} exports do \`.mjs\`` +
      (faltando.length ? ` (faltam: ${faltando.join(", ")})` : ""),
  );
}

// ------------------------------------------------------------------
secao("2. o teto recusa NO NAVEGADOR, antes de qualquer upload");
{
  const jpg = (bytes: number) =>
    conferirAntesDeLer({ nome: "foto.jpg", tipo: "image/jpeg", tamanhoBytes: bytes });

  ok(jpg(TETO_DO_NAVEGADOR_BYTES) === null, `${TETO_DO_NAVEGADOR_MB} MB exatos passam`);
  ok(
    jpg(TETO_DO_NAVEGADOR_BYTES + 1)?.motivo === "grande_demais",
    "  um byte acima é recusado, com motivo próprio",
  );

  // O caso que quebrou em produção: 4,2 MB continua passando, porque o
  // teto subiu para 10 MB. Se alguém devolver o padrão de 1 MB, esta
  // linha reprova antes de o cliente descobrir de novo.
  ok(jpg(4_200_000) === null, "  o arquivo de 4,2 MB que quebrou em 12/09 PASSA");
  ok(
    TETO_DO_SERVIDOR_BYTES > 1024 * 1024,
    "  e o teto do servidor não voltou para o padrão de 1 MB do Next",
  );

  const texto = jpg(TETO_DO_NAVEGADOR_BYTES + 1)?.texto ?? "";
  ok(texto.includes(String(TETO_DO_NAVEGADOR_MB)), "o texto diz o teto em MB");
  ok(!/erro|inválid|falhou|incorret/i.test(texto), "  e não usa a palavra 'erro'");
  ok(/menor|reduz/i.test(texto), "  e diz o que fazer");
}

// ------------------------------------------------------------------
secao("3. NENHUM CAMINHO FICA EM 'analisando' — o defeito de verdade");
{
  const tela = fonte(TELA);

  // Quem entra no estado é um lugar só. Dois lugares entrando e um
  // saindo é como o buraco volta.
  const entradas = [...tela.matchAll(/setFase\(\{\s*nome:\s*"analisando"/g)].length;
  ok(entradas === 1, `um único lugar entra em "analisando" (achei ${entradas})`);

  ok(/try\s*\{/.test(tela), "a função que envia tem `try`");
  ok(/\}\s*catch/.test(tela), "  e `catch`");
  ok(/\}\s*finally\s*\{/.test(tela), "  e `finally`");

  // ============================================================
  // A ASSERÇÃO QUE IMPORTA: o terminal está no `finally`.
  //
  // No `catch` ele cobriria só a falha PREVISTA. No `finally` ele roda
  // nos três desfechos — sucesso, exceção e retorno — e é a única forma
  // de a garantia não depender de alguém ter previsto a falha certa.
  // ============================================================
  const finalmente = tela.match(/\}\s*finally\s*\{([\s\S]*?)\n\s{2}\}/);
  const corpoDoFinally = finalmente?.[1] ?? "";
  ok(
    /setFase\(/.test(corpoDoFinally),
    "o `finally` sai do estado — é ele que garante, não o `catch`",
  );
  ok(
    !/analisando/.test(corpoDoFinally),
    "  e o estado em que ele deixa a tela NÃO é 'analisando'",
  );

  ok(
    protecaoDeEspera(tela, fonte(HELPER_ESPERA), fonte("lib/criativos/limites.mjs")),
    "há teto de tempo no cliente, para a promessa que não resolve nem rejeita",
  );

  // A action nunca lança: se ela lançasse, a tela dependeria só do
  // `finally` — que existe, mas é a segunda linha, não a primeira.
  const action = fonte(ACTION);
  ok(/try\s*\{/.test(action) && /\}\s*catch/.test(action), "a action tem `try/catch`");
  const retornosNus = [...action.matchAll(/return\s*;/g)].length;
  ok(retornosNus === 0, "  e nenhum `return` sem resultado");
  const retornos = [...action.matchAll(/return\s*\{([\s\S]{0,60})/g)];
  ok(
    retornos.length > 0 && retornos.every((m) => /\bok\s*:/.test(m[1] ?? "")),
    `  os ${retornos.length} retornos declaram \`ok\``,
  );
}

// ------------------------------------------------------------------
secao("4. o teto da tela é maior que o do backend");
{
  ok(
    TETO_DA_ESPERA_MS > ESPERA_DO_BACKEND_MS,
    `a tela espera ${TETO_DA_ESPERA_MS / 1000}s, o backend leva até ${ESPERA_DO_BACKEND_MS / 1000}s`,
  );

  // Se a tela desistisse antes, ela abandonaria análise que ia
  // responder — e o cliente leria "não deu" sobre trabalho que deu.
  const margem = TETO_DA_ESPERA_MS - ESPERA_DO_BACKEND_MS;
  ok(margem >= 30_000, `  com margem de ${margem / 1000}s para o upload e a ida ao servidor`);

  // A cópia do número do backend precisa bater com o original, que mora
  // num módulo `server-only` e por isso não pode ser importado aqui.
  const cliente = fonte("lib/backend/cliente.ts");
  const achado = cliente.match(/compliance:\s*([\d_]+)/);
  const valor = achado ? Number(achado[1]!.replace(/_/g, "")) : NaN;
  ok(
    valor === ESPERA_DO_BACKEND_MS,
    `\`TIMEOUTS.compliance\` (${valor}) bate com \`ESPERA_DO_BACKEND_MS\` (${ESPERA_DO_BACKEND_MS})`,
  );
}

// ------------------------------------------------------------------
secao("5. helper real, controles negativos e estouro — sem esperar seis minutos");
{
  const tela = fonte(TELA), helper = fonte(HELPER_ESPERA), limites = fonte("lib/criativos/limites.mjs");
  const negativos: Array<[string, string, string, string]> = [
    ["helper ausente", tela, "", limites],
    ["import do helper removido", tela.replace(/import\s*\{[^}]*comTetoDeEspera[^}]*\}\s*from\s*["']@\/lib\/criativos\/espera["'];?/, ""), helper, limites],
    ["await sem helper", tela.replace(/await comTetoDeEspera\(chamada\)/, "await chamada"), helper, limites],
    ["helper envolvendo outra promessa", tela.replace(/await comTetoDeEspera\(chamada\)/, "await comTetoDeEspera(Promise.resolve(null))"), helper, limites],
    ["timeout removido", tela, helper.replace("AbortSignal.timeout(TETO_DA_ESPERA_MS)", "new AbortController().signal"), limites],
    ["timeout apenas em comentário/string", tela, helper.replace("AbortSignal.timeout(TETO_DA_ESPERA_MS)", '"AbortSignal.timeout(TETO_DA_ESPERA_MS)"') + "\n// AbortSignal.timeout(TETO_DA_ESPERA_MS)", limites],
    ["teto inline em vez do módulo central", tela, helper.replace("AbortSignal.timeout(TETO_DA_ESPERA_MS)", "AbortSignal.timeout(360000)"), limites],
    ["import do teto removido", tela, helper.replace(/import[^;]*;/, ""), limites],
    ["export do teto removido", tela, helper, limites.replace(/export const TETO_DA_ESPERA_MS[^;]*;/, "")],
  ];
  for (const [nome, t, h, l] of negativos) {
    ok(!protecaoDeEspera(t, h, l), `controle negativo recusa: ${nome}`);
  }

  let prazo = NaN;
  const relogio = new AbortController();
  const simulado = { timeout(ms: number) { prazo = ms; return relogio.signal; } } as typeof AbortSignal;
  const real = carregarEspera(helper, simulado);
  const valor = { ok: true };
  ok(await real.comTetoDeEspera(Promise.resolve(valor)) === valor, "helper preserva a resposta rápida, sem substituí-la");
  ok(prazo === TETO_DA_ESPERA_MS, `helper passa o teto central de ${TETO_DA_ESPERA_MS} ms ao relógio`);
  const falhaOriginal = new Error("FALHA_FICTICIA");
  const rejeicao = await real.comTetoDeEspera(Promise.reject(falhaOriginal)).catch(e => e);
  ok(rejeicao === falhaOriginal, "rejeição da action é preservada, sem virar timeout ou sucesso");
  const pendente = real.comTetoDeEspera(new Promise<never>(() => {})).catch(e => e);
  relogio.abort();
  ok(await pendente instanceof real.EsperaEstourou, "abort do relógio rejeita a promessa pendente com EsperaEstourou");

  // AbortSignal.timeout nativo fica intacto; apenas o limite importado na VM é 5 ms.
  // Watchdog mantém o Node vivo (timeout nativo é unref) e impede teste pendurado.
  async function estouraComRelogioNativo(codigo: string): Promise<boolean> {
    const nativo = carregarEspera(codigo, AbortSignal, 5);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const resultado = await Promise.race([
        nativo.comTetoDeEspera(new Promise<never>(() => {})).then(() => false, e => e instanceof nativo.EsperaEstourou),
        new Promise<false>(resolve => { timer = setTimeout(() => resolve(false), 250); }),
      ]);
      return resultado;
    } finally { clearTimeout(timer); }
  }
  ok(await estouraComRelogioNativo(helper), "helper real estoura com AbortSignal.timeout nativo e limite de teste de 5 ms");
  ok(!await estouraComRelogioNativo(helper.replace("sinal.addEventListener", "new AbortController().signal.addEventListener")),
    "controle negativo: listener desligado do relógio não passa como estouro protegido");
  ok(!await estouraComRelogioNativo(helper.replace("new EsperaEstourou()", 'new Error("FALHA_FICTICIA")')),
    "controle negativo: exceção genérica não passa como EsperaEstourou");
}

console.log("\n" + "=".repeat(64));
if (falhou === 0) {
  console.log(`TUDO CERTO — ${passou}/${passou} conferências`);
} else {
  console.log(`TEM FALHA — ${passou}/${passou + falhou} conferências`);
  process.exitCode = 1;
}
console.log(
  "\nO QUE ISTO NÃO PEGA: o `finally` existir e deixar a tela num estado\n" +
    "que não é 'analisando' mas também não mostra nada. A §3 confere a\n" +
    "FORMA do caminho de saída, não o que ele desenha — isso é a prova\n" +
    "visual, e ela precisa de sessão.\n",
);
