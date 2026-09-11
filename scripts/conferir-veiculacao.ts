/**
 * Confere a FONTE ÚNICA de "no ar" — `lib/veiculacao/estado.ts`.
 *
 *   pnpm conferir:veiculacao
 *
 * ============================================================
 * POR QUE ESTE CONFERIDOR EXISTE.
 *
 * Em 11/09/2026, seis lugares do webapp afirmavam se o anúncio estava no
 * ar, e cada um lia uma fonte diferente. O resultado estava em produção:
 * na conta da V2G, com o anúncio rodado e pausado (`veiculacao:
 * "ja_foi_ao_ar"`, `status_na_plataforma: "PAUSED"`), a `/vendas` dizia
 * "Seu anúncio está no ar" e a `/alertas` dizia "Seus anúncios ainda não
 * estão no ar". Mesma conta, mesmo minuto, respostas opostas — e nenhuma
 * das duas verdadeira.
 *
 * Nenhuma revisão de tela pega isso, porque a contradição não está em
 * nenhuma das duas telas: está ENTRE elas. É por isso que a trava é um
 * conferidor de repositório, e não um teste de componente.
 *
 * A §2 é a que importa a longo prazo: ela lê o código-fonte das telas e
 * reprova quem escrever a própria frase de veiculação. As outras provam
 * que o módulo se comporta; ela impede que alguém o contorne.
 * ============================================================
 *
 * Não toca no banco e não precisa de rede.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  daParaAfirmar,
  ehVeiculacaoConhecida,
  estaNoArAgora,
  esteveNoAr,
  fraseDeVeiculacao,
  houveGastoMedido,
  veiculacaoDoNegocio,
  VEICULACAO_CONHECIDA,
  type ContextoDeFrase,
  type EstadoDeVeiculacao,
} from "../lib/veiculacao/estado.ts";

let falhas = 0;
let testes = 0;

function ok(condicao: boolean, descricao: string) {
  testes += 1;
  if (condicao) {
    console.log(`  ok    ${descricao}`);
  } else {
    falhas += 1;
    console.log(`  FALHA ${descricao}`);
  }
}

function secao(titulo: string) {
  console.log(`\n${titulo}`);
}

const RAIZ = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

/**
 * Tira comentários de linha e de bloco — inclusive os blocos `{/* … *\/}`
 * do JSX. O que sobra é, aproximadamente, o que o cliente lê.
 *
 * NO ESCOPO DO MÓDULO porque duas seções precisam dela: a §2, que procura
 * frase de veiculação em tela, e a §5, que procura o `"BRL"` literal. As
 * duas isentam comentário pelo mesmo motivo — os arquivos deste lote
 * explicam a regra citando o texto antigo, e um conferidor que proíba
 * explicar a si mesmo ensina a não comentar.
 */
function semComentarios(fonte: string): string {
  return fonte
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/.*/g, "$1 ");
}

const TODOS: EstadoDeVeiculacao[] = [
  "no_ar",
  "ja_foi_ao_ar",
  "nunca_foi_ao_ar",
  "nao_sabemos",
];
const CONTEXTOS: ContextoDeFrase[] = ["manchete", "apoio", "selo"];

// ---------------------------------------------------------------------

secao("0. linha de base — o mecanismo de asserção está pegando erro?");
{
  // Controle negativo. Sem ele, todo verde abaixo é verde sem valor.
  const antes = falhas;
  testes += 1;
  if (false) console.log("inalcançável");
  else falhas += 1;
  const pegou = falhas === antes + 1;
  falhas = antes;
  testes -= 1;
  ok(pegou, "o contador de falhas reage a uma asserção falsa");
}

