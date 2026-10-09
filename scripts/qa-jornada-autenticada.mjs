/** HTTP autenticado no v2g-webapp-qa. Somente identidades ficticias; remove tudo ao sair. */
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const appUrl = process.env.V2G_QA_LOCAL_URL ?? "http://localhost:3000";
assert.match(url, /^https:\/\/zskpijnqgkqwxksqmzmf\.supabase\.co\/?$/, "Projeto QA obrigatorio");
assert.match(appUrl, /^http:\/\/localhost:3000\/?$/, "Servidor local obrigatorio");
assert.ok(anonKey && adminKey);
const admin = createClient(url, adminKey, { auth: { persistSession: false, autoRefreshToken: false } });
const senha = randomBytes(24).toString("base64url");
const marcador = randomUUID();
const usuarios = [];
const negocios = [];
const pedidos = [];
const revisoes = [];
const arquivos = [];

async function conta(rotulo, operador = false) {
  const email = `qa-jornada-${rotulo}-${marcador}@example.invalid`;
  const criado = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true,
    app_metadata: operador ? { papel: "operador" } : {} });
  assert.ifError(criado.error);
  usuarios.push(criado.data.user.id);
  const perfil = await admin.from("profiles").upsert({ id: criado.data.user.id, full_name: `QA ${rotulo}` });
  assert.ifError(perfil.error);
  const jar = new Map();
  const sessao = createServerClient(url, anonKey, { cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (items) => items.forEach(({ name, value }) => jar.set(name, value)),
  } });
  const login = await sessao.auth.signInWithPassword({ email, password: senha });
  assert.ifError(login.error);
  return { id: criado.data.user.id, email, jar };
}

async function negocio(perfil, numero) {
  const criado = await admin.from("businesses").insert({
    profile_id: perfil.id, name: `QA Negocio ${numero}`, dados_ficticios: true,
  }).select("id").single();
  assert.ifError(criado.error);
  negocios.push(criado.data.id);
  return criado.data.id;
}

async function pedido(perfil, businessId, numero, aprovado, operadorId) {
  const criado = await admin.from("commercial_orders").insert({
    external_ref: `qa-jornada-${numero}-${marcador}`,
    buyer_profile_id: perfil.id, buyer_email: perfil.email,
    business_id: businessId, legal_name: `QA Empresa ${numero}`,
    cnpj: `000000000000${String(numero).padStart(2, "0")}`,
    declares_cnpj: true, sells_by_whatsapp: true, origin: "self_service",
    payment_method: "asaas_pix", billing_period: "monthly",
    unit_price_cents: 50000, discount_percent: 0, unit_count: 1, total_cents: 50000,
    status: aprovado ? "payment_approved" : "awaiting_payment",
    payment_approved_at: aprovado ? new Date().toISOString() : null,
    payment_approved_by: aprovado ? operadorId : null,
  }).select("id").single();
  assert.ifError(criado.error);
  pedidos.push(criado.data.id);
}

async function revisao(perfil, operador, businessId, numero, status) {
  const id = randomUUID();
  const caminho = `${businessId}/${id}`;
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9KUa0AAAAASUVORK5CYII=", "base64");
  const criada = await admin.from("creative_review_requests").insert({
    id, business_id: businessId, submitted_by: perfil.id,
    file_path: caminho, original_name: `qa-peca-${numero}.png`,
    mime_type: "image/png", size_bytes: png.length,
    sha256: createHash("sha256").update(png).digest("hex"),
    status, review_note: status === "changes_requested" ? "Trocar o texto da imagem." : null,
    reviewed_by: operador.id, reviewed_at: new Date().toISOString(),
  });
  assert.ifError(criada.error);
  revisoes.push(id);
  const subida = await admin.storage.from("creative-review").upload(caminho, png, { contentType: "image/png" });
  assert.ifError(subida.error);
  arquivos.push(caminho);
}

