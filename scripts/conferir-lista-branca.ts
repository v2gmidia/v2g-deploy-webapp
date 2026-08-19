/**
 * Acusa divergência entre o catálogo de campos e as listas brancas do banco.
 *
 *   node scripts/conferir-lista-branca.ts
 *
 * POR QUE ESTE ARQUIVO EXISTE. A `confirmar_campo_do_cliente` (0015) valida
 * o nome da coluna contra uma lista branca escrita em SQL, e ela precisa
 * disso: conferir só que a coluna existe aceitaria `profile_id`, e um POST
 * forjado daria o negócio para outra pessoa. Mas uma lista branca em SQL é
 * uma cópia — e cópia envelhece. Aconteceu na primeira oportunidade: a 0015
 * foi escrita contra `lib/agentes/campos.ts` como ele era naquele dia, o
 * bloco 2 do onboarding acrescentou `target_profit_per_customer` ao
 * catálogo, e a 0016 existiu só para alcançar. A própria 0015 pede por
 * escrito ("Campo novo no catálogo entra aqui também, e por migration") — e
 * um pedido por escrito é exatamente o que ninguém lê na pressa.
 *
 * O QUE ELE COMPARA, e o que NÃO compara: o catálogo em TypeScript contra o
 * SQL das MIGRATIONS. Ele **não lê o banco**. A pergunta que ele responde é
 * "alguém acrescentou campo ao catálogo e esqueceu a migration?", que é a
 * divergência que acontece de verdade. Se a migration existe mas não foi
 * aplicada, quem acusa é `supabase_migrations.schema_migrations`, não isto.
 */

import { readFileSync, readdirSync } from "node:fs";
import { CAMPOS } from "../lib/agentes/campos.ts";

const DIR = "supabase/migrations";

/** A definição mais recente de uma função, entre todas as migrations. */
function ultimaDefinicao(funcao: string): { arquivo: string; sql: string } {
  const candidatos = readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .reverse();
  for (const arquivo of candidatos) {
    const sql = readFileSync(`${DIR}/${arquivo}`, "utf8");
    if (sql.includes(`function public.${funcao}(`)) return { arquivo, sql };
  }
  throw new Error(`nenhuma migration define ${funcao}`);
}

/**
 * Os literais de um `array[...]`, a partir de uma âncora.
 *
 * Comentários `--` são removidos ANTES de extrair. Sem isso, um campo
 * citado dentro de um comentário entraria na lista como se fosse permitido
 * — e o conferidor passaria a aprovar por causa de uma frase.
 */
function literaisDoArray(sql: string, ancora: string): string[] {
  const inicio = sql.indexOf(ancora);
  if (inicio < 0) throw new Error(`âncora não encontrada: ${ancora}`);
  // O `[` é o ÚLTIMO caractere da âncora, e não "o próximo `[` depois
  // dela". Procurar o próximo achava o `[` de `text[]` na declaração
  // `v_permitidos text[] := array[`, o `]` logo em seguida, e devolvia
  // lista vazia — que fez a checagem 4 passar por vacuidade. Foi o
  // controle negativo da §5 que acusou.
  const abre = inicio + ancora.length - 1;
  const fecha = sql.indexOf("]", abre);
  const corpo = sql
    .slice(abre + 1, fecha)
    .split("\n")
    .map((l) => l.replace(/--.*$/, ""))
    .join("\n");
  return [...corpo.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]!);
}

let falhas = 0;
const ok = (m: string) => console.log(`  ok    ${m}`);
const nok = (m: string) => {
  falhas++;
  console.log(`  FALHA ${m}`);
};

// ---------------------------------------------------------------- as listas

// `: string[]` explícito, e ele passou a ser necessário: `CAMPOS` virou
// `as const satisfies readonly Campo[]` para que a exaustividade de
// `lib/perfil/catalogo-cliente.ts` seja erro de compilação. Com isso
// `c.campo` é união de literais, e `catalogo.includes(<string>)` da checagem
// 2 e o campo inventado da checagem 5 deixariam de compilar — o controle
// negativo depende justamente de comparar com algo que NÃO está na união.
const catalogo: string[] = CAMPOS.filter((c) => c.tabela === "businesses").map((c) => c.campo);

const confirmar = ultimaDefinicao("confirmar_campo_do_cliente");
const permitidos = literaisDoArray(confirmar.sql, "when 'businesses' then array[");

const esvaziar = ultimaDefinicao("esvaziar_campos_do_cliente");
const apagaveis = literaisDoArray(esvaziar.sql, "v_permitidos text[] := array[");