secao("1. a resolução — precedência, e o que cada sinal pode concluir");
{
  const gastou = { temDadoDaPlataforma: true, investiuCentavos: 1025 };
  const semGasto = { temDadoDaPlataforma: true, investiuCentavos: 0 };

  // ---- o backend manda, quando se faz entender ----
  ok(
    veiculacaoDoNegocio({ veiculacao: "no_ar" }) === "no_ar",
    "`no_ar` do backend vira `no_ar`",
  );
  ok(
    veiculacaoDoNegocio({ veiculacao: "ja_foi_ao_ar" }) === "ja_foi_ao_ar",
    "`ja_foi_ao_ar` do backend vira `ja_foi_ao_ar`",
  );
  ok(
    veiculacaoDoNegocio({ veiculacao: "sem_evidencia" }) === "nunca_foi_ao_ar",
    "`sem_evidencia` sem gasto vira `nunca_foi_ao_ar`",
  );

  // ============================================================
  // O CASO MEDIDO NA V2G, E É O QUE O LOTE INTEIRO EXISTE PARA CONSERTAR.
  //
  // `veiculacao: "ja_foi_ao_ar"` com `status_na_plataforma: "PAUSED"` e
  // R$ 10,25 gastos. A resposta certa é "já foi ao ar" — jamais "no ar".
  // ============================================================
  ok(
    veiculacaoDoNegocio({ veiculacao: "ja_foi_ao_ar", gasto: gastou }) === "ja_foi_ao_ar",
    "A CONTA DA V2G: pausada com gasto → `ja_foi_ao_ar`, e NUNCA `no_ar`",
  );

  // ---- o gasto é reserva, e SÓ prova o passado ----
  ok(
    veiculacaoDoNegocio({ veiculacao: "sem_evidencia", gasto: gastou }) === "ja_foi_ao_ar",
    "gasto medido vence `sem_evidencia` — o Facebook não cobra por anúncio que não rodou",
  );
  ok(
    veiculacaoDoNegocio({ veiculacao: null, gasto: gastou }) === "ja_foi_ao_ar",
    "e vale também quando o campo não veio",
  );
  ok(
    veiculacaoDoNegocio({ veiculacao: null, gasto: semGasto }) === "nunca_foi_ao_ar",
    "sem execução e sem gasto: `nunca_foi_ao_ar` — 404 daquela rota é resposta",
  );

  // ============================================================
  // O GASTO NUNCA DEVOLVE `no_ar`. É O LIMITE QUE IMPORTA.
  //
  // Dinheiro gasto é passado. Deixar o gasto concluir "está no ar" foi
  // exatamente como a cadeia passou a ler como concluída a etapa "O
  // anúncio no ar" de um anúncio que a Meta mantinha em `PAUSED`.
  // ============================================================
  const porGasto = TODOS.filter(
    (e) =>
      veiculacaoDoNegocio({ veiculacao: "sem_evidencia", gasto: gastou }) === e ||
      veiculacaoDoNegocio({ veiculacao: null, gasto: gastou }) === e,
  );
  ok(
    !porGasto.includes("no_ar"),
    "NENHUM caminho pelo gasto devolve `no_ar` — gasto é passado, nunca presente",
  );

  // ---- não saber é um estado, e ele se declara ----
  ok(
    veiculacaoDoNegocio({ veiculacao: null, execucaoIlegivel: true }) === "nao_sabemos",
    "leitura ilegível vira `nao_sabemos`, e não `nunca_foi_ao_ar`",
  );
  ok(
    veiculacaoDoNegocio({ veiculacao: "sem_evidencia", execucaoIlegivel: true }) ===
      "nao_sabemos",
    "  e nem `sem_evidencia` salva uma leitura que falhou",
  );

  // ============================================================
  // VALOR NOVO DO BACKEND NÃO VIRA "NO AR". NUNCA.
  //
  // O `openapi.json` declara `veiculacao` como `string` sem enum, então
  // um valor novo é questão de tempo. A resposta segura é `nao_sabemos`:
  // errar para "não afirmo" custa uma linha vaga; errar para "no ar"
  // custa o cliente lendo que o anúncio dele está rodando quando não está.
  // ============================================================
  for (const novo of ["pausada_pelo_gestor", "encerrada", "NO_AR", "", "no ar"]) {
    ok(
      veiculacaoDoNegocio({ veiculacao: novo }) === "nao_sabemos",
      `valor desconhecido ${JSON.stringify(novo)} → \`nao_sabemos\``,
    );
  }
  ok(
    veiculacaoDoNegocio({ veiculacao: "vocabulario_novo", gasto: gastou }) === "ja_foi_ao_ar",
    "  mas com gasto na mão, o extrato ainda prova o passado",
  );

  // ---- o gasto medido: os dois lados, nunca um só ----
  ok(!houveGastoMedido(null), "sem consolidado não há gasto medido");
  ok(
    !houveGastoMedido({ temDadoDaPlataforma: false, investiuCentavos: 1025 }),
    "sem dado da plataforma, o número sozinho não prova",
  );
  ok(!houveGastoMedido(semGasto), "com dado e zero investido, não há");
  ok(houveGastoMedido(gastou), "os dois lados juntos: há");
}

