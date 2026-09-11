/**
 * Onde a fixture pode ser nomeada — `pnpm conferir:portao`
 *
 * ============================================================
 * POR QUE ESTE ARQUIVO EXISTE. Medido em 11/09/2026.
 *
 * O portão das fixtures nasceu em UM lugar — a própria
 * `app/(protected)/inicio/page.tsx` — e no mesmo dia estava em TRÊS: mais
 * o `proxy.ts` e o `app/(protected)/layout.tsx`. Espalhar foi barato
 * porque cada cópia, sozinha, parecia razoável: sem a do proxy não havia
 * captura, e a do layout vinha explicada como prova de que a defesa em
 * profundidade funcionava.
 *
 * Não era. Uma exceção copiada para dentro das três camadas é UMA camada
 * escrita três vezes — o mesmo buraco, no mesmo lugar, três vezes. E a
 * terceira cópia ficava no layout RAIZ (`V2G_FIXTURE_TEMA`), que decide o
 * tema do site inteiro, `/entrar` e landing page inclusive.
 *
 * As duas cópias saíram. Este conferidor existe para que a terceira não
 * apareça: a regra é de LUGAR, não de forma.
 *
 *   Só `app/(protected)/inicio/` e `lib/dev/` podem nomear uma
 *   `V2G_FIXTURE_*`. Nenhum outro arquivo que o Next compile.
 *
 * O que isso compra: um portão de fixture só consegue mudar QUEM ENTRA se
 * estiver antes da checagem de sessão — e os lugares que ficam antes dela
 * (o proxy e os dois layouts) estão todos fora da lista. O que sobra
 * dentro da lista só consegue mudar o que a página LÊ, depois de a sessão
 * já ter sido exigida duas vezes.
 * ============================================================
 *
 * O QUE ESTE CONFERIDOR NÃO OLHA, e por quê cada um:
 *
 *   - `scripts/`: não é compilado nem servido — nada daqui vira resposta
 *     HTTP. E um conferidor precisa poder escrever o nome do que confere.
 *   - `docs/`: prosa. Documento que não pode citar a variável é documento
 *     que não pode explicá-la.
 *   - `.env*`: é a CASA da variável, e o `.gitignore` fecha o arquivo
 *     inteiro (`.env.*`) — não há valor real rastreado neste repo.
 *
 * Puro: não toca rede, banco nem navegador.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";

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

/**
 * O padrão é MONTADO, não escrito.
 *
 * Se o nome aparecesse inteiro aqui, este arquivo seria a primeira coisa
 * que ele encontraria no dia em que alguém ampliasse o alcance para
 * `scripts/` — e a saída barata seria abrir uma exceção para o próprio
 * conferidor, que é como a regra morre.
 */
const PREFIXO = ["V2G", "FIXTURE"].join("_") + "_";
const PADRAO = new RegExp(PREFIXO + "[A-Z0-9_]+", "g");

/** Os dois únicos lugares onde nomear a fixture é permitido. */
const PERMITIDOS = ["app/(protected)/inicio/", "lib/dev/"];

/** Onde o Next procura código — é este o alcance da regra. */
const ARVORES = ["app", "lib", "components"];

const EXTENSOES = /\.(tsx?|jsx?|mjs|cjs)$/;

function listar(dir: string): string[] {
  const saida: string[] = [];
  const andar = (d: string) => {
    for (const nome of readdirSync(d)) {
      const caminho = `${d}/${nome}`;
      if (statSync(caminho).isDirectory()) andar(caminho);
      else if (EXTENSOES.test(nome)) saida.push(caminho);
    }
  };
  andar(dir);
  return saida;
}

/**
 * A raiz entra na conta e não é detalhe: `proxy.ts` mora nela, e foi ele
 * a cópia que de fato abria a porta sem sessão.
 */
function listarRaiz(): string[] {
  return readdirSync(".")
    .filter((nome) => EXTENSOES.test(nome))
    .filter((nome) => statSync(nome).isFile());
}

const arquivos = [...ARVORES.flatMap(listar), ...listarRaiz()];
const permitido = (f: string) => PERMITIDOS.some((p) => f.startsWith(p));

// ------------------------------------------------------------------
secao("1. o alcance da conferência");
{
  ok(arquivos.length > 0, `achei ${arquivos.length} arquivos compilados para varrer`);
  ok(
    arquivos.includes("proxy.ts"),
    "o `proxy.ts` da raiz está entre eles — foi dele a cópia que abria a porta",
  );
  ok(
    arquivos.includes("app/layout.tsx") && arquivos.includes("app/(protected)/layout.tsx"),
    "os dois layouts estão entre eles",
  );
}

// ------------------------------------------------------------------
secao("2. controle positivo — o padrão acha onde DEVE achar");
{
  // Sem isto, a conferência inteira passa por engano no dia em que o
  // padrão parar de casar: zero achados fora da lista é o mesmo resultado
  // de uma regex quebrada. O controle positivo separa os dois.
  // `match` e não `test`: `PADRAO` tem a flag `g`, e `test` com `g`
  // guarda `lastIndex` entre chamadas — a segunda pergunta sobre o mesmo
  // arquivo responderia `false` sozinha.
  const mencoes = (f: string) => readFileSync(f, "utf8").match(PADRAO) ?? [];

  const dentro = arquivos.filter(permitido).filter((f) => mencoes(f).length > 0);
  const achados = dentro.flatMap((f) => mencoes(f).map((m) => `${f}: ${m}`));

  ok(
    achados.length > 0,
    `o padrão \`${PREFIXO}*\` acha ${achados.length} menção(ões) na área permitida` +
      ` — ${[...new Set(achados.map((a) => a.split(": ")[1]))].join(", ")}`,
  );
  ok(dentro.length > 0, "  e os arquivos permitidos que a mencionam continuam existindo");
}

// ------------------------------------------------------------------
secao("3. a regra — fora de `/inicio` e `lib/dev/`, ninguém nomeia a fixture");
{
  const infratores = arquivos
    .filter((f) => !permitido(f))
    .map((f) => ({ f, achados: readFileSync(f, "utf8").match(PADRAO) ?? [] }))
    .filter(({ achados }) => achados.length > 0);

  for (const { f, achados } of infratores) {
    console.log(`         ${f} → ${[...new Set(achados)].join(", ")}`);
  }

  ok(
    infratores.length === 0,
    `nenhum arquivo compilado fora de ${PERMITIDOS.join(" e ")} menciona \`${PREFIXO}*\`` +
      (infratores.length ? ` (achei ${infratores.length})` : ""),
  );
}

console.log("\n" + "=".repeat(64));
if (falhou === 0) {
  console.log(`TUDO CERTO — ${passou}/${passou} conferências`);
} else {
  console.log(`TEM FALHA — ${passou}/${passou + falhou} conferências`);
  process.exitCode = 1;
}
console.log(
  "\nO QUE ISTO NÃO PEGA: fixture que não se chame `" +
    PREFIXO +
    "*`. A regra é\n" +
    "sobre o NOME, e um portão lido de `process.env.OUTRA_COISA`, ou de um\n" +
    "arquivo, passa batido. O que fecha essa porta é a `conferir:inicio` §6,\n" +
    "que exige que só a `/inicio` alcance `lib/dev/fixtures-inicio.ts`.\n",
);
