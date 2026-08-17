#!/usr/bin/env node
/**
 * Marca (ou desmarca) um usuário como OPERADOR.
 *
 * Uso:
 *   node scripts/marcar-operador.mjs v2g.midia@gmail.com
 *   node scripts/marcar-operador.mjs v2g.midia@gmail.com --remover
 *   node scripts/marcar-operador.mjs --listar
 *
 * ============================================================
 * POR QUE `app_metadata` E NÃO `user_metadata`
 *
 * `user_metadata` é gravável pelo PRÓPRIO usuário, com uma chamada de
 * `auth.updateUser` do navegador. Se o papel morasse ali, qualquer
 * cliente se promoveria a operador em dez segundos.
 *
 * `app_metadata` só a `service_role` escreve — daí este script existir e
 * rodar fora do app. E ele vem assinado dentro do JWT, então o
 * `proxy.ts` decide sem consultar o banco a cada request.
 * ============================================================
 *
 * POR QUE `fetch` CRU E NÃO O `supabase-js`
 *
 * Foi tentado com o cliente oficial primeiro. No Windows ele deixa um
 * handle aberto no encerramento e o Node aborta com
 * "Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)", saindo com
 * código 127 — depois de fazer o trabalho certo. Um script de
 * administração que grita erro quando deu tudo certo é pior que um
 * script sem biblioteca.
 *
 * A API de administração do GoTrue é REST simples, então não há o que
 * ganhar com o cliente aqui. Continua sendo o caminho sancionado (não é
 * UPDATE direto em `auth.users`, que passaria por cima das invariantes do
 * GoTrue).
 * ============================================================
 *
 * ATENÇÃO: o papel entra no JWT quando o token é EMITIDO. Quem já está
 * logado continua sem o papel até o token ser renovado — na prática,
 * saia e entre de novo depois de rodar isto.
 */

import { readFileSync } from "node:fs";

const PAPEL = "operador";
const POR_PAGINA = 200;

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
const base = (env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
const chave = env.SUPABASE_SERVICE_ROLE_KEY;

if (!base || !chave) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Preencha no .env.local ou passe pelo ambiente.",
  );
  process.exit(1);
}

const cabecalhos = {
  apikey: chave,
  Authorization: `Bearer ${chave}`,
  "Content-Type": "application/json",
};

async function chamar(caminho, opcoes = {}) {
  const r = await fetch(base + caminho, { ...opcoes, headers: cabecalhos });
  const texto = await r.text();
  let corpo = null;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    // Deixa `corpo` nulo: a mensagem abaixo mostra o texto cru, que é o
    // que serve quando a resposta não é JSON.
  }
  if (!r.ok) {
    const detalhe = corpo?.msg ?? corpo?.message ?? corpo?.error_description ?? texto.slice(0, 200);
    throw new Error(`HTTP ${r.status} em ${caminho}: ${detalhe}`);
  }
  return corpo;
}

/** Percorre todas as páginas de usuários, aplicando `visitar` em cada um. */
async function percorrerUsuarios(visitar) {
  for (let pagina = 1; ; pagina += 1) {
    const dados = await chamar(`/auth/v1/admin/users?page=${pagina}&per_page=${POR_PAGINA}`);
    const usuarios = dados?.users ?? [];
    for (const u of usuarios) {
      const parar = visitar(u);
      if (parar) return parar;
    }
    if (usuarios.length < POR_PAGINA) return null;
  }
}

async function listar() {
  const operadores = [];
  await percorrerUsuarios((u) => {
    if (u.app_metadata?.papel === PAPEL) operadores.push(u.email ?? u.id);
    return null;
  });
  if (operadores.length === 0) {
    console.log("Nenhum operador marcado.");
  } else {
    console.log(`${operadores.length} operador(es):`);
    for (const e of operadores) console.log("  " + e);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--listar")) {
    await listar();
    return 0;
  }

  const email = args.find((a) => !a.startsWith("--"));
  const remover = args.includes("--remover");

  if (!email) {
    console.error(
      "Informe o e-mail.\n" +
        "  node scripts/marcar-operador.mjs voce@exemplo.com\n" +
        "  node scripts/marcar-operador.mjs voce@exemplo.com --remover\n" +
        "  node scripts/marcar-operador.mjs --listar",
    );
    return 1;
  }

  const alvo = email.toLowerCase();
  const usuario = await percorrerUsuarios((u) =>
    u.email?.toLowerCase() === alvo ? u : null,
  );

  if (!usuario) {
    console.error(`Nenhum usuário com o e-mail ${email}. Ele precisa ter conta criada antes.`);
    return 1;
  }

  // Preserva o resto do app_metadata. Sobrescrever o objeto inteiro
  // apagaria `provider` e `providers`, que o GoTrue usa.
  const novoMeta = { ...(usuario.app_metadata ?? {}) };
  if (remover) delete novoMeta.papel;
  else novoMeta.papel = PAPEL;

  await chamar(`/auth/v1/admin/users/${usuario.id}`, {
    method: "PUT",
    body: JSON.stringify({ app_metadata: novoMeta }),
  });

  console.log(
    remover ? `${email} não é mais operador.` : `${email} agora é operador. Acesso: /saude-meta`,
  );
  console.log(
    "\nIMPORTANTE: o papel entra no JWT só quando o token é emitido.\n" +
      "Se você já está logado, SAIA e ENTRE de novo — antes disso o proxy\n" +
      "continua te vendo sem papel.",
  );
  return 0;
}

main().then(
  (codigo) => {
    process.exitCode = codigo;
  },
  (erro) => {
    console.error(erro.message);
    process.exitCode = 1;
  },
);