secao("2. NENHUMA TELA ESCREVE A PRÓPRIA FRASE DE VEICULAÇÃO");
{
  // ============================================================
  // A TRAVA CENTRAL DO LOTE, E A RAZÃO DE ELA SER POR LEITURA DE CÓDIGO.
  //
  // O que se quer impedir não é um bug: é uma tela voltar a ter razão
  // sozinha. Alguém acrescenta uma frase boa, na tela certa, revisa e
  // aprova — e o app volta a se contradizer entre duas telas que ninguém
  // lê lado a lado.
  //
  // Procura afirmação de veiculação em texto de tela. Comentário é
  // ISENTO de propósito: os arquivos deste lote explicam a regra citando
  // as frases antigas, e um conferidor que proíba explicar a si mesmo
  // ensina a não comentar.
  // ============================================================
  const ALVOS = ["app", "components"];

  /** Frase de veiculação em conteúdo de tela. */
  const PROIBIDO: { padrao: RegExp; diz: string }[] = [
    { padrao: /(está|estão|segue|seguem)\s+no\s+ar/i, diz: "afirma que ESTÁ no ar" },
    { padrao: /(não\s+est(á|ão))\s+no\s+ar/i, diz: "afirma que NÃO está no ar" },
    { padrao: /ainda\s+não\s+foi\s+ao\s+ar/i, diz: "afirma que não foi ao ar" },
    { padrao: /campanha\s+(está\s+)?rodando/i, diz: "afirma que a campanha roda" },
    { padrao: /anúncios?\s+rodando/i, diz: "afirma que o anúncio roda" },
  ];

  function arquivos(dir: string): string[] {
    const saida: string[] = [];
    for (const nome of readdirSync(dir)) {
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) {
        saida.push(...arquivos(caminho));
      } else if (/\.tsx?$/.test(nome)) {
        saida.push(caminho);
      }
    }
    return saida;
  }

  const encontrados: string[] = [];
  for (const alvo of ALVOS) {
    const dir = join(RAIZ, alvo);
    for (const caminho of arquivos(dir)) {
      const rel = relative(RAIZ, caminho).replace(/\\/g, "/");
      // A própria fonte única pode — é ela quem escreve as frases.
      if (rel.startsWith("lib/veiculacao/")) continue;
      const texto = semComentarios(readFileSync(caminho, "utf8"));
      for (const { padrao, diz } of PROIBIDO) {
        const achado = texto.match(padrao);
        if (achado) encontrados.push(`${rel} — ${diz}: "${achado[0]}"`);
      }
    }
  }

  ok(
    encontrados.length === 0,
    encontrados.length === 0
      ? "nenhuma tela escreve frase de veiculação — todas pedem ao módulo"
      : `${encontrados.length} tela(s) escrevendo a própria frase:\n        ${encontrados.join("\n        ")}`,
  );

  // ============================================================
  // E NINGUÉM DEDUZ VEICULAÇÃO DE `campaigns.published_at`.
  //
  // Era a fonte da `/alertas` e da `/reprovado`, e a tabela tem ZERO
  // linhas — o predicado era `false` para todo mundo, para sempre.
  // ============================================================
  const porPublishedAt: string[] = [];
  for (const alvo of ALVOS) {
    for (const caminho of arquivos(join(RAIZ, alvo))) {
      const rel = relative(RAIZ, caminho).replace(/\\/g, "/");
      const texto = semComentarios(readFileSync(caminho, "utf8"));
      if (/published_at/.test(texto)) porPublishedAt.push(rel);
    }
  }
  ok(
    porPublishedAt.length === 0,
    porPublishedAt.length === 0
      ? "nenhuma tela lê `published_at` — a tabela está vazia e a fonte é outra"
      : `telas ainda lendo \`published_at\`: ${porPublishedAt.join(", ")}`,
  );
}