// NENHUMA lista pode chegar vazia. Uma lista vazia faz as comparações
// abaixo passarem sem comparar nada: conjunto vazio é subconjunto de tudo,
// e "não achei divergência" viraria "está em dia". Foi o que aconteceu na
// primeira execução deste arquivo.
for (const [nome, lista] of [
  ["catálogo", catalogo],
  ["confirmar_campo_do_cliente", permitidos],
  ["esvaziar_campos_do_cliente", apagaveis],
] as const) {
  if (lista.length === 0) {
    console.error(`a lista "${nome}" veio VAZIA — o conferidor não conseguiu ler, e sem`);
    console.error("ela nenhuma comparação abaixo significa alguma coisa. Corrija a leitura.");
    process.exit(2);
  }
}

console.log(`catálogo (lib/agentes/campos.ts, tabela businesses): ${catalogo.length} campos`);
console.log(`confirmar_campo_do_cliente  (${confirmar.arquivo}): ${permitidos.length}`);
console.log(`esvaziar_campos_do_cliente  (${esvaziar.arquivo}): ${apagaveis.length}\n`);

// --- 1. todo campo do catálogo é gravável
console.log("1. o catálogo cabe na lista branca");
const orfaos = catalogo.filter((c) => !permitidos.includes(c));
if (orfaos.length) {
  nok(`no catálogo e FORA da lista branca: ${orfaos.join(", ")}`);
  console.log(`       → acrescente em ${DIR}/ numa migration nova, como a 0016 fez`);
} else {
  ok(`os ${catalogo.length} campos do catálogo estão na lista branca`);
}

// --- 2. os extras são conhecidos e justificados
console.log("\n2. o que a lista branca tem a mais");
const EXTRAS_ESPERADOS = ["radius_km"];
const extras = permitidos.filter((p) => !catalogo.includes(p));
const inesperados = extras.filter((e) => !EXTRAS_ESPERADOS.includes(e));
if (inesperados.length) {
  nok(`na lista branca sem estar no catálogo nem na lista de exceções: ${inesperados.join(", ")}`);
  console.log("       → ou entra no catálogo, ou entra em EXTRAS_ESPERADOS com o motivo");
} else {
  ok(`extras conhecidos: ${extras.join(", ") || "nenhum"} (vêm do formulário da /conta)`);
}

// --- 3. o que NUNCA pode estar em lista nenhuma
console.log("\n3. as colunas que nenhuma lista aceita");
const PROIBIDOS = ["id", "profile_id", "claim_email", "short_id", "procedencia", "onboarding", "dados_ficticios"];
const vazados = [...new Set([...permitidos, ...apagaveis])].filter((c) => PROIBIDOS.includes(c));
if (vazados.length) nok(`coluna de controle numa lista branca: ${vazados.join(", ")}`);
else ok("nenhuma coluna de identidade ou de controle nas listas");

// --- 4. esvaziar é mais restrito que confirmar
console.log("\n4. esvaziar ⊆ confirmar");
const soApagavel = apagaveis.filter((a) => !permitidos.includes(a));
if (soApagavel.length) {
  nok(`dá para apagar mas não para preencher: ${soApagavel.join(", ")}`);
} else {
  ok("tudo que se apaga também se preenche");
}
if (apagaveis.includes("name")) {
  nok("`name` está na lista de esvaziar, e a coluna é not null");
} else {
  ok("`name` fica de fora do esvaziar (coluna not null)");
}

// --- 5. o controle negativo
console.log("\n5. controle negativo — o conferidor acusa?");
const catalogoFalso = [...catalogo, "campo_que_nao_existe"];
const detectou = catalogoFalso.some((c) => !permitidos.includes(c));
if (detectou) ok("um campo inventado no catálogo seria acusado");
else nok("um campo inventado passaria — a checagem 1 não está medindo");

const sqlSemComentario = literaisDoArray(
  "v_permitidos text[] := array[\n  -- 'nao_conta', comentado\n  'city'\n]",
  "v_permitidos text[] := array[",
);
if (sqlSemComentario.length === 1 && sqlSemComentario[0] === "city") {
  ok("campo citado dentro de comentário não entra na lista");
} else {
  nok(`comentário virou campo: ${JSON.stringify(sqlSemComentario)}`);
}

console.log(falhas === 0 ? "\nEM DIA" : `\n${falhas} DIVERGÊNCIA(S)`);
process.exit(falhas === 0 ? 0 : 1);
