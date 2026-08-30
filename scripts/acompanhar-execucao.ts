/**
 * ACOMPANHA UMA EXECUÇÃO ENQUANTO ELA RODA, e é a única chance de medir.
 *
 * O backend calcula o custo de cada chamada de LLM e joga o resultado em
 * `stdout` (`src/llm/anthropic_client.py:157-159`). Não existe coluna de
 * token, custo ou usage em `execucoes` nem em nenhuma tabela do pipeline —
 * conferido no `information_schema` por `%custo%|%token%|%usage%|%usd%`. Ou
 * seja: **depois que a execução termina, não há de onde ler quanto ela
 * custou nem quanto cada agente demorou.** Só o log do container e os dados
 * de execução do n8n têm isso, e nenhum dos dois é acessível daqui.
 *
 * O que este script faz é reconstruir o que dá, de fora, com o que o banco
 * mostra: `execucoes` tem quatro colunas jsonb que os agentes preenchem uma
 * a uma (`classificacao`, `diagnostico`, `oferta`, `copy`), mais
 * `varredura_site`. Amostrando durante a corrida, o instante em que cada uma
 * deixa de ser nula é o fim daquele agente — e a diferença entre dois
 * instantes é a duração do seguinte.
 *
 * A MEDIDA DE SAÍDA É PISO, NÃO EXATA, e isso não é detalhe. `claude-opus-5`
 * tem thinking ligado por padrão, o thinking é cobrado, e ele não fica
 * gravado em lugar nenhum. Contar os tokens do jsonb dá o que a IA
 * ENTREGOU, não o que ela GEROU. A diferença é o raciocínio pago e não
 * visto. Quem quiser o número exato tem que ler o log do container.
 *
 *   node --env-file-if-exists=.env.local scripts/acompanhar-execucao.ts <id_execucao>
 *        [--intervalo=5] [--minutos=25] [--saida=<arquivo.json>]
 *
 * Sai sozinho quando o status chega a um terminal, ou quando o prazo estoura.
 * Toda amostra vai para o arquivo de saída; a tela mostra só as MUDANÇAS,
 * porque 300 linhas iguais escondem a única que importa.
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

/** As colunas que os agentes preenchem, na ordem do Workflow A. */
const ETAPAS = [
  { coluna: "classificacao", agente: "3. classificar-nicho" },
  { coluna: "varredura_site", agente: "5. varrer-site (só com deve_varrer_site)" },
  { coluna: "diagnostico", agente: "4. diagnosticar-orcamento" },
  { coluna: "oferta", agente: "6. construir-oferta" },
  { coluna: "copy", agente: "7. gerar-copy" },
] as const;

/** Onde o Workflow A pode legitimamente parar. */
const TERMINAIS = new Set(["aguardando_fotos", "gerado", "estrutura_pronta"]);

const ESCALARES =
  "id, status, nicho, requer_revisao, confianca_minima, motivos_revisao, " +
  "nome_negocio, criado_em, atualizado_em";
const COLUNAS = ESCALARES + ", " + ETAPAS.map((e) => e.coluna).join(", ");

function agora(): string {
  return new Date().toISOString();
}

function arg(nome: string, queda: number): number {
  const bruto = process.argv.find((a) => a.startsWith(`--${nome}=`));
  if (!bruto) return queda;
  const n = Number(bruto.slice(nome.length + 3));
  return Number.isFinite(n) && n > 0 ? n : queda;
}

