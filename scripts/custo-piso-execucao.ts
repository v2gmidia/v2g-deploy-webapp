/**
 * O CUSTO DE UMA EXECUÇÃO, MEDIDO ATÉ ONDE DÁ — e o nome diz o limite.
 *
 * ============================================================
 * POR QUE "PISO" E NÃO "CUSTO". Leia antes de citar o número.
 *
 * O backend calcula o custo real de cada chamada (`calcular_custo_usd`) e
 * joga o resultado em `stdout` (`src/llm/anthropic_client.py:157-159`).
 * **Não existe coluna de token, custo ou usage em `execucoes` nem em
 * nenhuma tabela do pipeline** — conferido no `information_schema` por
 * `%custo%|%token%|%usage%|%usd%`: só `criativos.custo_usd` (imagem) e
 * `propostas_de_perfil.tokens_*` (outro caminho, o agente do webapp).
 *
 * Então o custo real por agente **não é obtível do banco**. Ele está no log
 * do container (Easypanel) e nos dados de execução do n8n — nenhum dos dois
 * acessível daqui.
 *
 * O que este script faz é contar, com o `count_tokens` da própria API, os
 * tokens do que cada agente GRAVOU nas colunas jsonb. Isso é o que a IA
 * ENTREGOU. O que ela GEROU é maior, por dois motivos que empurram na mesma
 * direção:
 *
 *   1. `claude-opus-5` tem thinking ligado por padrão, o thinking é cobrado,
 *      e ele não fica gravado em lugar nenhum.
 *   2. O jsonb guarda o objeto já parseado; o que saiu do modelo foi JSON
 *      com sintaxe, e a sintaxe custa tokens.
 *
 * Por isso: PISO. O real está acima, e a distância é desconhecida sem o log.
 * A entrada, essa sim, é conhecida — o prompt é determinístico.
 * ============================================================
 *
 *   node --env-file-if-exists=.env.local scripts/custo-piso-execucao.ts <id_execucao>
 *        [--modelo=claude-opus-5] [--nicho=generico]
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Preço por milhão de tokens. Bate com `src/llm/custo.py` do backend, e com
 * a tabela oficial. Escrita de cache é 1,25x a entrada; leitura, 0,10x.
 */
const PRECOS: Record<string, { entrada: number; saida: number }> = {
  "claude-opus-5": { entrada: 5.0, saida: 25.0 },
  "claude-opus-4-8": { entrada: 5.0, saida: 25.0 },
  "claude-sonnet-5": { entrada: 3.0, saida: 15.0 },
  "claude-haiku-4-5": { entrada: 1.0, saida: 5.0 },
};

/**
 * Tokens de ENTRADA de cada agente — sistema montado + corpo de usuário com
 * os dados reais do negócio, slug `generico`. Medidos em 25/08/2026 com
 * `count_tokens` sobre o prompt que o código real monta, não convertidos de
 * uma contagem de caracteres: a conversão chars/token movia a entrada em
 * ~14% conforme o divisor escolhido, e aqui não há divisor a escolher.
 *
 * VALEM PARA A GERAÇÃO 5 (opus-5 e sonnet-5 contam idêntico). Um modelo de
 * outra geração tokeniza diferente — medido: opus-4-5 deu 29% menos no mesmo
 * texto. Se produção estiver noutra geração, ESTES NÚMEROS PRECISAM SER
 * RECONTADOS, não só reprecificados.
 *
 * `cacheia` vem de `cachear_sistema=True` no agente. Numa execução ÚNICA
 * isso ENCARECE: é tudo escrita de cache (1,25x), porque não há execução
 * anterior de onde ler. O desconto de 0,10x só existe da segunda em diante.
 */
const AGENTES = [
  { coluna: "classificacao", nome: "3. classificar-nicho", entrada: 1208, maxTokens: 2048, cacheia: false },
  { coluna: "diagnostico", nome: "4. diagnosticar-orcamento", entrada: 1473, maxTokens: 3072, cacheia: false },
  { coluna: "oferta", nome: "6. construir-oferta", entrada: 4495, maxTokens: 4096, cacheia: true },
  { coluna: "copy", nome: "7. gerar-copy", entrada: 2240, maxTokens: 8192, cacheia: true },
] as const;

