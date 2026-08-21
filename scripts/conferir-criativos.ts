/**
 * Confere a definição de "peça de anúncio" — `lib/criativos/peca.ts`.
 *
 * POR QUE ESTE CONFERIDOR EXISTE. `creatives` guarda quatro coisas na
 * mesma tabela e todas nascem `status = 'draft'`. Uma leitura que filtra
 * só por `status` traz a logo do cliente, e foi assim que a `/aprovar`
 * passou a apresentar a logo dele como o anúncio que a IA montou.
 * Medição em `docs/buraco-aprovar-sem-filtro.md`; desenho do conserto em
 * `docs/lote-leitura-de-peca.md`.
 *
 * TESTA OS DOIS LADOS DE CADA FILTRO, sempre. O alvo importa mais que a
 * asserção aqui: com zero peças de campanha no banco, um teste do conserto
 * passa porque a tela fica VAZIA — e tela vazia não prova filtro certo,
 * prova tabela vazia. Já aconteceu sete vezes neste projeto. Por isso cada
 * seção abaixo tem a linha que TEM que passar e a que TEM que ser barrada.
 *
 * ISTO AQUI É A METADE DE FIXTURE. A outra metade — a mesma definição
 * escrita em SQL — não dá para conferir sem banco, e é o `pnpm medir:peca`
 * que roda ela contra as linhas de verdade. **As duas juntas são a prova;
 * esta sozinha não é.**
 *
 * O §0 é controle negativo: se o próprio mecanismo de asserção não estiver
 * pegando erro, todo o resto abaixo é verde sem valor.
 *
 * Roda com `pnpm conferir:criativos`. Não toca no banco e não precisa de rede.
 */

import {
  COLUNAS_DO_JULGAMENTO,
  USOS,
  USO_DE_ANUNCIO,
  apenasPecasDeAnuncio,
  ehPecaDeAnuncio,
  esperaAprovacao,
  foiReprovada,
  type PecaLida,
} from "../lib/criativos/peca.ts";

let falhas = 0;
let testes = 0;

function ok(condicao: boolean, rotulo: string) {
  testes += 1;
  if (condicao) {
    console.log(`  ok    ${rotulo}`);
  } else {
    falhas += 1;
    console.log(`  FALHA ${rotulo}`);
  }
}

function secao(titulo: string) {
  console.log(`\n${titulo}`);
}

// ---------------------------------------------------------------- fixtures

const ARQUIVADA_EM = "2026-08-19T14:03:54.806+00:00";

/** Linha completa: as três colunas do julgamento sempre presentes. */
function linha(over: Partial<PecaLida> = {}): PecaLida {
  return { uso: "campanha", status: "draft", arquivado_em: null, ...over };
}

// ------------------------------------------------------------------ §0

secao("0. controle negativo — a asserção pega erro quando existe");
{
  const guardaFalhas = falhas;
  const guardaTestes = testes;
  const guardaLog = console.log;
  console.log = () => {};
  ok(1 + 1 === 3, "controle");
  console.log = guardaLog;
  const pegou = falhas === guardaFalhas + 1;
  falhas = guardaFalhas;
  testes = guardaTestes;
  ok(pegou, "o mecanismo de asserção acusa uma condição falsa");
}

// ------------------------------------------------------------------ §1

secao("1. ehPecaDeAnuncio — os dois lados do filtro de `uso`");
{
  ok(
    ehPecaDeAnuncio(linha({ uso: "campanha" })),
    "peça de campanha vigente É peça de anúncio",
  );

  // O LADO QUE FALTAVA NA /aprovar. Cada um dos outros três `uso` do
  // domínio, um por um — não só a logo, porque foi a logo que apareceu
  // desta vez e seria a `referencia` na próxima.
  for (const uso of USOS.filter((u) => u !== USO_DE_ANUNCIO)) {
    ok(
      !ehPecaDeAnuncio(linha({ uso })),
      `\`uso = '${uso}'\` NÃO é peça de anúncio`,
    );
  }

  // `uso` é nullable no banco (0010 pôs default, não NOT NULL). Linha
  // antiga pode ter nulo, e nulo não é "campanha".
  ok(!ehPecaDeAnuncio(linha({ uso: null })), "`uso` nulo NÃO é peça de anúncio");
}

secao("2. ehPecaDeAnuncio — os dois lados do filtro de arquivamento");
{
  ok(
    ehPecaDeAnuncio(linha({ arquivado_em: null })),
    "peça de campanha NÃO arquivada é peça de anúncio",
  );
  ok(
    !ehPecaDeAnuncio(linha({ arquivado_em: ARQUIVADA_EM })),
    "peça de campanha ARQUIVADA não é (0014: deixou de ser o arquivo vigente)",
  );
}