async function main(): Promise<number> {
  const id = process.argv[2];
  if (!id) {
    console.error("uso: node scripts/acompanhar-execucao.ts <id_execucao> [--intervalo=5] [--minutos=25]");
    return 1;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const servico = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !servico) {
    console.error("faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
    return 1;
  }

  const intervaloS = arg("intervalo", 5);
  const limiteMin = arg("minutos", 25);
  const destino =
    process.argv.find((a) => a.startsWith("--saida="))?.slice("--saida=".length) ??
    `acompanhamento-${id.slice(0, 8)}.json`;

  const supabase = createClient(url, servico, { auth: { persistSession: false } });

  const t0 = Date.now();
  const amostras: Array<Record<string, unknown>> = [];
  /** primeira vez que vimos cada coluna preenchida */
  const surgiu = new Map<string, { em: string; msDesdeInicio: number }>();
  let statusAnterior: string | null = null;
  let ultima: Record<string, unknown> | null = null;

  console.log(`acompanhando ${id}`);
  console.log(`amostra a cada ${intervaloS}s, prazo de ${limiteMin} min`);
  console.log(`amostras vão para ${destino}`);
  console.log("-".repeat(72));

  while (Date.now() - t0 < limiteMin * 60_000) {
    const { data, error } = await supabase
      .from("execucoes")
      .select(COLUNAS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`${agora()}  falha ao ler :: ${error.message}`);
    } else if (!data) {
      console.error(`${agora()}  execução ${id} não existe`);
      return 1;
    } else {
      const linha = data as unknown as Record<string, unknown>;
      ultima = linha;
      const ms = Date.now() - t0;

      // A amostra guardada é enxuta: os jsonb inteiros repetidos a cada 5s
      // encheriam o arquivo com a mesma coisa. O conteúdo vem do relatório.
      amostras.push({
        em: agora(),
        msDesdeInicio: ms,
        status: linha.status,
        atualizado_em: linha.atualizado_em,
        nicho: linha.nicho,
        preenchidas: ETAPAS.filter((e) => linha[e.coluna] != null).map((e) => e.coluna),
      });

      if (linha.status !== statusAnterior) {
        console.log(
          `${agora()}  [${(ms / 1000).toFixed(0).padStart(5)}s]  status: ${statusAnterior ?? "(primeira leitura)"} -> ${linha.status}`,
        );
        statusAnterior = linha.status as string;
      }

      for (const etapa of ETAPAS) {
        if (linha[etapa.coluna] != null && !surgiu.has(etapa.coluna)) {
          surgiu.set(etapa.coluna, { em: agora(), msDesdeInicio: ms });
          console.log(
            `${agora()}  [${(ms / 1000).toFixed(0).padStart(5)}s]  GRAVOU ${etapa.coluna.padEnd(16)} ${etapa.agente}`,
          );
        }
      }

      if (TERMINAIS.has(String(linha.status))) {
        console.log("-".repeat(72));
        console.log(`terminal: ${linha.status}. Parando.`);
        break;
      }
    }

    await new Promise((r) => setTimeout(r, intervaloS * 1000));
  }

  // ------------------------------------------------------------ relatório

  console.log("\n" + "=".repeat(72));
  console.log("LINHA DO TEMPO — por agente");
  console.log("=".repeat(72));
  if (surgiu.size === 0) {
    console.log("  nenhuma coluna foi preenchida no período. O pipeline não andou.");
  } else {
    let anterior = 0;
    for (const etapa of ETAPAS) {
      const s = surgiu.get(etapa.coluna);
      if (!s) {
        console.log(`  ${etapa.coluna.padEnd(16)} —  não gravou  (${etapa.agente})`);
        continue;
      }
      const dur = (s.msDesdeInicio - anterior) / 1000;
      console.log(
        `  ${etapa.coluna.padEnd(16)} +${(s.msDesdeInicio / 1000).toFixed(1).padStart(7)}s   levou ~${dur.toFixed(1)}s   ${etapa.agente}`,
      );
      anterior = s.msDesdeInicio;
    }
    console.log(
      "\n  (o 'levou' é a diferença entre gravações consecutivas: inclui o tempo\n" +
      "   do nó do n8n e da rede, não só o do LLM. É teto por agente, não o exato.)",
    );
  }

  if (ultima) {
    console.log("\n" + "=".repeat(72));
    console.log("O ESTADO FINAL");
    console.log("=".repeat(72));
    for (const c of ESCALARES.split(", ")) {
      console.log(`  ${c.padEnd(18)} ${JSON.stringify(ultima[c])}`);
    }

    writeFileSync(
      destino,
      JSON.stringify({ id, iniciadoEm: new Date(t0).toISOString(), amostras, final: ultima }, null, 2),
      "utf-8",
    );
    console.log(`\nconteúdo completo dos jsonb + ${amostras.length} amostras em ${destino}`);
  }

  return 0;
}

process.exitCode = await main();
