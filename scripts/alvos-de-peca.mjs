#!/usr/bin/env node
/**
 * Cria (e remove) os ALVOS DE TESTE da definição de peça de anúncio.
 *
 * Uso:
 *   node scripts/alvos-de-peca.mjs --criar
 *   node scripts/alvos-de-peca.mjs --listar
 *   node scripts/alvos-de-peca.mjs --remover
 *
 * ============================================================
 * POR QUE ESTE SCRIPT EXISTE, E POR QUE ELE É A PARTE QUE IMPORTA
 *
 * O conserto da `/aprovar` (docs/lote-leitura-de-peca.md) é curto. O que
 * não é curto é PROVAR que ele funciona: no dia em que foi escrito, o
 * banco inteiro tinha ZERO linhas com `uso = 'campanha'`. Um teste do
 * conserto passava porque a tela ficava vazia — e tela vazia não prova
 * filtro certo, prova tabela vazia. Foi a sétima vez neste projeto que um
 * verde teria escondido defeito.
 *
 * São necessários DOIS alvos, e o segundo não existia:
 *   - o que TEM que sumir (a logo `draft` — essa existia, no negócio V2G)
 *   - o que TEM que aparecer (peça de campanha `draft` — não existia)
 *
 * Alvo criado à mão numa sessão morre com a sessão, e a medição seguinte
 * volta a rodar contra tabela vazia sem ninguém perceber. Por isso ele é
 * um comando, não um `insert` colado num documento.
 * ============================================================
 *
 * ONDE OS ALVOS SÃO CRIADOS, E POR QUE ALI É SEGURO
 *
 * No negócio `a0328fb8` — "Padaria Dona Zilda (FICTICIO)". Duas
 * propriedades dele fazem isto ser inofensivo, e as duas foram conferidas:
 *
 *   `dados_ficticios = true` é TRAVA, não etiqueta. `lib/pipeline/
 *   disparar.ts:289` e `lib/meta/publicar.ts:332` recusam o negócio antes
 *   de qualquer chamada externa. Nada inserido aqui pode virar campanha na
 *   Meta nem gasto de verba.
 *
 *   `profile_id` é nulo — nenhum usuário é dono desse negócio, então a RLS
 *   (`owns_business`) não devolve estas linhas para ninguém logado. O alvo
 *   não aparece na tela de nenhum cliente.
 *
 * Nada é escrito no negócio real (`a85c37a9`, "V2G"). A logo que serve de
 * alvo negativo lá já existia e não é tocada.
 * ============================================================
 */

import { readFileSync } from "node:fs";

const NEGOCIO_FICTICIO = "a0328fb8-cd95-415b-b2f5-5d305e5df9f4";

/** Prefixo que torna o alvo reconhecível a olho nu numa consulta ao banco. */
const MARCA = "ALVO-";

/**
 * ============================================================
 * A ORDEM DAS DATAS É PARTE DO ALVO, NÃO DETALHE.
 *
 * A `/aprovar` traz UMA linha: `order created_at desc, limit 1`. Na
 * primeira versão deste script os cinco alvos nasceram no mesmo instante,
 * e a leitura ANTIGA devolveu a peça de campanha por sorte de ordenação —
 * o que fazia a medição parecer que não havia defeito no negócio de teste.
 *
 * Então a LOGO é a mais RECENTE de propósito. É assim que o defeito
 * acontece de verdade (a logo `9263c465` do negócio real é a última linha
 * inserida lá), e é o que faz as duas colunas da medição divergirem:
 *
 *   leitura antiga → devolve a logo    (a mentira)
 *   leitura nova   → devolve a peça A  (a verdade)
 *
 * Quem mexer nestas datas apaga a diferença entre as duas colunas sem
 * mudar uma linha do conserto.
 * ============================================================
 *
 * Os cinco alvos, cada um para um lado de um filtro:
 *   A  peça viva                → TEM que aparecer na /aprovar
 *   B  peça arquivada           → o filtro `arquivado_em is null`
 *   C  logo, e a mais recente   → o filtro `uso = 'campanha'` (o defeito medido)
 *   D  peça reprovada viva      → TEM que aparecer na /reprovado
 *   E  peça reprovada arquivada → o mesmo filtro, do lado da /reprovado
 */