secao("3. o banco de frases — os quatro estados, em todo contexto");
{
  for (const contexto of CONTEXTOS) {
    for (const estado of TODOS) {
      const frase = fraseDeVeiculacao(estado, contexto);
      ok(
        typeof frase === "string" && frase.trim().length > 0,
        `${contexto}/${estado} tem frase: "${frase}"`,
      );
    }
  }

  // ============================================================
  // O TEMPO VERBAL É O CONTEÚDO — e cada estado se afirma explicitamente.
  //
  // A primeira versão deste bloco procurava a expressão "está no ar" com
  // uma lookbehind de negação. Não funciona, e o motivo vale registrar:
  // das quatro manchetes, DUAS contêm a expressão sem afirmá-la —
  // "já rodou e **não está no ar** agora" nega, e "não conseguimos
  // conferir se seu anúncio **está no ar**" subordina. Separar afirmação
  // de menção por regex exigiria analisar a oração, e um conferidor que
  // erra assim empurra quem escreve a frase para sinônimos piores só
  // para passar.
  //
  // As quatro frases são uma TABELA revisada, não texto gerado. Então o
  // teste diz, por extenso, o que cada uma tem que dizer. Trocar a frase
  // passa a exigir trocar a asserção — que é o pedágio certo para mexer
  // no texto que todo cliente lê em toda tela.
  // ============================================================
  ok(
    /seu anúncio está no ar/i.test(fraseDeVeiculacao("no_ar", "manchete")),
    "`no_ar` afirma, no presente",
  );
  ok(
    /já rodou/i.test(fraseDeVeiculacao("ja_foi_ao_ar", "manchete")) &&
      /não está no ar/i.test(fraseDeVeiculacao("ja_foi_ao_ar", "manchete")),
    "`ja_foi_ao_ar` diz que já rodou E que não está no ar — o passado, e a negação do presente",
  );
  ok(
    /ainda não foi ao ar/i.test(fraseDeVeiculacao("nunca_foi_ao_ar", "manchete")),
    "`nunca_foi_ao_ar` nega o passado inteiro",
  );
  ok(
    /não consegui/i.test(fraseDeVeiculacao("nao_sabemos", "manchete")),
    "`nao_sabemos` admite a falha de leitura em vez de escolher um lado",
  );

  // ============================================================
  // E A TRAVA QUE IMPORTA: SÓ `no_ar` PODE AFIRMAR SEM RESSALVA.
  //
  // Toda manchete que cite o ar sem ser `no_ar` tem que carregar uma
  // negação ou uma ressalva na mesma frase. É o teste que pega a
  // regressão real — alguém "simplificando" a frase do pausado para
  // "Seu anúncio está no ar (pausado)".
  // ============================================================
  for (const outro of ["ja_foi_ao_ar", "nunca_foi_ao_ar", "nao_sabemos"] as const) {
    const f = fraseDeVeiculacao(outro, "manchete");
    ok(
      !/no ar/i.test(f) || /não/i.test(f),
      `  \`${outro}\` não cita o ar sem negar ou ressalvar: "${f}"`,
    );
  }

  // ---- as quatro frases são DISTINTAS, em todo contexto ----
  for (const contexto of CONTEXTOS) {
    const frases = TODOS.map((e) => fraseDeVeiculacao(e, contexto));
    ok(
      new Set(frases).size === TODOS.length,
      `as quatro frases de ${contexto} são distintas entre si`,
    );
  }

  // ============================================================
  // AS REGRAS DE PRODUTO, NAS FRASES. `docs/` e o CLAUDE.md.
  //
  // Jargão de tráfego, promessa de prazo e diminutivo. A frase de
  // veiculação é lida por todo cliente em toda tela — é o texto do
  // produto com mais alcance, e o que menos alguém revisa depois.
  // ============================================================
  for (const contexto of CONTEXTOS) {
    for (const estado of TODOS) {
      const f = fraseDeVeiculacao(estado, contexto);
      ok(
        !/CTR|ROAS|CPM|impress|creative|campaign|status|payload/i.test(f),
        `${contexto}/${estado} sem jargão nem nome de campo`,
      );
      ok(!/grátis/i.test(f), `${contexto}/${estado} não usa a palavra proibida`);
      ok(
        !/\b\d+\s*(horas?|dias?|minutos?)\b/i.test(f),
        `${contexto}/${estado} não promete prazo`,
      );
      ok(!/inha\b|inho\b|relaxa/i.test(f), `${contexto}/${estado} sem diminutivo`);
    }
  }

  // O selo é curto — ele mora dentro de uma pílula.
  for (const estado of TODOS) {
    const selo = fraseDeVeiculacao(estado, "selo");
    ok(selo.length <= 20, `o selo de ${estado} cabe na pílula: "${selo}" (${selo.length})`);
  }
}