async function pagina(path, perfil, businessId) {
  const cookie = [...perfil.jar].map(([name, value]) => `${name}=${encodeURIComponent(value)}`);
  if (businessId) cookie.push(`v2g_negocio_ativo=${businessId}`);
  const resposta = await fetch(`${appUrl}${path}`, { redirect: "manual", headers: { cookie: cookie.join("; ") } });
  return { status: resposta.status, local: resposta.headers.get("location") ?? "", html: await resposta.text() };
}

try {
  const cliente = await conta("cliente");
  const pendente = await conta("pendente");
  const operador = await conta("operador", true);
  const primeiro = await negocio(cliente, 1);
  const segundo = await negocio(cliente, 2);
  const semPagamento = await negocio(pendente, 3);
  await pedido(cliente, primeiro, 1, true, operador.id);
  await pedido(cliente, segundo, 2, true, operador.id);
  await pedido(pendente, semPagamento, 3, false, operador.id);
  await revisao(cliente, operador, primeiro, 1, "changes_requested");
  await revisao(cliente, operador, segundo, 2, "approved_for_manual_publish");

  const escolha = await pagina("/criativos", cliente);
  assert.ok([302, 303, 307, 308].includes(escolha.status));
  assert.match(escolha.local, /escolher-negocio/);
  const um = await pagina("/criativos", cliente, primeiro);
  const dois = await pagina("/criativos", cliente, segundo);
  assert.equal(um.status, 200);
  assert.equal(dois.status, 200);
  assert.match(um.html, /Revisão do gestor/);
  assert.match(dois.html, /Revisão do gestor/);
  assert.match(um.html, /qa-peca-1.png/);
  assert.doesNotMatch(um.html, /qa-peca-2.png/);
  assert.match(dois.html, /qa-peca-2.png/);
  assert.doesNotMatch(dois.html, /qa-peca-1.png/);
  console.log("QA: dois negocios da mesma conta abrem criativos separadamente");

  const barrado = await pagina("/criativos", pendente, semPagamento);
  assert.ok([302, 303, 307, 308].includes(barrado.status));
  assert.match(barrado.local, /acesso-pendente/);
  console.log("QA: compra pendente nao libera o WebApp");

  const clienteGestor = await pagina("/gestor/criativos", cliente, primeiro);
  const operadorGestor = await pagina("/gestor/criativos", operador);
  const anonimoGestor = await fetch(`${appUrl}/gestor/criativos`, { redirect: "manual" });
  assert.notEqual(clienteGestor.status, 200);
  assert.ok([302, 303, 307, 308].includes(anonimoGestor.status));
  assert.match(anonimoGestor.headers.get("location") ?? "", /entrar/);
  assert.equal(operadorGestor.status, 200);
  assert.match(operadorGestor.html, /qa-peca-1.png/);
  assert.match(operadorGestor.html, /qa-peca-2.png/);
  console.log("QA: cliente e anonimo barrados da fila; operador autorizado");

  const avisos = await pagina("/alertas", cliente, primeiro);
  assert.equal(avisos.status, 200);
  assert.match(avisos.html, /Retorno dos criativos/);
  assert.match(avisos.html, /Trocar o texto da imagem/);
  assert.doesNotMatch(avisos.html, /qa-peca-2.png/);
  const avisosOutro = await pagina("/alertas", cliente, segundo);
  assert.equal(avisosOutro.status, 200);
  assert.match(avisosOutro.html, /qa-peca-2.png/);
  assert.doesNotMatch(avisosOutro.html, /qa-peca-1.png/);
  assert.match(avisosOutro.html, /publicação pelo gestor ainda precisa ser confirmada/);
  console.log("QA: avisos de criativos renderizados para o negocio ativo");
} finally {
  if (arquivos.length) await admin.storage.from("creative-review").remove(arquivos);
  if (revisoes.length) await admin.from("creative_review_requests").delete().in("id", revisoes);
  if (pedidos.length) await admin.from("commercial_orders").delete().in("id", pedidos);
  if (negocios.length) await admin.from("businesses").delete().in("id", negocios);
  for (const id of usuarios) await admin.auth.admin.deleteUser(id);
}
