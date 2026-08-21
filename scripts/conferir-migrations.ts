/**
 * Confere se o que as migrations do repositório dizem criar EXISTE no banco.
 *
 *   pnpm conferir:migrations
 *
 * POR QUE ESTE CONFERIDOR EXISTE. Arquivo commitado e cadeia aplicada são
 * dois estados independentes: nada no repositório sabe qual migration rodou,
 * nada no banco sabe qual arquivo existe. Uma migration do backend ficou 13
 * dias sem rodar com o modelo já declarando as colunas dela, e ninguém
 * suspeitou — o arquivo estava lá, versionado e revisado. Medido em
 * `docs/migration-no-repo-nao-e-migration-aplicada.md`; desenho em
 * `docs/conferidor-de-migrations.md`.
 *
 * POR OBJETO, NUNCA POR NOME. Das 22 linhas do ledger, 19 entraram sem o
 * prefixo numérico e pelo menos 2 com o nome trocado. Conferidor por nome dá
 * alarme falso, e alarme falso repetido é como se aprende a ignorar o
 * conferidor.
 *
 * ============================================================
 * O QUE ELE NÃO ALCANÇA — leia antes de confiar no verde.
 *
 * A porta é a especificação do PostgREST (`GET /rest/v1/`), que mostra
 * TABELA, COLUNA e RPC do schema `public`. Ela não mostra índice,
 * constraint, trigger, policy de RLS, grant, corpo de função, nem nada fora
 * do `public`. (O ledger `supabase_migrations.schema_migrations` e o
 * `pg_proc` não são alcançáveis com o que existe no `.env.local`: o
 * PostgREST expõe só o `public`.)
 *
 * Por isso cada migration declara, em `foraDoAlcance`, o que fica de fora —
 * e este script IMPRIME essa contagem junto do verde. Um conferidor que
 * confere 60% e diz "TUDO CERTO" produz confiança que não corresponde a
 * nada.
 * ============================================================
 *
 * ============================================================
 * POR QUE TUDO ESTÁ DENTRO DE `main()`. MEDIDO, não estilo.
 *
 * No Windows, terminar o processo logo depois de um `fetch` — com
 * `process.exit()` OU com um `throw` no topo — aborta o Node com
 *
 *   Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), src\win\async.c
 *
 * e sai com **código 127**, depois de ter feito o trabalho certo e impresso
 * "TUDO CERTO". Um conferidor que grita falha quando deu tudo certo é
 * exatamente o alarme falso que este lote existe para não criar. (O mesmo
 * sintoma já estava registrado em `scripts/marcar-operador.mjs`, por outro
 * caminho: lá foi o cliente do supabase-js.)
 *
 * Medido: com 50ms de espera antes do `exit`, ainda 127; com 300ms, sai
 * limpo. Ou seja, esperar é corrida, não conserto. O único jeito
 * determinístico é NÃO terminar à força: `main()` devolve o código, o Node
 * fecha os sockets sozinho e sai pelo caminho normal.
 * ============================================================
 *
 * Precisa de rede e de `SUPABASE_SERVICE_ROLE_KEY`. Sem elas devolve 2 —
 * não medir não é passar, mesma regra do `conferir:cadastro`.
 */

import { readFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { MIGRATIONS, type Objeto } from "../supabase/objetos.ts";

const DIR = new URL("../supabase/migrations/", import.meta.url);

function lerEnvLocal(): Record<string, string> {
  let bruto: string;
  try {
    bruto = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return {};
  }
  const env: Record<string, string> = {};
  for (const linha of bruto.split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) env[m[1]!] = m[2]!.trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function descrever(o: Objeto): string {
  switch (o.tipo) {
    case "tabela":
      return `tabela ${o.nome}`;
    case "coluna":
      return `${o.tabela}.${o.nome}`;
    case "rpc":
      return `rpc ${o.nome}()`;
    case "rpc_ausente":
      return `rpc ${o.nome}() FORA do PostgREST`;
  }
}

async function main(): Promise<number> {
  const env = { ...lerEnvLocal(), ...process.env };
  const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
  const CHAVE = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!URL_BASE || !CHAVE) {
    console.error(
      "conferir:migrations precisa de NEXT_PUBLIC_SUPABASE_URL e " +
        "SUPABASE_SERVICE_ROLE_KEY (.env.local). Sem elas não há o que medir.",
    );
    return 2;
  }

  let falhas = 0;
  const ok = (m: string) => console.log(`  ok    ${m}`);
  const nok = (m: string) => {
    falhas++;
    console.log(`  FALHA ${m}`);
  };

  // ----------------------------------------------------- o schema de verdade

  const resposta = await fetch(`${URL_BASE}/rest/v1/`, {
    headers: { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` },
  });
  if (!resposta.ok) {
    console.error(`Não consegui ler a especificação do PostgREST: HTTP ${resposta.status}`);
    return 2;
  }

  type Spec = {
    paths?: Record<string, unknown>;
    definitions?: Record<string, { properties?: Record<string, unknown> }>;
  };
  const spec = (await resposta.json()) as Spec;

  const TABELAS = new Map<string, Set<string>>();
  for (const [nome, def] of Object.entries(spec.definitions ?? {})) {
    TABELAS.set(nome, new Set(Object.keys(def.properties ?? {})));
  }
  const RPCS = new Set(
    Object.keys(spec.paths ?? {})
      .filter((p) => p.startsWith("/rpc/"))
      .map((p) => p.slice(5)),
  );

  function existe(o: Objeto): boolean {
    switch (o.tipo) {
      case "tabela":
        return TABELAS.has(o.nome);
      case "coluna":
        return TABELAS.get(o.tabela)?.has(o.nome) ?? false;
      case "rpc":
        return RPCS.has(o.nome);
      // Presente é FALHA aqui: a 0002 existe para tirar a função do PostgREST.
      case "rpc_ausente":
        return !RPCS.has(o.nome);
    }
  }

  console.log(`banco: ${new URL(URL_BASE).host}`);
  console.log(`o PostgREST expõe ${TABELAS.size} tabelas e ${RPCS.size} funções\n`);

  // --- 0. controle negativo
  //
  // Sem isto o relatório inteiro é suspeito: se o instrumento não souber
  // dizer AUSENTE, todas as linhas abaixo saem "ok" sem valor.
  console.log("0. controle negativo — o instrumento sabe dizer AUSENTE");
  {
    const inventados: Objeto[] = [
      { tipo: "tabela", nome: "tabela_que_nao_existe_v2g" },
      { tipo: "coluna", tabela: "businesses", nome: "coluna_que_nao_existe_v2g" },
      { tipo: "rpc", nome: "funcao_que_nao_existe_v2g" },
      // E o inverso: um `rpc_ausente` que na verdade ESTÁ lá tem que acusar.
      { tipo: "rpc_ausente", nome: "confirmar_campo_do_cliente" },
    ];
    const pegou = inventados.filter((o) => !existe(o)).length;
    if (pegou === inventados.length) ok(`os ${pegou} objetos inventados foram acusados`);
    else nok(`só ${pegou} de ${inventados.length} objetos inventados foram acusados`);
  }

  // ------------------------------------------------------- manifesto x disco

  console.log("\n1. o manifesto e a pasta dizem a mesma coisa");
  {
    const noDisco = readdirSync(DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    const declarados = new Set(MIGRATIONS.map((m) => m.arquivo));

    const semEntrada = noDisco.filter((f) => !declarados.has(f));
    const semArquivo = [...declarados].filter((d) => !noDisco.includes(d));

    if (semEntrada.length === 0) ok(`os ${noDisco.length} arquivos têm entrada no manifesto`);
    else
      nok(
        `${semEntrada.join(", ")} não está(ão) em supabase/objetos.ts — ` +
          "migration nova precisa declarar o que cria, senão o manifesto envelhece em silêncio",
      );

    if (semArquivo.length === 0) ok("nenhuma entrada órfã no manifesto");
    else nok(`${semArquivo.join(", ")}: entrada no manifesto sem arquivo na pasta`);
  }

  // ----------------------------------------------------------- por objeto

  console.log("\n2. cada migration, pelos objetos que ela diz criar");

  let conferidos = 0;
  let foraDoAlcance = 0;
  const semNada: string[] = [];

  for (const m of MIGRATIONS) {
    foraDoAlcance += m.foraDoAlcance.length;

    const alvos = [...m.cria, ...(m.documenta ?? [])];
    if (alvos.length === 0) {
      semNada.push(m.arquivo);
      continue;
    }

    const ausentes = alvos.filter((o) => !existe(o));
    conferidos += alvos.length;

    if (ausentes.length === 0) {
      const marca = m.documenta?.length ? " (parte só documentada — ver o manifesto)" : "";
      ok(`${m.arquivo} — ${alvos.length} objeto(s)${marca}`);
    } else {
      nok(`${m.arquivo} — AUSENTE(S): ${ausentes.map(descrever).join(", ")}`);
    }
  }

  // ----------------------------------------------------- o que não foi visto

  console.log("\n3. o que este conferidor NÃO viu");
  console.log(`  ${conferidos} objetos conferidos contra o schema vivo.`);
  console.log(
    `  ${foraDoAlcance} coisas declaradas como fora do alcance do instrumento ` +
      "(índice, constraint, trigger, policy, grant, corpo de função, schema `private`).",
  );
  if (semNada.length > 0) {
    console.log(
      `  ${semNada.length} migration(s) sem NENHUM objeto conferível: ${semNada.join(", ")}.`,
    );
    console.log("     Elas passam por não terem o que medir, não por terem sido medidas.");
  }
  console.log("  Nada aqui é falha — é o tamanho do que o verde acima cobre.");

  // --------------------------------------------------------- a outra camada

  console.log("\n4. a comparação com o ledger (`supabase migration list --linked`)");
  {
    // Ela não substitui a conferência por objeto — o ledger mente sobre
    // nomes. Mas é a única que enxerga migration APLICADA SEM ARQUIVO, que é
    // o sentido que o manifesto não cobre.
    let linkado = true;
    try {
      readFileSync(new URL("../supabase/.temp/project-ref", import.meta.url), "utf8");
    } catch {
      linkado = false;
    }

    if (!linkado) {
      // NÃO derruba, e NÃO passa em silêncio. Um pulo silencioso é como
      // metade de um conferidor nunca roda sem ninguém perceber — a mesma
      // doença do documento que gerou este script.
      console.log("  DESLIGADA — o projeto não está linkado (falta supabase/.temp/project-ref).");
      console.log("     Para ligar, uma vez:  npx supabase link --project-ref <ref>");
      console.log("     Ela é a única camada que enxerga migration aplicada SEM arquivo no repo.");
    } else {
      try {
        const saida = execFileSync(
          "npx",
          ["--no-install", "supabase", "migration", "list", "--linked"],
          { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
        );
        console.log(
          saida
            .split("\n")
            .map((l) => `     ${l}`)
            .join("\n"),
        );
      } catch (e) {
        nok(
          `o projeto está linkado mas \`supabase migration list\` falhou: ${(e as Error).message}`,
        );
      }
    }
  }

  console.log(
    `\n${falhas === 0 ? "TUDO CERTO" : `${falhas} FALHA(S)`} — ${conferidos} objetos, ` +
      `${foraDoAlcance} fora do alcance`,
  );
  return falhas === 0 ? 0 : 1;
}

process.exitCode = await main();
