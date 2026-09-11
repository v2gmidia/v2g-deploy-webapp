/**
 * De quem é a campanha que a tela mostra — `pnpm conferir:campanha-da-sessao`
 *
 * ============================================================
 * O BURACO QUE ESTE ARQUIVO EXISTE PARA IMPEDIR.
 *
 * Duas rotas do backend devolvem campanha e **não perguntam de quem ela
 * é**:
 *
 *   GET /execucoes/{id}              nome, canal, status
 *   GET /execucoes/{id}/consolidado  o dinheiro, os cliques, o nível
 *
 * Nenhuma das duas aceita `profile_id`. Quem tem o `X-V2G-Token` lê a
 * execução de QUALQUER cliente — e o servidor do Next tem o token.
 *
 * As duas rotas de negócio, ao contrário, conferem o dono. Medido em
 * 10/09/2026 contra produção:
 *
 *   GET /negocios/a85c37a9-…/consolidado?profile_id=<de outro usuário>
 *   → 404 {"detail":"negocio a85c37a9-… nao encontrado."}
 *
 * Então a autorização é a LISTA: os ids que vêm em `por_execucao` do
 * consolidado do negócio da sessão já passaram pelo `profile_id`. Qualquer
 * id que chegue por outro caminho — `searchParams`, `params` de rota,
 * campo de formulário — é "troque o uuid e veja a campanha do vizinho".
 *
 * Regra do Victor, 10/09/2026.
 * ============================================================
 *
 * ISTO NÃO É ANÁLISE DE FLUXO DE DADOS, e não finge ser. São quatro
 * travas estruturais, e cada uma fecha uma porta:
 *
 *   1. só um arquivo chama as duas rotas
 *   2. esse arquivo não expõe função que aceite id de execução
 *   3. quem chama esse arquivo passa id de NEGÓCIO, e o tira do estado
 *      da sessão — nunca de `searchParams`
 *   4. os ids consultados saem de `porExecucao`
 *
 * Puro: lê arquivo do disco, não toca rede nem banco.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";

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

function secao(t: string) {
  console.log("\n" + t);
}

/** Todo `.ts`/`.tsx` de `app/` e `lib/`, com o caminho relativo à raiz. */
function fontes(): Array<{ caminho: string; texto: string }> {
  const achados: Array<{ caminho: string; texto: string }> = [];
  const andar = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const cheio = join(dir, nome);
      if (statSync(cheio).isDirectory()) {
        if (nome === "node_modules" || nome === ".next") continue;
        andar(cheio);
        continue;
      }
      if (!/\.tsx?$/.test(nome)) continue;
      achados.push({
        caminho: relative(RAIZ, cheio).replace(/\\/g, "/"),
        texto: readFileSync(cheio, "utf8"),
      });
    }
  };
  andar(resolve(RAIZ, "app"));
  andar(resolve(RAIZ, "lib"));
  return achados;
}

const ARQUIVOS = fontes();

/** O único arquivo autorizado a perguntar por uma execução. */
const PORTEIRO = "lib/resultado/do-negocio.ts";

// ---------------------------------------------------------------- §0

secao("0. controle negativo — a varredura enxerga os arquivos");
{
  ok(ARQUIVOS.length > 30, `${ARQUIVOS.length} arquivos de app/ e lib/ lidos`);
  ok(
    ARQUIVOS.some((a) => a.caminho === PORTEIRO),
    `o porteiro \`${PORTEIRO}\` está entre eles`,
  );
  ok(
    ARQUIVOS.some((a) => a.texto.includes("consolidadoDaExecucao")),
    "e a busca por `consolidadoDaExecucao` acha alguma coisa — senão o resto passaria vazio",
  );
}

// ---------------------------------------------------------------- §1

secao("1. SÓ o porteiro chama as rotas que não conferem o dono");
{
  // A definição e o reexport não contam: quem importa risco é a CHAMADA.
  const DEFINE = ["lib/backend/dia-seguinte.ts", "lib/backend/execucoes.ts", "lib/backend/index.ts"];

  for (const rotina of ["consolidadoDaExecucao", "fichaDaExecucao"]) {
    const chamadores = ARQUIVOS.filter(
      (a) =>
        !DEFINE.includes(a.caminho) &&
        new RegExp(String.raw`\b${rotina}\s*\(`).test(
          // comentário fora: citar o nome numa explicação não é chamar
          a.texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""),
        ),
    ).map((a) => a.caminho);

    const soOPorteiro = chamadores.length === 1 && chamadores[0] === PORTEIRO;
    ok(
      soOPorteiro,
      soOPorteiro
        ? `\`${rotina}()\` só é chamada em \`${PORTEIRO}\``
        : `\`${rotina}()\` foi achada FORA do porteiro: ${chamadores.join(", ") || "(em lugar nenhum)"}`,
    );
  }
}

