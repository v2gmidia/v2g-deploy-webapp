#!/usr/bin/env node
/**
 * Mede, CONTRA O BANCO DE VERDADE, o que a `/aprovar` e a `/reprovado`
 * devolvem — com a leitura de antes do conserto e com a de agora, lado a
 * lado, nos dois negócios que têm dado.
 *
 * Uso:
 *   node scripts/medir-peca.mjs        (ou `pnpm medir:peca`)
 *
 * ============================================================
 * POR QUE ISTO NÃO ESTÁ NO `pnpm conferir`
 *
 * Precisa de rede e da `SUPABASE_SERVICE_ROLE_KEY`. `pnpm conferir` roda
 * offline e tem que continuar rodando offline — um conferidor que só passa
 * com credencial é um conferidor que alguém desliga.
 *
 * A divisão de trabalho entre os dois:
 *   `pnpm conferir:criativos`  os PREDICADOS, com fixture, os dois lados.
 *   `pnpm medir:peca` (este)   o FILTRO DE SQL, contra linha de verdade.
 *
 * As duas metades da definição vivem em `lib/criativos/peca.ts` e podem
 * divergir em silêncio. Nenhuma das duas conferências sozinha pega isso.
 * ============================================================
 *
 * A LEITURA DE ANTES RODA JUNTO, E ISSO É O PONTO. Uma medição que só
 * mostra a consulta nova passando não distingue "o filtro funciona" de "a
 * tabela está vazia" — que é exatamente o erro que este lote existe para
 * não repetir. Com as duas colunas na tela, a diferença entre elas É a
 * prova.
 *
 * Antes de rodar: `node scripts/alvos-de-peca.mjs --criar`. Sem os alvos,
 * este script AVISA em vez de dar verde — ver o fim do arquivo.
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  COLUNAS_DO_JULGAMENTO,
  apenasPecasDeAnuncio,
  esperaAprovacao,
} from "../lib/criativos/peca.ts";

const NEGOCIOS = [
  { rotulo: "V2G (real)", id: "a85c37a9-df57-4829-985b-41bc306f8537" },
  { rotulo: "Padaria Dona Zilda (FICTICIO)", id: "a0328fb8-cd95-415b-b2f5-5d305e5df9f4" },
];

function lerEnvLocal() {
  let bruto;
  try {
    bruto = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return {};
  }
  const env = {};
  for (const linha of bruto.split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = { ...lerEnvLocal(), ...process.env };
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local).");
  process.exit(1);
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const COLUNAS = "id, file_name, uso, status, arquivado_em, campaign_id";

/**
 * O `.eq("business_id", …)` só existe AQUI. Nas telas, quem faz esse
 * recorte é a RLS, a partir da sessão — e a `service_role` deste script
 * passa por cima dela. Sem o filtro explícito, a medição juntaria os
 * negócios e responderia outra pergunta.
 */
const escopo = (id) => supabase.from("creatives").select(COLUNAS).eq("business_id", id);

/** A leitura de antes do conserto, copiada de `aprovar/page.tsx:35-39`. */
const aprovarAntes = (id) =>
  escopo(id).eq("status", "draft").order("created_at", { ascending: false }).limit(1);

/** A de agora — o mesmo `apenasPecasDeAnuncio` que a tela chama. */
const aprovarAgora = (id) =>
  apenasPecasDeAnuncio(escopo(id))
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1);

const reprovadoAntes = (id) => escopo(id).eq("status", "rejected");
const reprovadoAgora = (id) => apenasPecasDeAnuncio(escopo(id)).eq("status", "rejected");

function descrever(linhas) {
  if (!linhas || linhas.length === 0) return "(vazio)";
  return linhas
    .map((l) => `${l.file_name ?? "(sem nome)"} [uso=${l.uso} status=${l.status}]`)
    .join(", ");
}

let problemas = 0;
const aviso = (texto) => {
  problemas += 1;
  console.log(`  !! ${texto}`);
};

console.log(`banco: ${new URL(env.NEXT_PUBLIC_SUPABASE_URL).host}`);