secao("3. esperaAprovacao — o que a /aprovar mostra e o que a cadeia conta");
{
  ok(esperaAprovacao(linha({ status: "draft" })), "peça de campanha `draft` espera aprovação");

  // O CASO EXATO DO BURACO: a logo `9263c465` do negócio V2G, `draft`,
  // não arquivada, `campaign_id` nulo. Era ela que a tela devolvia.
  ok(
    !esperaAprovacao(linha({ uso: "logo", status: "draft" })),
    "a LOGO `draft` do cliente NÃO espera aprovação (era o defeito medido)",
  );
  ok(
    !esperaAprovacao(linha({ status: "draft", arquivado_em: ARQUIVADA_EM })),
    "peça `draft` arquivada não espera aprovação",
  );

  // O outro lado do filtro de `status`: peça de campanha que já andou.
  for (const status of ["pending_review", "approved", "rejected", "paused"]) {
    ok(
      !esperaAprovacao(linha({ status })),
      `peça de campanha \`${status}\` não espera aprovação`,
    );
  }
}

secao("4. esperaAprovacao NÃO olha `campaign_id` — e isso é decisão");
{
  // docs/lote-leitura-de-peca.md §3. Exigir campanha faria a cadeia contar
  // uma peça que a tela esconderia — a mesma divergência, pela ponta
  // oposta. O objeto sem `campaign_id` nem chega ao predicado: ele não
  // está no tipo. Este teste guarda a decisão contra quem "arrumar" isso
  // depois sem ler o porquê.
  const semCampanha = { ...linha(), campaign_id: null } as PecaLida;
  const comCampanha = { ...linha(), campaign_id: "8f0f2f0e-…" } as PecaLida;
  ok(esperaAprovacao(semCampanha), "peça de campanha SEM `campaign_id` espera aprovação");
  ok(esperaAprovacao(comCampanha), "peça de campanha COM `campaign_id` também");
}

secao("5. foiReprovada — o que a /reprovado e a /anuncios contam");
{
  ok(foiReprovada(linha({ status: "rejected" })), "peça de campanha `rejected` foi reprovada");
  ok(
    !foiReprovada(linha({ status: "rejected", arquivado_em: ARQUIVADA_EM })),
    "peça `rejected` ARQUIVADA não conta mais (o que a /anuncios deixava passar)",
  );
  ok(
    !foiReprovada(linha({ uso: "identidade", status: "rejected" })),
    "foto de identidade `rejected` não é anúncio reprovado",
  );
  ok(!foiReprovada(linha({ status: "draft" })), "peça `draft` não foi reprovada");
}

secao("6. coluna que faltou no select estoura, em vez de virar regra inerte");
{
  // Sem tipo gerado do Supabase, `select('id, uso')` devolve linha
  // destipada e `p.arquivado_em` vira `undefined` — que o `?? null`
  // transformaria em "não arquivada". A regra ficaria escrita, correta e
  // sem efeito. Ver lib/criativos/peca.ts e docs/regra-inerte.md.
  const semArquivado = { uso: "campanha", status: "draft" } as PecaLida;
  let estourou = false;
  try {
    ehPecaDeAnuncio(semArquivado);
  } catch {
    estourou = true;
  }
  ok(estourou, "linha sem `arquivado_em` no select estoura");

  const completa = { uso: "campanha", status: "draft", arquivado_em: null };
  let passouLimpo = true;
  try {
    ehPecaDeAnuncio(completa);
  } catch {
    passouLimpo = false;
  }
  ok(passouLimpo, "linha com as três colunas passa sem estourar");

  // E o outro lado: a constante que existe para isso não pode ter perdido
  // uma coluna.
  for (const coluna of ["uso", "status", "arquivado_em"]) {
    ok(
      COLUNAS_DO_JULGAMENTO.includes(coluna),
      `COLUNAS_DO_JULGAMENTO traz \`${coluna}\``,
    );
  }
}

secao("7. a metade SQL aplica os dois filtros, na coluna certa");
{
  // Dublê do builder do PostgREST: guarda o que foi pedido. Não prova que
  // o banco responde certo — isso é o `pnpm medir:peca`. Prova que a
  // metade SQL e os predicados falam da MESMA coluna com o MESMO valor,
  // que é por onde as duas divergiriam em silêncio.
  const pedidos: string[] = [];
  const dubleh = {
    eq(c: string, v: string) {
      pedidos.push(`eq:${c}=${v}`);
      return dubleh;
    },
    is(c: string, v: null) {
      pedidos.push(`is:${c}=${String(v)}`);
      return dubleh;
    },
  };

  apenasPecasDeAnuncio(dubleh);

  ok(pedidos.includes(`eq:uso=${USO_DE_ANUNCIO}`), "pede `uso = 'campanha'` no SQL");
  ok(pedidos.includes("is:arquivado_em=null"), "pede `arquivado_em is null` no SQL");
  ok(pedidos.length === 2, "e não pede mais nada (não exige `campaign_id` — §4)");
  ok(
    apenasPecasDeAnuncio(dubleh) === dubleh,
    "devolve o builder, para o chamador seguir encadeando",
  );
}

console.log(
  `\n${falhas === 0 ? "TUDO CERTO" : `${falhas} FALHA(S)`} — ${testes} conferências`,
);
process.exit(falhas === 0 ? 0 : 1);
