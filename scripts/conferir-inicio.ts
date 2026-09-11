/**
 * A tela do Início — `pnpm conferir:inicio`
 *
 * ============================================================
 * ESTE CONFERIDOR NASCEU DE UM RETÂNGULO VAZIO EM PRODUÇÃO.
 *
 * Item #1 do QA de 11/09/2026: a `/inicio` mostrou o cabeçalho "Onde seu
 * anúncio está", o contador **"0 de 0 etapas"** e um `<ol>` sem um único
 * `<li>`. Uma borda com nada dentro, na primeira tela do produto.
 *
 * A causa não estava na tela. As seis etapas de `montarEtapas()` são
 * fixas — nenhuma entrada honesta devolve zero. Quem devolvia era a
 * constante `VAZIO` de `lib/estado/cliente.ts`, que tinha `etapas: []` e
 * era retornada por três caminhos diferentes.
 *
 * A FAMÍLIA do defeito é maior que a trilha, e é o que este arquivo
 * confere: **título de seção sem itens embaixo** (item B7). São o mesmo
 * erro — uma seção que afirma ter conteúdo e não tem. A lista vazia é a
 * versão com borda; o título órfão é a versão sem.
 * ============================================================
 *
 * Puro: não toca rede, banco, nem navegador.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import {
  ETAPAS_NAS_FASES,
  fasesDaCadeia,
  montarEtapas,
  type Etapa,
  type IdDeEtapa,
  type MedidaDoCliente,
} from "../lib/estado/frases.ts";
import type { ResumoDePendencias } from "../lib/cadastro/pendencias.ts";

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

const CADASTRO_VAZIO: ResumoDePendencias = {
  vazio: false,
  titulo: "t",
  corpo: "c",
  acao: null,
  nossaDivida: false,
  itens: [],
  quantosNaoSei: 0,
};

const CADASTRO_FECHADO: ResumoDePendencias = { ...CADASTRO_VAZIO, vazio: true, acao: null };

function medida(over: Partial<MedidaDoCliente> = {}): MedidaDoCliente {
  return {
    temNegocio: false,
    cadastro: CADASTRO_VAZIO,
    conexaoAtiva: false,
    cadastroEnviadoEm: null,
    execucao: null,
    pecasProntas: 0,
    pecasParaAprovar: 0,
    campanhaCriadaEm: null,
    publicacaoFalhou: false,
    publicadaEm: null,
    temNumero: false,
    execucaoDoBackend: null,
    execucaoIlegivel: false,
    veiculacao: "nao_sabemos",
    ...over,
  };
}

const AGORA = new Date("2026-09-11T15:00:00Z");

console.log("\nA tela do Início\n" + "=".repeat(64));

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
secao("1. NENHUMA entrada gera cadeia vazia — o item #1 do QA");
{
  const casos: [string, MedidaDoCliente][] = [
    ["tudo falso, o caso da conta sem negócio", medida()],
    ["negócio recém-criado", medida({ temNegocio: true })],
    ["cadastro fechado, sem conexão", medida({ temNegocio: true, cadastro: CADASTRO_FECHADO })],
    [
      "conectado e com peça",
      medida({ temNegocio: true, cadastro: CADASTRO_FECHADO, conexaoAtiva: true, pecasProntas: 2 }),
    ],
    [
      "tudo fechado, com número",
      medida({
        temNegocio: true,
        cadastro: CADASTRO_FECHADO,
        conexaoAtiva: true,
        pecasProntas: 2,
        publicadaEm: "2026-09-01T00:00:00Z",
        temNumero: true,
        veiculacao: "ja_foi_ao_ar",
      }),
    ],
    ["execução ilegível", medida({ temNegocio: true, execucaoIlegivel: true })],
  ];

  for (const [nome, m] of casos) {
    const etapas = montarEtapas(m, AGORA);
    ok(etapas.length === 6, `${nome}: seis etapas, não zero`);
    ok(
      etapas.every((e) => e.nome.trim().length > 0),
      `${nome}: e nenhuma delas sem nome`,
    );
  }
}

// ------------------------------------------------------------------
secao("2. a fonte não tem mais o literal que causou o defeito");
{
  const cliente = fonte("lib/estado/cliente.ts");
  ok(
    !/etapas:\s*\[\s*\]/.test(cliente),
    "`lib/estado/cliente.ts` não devolve `etapas: []` em lugar nenhum",
  );
  ok(
    /montarEtapas\(/.test(cliente),
    "  e o caminho sem negócio passa por `montarEtapas`, como todos os outros",
  );
}

// ------------------------------------------------------------------
secao("3. as quatro fases cobrem as seis etapas — partição total e disjunta");
{
  const TODAS: IdDeEtapa[] = ["cadastro", "conexao", "peca", "aprovacao", "no_ar", "numeros"];

  ok(ETAPAS_NAS_FASES.length === 6, "as fases cobrem seis etapas ao todo");
  ok(new Set(ETAPAS_NAS_FASES).size === 6, "  e nenhuma aparece em duas fases");
  for (const id of TODAS) {
    ok(ETAPAS_NAS_FASES.includes(id), `  \`${id}\` pertence a alguma fase`);
  }

  // A ponta que importa: agrupar não pode PERDER etapa. Se alguém
  // acrescentar um degrau à cadeia e esquecer da partição, é aqui que
  // aparece — e não numa tela em que o cliente conta quatro e a lista
  // mostra sete.
  const etapas = montarEtapas(medida({ temNegocio: true }), AGORA);
  const idsDaCadeia = etapas.map((e) => e.id).sort();
  const idsDasFases = [...ETAPAS_NAS_FASES].sort();
  ok(
    JSON.stringify(idsDaCadeia) === JSON.stringify(idsDasFases),
    "a partição bate EXATAMENTE com a cadeia que `montarEtapas` devolve",
  );
}

// ------------------------------------------------------------------
secao("4. `fasesDaCadeia` — quatro sempre, e o estado certo");
{
  const abertas = montarEtapas(medida({ temNegocio: true }), AGORA);
  const primeira = abertas.find((e) => !e.concluida) ?? null;
  const fases = fasesDaCadeia(abertas, primeira);

  ok(fases.length === 4, "quatro fases");
  ok(
    fases.filter((f) => f.estado === "atual").length <= 1,
    "no máximo uma fase é a atual — duas seriam dois 'você está aqui'",
  );
  ok(
    fases.every((f) => f.rotulo.trim().length > 0),
    "toda fase tem rótulo",
  );

  // A PROIBIÇÃO DE PRAZO, na fase travada. O wireframe escreve "Em
  // breve"; o plano proíbe promessa de prazo sem lastro, e a conta da
  // V2G ficou dezessete dias na mesma etapa.
  ok(
    fases.every((f) => !/em breve|logo|alguns dias|minutos/i.test(f.rotulo)),
    "nenhum rótulo de fase promete prazo",
  );

  // Cadeia inteira fechada: sem atual, ninguém fica 'travada' por engano.
  const fechadas: Etapa[] = abertas.map((e) => ({ ...e, concluida: true }));
  const todas = fasesDaCadeia(fechadas, null);
  ok(
    todas.every((f) => f.estado === "feita"),
    "com a cadeia fechada e `atual` nulo, as quatro saem como feitas",
  );
}

// ------------------------------------------------------------------
secao("5. B7 — seção sem item não renderiza título");
{
  const inicio = fonte("app/(protected)/inicio/page.tsx");

  // A lista de campanhas é o caso medido: ela ganhava cabeçalho e link
  // "Ver todas" com zero linhas embaixo.
  const temMapa = /campanhasNoAr\.map\(/.test(inicio);
  ok(temMapa, "a `/inicio` ainda renderiza a lista de campanhas (se não, revise esta regra)");
  ok(
    /campanhasNoAr\.length\s*>\s*0/.test(inicio),
    "e ela está guardada por `campanhasNoAr.length > 0`",
  );

  // O bloco do dono já era guardado; a trava existe para não deixar de ser.
  ok(
    /donoRespondeu\s*&&/.test(inicio),
    "o bloco 'O que você me contou' só sai quando o dono respondeu",
  );
}

// ------------------------------------------------------------------
secao("6. o portão das fixtures — o que prova que elas não vazam");
{
  const fixture = "lib/dev/fixtures-inicio.ts";
  const inicio = fonte("app/(protected)/inicio/page.tsx");

  ok(
    /await import\("@\/lib\/dev\/fixtures-inicio"\)/.test(inicio),
    "a `/inicio` alcança a fixture só por `await import()` — nunca no topo",
  );
  ok(
    !/^\s*import .*fixtures-inicio/m.test(inicio),
    "  e não há import estático dela em lugar nenhum do arquivo",
  );
  ok(
    /process\.env\.NODE_ENV !== "production"/.test(inicio),
    "o primeiro trinco está escrito: `NODE_ENV !== \"production\"`",
  );
  ok(
    /process\.env\.V2G_FIXTURE_INICIO/.test(inicio),
    "  e o segundo: `V2G_FIXTURE_INICIO`",
  );

  // Ninguém MAIS pode importar a fixture — nem de forma dinâmica. O dia
  // em que um segundo arquivo a alcançar, o portão passa a ter duas
  // portas e só uma delas está conferida aqui.
  const alcancam = ["app", "lib", "components"]
    .flatMap((dir) => listarTs(dir))
    .filter((f) => f !== fixture && f !== "app/(protected)/inicio/page.tsx")
    .filter((f) => /fixtures-inicio/.test(fonte(f)));
  ok(
    alcancam.length === 0,
    `só a \`/inicio\` alcança a fixture (achei: ${alcancam.join(", ") || "nenhum outro"})`,
  );

  const modulo = fonte(fixture);
  ok(
    /FIXTURE_SO_DE_DESENVOLVIMENTO_V2G/.test(modulo),
    "a sentinela está no módulo — é ela que o `grep` no `.next/` procura",
  );
}

function listarTs(dir: string): string[] {
  const saida: string[] = [];
  const andar = (d: string) => {
    for (const nome of readdirSync(d)) {
      const caminho = `${d}/${nome}`;
      if (statSync(caminho).isDirectory()) andar(caminho);
      else if (/\.tsx?$/.test(nome)) saida.push(caminho);
    }
  };
  andar(dir);
  return saida;
}

console.log("\n" + "=".repeat(64));
if (falhou === 0) {
  console.log(`TUDO CERTO — ${passou}/${passou} conferências`);
} else {
  console.log(`TEM FALHA — ${passou}/${passou + falhou} conferências`);
  process.exitCode = 1;
}
console.log(
  "\nO QUE ISTO NÃO PEGA: seção vazia escrita de um jeito novo. As regras\n" +
    "da §5 citam os dois blocos que existem hoje, pelo nome. Um terceiro\n" +
    "bloco com título e lista vazia passa batido — é trava de regressão,\n" +
    "não análise de layout.\n",
);