// ---------------------------------------------------------------- §2

secao("2. o porteiro NÃO aceita id de execução de fora");
{
  const porteiro = ARQUIVOS.find((a) => a.caminho === PORTEIRO)!.texto;

  // ============================================================
  // A PROTEÇÃO É NÃO EXISTIR A PORTA, e não recusar quem bate nela.
  //
  // Uma `resultadoDaCampanha(idExecucao)` seria chamada de uma página com
  // `params.id`, e a proteção viraria um `if` que alguém esquece. Aqui o
  // id malicioso não é recusado — ele não tem por onde entrar.
  // ============================================================
  const exportadas = [...porteiro.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g)];
  ok(exportadas.length > 0, `o porteiro exporta ${exportadas.length} função(ões)`);

  for (const [, nome, args] of exportadas) {
    ok(
      !/idExecucao|id_execucao/i.test(args ?? ""),
      `\`${nome}()\` não recebe id de execução como argumento`,
    );
  }

  ok(
    /porExecucao\s*\.\s*map|porExecucao\.length|const\s*\{\s*porExecucao/.test(porteiro),
    "e os ids que ele consulta saem de `porExecucao`",
  );
  ok(
    /consolidadoDoNegocio\s*\(/.test(porteiro),
    "que só existe porque o consolidado do NEGÓCIO — o que confere `profile_id` — foi lido antes",
  );
  ok(
    porteiro.indexOf("consolidadoDoNegocio(") < porteiro.indexOf("consolidadoDaExecucao("),
    "e ele é lido ANTES: a lista é a autorização, então ela vem primeiro",
  );
}

// ---------------------------------------------------------------- §3

secao("3. nenhum id de URL, query ou formulário chega perto disso");
{
  const chamadores = ARQUIVOS.filter((a) =>
    /\bresultadoDoNegocio\s*\(/.test(
      a.texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""),
    ),
  );

  ok(chamadores.length > 0, `${chamadores.length} tela(s) chamam \`resultadoDoNegocio()\``);

  for (const a of chamadores) {
    if (a.caminho === PORTEIRO) continue;
    const codigo = a.texto.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

    // ============================================================
    // A TELA NÃO PODE LER `searchParams` NEM `params` NO MESMO ARQUIVO.
    //
    // É mais duro que o necessário de propósito: em tese daria para ler um
    // filtro de data de `searchParams` sem risco nenhum. Mas "sem risco
    // nenhum" é julgamento, e julgamento não sobrevive a seis meses de
    // edições. Precisar de filtro é motivo para revisitar esta regra
    // conscientemente, que é exatamente o que se quer.
    // ============================================================
    ok(
      !/\bsearchParams\b|\bparams\s*[:.]/.test(codigo),
      `\`${a.caminho}\` não lê \`searchParams\` nem \`params\` — não há id de URL para vazar`,
    );
    ok(
      /businessId:\s*estado\.negocioId/.test(codigo),
      `\`${a.caminho}\` tira o negócio do estado da sessão, não de entrada do usuário`,
    );
    ok(
      /profileId:\s*user\.id/.test(codigo),
      `\`${a.caminho}\` passa o \`profileId\` de \`auth.getUser()\`, nunca de formulário`,
    );
  }
}

// ---------------------------------------------------------------- placar

console.log("\n" + "=".repeat(64));
if (falhou === 0) {
  console.log(`TUDO CERTO — ${passou}/${passou} conferências`);
} else {
  console.log(`TEM FALHA — ${passou}/${passou + falhou} conferências`);
  process.exitCode = 1;
}
console.log(
  "\nISTO É TRAVA ESTRUTURAL, NÃO ANÁLISE DE FLUXO. Ele prova que não\n" +
    "existe caminho ÓBVIO de id alheio até a rota sem dono. Um caminho\n" +
    "torto — id que passe por três variáveis e uma função — ele não pega,\n" +
    "e o que pega isso é a revisão de quem mexer no porteiro.\n",
);