function arg(nome: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${nome}=`))?.slice(nome.length + 3);
}

async function main(): Promise<number> {
  const id = process.argv[2];
  if (!id) {
    console.error("uso: node scripts/custo-piso-execucao.ts <id_execucao> [--modelo=…] [--nicho=…]");
    return 1;
  }

  const modelo = arg("modelo") ?? "claude-opus-5";
  const preco = PRECOS[modelo];
  if (!preco) {
    console.error(`modelo desconhecido: ${modelo}. Conhecidos: ${Object.keys(PRECOS).join(", ")}`);
    return 1;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const servico = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !servico) {
    console.error("faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return 1;
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("falta ANTHROPIC_API_KEY — é ela que conta os tokens");
    return 1;
  }

  const supabase = createClient(url, servico, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("execucoes")
    .select("id, status, nicho, classificacao, diagnostico, oferta, copy")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("falha ao ler ::", error.message);
    return 1;
  }
  if (!data) {
    console.error(`execução ${id} não existe`);
    return 1;
  }

  const linha = data as unknown as Record<string, unknown>;
  const nicho = arg("nicho") ?? (linha.nicho as string) ?? "generico";

  console.log(`execução  ${id}`);
  console.log(`status    ${linha.status}`);
  console.log(`nicho     ${nicho}${nicho === "generico" ? "" : "  (entrada medida no slug `generico` — recontar)"}`);
  console.log(`modelo    ${modelo}   $${preco.entrada}/Mtok entrada · $${preco.saida}/Mtok saída`);
  console.log("=".repeat(88));

  const anthropic = new Anthropic();
  let totalIn = 0;
  let totalOut = 0;
  let totalTeto = 0;

  console.log(
    `${"agente".padEnd(26)}${"tok in".padStart(8)}${"tok out".padStart(9)}${"/teto".padStart(8)}${"$ in".padStart(9)}${"$ out".padStart(9)}${"$ tot".padStart(9)}`,
  );

  for (const a of AGENTES) {
    const gravado = linha[a.coluna];
    const tokIn = a.entrada;
    // Escrita de cache: 1,25x. Numa execução única é SEMPRE escrita — não há
    // execução anterior de onde ler, então o cache encarece em vez de
    // baratear. O desconto de 0,10x só existe da segunda em diante.
    const fator = a.cacheia ? 1.25 : 1.0;
    const custoIn = (tokIn * preco.entrada * fator) / 1e6;

    let tokOut = 0;
    if (gravado != null) {
      const r = await anthropic.messages.countTokens({
        model: modelo,
        messages: [{ role: "user", content: JSON.stringify(gravado) }],
      });
      tokOut = r.input_tokens;
    }
    const custoOut = (tokOut * preco.saida) / 1e6;

    totalIn += custoIn;
    totalOut += custoOut;
    totalTeto += (a.maxTokens * preco.saida) / 1e6;

    const pct = gravado == null ? "—" : `${((tokOut / a.maxTokens) * 100).toFixed(0)}%`;
    console.log(
      `${a.nome.padEnd(26)}${tokIn.toString().padStart(8)}${(gravado == null ? "—" : String(tokOut)).padStart(9)}${pct.padStart(8)}${custoIn.toFixed(4).padStart(9)}${custoOut.toFixed(4).padStart(9)}${(custoIn + custoOut).toFixed(4).padStart(9)}`,
    );
  }

  console.log("=".repeat(88));
  console.log(
    `${"PISO MEDIDO".padEnd(26)}${"".padStart(8)}${"".padStart(9)}${"".padStart(8)}${totalIn.toFixed(4).padStart(9)}${totalOut.toFixed(4).padStart(9)}${(totalIn + totalOut).toFixed(4).padStart(9)}`,
  );
  console.log(
    `${"teto (max_tokens cheio)".padEnd(26)}${"".padStart(8)}${"".padStart(9)}${"".padStart(8)}${totalIn.toFixed(4).padStart(9)}${totalTeto.toFixed(4).padStart(9)}${(totalIn + totalTeto).toFixed(4).padStart(9)}`,
  );
  console.log(
    "\nO REAL FICA ENTRE OS DOIS, e mais perto do piso quanto menos o modelo\n" +
    "pensou. A diferença é thinking cobrado e não gravado — para o número\n" +
    "exato, o log do container no Easypanel.",
  );
  return 0;
}

process.exitCode = await main();
