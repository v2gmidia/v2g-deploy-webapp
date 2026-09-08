/**
 * Id vindo da requisição endereçando dado — `pnpm conferir:identidade`
 *
 * ============================================================
 * A PERGUNTA QUE ELE FAZ, E POR QUE ELA VALE.
 *
 * `docs/superficie-do-token.md` mediu que a separação entre clientes
 * neste app é **disciplina de código, não invariante do sistema**: o
 * `X-V2G-Token` é único e conecta com `service_role`, e o que impede a
 * tela do cliente A de pedir o dado do cliente B é o hábito de fazer o
 * `profile_id` nascer sempre da sessão.
 *
 * Hábito não é conferível. Um handler novo que aceitasse `?business_id=`
 * e chamasse o backend funcionaria, passaria no typecheck, passaria no
 * build e passaria no `pnpm conferir` — e leria o negócio de qualquer
 * cliente.
 *
 * **Este conferidor não existe para pegar o código de hoje, que está
 * certo. Existe para obrigar o QUARTO caso a se declarar.**
 * ============================================================
 *
 * ============================================================
 * COMO ELE MEDE, E ONDE ERRA. Leia antes de confiar.
 *
 * Fluxo de dados POR NOME, dentro de um arquivo só. Ele marca os nomes
 * ligados a entrada de requisição (`params`, `searchParams`, `formData`,
 * cookie, corpo) e depois procura esses nomes em posição de ENDEREÇAR
 * LINHA — `.eq()` numa coluna de id, chave `*_id` de RPC, ou passados a
 * uma função de `@/lib/` quando o próprio nome é de id.
 *
 * NÃO É ANÁLISE DE VERDADE. Ele não segue valor entre arquivos, não
 * entende reatribuição, e não sabe a diferença entre um id autorizado e
 * um não autorizado — essa diferença é semântica, e é por isso que a
 * lista branca existe.
 *
 * O lado para o qual ele erra é escolhido: prefere apontar demais. Um
 * falso positivo custa uma entrada declarada em `lib/seguranca/excecoes.ts`
 * — que é leitura humana de cinco minutos. Um falso negativo custa o dado
 * de um cliente aparecendo para outro.
 * ============================================================
 *
 * Não toca rede nem banco.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { EXCECOES } from "../lib/seguranca/excecoes.ts";

const RAIZ = resolve(import.meta.dirname, "..");

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

// ---------------------------------------------------------------- o instrumento

/** Entradas de requisição. O que sai delas é suspeito até prova em contrário. */
const ENTRADAS = [
  /await\s+params\b/,
  /await\s+searchParams\b/,
  /\bsearchParams\.get\s*\(/,
  /\bformData\.get\s*\(/,
  /\bcookies\s*\(\s*\)/,
  /\brequest\.cookies\.get\s*\(/,
  /\brequest\.json\s*\(/,
  /\brequest\.formData\s*\(/,
  /\bnew URL\(request\.url\)/,
  // Funções nossas cujo trabalho É ler a requisição. Sem esta linha, o
  // corpo assinado da Meta entraria como se fosse valor confiável.
  /\bpedidoAssinadoDaRequisicao\s*\(/,
  /\blerPedidoAssinado\s*\(/,
];

/** Coluna ou chave que endereça LINHA. `p_chave` e `nome` não entram. */
const EH_DE_ID = (s: string) => /^id$|_id$|Id$/.test(s);

/**
 * O nome aparece nesta linha COMO VARIÁVEL?
 *
 * O `(?<![\w.$])` é o que separa a variável `id` do acesso `user.id` —
 * sem ele, toda linha com `.eq("profile_id", user.id)` acusava qualquer
 * arquivo que tivesse uma variável chamada `id`. Foi o primeiro falso
 * positivo da calibração, e era o mais barulhento.
 */
const usa = (linha: string, nome: string) =>
  new RegExp(String.raw`(?<![\w.$])` + nome + String.raw`\b`).test(linha);

function arquivosDe(dir: string, achados: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      if (nome === "node_modules" || nome.startsWith(".")) continue;
      arquivosDe(caminho, achados);
    } else if (/\.tsx?$/.test(nome)) {
      achados.push(caminho);
    }
  }
  return achados;
}

/**
 * Os nomes que receberam entrada de requisição.
 *
 * Pega as três formas que o repositório usa: `const x = <entrada>`,
 * `const { a, b: c } = <entrada>` e `const [a] = <entrada>`.
 */
function nomesSujos(texto: string): Set<string> {
  const sujos = new Set<string>();
  const linhas = texto.split("\n");

  /** Os nomes ligados nesta linha, seja `const x =` ou `x =`. */
  const ligadosEm = (linha: string): string[] => {
    const destr = linha.match(/(?:const|let|var)?\s*\{([^}]*)\}\s*=/);
    if (destr) {
      return destr[1]!
        .split(",")
        .map((parte) => (parte.includes(":") ? parte.split(":")[1]! : parte).trim().replace(/\s.*$/, ""))
        .filter(Boolean);
    }
    const simples = linha.match(/(?:(?:const|let|var)\s+)?([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=[^=]/);
    return simples ? [simples[1]!] : [];
  };

  for (const linha of linhas) {
    if (ENTRADAS.some((r) => r.test(linha))) {
      for (const n of ligadosEm(linha)) sujos.add(n);
    }
  }

  // ============================================================
  // UM SALTO DE ATRIBUIÇÃO, ATÉ FECHAR. Sem isto o instrumento perde o
  // caso do `/auth/meta/callback`, que é o melhor exemplo que o
  // repositório tem: o cookie liga `cru`, e quem endereça a linha é
  // `guardado = JSON.parse(cru)`, uma atribuição depois. Perder isso
  // seria perder justamente o padrão que a gente quer que os outros
  // copiem.
  // ============================================================
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const linha of linhas) {
      const usaSujo = [...sujos].some((n) => usa(linha, n));
      if (!usaSujo) continue;
      for (const n of ligadosEm(linha)) {
        if (!sujos.has(n)) {
          sujos.add(n);
          mudou = true;
        }
      }
    }
  }

  return sujos;
}

interface Achado {
  arquivo: string;
  nome: string;
  linha: number;
  trecho: string;
  motivo: string;
}

/**
 * Onde um nome sujo endereça linha.
 *
 * Três posições, e cada uma corresponde a um caso real do repositório:
 * o `.eq("id", …)` do callback do Meta, a chave `p_meta_user_id` das
 * rotas de exclusão, e o `carregarProposta(propostaId)` da tela de
 * operador.
 */
function achadosDe(arquivo: string, texto: string): Achado[] {
  const sujos = nomesSujos(texto);
  if (sujos.size === 0) return [];

  const importadosDeLib = new Set<string>();
  for (const m of texto.matchAll(/import\s*\{([^}]*)\}\s*from\s*["']@\/lib\/[^"']+["']/g)) {
    for (const parte of m[1]!.split(",")) {
      const nome = parte.trim().split(/\s+as\s+/).pop()!.trim();
      if (nome) importadosDeLib.add(nome);
    }
  }

  const achados: Achado[] = [];
  const linhas = texto.split("\n");

  // Quais linhas estão dentro de uma chamada `.rpc(...)`. Contagem de
  // parênteses porque a chamada quase sempre atravessa linhas, e a chave
  // que interessa nunca está na mesma linha do `.rpc(`.
  const dentroDeRpc = new Set<number>();
  for (let i = 0; i < linhas.length; i++) {
    if (!/\.rpc\s*\(/.test(linhas[i]!)) continue;
    let saldo = 0;
    for (let j = i; j < linhas.length; j++) {
      dentroDeRpc.add(j);
      for (const c of linhas[j]!) {
        if (c === "(") saldo++;
        else if (c === ")") saldo--;
      }
      if (saldo <= 0 && j > i) break;
      if (saldo <= 0 && /\)/.test(linhas[j]!)) break;
    }
  }

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i]!;
    // A linha da própria atribuição não é uso.
    if (ENTRADAS.some((r) => r.test(linha))) continue;

    for (const nome of sujos) {
      if (!usa(linha, nome)) continue;

      // (a) `.eq("<coluna de id>", … nome …)`
      const eq = linha.match(/\.eq\s*\(\s*["']([^"']+)["']/);
      if (eq && EH_DE_ID(eq[1]!)) {
        achados.push({
          arquivo,
          nome,
          linha: i + 1,
          trecho: linha.trim(),
          motivo: `filtra por \`${eq[1]}\``,
        });
        continue;
      }

      // ============================================================
      // (b) chave de id DENTRO DE UMA CHAMADA DE RPC — e só ali.
      //
      // A primeira versão olhava qualquer `chave: valor` de objeto, e a
      // calibração mostrou por que isso não serve: `.update({ meta_page_id:
      // pagina })` e `.upsert({ external_id: contaExterna })` casavam. Só
      // que esses `_id` são VALOR sendo escrito — o id de uma página do
      // Facebook —, não endereço da nossa linha. Quem endereça ali é o
      // `.eq("business_id", …)` de quem veio da sessão.
      //
      // Dentro de `.rpc()` é o contrário: `p_business_id` é o que a função
      // do banco vai usar para achar a linha. É a diferença entre escrever
      // um dado e escolher de quem é a linha.
      //
      // O par é casado com o nome, e não com a primeira chave da linha —
      // esse foi o segundo falso positivo: `p_chave: chave` acusava porque
      // `p_business_id` vinha antes na mesma chamada.
      // ============================================================
      if (dentroDeRpc.has(i)) {
        const par = linha.match(
          new RegExp(String.raw`([A-Za-z_$][\w$]*)\s*:\s*[^,}]*(?<![\w.$])` + nome + String.raw`\b`),
        );
        if (par && EH_DE_ID(par[1]!)) {
          achados.push({
            arquivo,
            nome,
            linha: i + 1,
            trecho: linha.trim(),
            motivo: `vai como \`${par[1]}\` numa RPC`,
          });
          continue;
        }
      }

      // (c) nome DE ID passado a função de `@/lib/`. É o único caso em que
      // o nome da variável decide — e decide porque `carregarProposta(x)`
      // não diz, na forma, que `x` é um id.
      if (EH_DE_ID(nome)) {
        for (const fn of importadosDeLib) {
          const chamada = new RegExp(
            String.raw`\b` + fn + String.raw`\s*\([^)]*(?<![\w.$])` + nome + String.raw`\b`,
          );
          if (chamada.test(linha)) {
            achados.push({
              arquivo,
              nome,
              linha: i + 1,
              trecho: linha.trim(),
              motivo: `endereça dado por \`${fn}()\``,
            });
            break;
          }
        }
      }
    }
  }

  return achados;
}

// ---------------------------------------------------------------- §0

console.log("\nId da requisição endereçando dado\n" + "=".repeat(66));

console.log("\n0. controle negativo — o instrumento acusa quando existe?");
{
  const plantado = `
    export async function GET(request: NextRequest) {
      const { searchParams } = new URL(request.url);
      const businessId = searchParams.get("business_id");
      const { data } = await supabase.from("businesses").select("*").eq("id", businessId);
      return Response.json(data);
    }`;
  const a = achadosDe("plantado.ts", plantado);
  ok(a.length > 0, "um handler com `?business_id=` endereçando linha SERIA acusado");
  ok(
    a.some((x) => x.motivo.includes("filtra por")),
    "e o motivo aponta o filtro, não só o arquivo",
  );

  // O contrário: o padrão CERTO não pode ser acusado, senão a lista
  // branca vira a lista de tudo e ninguém lê.
  const limpo = `
    export async function acao(formData: FormData) {
      const chave = String(formData.get("chave") ?? "");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: negocio } = await supabase.from("businesses").select("id").eq("profile_id", user.id);
      await supabase.rpc("confirmar_campo_do_cliente", { p_business_id: negocio.id, p_chave: chave });
    }`;
  ok(
    achadosDe("limpo.ts", limpo).length === 0,
    "e o padrão CERTO — id do `select` sob RLS, campo do formulário — não é acusado",
  );
}

// ---------------------------------------------------------------- §1

console.log("\n1. o repositório, arquivo por arquivo");

const arquivos = arquivosDe(join(RAIZ, "app"));
const curto = (f: string) => relative(RAIZ, f).replace(/\\/g, "/");

const todos: Achado[] = [];
for (const f of arquivos) {
  todos.push(...achadosDe(curto(f), readFileSync(f, "utf8")));
}

const porArquivo = new Map<string, Achado[]>();
for (const a of todos) {
  porArquivo.set(a.arquivo, [...(porArquivo.get(a.arquivo) ?? []), a]);
}

const declarados = new Set(EXCECOES.map((e) => e.arquivo));
const encontrados = [...porArquivo.keys()].sort();

console.log(`   ${arquivos.length} arquivos varridos, ${encontrados.length} com achado`);

// ---------------------------------------------------------------- §2

console.log("\n2. tudo que endereça linha está declarado?");
{
  const naoDeclarados = encontrados.filter((f) => !declarados.has(f));
  ok(
    naoDeclarados.length === 0,
    naoDeclarados.length === 0
      ? "nenhum arquivo endereça linha com id de fora sem declarar"
      : `NÃO DECLARADO(S): ${naoDeclarados.join(", ")}`,
  );
  for (const f of naoDeclarados) {
    for (const a of porArquivo.get(f)!) {
      console.log(`         ${f}:${a.linha}  \`${a.nome}\` ${a.motivo}`);
      console.log(`           ${a.trecho.slice(0, 96)}`);
    }
    console.log(
      "         Se for legítimo, declare em `lib/seguranca/excecoes.ts` com uma\n" +
        "         das três autorizações — posse, papel ou prova — e o porquê.",
    );
  }
}

// ---------------------------------------------------------------- §3

console.log("\n3. e a lista não envelheceu sozinha?");
{
  // ============================================================
  // ENTRADA QUE DEIXOU DE OCORRER É FALHA, e não alívio.
  //
  // Mesma garantia da lista de inertes do `conferir:cascata`: sem isto, a
  // exceção sobrevive ao código que a justificava, e a próxima pessoa
  // herda uma permissão sem dono. Uma lista branca que só cresce é uma
  // lista branca que ninguém confere.
  // ============================================================
  const orfas = EXCECOES.filter((e) => !porArquivo.has(e.arquivo));
  ok(
    orfas.length === 0,
    orfas.length === 0
      ? "toda exceção declarada corresponde a um achado real"
      : `ÓRFÃ(S) — declarada e não ocorre mais: ${orfas.map((o) => o.arquivo).join(", ")}`,
  );

  const semArquivo = EXCECOES.filter((e) => {
    try {
      return !statSync(join(RAIZ, e.arquivo)).isFile();
    } catch {
      return true;
    }
  });
  ok(semArquivo.length === 0, "e todo arquivo declarado existe no disco");
}

// ---------------------------------------------------------------- §4

console.log("\n4. as exceções, IMPRESSAS — a lista não é esconderijo");
for (const e of EXCECOES) {
  const n = porArquivo.get(e.arquivo)?.length ?? 0;
  console.log(`\n   [${e.autorizacao}] ${e.arquivo}  (${n} uso(s))`);
  console.log(`      entra:  ${e.oQueEntra}`);
  console.log(`      porque: ${e.porque.replace(/\s+/g, " ")}`);
}

// ---------------------------------------------------------------- placar

console.log("\n" + "=".repeat(66));
if (falhou === 0) {
  console.log(`TUDO CERTO — ${passou}/${passou} conferências, ${EXCECOES.length} exceção(ões) declarada(s)`);
} else {
  console.log(`TEM FALHA — ${passou}/${passou + falhou} conferências`);
  process.exitCode = 1;
}
console.log(
  "\nELE NÃO DIZ QUE O ID ESTÁ AUTORIZADO. Diz que alguém DECLAROU por que\n" +
    "está — e a diferença entre as duas é exatamente o que nenhum lint\n" +
    "alcança. Ver o bloco no topo de `lib/seguranca/excecoes.ts`.\n",
);
