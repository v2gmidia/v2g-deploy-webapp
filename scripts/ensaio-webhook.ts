/**
 * ENSAIO A SECO DO AVISO AO n8n — e, com `--enviar`, o disparo à mão.
 *
 * Monta o corpo EXATO que `avisarN8n()` (lib/pipeline/disparar.ts) mandaria
 * para `V2G_N8N_WEBHOOK_URL` e imprime. Existe porque o disparo real é a
 * única coisa do lote E que não desfaz: uma chamada bem-sucedida acorda os
 * agentes e vira token de LLM. Conferir o corpo antes custa zero.
 *
 * O que ele responde, e que o `conferir:cadastro` não responde: o
 * `conferir:cadastro` valida o payload contra o schema do FastAPI. Este aqui
 * mostra o corpo do WEBHOOK, que é outro contrato — os nós do n8n leem
 * `$('Configuracao').item.json.cadastro.<campo>`, e um campo ausente ali não
 * dá erro, dá `undefined` que o `JSON.stringify` descarta em silêncio.
 *
 *   node --env-file-if-exists=.env.local scripts/ensaio-webhook.ts <business_id>
 *
 * COM `--enviar`, ele deixa de ser ensaio e CHAMA o webhook de verdade:
 *
 *   … scripts/ensaio-webhook.ts <business_id> --enviar --id-execucao=<uuid> [--varrer]
 *
 * O corpo enviado é montado pelo MESMO código do ensaio, e é essa a razão de
 * os dois modos morarem num arquivo só: um script de disparo separado poderia
 * mandar um corpo diferente do que foi conferido, e a conferência deixaria de
 * valer no exato momento em que ela importa.
 *
 * `--id-execucao` é obrigatório no envio e não tem queda. Sem ele o nó
 * `Execucao ja existe?` bifurca para `1. Cadastro` e o n8n CRIA UMA SEGUNDA
 * execução — que é o desfecho que a idempotência inteira do lote E existe
 * para impedir.
 *
 * MEDIDO EM 23/08/2026, no JSON do workflow: pelo caminho do webhook NÃO HÁ
 * portão humano antes do `7. gerar-copy`. As telas de decisão do gestor são do
 * caminho do FORMULÁRIO. Quem chama isto com `--enviar` está autorizando os
 * cinco agentes do Workflow A a rodarem desatendidos até `aguardando_fotos`.
 *
 * `select("*")` de propósito, e é seguro aqui: script de operador, sob
 * `service_role`, com a linha indo direto para `montarCadastro`, que só lê o
 * que conhece. A regra contra `select *` protege leitura DE CLIENTE
 * (`auditoria-resultados.md` §4) — não é o caso.
 *
 * TUDO MORA NUMA `main()` QUE DEVOLVE O CÓDIGO, e nenhum caminho chama
 * `process.exit()`. Chamava, e no Windows isso derrubava o processo com
 * `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` do libuv: o
 * `supabase-js` deixa o socket de keep-alive do undici aberto, e matar o
 * processo por cima dele virava código de saída 127. O script imprimia
 * "VEREDITO: ok" e saía 127 — o texto dizendo uma coisa e o `$?` dizendo
 * outra, que é a forma mais silenciosa de mentir para quem automatizar isto.
 */

import { createClient } from "@supabase/supabase-js";
import { montarCadastro, type NegocioParaCadastro } from "../lib/cadastro/montar.ts";

/** Os campos que os nós do n8n leem do corpo. Ver `n8n/CONTRATO.md`. */
const LIDOS_PELO_N8N = [
  "nome_negocio",
  "descricao_livre",
  "ticket_medio",
  "custo_direto_medio",
  "lucro_desejado_por_cliente",
  "orcamento_mensal_disponivel",
] as const;

/** O header que o nó `Webhook` confere. Espelha `CABECALHO_N8N` do disparar.ts. */
const CABECALHO_N8N = "X-V2G-Webhook";

