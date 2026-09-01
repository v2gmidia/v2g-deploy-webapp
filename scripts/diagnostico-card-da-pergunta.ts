/**
 * Por que o card da pergunta diária não apareceu.
 *
 *   pnpm diagnostico:card
 *
 * Refaz, na ordem, EXATAMENTE o que a `/inicio` faz no servidor — e diz em
 * qual passo a condição morre. Existe porque em 01/09 o card não renderizou
 * numa conta real, com a rota provada por `curl` e o console limpo: os dois
 * caminhos que zeram a execução são silenciosos, e a ausência dos dois é a
 * mesma tela vazia.
 *
 * SÓ LEITURA. Nenhum `POST`, nenhuma escrita.
 *
 * Ele lê as MESMAS variáveis de ambiente que o servidor lê. Rodar isto na
 * máquina onde a tela foi aberta é o ponto: se a resposta aqui for
 * diferente da que você viu, a diferença está no ambiente, não no código.
 */

import { validarExecucaoDoNegocio } from "../lib/dia-seguinte/validar.ts";
import { diaDeOntemEmSaoPaulo } from "../lib/dia-seguinte/dia.ts";

const negocio = process.env.V2G_BUSINESS_DE_TESTE;
const perfil = process.env.V2G_PROFILE_DE_TESTE;

function passo(n: string, ok: boolean | null, detalhe: string) {
  const marca = ok === null ? "  ?  " : ok ? " ok  " : "FALHA";
  console.log(`${marca} ${n}\n        ${detalhe}`);
}

console.log("\nDiagnóstico do card da pergunta diária\n" + "=".repeat(60));

// ---- 1. o ambiente ----
const base = (process.env.V2G_BACKEND_URL ?? "").replace(/\/+$/, "");
const token = process.env.V2G_BACKEND_TOKEN;
const configurado = Boolean(base && token);

passo(
  "1. o backend está configurado neste ambiente?",
  configurado,
  configurado
    ? `V2G_BACKEND_URL = ${base}`
    : "V2G_BACKEND_URL e/ou V2G_BACKEND_TOKEN AUSENTES.\n" +
      "        É o caminho mais silencioso de todos: `lib/backend/cliente.ts` não\n" +
      "        loga backend não configurado de propósito, e a tela some sem rastro.\n" +
      "        Se a tela foi aberta num deploy, confira as env vars DE LÁ.",
);

if (!configurado) {
  console.log("\nParou aqui: sem env, nada abaixo pode ser medido.\n");
  process.exitCode = 1;
} else if (!negocio) {
  console.log(
    "\n  ?   Falta `V2G_BUSINESS_DE_TESTE` (o uuid do negócio) para seguir.\n" +
      "      `V2G_PROFILE_DE_TESTE` é opcional, mas é ele que reproduz o que o\n" +
      "      servidor manda — a /inicio SEMPRE manda o profile_id.\n",
  );
} else {
  const cabecalho = { "X-V2G-Token": token!, Accept: "application/json" };

  const rota = `${base}/negocios/${encodeURIComponent(negocio)}/execucao`;
  const comPerfil = perfil ? `${rota}?profile_id=${encodeURIComponent(perfil)}` : rota;

  const r = await fetch(comPerfil, { headers: cabecalho, cache: "no-store" });

  passo(
    "2. a porta de entrada responde?",
    r.status === 200,
    r.status === 200
      ? "200 — há execução para este negócio"
      : r.status === 404
        ? "404 — o backend diz: negócio sem execução, OU profile_id que não bate.\n" +
          "        A rota devolve 404 nos dois casos de propósito (403 confirmaria\n" +
          "        que o negócio existe para quem está adivinhando id).\n" +
          `        ${perfil ? "Rode de novo SEM V2G_PROFILE_DE_TESTE: se aí der 200, o id não bate." : "Rode de novo COM V2G_PROFILE_DE_TESTE para reproduzir o servidor."}`
        : `${r.status} — nem 200 nem 404. Aqui o `+"`cliente.ts`"+` logaria.`,
  );

  if (r.status === 200) {
    const bruto = await r.json();
    const execucao = validarExecucaoDoNegocio(bruto);
    passo(
      "3. o corpo passa no validador de fronteira?",
      execucao !== null,
      execucao !== null
        ? `status=${execucao.status} pede_acao=${execucao.pedeAcao}`
        : "REPROVOU. O backend mudou um campo e a tela vê `null` — este é o\n" +
          "        modo de falha silenciosa da camada. Corpo:\n        " +
          JSON.stringify(bruto).slice(0, 200),
    );

    if (execucao) {
      const dia = diaDeOntemEmSaoPaulo(new Date());
      const c = await fetch(
        `${base}/negocios/${encodeURIComponent(negocio)}/consolidado` +
          `?desde=${dia}&ate=${dia}&dia_da_pergunta=${dia}` +
          (perfil ? `&profile_id=${encodeURIComponent(perfil)}` : ""),
        { headers: cabecalho, cache: "no-store" },
      );
      const corpo = c.status === 200 ? await c.json() : null;
      const linha = corpo?.dias?.find((d: { dia: string }) => d.dia === dia);

      passo(
        "4. o que já está gravado no dia de ontem?",
        c.status === 200,
        c.status !== 200
          ? `consolidado respondeu ${c.status}`
          : `dia ${dia} — vendas=${JSON.stringify(linha?.viraram_venda ?? null)} ` +
            `receita=${JSON.stringify(linha?.voltou_centavos ?? null)}`,
      );

      const cabe = !linha || linha.viraram_venda === null || linha.voltou_centavos === null;
      passo(
        "5. a condição do card fecha?",
        cabe,
        cabe
          ? "SIM — o card deveria aparecer. Se não apareceu na tela, o ambiente\n" +
            "        onde ela roda não é este: confira as env vars de LÁ, e se o\n" +
            "        build é recente."
          : "NÃO — os dois campos já estão respondidos para ontem, e o card some\n" +
            "        de propósito. Isso é o comportamento correto.",
      );
    }
  }
}

console.log("");
