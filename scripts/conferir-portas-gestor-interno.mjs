import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * Trava estática de regressão do perímetro interno atual. NÃO demonstra
 * isolamento de agência, RLS, sessão autenticada ou comportamento em QA.
 * Quando houver papel de agência, esta lista precisa ser substituída por
 * autorização por vínculo em cada leitura, action e arquivo privado.
 */
const raiz = join(process.cwd(), "app", "(protected)", "gestor");
const paginasEsperadas = [
  "page.tsx",
  "compras/page.tsx",
  "criativos/page.tsx",
  "tarefas/page.tsx",
  "negocio/[id]/marca/page.tsx",
];
const actionsEsperadas = ["criativos/actions.ts", "tarefas/actions.ts"];

function listar(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(dir, item.name);
    return item.isDirectory() ? listar(caminho) : [relative(raiz, caminho).split(sep).join("/")];
  });
}

function guardaAntesDoAdmin(texto, guarda) {
  const sessao = texto.indexOf(".auth.getUser()");
  const papel = texto.indexOf('app_metadata?.papel !== "operador"');
  const negacao = texto.indexOf(guarda, papel);
  const admin = texto.indexOf("createAdminClient()", papel);
  return sessao >= 0 && papel > sessao && negacao > papel && admin > negacao;
}

const encontrados = listar(raiz);
assert.deepEqual(encontrados.filter((p) => p.endsWith("/page.tsx") || p === "page.tsx").sort(),
  [...paginasEsperadas].sort(), "rota nova exige revisão explícita da autorização");
assert.deepEqual(encontrados.filter((p) => p.endsWith("/actions.ts")).sort(),
  [...actionsEsperadas].sort(), "action nova exige revisão explícita da autorização");

for (const pagina of paginasEsperadas) {
  const texto = readFileSync(join(raiz, pagina), "utf8");
  assert.ok(guardaAntesDoAdmin(texto, "notFound()"),
    `${pagina}: confirmar operador autenticado e negar antes do cliente administrativo`);
  assert.ok(!texto.includes('app_metadata?.papel === "gestor_agencia"'),
    `${pagina}: papel de agência não pode ganhar acesso global`);
}

const criativos = readFileSync(join(raiz, "criativos", "actions.ts"), "utf8");
const funcoesCriativos = criativos.split(/export async function /).slice(1);
assert.deepEqual(funcoesCriativos.map((f) => f.match(/^\w+/)?.[0]),
  ["revisarPecaAction", "sincronizarTarefaPecaAction"]);
for (const trecho of funcoesCriativos) {
  assert.ok(guardaAntesDoAdmin(trecho, 'return { erro: "Acesso não autorizado." }'),
    "action de criativos deve negar cliente antes do service_role");
}

const tarefas = readFileSync(join(raiz, "tarefas", "actions.ts"), "utf8");
assert.ok(tarefas.includes('user?.app_metadata?.papel === "operador"'),
  "helper da fila precisa exigir papel interno");
const funcoesTarefas = tarefas.split(/export async function /).slice(1);
assert.deepEqual(funcoesTarefas.map((f) => f.match(/^\w+/)?.[0]),
  ["criarTarefaAction", "assumirContaAction", "assumirTarefaAction",
    "prepararContaAction", "concluirTarefaAction"]);
for (const trecho of funcoesTarefas) {
  const operador = trecho.indexOf("await operador()");
  const negacao = trecho.indexOf('return { erro: "Acesso não autorizado." }', operador);
  const admin = trecho.indexOf("createAdminClient()", operador);
  assert.ok(operador >= 0 && negacao > operador && admin > negacao,
    "action de tarefas deve negar cliente antes do service_role");
}

assert.equal(guardaAntesDoAdmin('const admin = createAdminClient(); .auth.getUser(); app_metadata?.papel !== "operador"; notFound()', "notFound()"), false,
  "o teste detecta cliente administrativo antes da guarda");
console.log(`Portas internas da mesa: ${paginasEsperadas.length} páginas e ${funcoesCriativos.length + funcoesTarefas.length} actions conferidas estaticamente.`);