async function main(): Promise<number> {
  const businessId = process.argv[2];
  if (!businessId) {
    console.error("uso: node scripts/ensaio-webhook.ts <business_id> [--enviar --id-execucao=<uuid>]");
    return 1;
  }

  const enviar = process.argv.includes("--enviar");
  const idExecucao = process.argv
    .find((a) => a.startsWith("--id-execucao="))
    ?.slice("--id-execucao=".length);
  const deveVarrerSite = process.argv.includes("--varrer");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const servico = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !servico) {
    console.error("faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local");
    return 1;
  }

  const supabase = createClient(supabaseUrl, servico, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .maybeSingle();

  if (error) {
    console.error("falha ao ler o negócio ::", error.message);
    return 1;
  }
  if (!data) {
    console.error(`negócio ${businessId} não existe`);
    return 1;
  }

  console.log("=== O NEGÓCIO ===");
  console.log(`id                 ${data.id}`);
  console.log(`name               ${JSON.stringify(data.name)}`);
  console.log(`dados_ficticios    ${data.dados_ficticios}`);
  console.log(`cadastro_estado    ${JSON.stringify(data.cadastro_estado)}`);

  if (data.dados_ficticios) {
    console.log("\nRECUSADO no passo 2 do disparo: dados_ficticios = true.");
    console.log("Este negócio nunca chega a chamar o webhook pelo caminho do app.");
  }

  const cadastro = montarCadastro(data as unknown as NegocioParaCadastro);

  if (!cadastro.completo) {
    console.log("\n=== CADASTRO INCOMPLETO — não dispararia ===");
    for (const p of cadastro.pendencias) {
      console.log(`  ${p.campo.padEnd(28)} ${p.motivo.padEnd(16)} ${p.onde}`);
    }
    return 0;
  }

  // `deve_varrer_site` VEM DA RESPOSTA DO BACKEND — quem decide se o site vale
  // uma varredura é ele, não conta local. No ensaio a execução ainda não
  // existe, então entra como marcador visível; no envio vem do `--varrer`, que
  // é a decisão de quem dispara à mão uma execução que já nasceu.
  const corpo = {
    ...cadastro.payload,
    id_execucao: enviar ? idExecucao : "<vem da resposta do POST /cadastro>",
    deve_varrer_site: enviar ? deveVarrerSite : "<vem da resposta do POST /cadastro>",
  };

  console.log("\n=== O CORPO QUE SAIRIA ===");
  console.log(JSON.stringify(corpo, null, 2));

  console.log("\n=== OS CAMPOS QUE O n8n LÊ ===");
  let faltou = false;
  for (const campo of LIDOS_PELO_N8N) {
    const v = (cadastro.payload as unknown as Record<string, unknown>)[campo];
    const ok = v !== undefined && v !== null && v !== "";
    if (!ok) faltou = true;
    console.log(`  ${ok ? "ok  " : "FALTA"} ${campo.padEnd(30)} ${JSON.stringify(v)}`);
  }

  const url = process.env.V2G_N8N_WEBHOOK_URL;
  const token = process.env.V2G_N8N_WEBHOOK_TOKEN;
  console.log("\n=== O AMBIENTE ===");
  console.log(`V2G_N8N_WEBHOOK_URL     ${url ?? "(ausente — avisarN8n sai sem chamar)"}`);
  console.log(
    `V2G_N8N_WEBHOOK_TOKEN   ${token ? `presente, ${token.length} caracteres` : "(ausente — o n8n responde 403 se exigir header)"}`,
  );

  if (faltou) {
    console.log("\nVEREDITO: um campo lido pelo n8n está vazio. NÃO disparar.");
    return 1;
  }
  console.log("\nVEREDITO: o corpo tem os seis campos que o n8n lê.");

  if (!enviar) {
    console.log("\n(ensaio — nada foi enviado. `--enviar` chama de verdade.)");
    return 0;
  }

  // ---------------------------------------------------------------- o envio

  if (!idExecucao) {
    console.error("\n--enviar exige --id-execucao=<uuid>. Ver o cabeçalho.");
    return 1;
  }
  if (!url) {
    console.error("\n--enviar exige V2G_N8N_WEBHOOK_URL no ambiente.");
    return 1;
  }

  const cabecalhos: Record<string, string> = { "Content-Type": "application/json" };
  if (token) cabecalhos[CABECALHO_N8N] = token;

  console.log(`\n=== ENVIANDO para ${url} ===`);
  console.log(`id_execucao        ${idExecucao}`);
  console.log(`deve_varrer_site   ${deveVarrerSite}`);
  console.log(
    `header             ${token ? `${CABECALHO_N8N}: <${token.length} caracteres>` : "(nenhum)"}`,
  );

  const t0 = Date.now();
  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: cabecalhos,
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(30_000),
    });
    const texto = await resposta.text();
    console.log(`\nstatus   ${resposta.status} ${resposta.statusText}`);
    console.log(`levou    ${Date.now() - t0} ms`);
    console.log(`corpo    ${texto.slice(0, 2000)}`);
    if (!resposta.ok) {
      console.log("\nO n8n RECUSOU. O pipeline não começou.");
      return 1;
    }
    console.log("\nAceito. Acompanhe `execucoes.status` — tem que sair de `cadastro_completo`.");
    return 0;
  } catch (erro) {
    console.error(
      `\nfalha na chamada :: ${erro instanceof Error ? `${erro.name}: ${erro.message}` : "desconhecido"}`,
    );
    return 1;
  }
}

process.exitCode = await main();