const ALVOS = [
  {
    file_name: `${MARCA}A-peca-viva.png`,
    uso: "campanha",
    status: "draft",
    arquivado_em: null,
    created_at: "2026-08-21T10:00:00+00:00",
    copy: {
      oferta: "Bolo de fubá inteiro por R$ 28 até sexta",
      titulo: "Bolo de fubá quentinho, feito hoje",
      corpo: "Passa aqui na Dona Zilda. Encomenda pelo WhatsApp com dois dias.",
    },
    esperado: "aparecer na /aprovar",
  },
  {
    file_name: `${MARCA}B-peca-arquivada.png`,
    uso: "campanha",
    status: "draft",
    arquivado_em: "2026-08-21T12:00:00+00:00",
    created_at: "2026-08-21T11:00:00+00:00",
    copy: { titulo: "Versão antiga, arquivada" },
    esperado: "sumir",
  },
  {
    file_name: `${MARCA}D-reprovada-viva.png`,
    uso: "campanha",
    status: "rejected",
    arquivado_em: null,
    created_at: "2026-08-21T12:00:00+00:00",
    copy: { titulo: "Peça que a revisão do Facebook recusou" },
    esperado: "aparecer na /reprovado",
  },
  {
    file_name: `${MARCA}E-reprovada-arquivada.png`,
    uso: "campanha",
    status: "rejected",
    arquivado_em: "2026-08-21T13:30:00+00:00",
    created_at: "2026-08-21T13:00:00+00:00",
    copy: { titulo: "Reprovada e já arquivada" },
    esperado: "sumir",
  },
  {
    // A MAIS RECENTE. Ver o cabeçalho acima.
    file_name: `${MARCA}C-logo.png`,
    uso: "logo",
    status: "draft",
    arquivado_em: null,
    created_at: "2026-08-21T14:00:00+00:00",
    copy: {},
    esperado: "sumir",
  },
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
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_BASE || !CHAVE) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (.env.local).",
  );
  process.exit(1);
}

async function rest(caminho, init = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${caminho}`, {
    ...init,
    headers: {
      apikey: CHAVE,
      Authorization: `Bearer ${CHAVE}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const texto = await r.text();
  if (!r.ok) {
    console.error(`HTTP ${r.status} em ${caminho}\n${texto}`);
    process.exit(1);
  }
  return texto ? JSON.parse(texto) : null;
}

const FILTRO_DOS_ALVOS =
  `business_id=eq.${NEGOCIO_FICTICIO}&file_name=like.${MARCA}*`;

async function listar() {
  const linhas = await rest(
    `creatives?select=id,file_name,uso,status,campaign_id,arquivado_em&${FILTRO_DOS_ALVOS}&order=file_name`,
  );
  if (linhas.length === 0) {
    console.log("Nenhum alvo no banco. Rode com --criar.");
    return linhas;
  }
  for (const l of linhas) {
    console.log(
      `  ${l.file_name.padEnd(30)} uso=${String(l.uso).padEnd(9)} status=${String(l.status).padEnd(7)} arquivado=${l.arquivado_em ? "sim" : "não"}  ${l.id}`,
    );
  }
  return linhas;
}

async function criar() {
  const jaExistem = await rest(`creatives?select=id&${FILTRO_DOS_ALVOS}`);
  if (jaExistem.length > 0) {
    console.log(
      `Já existem ${jaExistem.length} alvo(s). Rode --remover antes, para não empilhar.`,
    );
    // Empilhar seria pior que falhar: a `/aprovar` traz UMA linha, a mais
    // recente, e um alvo duplicado faz a medição responder sobre a cópia
    // sem que ninguém veja.
    process.exit(1);
  }
  const corpo = ALVOS.map((a) => ({
    business_id: NEGOCIO_FICTICIO,
    file_name: a.file_name,
    uso: a.uso,
    status: a.status,
    arquivado_em: a.arquivado_em,
    created_at: a.created_at,
    copy: a.copy,
    // `campaign_id` fica NULO de propósito. Ver
    // docs/lote-leitura-de-peca.md §3: a definição não exige campanha, e
    // um alvo com campanha esconderia justamente essa decisão.
    campaign_id: null,
  }));
  await rest("creatives", { method: "POST", body: JSON.stringify(corpo) });
  console.log(`${corpo.length} alvos criados no negócio fictício:`);
  await listar();
}

async function remover() {
  const antes = await rest(`creatives?select=id&${FILTRO_DOS_ALVOS}`);
  await rest(`creatives?${FILTRO_DOS_ALVOS}`, { method: "DELETE" });
  console.log(`${antes.length} alvo(s) removido(s).`);
}

const acao = process.argv[2];
if (acao === "--criar") await criar();
else if (acao === "--remover") await remover();
else if (acao === "--listar") await listar();
else {
  console.log("Uso: node scripts/alvos-de-peca.mjs --criar | --listar | --remover");
  process.exit(1);
}