for (const negocio of NEGOCIOS) {
  console.log(`\n### ${negocio.rotulo} — ${negocio.id}`);

  const [antes, agora, repAntes, repAgora] = await Promise.all([
    aprovarAntes(negocio.id),
    aprovarAgora(negocio.id),
    reprovadoAntes(negocio.id),
    reprovadoAgora(negocio.id),
  ]);

  for (const r of [antes, agora, repAntes, repAgora]) {
    if (r.error) {
      console.error(`  erro: ${r.error.message}`);
      process.exit(1);
    }
  }

  console.log("  /aprovar   antes:", descrever(antes.data));
  console.log("  /aprovar   agora:", descrever(agora.data));
  console.log("  /reprovado antes:", descrever(repAntes.data));
  console.log("  /reprovado agora:", descrever(repAgora.data));

  // ---- a cadeia do /inicio, contada do jeito que `lib/estado/cliente.ts`
  // conta, sobre as MESMAS linhas ----
  //
  // Este bloco é o que fecha a queixa original. O defeito não era só "a
  // tela mostra logo": era a tela e a cadeia darem respostas DIFERENTES
  // sobre a mesma conta, no mesmo minuto. Contar de novo aqui e comparar
  // com o que a tela devolve é a única forma de ver as duas juntas.
  const { data: todas } = await supabase
    .from("creatives")
    .select(`id, ${COLUNAS_DO_JULGAMENTO}`)
    .eq("business_id", negocio.id)
    .is("arquivado_em", null);

  const cadeiaConta = (todas ?? []).filter(esperaAprovacao).length;
  const telaMostra = (agora.data ?? []).length;

  console.log(
    `  cadeia (/inicio) conta ${cadeiaConta} peça(s) para aprovar; a tela mostra ${telaMostra}`,
  );

  // A tela tem `limit(1)`: ela mostra UMA de N. O que não pode acontecer é
  // uma dizer "tem" e a outra "não tem" — que era o estado medido em 21/08.
  if ((cadeiaConta > 0) !== (telaMostra > 0)) {
    aviso(
      `a cadeia e a tela DISCORDAM: cadeia=${cadeiaConta}, tela=${telaMostra}. ` +
        "É o defeito original, em qualquer direção.",
    );
  }

  // ---- os dois lados, conferidos e não só impressos ----
  const trouxeLogo = (r) => (r.data ?? []).some((l) => l.uso !== "campanha");
  const trouxeArquivada = (r) => (r.data ?? []).some((l) => l.arquivado_em !== null);

  if (trouxeLogo(agora)) aviso("a leitura de AGORA trouxe linha que não é `uso = 'campanha'`");
  if (trouxeArquivada(agora)) aviso("a leitura de AGORA trouxe linha arquivada");

  const alvoA = (agora.data ?? []).some((l) => l.file_name === "ALVO-A-peca-viva.png");
  const temAlvos = (antes.data ?? []).length > 0 || alvoA;

  if (negocio.id === NEGOCIOS[1].id) {
    // O negócio fictício é onde os dois lados existem. Sem os alvos, esta
    // medição não mede nada, e é melhor dizer isso do que sair verde.
    if (!alvoA) {
      aviso(
        "ALVO-A não apareceu. Ou os alvos não foram criados " +
          "(`node scripts/alvos-de-peca.mjs --criar`), ou o filtro está " +
          "escondendo peça de verdade — que é o defeito pela ponta oposta.",
      );
    }
    if (!temAlvos) aviso("nenhuma linha no negócio de teste: a medição rodou contra tabela vazia");
  }
}

console.log(
  problemas === 0
    ? "\nMEDIÇÃO OK — a leitura de agora não trouxe logo nem peça arquivada, e o alvo vivo apareceu."
    : `\n${problemas} PROBLEMA(S) na medição.`,
);
// `exitCode` e não `process.exit()` — ver a nota no fim de
// `scripts/conferir-migrations.ts`. Aqui o risco é o mesmo por outra porta:
// o cliente do supabase-js usa `fetch` por baixo.
process.exitCode = problemas === 0 ? 0 : 1;