secao("4. os predicados, e o que o card da campanha NÃO mostra");
{
  ok(esteveNoAr("no_ar") && esteveNoAr("ja_foi_ao_ar"), "`esteveNoAr` cobre os dois");
  ok(
    !esteveNoAr("nunca_foi_ao_ar") && !esteveNoAr("nao_sabemos"),
    "  e `nao_sabemos` responde `false` — não saber não é prova",
  );
  ok(estaNoArAgora("no_ar"), "`estaNoArAgora` só aceita o presente");
  ok(
    !estaNoArAgora("ja_foi_ao_ar"),
    "  e recusa o pausado, que é a distinção que não existia",
  );
  ok(
    TODOS.filter((e) => daParaAfirmar(e)).length === 3,
    "`daParaAfirmar` separa os três afirmáveis do `nao_sabemos`",
  );

  ok(
    VEICULACAO_CONHECIDA.every((v) => ehVeiculacaoConhecida(v)),
    "o vocabulário declarado se reconhece",
  );
  ok(
    !ehVeiculacaoConhecida("qualquer_outro") && !ehVeiculacaoConhecida(null),
    "  e o que não está nele, não",
  );

  // ============================================================
  // ITEM B2 — O CARD DA CAMPANHA NÃO MOSTRA VENDA DO DONO.
  //
  // Medido em 11/09/2026: a execução 98447192 nunca foi ao ar e carrega
  // `vendas: 22` e `voltou_centavos: 120000`; a aed42ce7, a única com
  // dado de plataforma, tem os dois nulos. O lado do dono é do NEGÓCIO —
  // pendurado no card, dizia que uma campanha que não rodou trouxe
  // R$ 1.200,00.
  //
  // A trava é de TIPO, e por isso é lida do arquivo: `BlocoDeMoeda` é o
  // bloco por execução, e os dois campos não podem voltar para ele.
  // ============================================================
  const tipos = readFileSync(join(RAIZ, "lib/resultado/tipos.ts"), "utf8");
  const corpoDoBloco =
    tipos.match(/export interface BlocoDeMoeda \{([\s\S]*?)\n\}/)?.[1] ?? "";
  ok(corpoDoBloco.length > 0, "achei a interface `BlocoDeMoeda`");
  ok(
    !/^\s*vendas\s*:/m.test(corpoDoBloco),
    "`BlocoDeMoeda` NÃO tem `vendas` — a resposta do dono não é por campanha",
  );
  ok(
    !/^\s*voltou\s*:/m.test(corpoDoBloco),
    "`BlocoDeMoeda` NÃO tem `voltou` — idem",
  );
  ok(
    /export interface RespostaDoDono/.test(tipos),
    "e existe `RespostaDoDono`, no nível do negócio, para eles morarem",
  );

  const anuncios = readFileSync(join(RAIZ, "app/(protected)/anuncios/page.tsx"), "utf8");
  ok(
    !/bloco\.vendas|bloco\.voltou/.test(anuncios),
    "a `/anuncios` não lê venda nem retorno do bloco da campanha",
  );
  ok(
    /doDono/.test(anuncios),
    "  ela lê `doDono`, que é do negócio",
  );
}

secao("5. B4 — dinheiro com moeda, pela função de formato");
{
  // ============================================================
  // O CAMPO DE RECEITA ERA A ÚNICA SUPERFÍCIE DE DINHEIRO SEM MOEDA.
  //
  // `placeholder="Ex: 1.600,00"` escrito à mão, e o valor saindo de
  // `centavosNoCampo` seco. Num campo a omissão pesa mais que numa
  // leitura: o dono digita o número que vira `voltou_centavos` no banco.
  // ============================================================
  const pd = readFileSync(join(RAIZ, "app/(protected)/inicio/PerguntaDoDia.tsx"), "utf8");
  ok(
    !/placeholder="Ex: 1\.600,00"/.test(pd),
    "o placeholder do campo de receita não é mais literal",
  );
  ok(
    /simboloDaMoeda\(/.test(pd),
    "o campo mostra o símbolo da moeda, vindo da função de formato",
  );
  // Fora de comentário: o bloco que explica a mudança cita o literal
  // antigo de propósito, e proibir a explicação ensina a não comentar.
  const pdCodigo = semComentarios(pd);
  ok(
    !/"BRL"/.test(pdCodigo),
    "e o `\"BRL\"` literal saiu do código — virou `MOEDA_DA_RESPOSTA`, achável por grep",
  );

  const pergunta = readFileSync(join(RAIZ, "lib/dia-seguinte/pergunta.ts"), "utf8");
  ok(
    /export const MOEDA_DA_RESPOSTA/.test(pergunta),
    "a suposição de moeda está declarada num lugar só",
  );
}

console.log(
  `\n${falhas === 0 ? "TUDO CERTO" : `${falhas} FALHA(S)`} — ${testes} conferências`,
);
process.exit(falhas === 0 ? 0 : 1);
