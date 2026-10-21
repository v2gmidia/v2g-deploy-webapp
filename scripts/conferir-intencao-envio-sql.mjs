/** Ensaio PostgreSQL efêmero: sem .env, rede, Supabase, JWT real ou Storage real. */
import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

const modulo = process.env.V2G_PGLITE_MODULE
  ?? "C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js";
const { PGlite } = await import(pathToFileURL(modulo).href);
const db = new PGlite();
const dono = "11111111-1111-4111-8111-111111111111";
const outro = "22222222-2222-4222-8222-222222222222";
const gestor = "33333333-3333-4333-8333-333333333333";
const negocio = "44444444-4444-4444-8444-444444444444";
const negocioAlheio = "55555555-5555-4555-8555-555555555555";
const legado = "66666666-6666-4666-8666-666666666666";
const valido = { version: 1, objective: "whatsapp_messages", promotionEndsOn: null,
  confirmedAt: "2026-10-21T03:00:00.123Z" };
let aclAntes, policiesAntes;

const inserir = async (intencao, biz = negocio, perfil = dono, id = randomUUID()) => db.query(
  `insert into creative_review_requests
    (id,business_id,submitted_by,file_path,original_name,mime_type,size_bytes,sha256,upload_intent)
    values($1,$2,$3,$4,'imagem-ficticia.png','image/png',8,$5,$6) returning id`,
  [id, biz, perfil, `${biz}/${id}`, "a".repeat(64), intencao === null ? null : JSON.stringify(intencao)]);

before(async () => {
  // Serviços mínimos simulados para executar a migration BASE verdadeira.
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    alter default privileges in schema public grant all on tables to service_role;
    create schema auth; grant usage on schema auth to authenticated;
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table public.profiles(id uuid primary key);
    create table public.businesses(id uuid primary key,profile_id uuid references profiles,dados_ficticios boolean not null default true);
    create table public.manager_accounts(business_id uuid,operator_profile_id uuid);
    create schema supabase_migrations;
    create table supabase_migrations.schema_migrations(version text,name text);
    alter table public.businesses enable row level security;
    grant select on public.businesses to authenticated;
    create policy negocio_proprio on public.businesses for select to authenticated
      using(profile_id=(select auth.uid()));`);
  for (const id of [dono, outro, gestor]) await db.query("insert into profiles values($1)", [id]);
  await db.query("insert into businesses(id,profile_id) values($1,$2),($3,$4)", [negocio,dono,negocioAlheio,outro]);
  await db.exec(readFileSync(new URL("../supabase/migrations/20261009034500_fila_revisao_criativos.sql", import.meta.url), "utf8"));
  await db.query(`insert into creative_review_requests
    (id,business_id,submitted_by,file_path,original_name,mime_type,size_bytes,sha256)
    values($1,$2,$3,$4,'legado.png','image/png',8,$5)`, [legado,negocio,dono,`${negocio}/${legado}`,"a".repeat(64)]);
  aclAntes = (await db.query("select relacl::text as acl from pg_class where oid='public.creative_review_requests'::regclass")).rows;
  policiesAntes = (await db.query("select policyname,cmd,qual,with_check from pg_policies where tablename='creative_review_requests'")).rows;
  await db.exec(readFileSync(new URL("../supabase/migrations/20261021032617_creative_review_upload_intent.sql", import.meta.url), "utf8"));
});
after(async () => { await db.close(); });

test("migration exata preserva legado NULL e permite novos objetivos fechados", async () => {
  assert.equal((await db.query("select upload_intent from creative_review_requests where id=$1", [legado])).rows[0].upload_intent, null);
  for (const objective of ["whatsapp_messages", "instagram_visits"])
    assert.equal((await inserir({ ...valido, objective })).rows.length, 1);
  assert.equal((await inserir(null)).rows.length, 1);
});
test("JSON null, lista e objeto incompleto não passam pelo NULL do CHECK", async () => {
  await assert.rejects(db.query("update creative_review_requests set upload_intent='null'::jsonb where id=$1", [legado]));
  for (const valor of [[], {}, {version:1}, { ...valido, objective:null }, { ...valido, confirmedAt:null }])
    await assert.rejects(inserir(valor));
  const incompleto = { ...valido }; delete incompleto.promotionEndsOn;
  await assert.rejects(inserir(incompleto));
});
test("versão, objetivo, propriedades extras e tamanho são restritos", async () => {
  for (const valor of [{ ...valido, version:"1" }, { ...valido, version:2 }, { ...valido, objective:"vendas" },
    { ...valido, extra:true }, { ...valido, objective:"x".repeat(600) }]) await assert.rejects(inserir(valor));
});
test("validade aceita data real inclusive bissexto e nega data impossível/tipo errado", async () => {
  for (const promotionEndsOn of ["2028-02-29", "2099-12-31", "2020-01-01"])
    assert.equal((await inserir({ ...valido, promotionEndsOn })).rows.length, 1);
  // Prazo antigo permanece no histórico. Vencimento no envio/aprovação é guarda da aplicação.
  for (const promotionEndsOn of ["2026-02-30", "2026-02-29", "2026-13-01", "2026-00-10", "2026-1-1", 20261021, "2026-10-21T00:00:00Z"])
    await assert.rejects(inserir({ ...valido, promotionEndsOn }));
});
test("horário de confirmação exige formato UTC real e canônico", async () => {
  for (const confirmedAt of ["ontem", "2026-10-21", "2026-13-21T03:00:00.123Z", "2026-02-30T03:00:00.123Z", "2026-10-21T24:00:00.123Z"])
    await assert.rejects(inserir({ ...valido, confirmedAt }));
});
test("datas ISO não dependem de DateStyle ou fuso da sessão SQL", async () => {
  await db.exec("begin; set local datestyle='German, DMY'; set local timezone='Pacific/Kiritimati';");
  try { assert.equal((await inserir({ ...valido, promotionEndsOn:"2028-02-29" })).rows.length,1); }
  finally { await db.exec("rollback;"); }
});
test("RLS, policies e grants não são alargados pela nova coluna", async () => {
  assert.deepEqual((await db.query("select relacl::text as acl from pg_class where oid='public.creative_review_requests'::regclass")).rows, aclAntes);
  assert.deepEqual((await db.query("select policyname,cmd,qual,with_check from pg_policies where tablename='creative_review_requests'")).rows, policiesAntes);
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.creative_review_requests'::regclass")).rows[0].relrowsecurity, true);
  for (const role of ["anon", "authenticated"]) for (const op of ["INSERT", "UPDATE", "DELETE"])
    assert.equal((await db.query("select has_table_privilege($1,'creative_review_requests',$2) as ok", [role,op])).rows[0].ok, false);
  assert.equal((await db.query("select has_column_privilege('authenticated','creative_review_requests','upload_intent','SELECT') as ok")).rows[0].ok, true);
});

async function como(role, perfil, acao) {
  await db.exec(`begin; set local role ${role};`); // role só vem de literais deste ensaio
  try { await db.query("select set_config('request.jwt.claim.sub',$1,true)", [perfil]); return await acao(); }
  finally { await db.exec("rollback;"); }
}
test("SELECT SQL sob identidade simulada isola negócios e não concede carteira ao gestor", async () => {
  await inserir(valido, negocioAlheio, outro);
  const minhas = await como("authenticated", dono, () => db.query("select business_id from creative_review_requests"));
  assert.ok(minhas.rows.length > 0 && minhas.rows.every((l) => l.business_id === negocio));
  const alheias = await como("authenticated", outro, () => db.query("select business_id from creative_review_requests"));
  assert.ok(alheias.rows.length > 0 && alheias.rows.every((l) => l.business_id === negocioAlheio));
  assert.equal((await como("authenticated", gestor, () => db.query("select id from creative_review_requests"))).rows.length, 0);
});
test("cliente não insere/atualiza e anon não lê nem com identidade simulada", async () => {
  await assert.rejects(como("authenticated", dono, () => inserir(valido)));
  await assert.rejects(como("authenticated", dono, () => db.query("update creative_review_requests set upload_intent=null where id=$1", [legado])));
  await assert.rejects(como("anon", dono, () => db.query("select id from creative_review_requests")));
});
test("bucket continua privado e limitado aos formatos/tamanho existentes", async () => {
  const b = (await db.query("select * from storage.buckets where id='creative-review'")).rows[0];
  assert.equal(b.public, false); assert.equal(Number(b.file_size_limit), 9437184);
  assert.deepEqual(b.allowed_mime_types, ["image/jpeg", "image/png"]);
});
test("pré-checagem somente leitura compila com schema/ledger simulados",async()=>{
  const antes=(await db.query("select count(*)::int as n from creative_review_requests")).rows[0].n;
  await db.exec(readFileSync(new URL("./sql/prechecar-qa-envio-criativo.sql",import.meta.url),"utf8"));
  assert.equal((await db.query("select count(*)::int as n from creative_review_requests")).rows[0].n,antes);
});
test("modelo de limpeza exige alvo exato e rollback é o padrão",async()=>{
  const id=randomUUID();await inserir(valido,negocio,dono,id);
  await db.query("update creative_review_requests set original_name='E28-QA-ficticio.png' where id=$1",[id]);
  const modelo=readFileSync(new URL("./sql/limpeza-qa-envio-criativo-modelo.sql",import.meta.url),"utf8");
  const params={review_id:id,business_id:negocio,actor_id:dono,sha256:"a".repeat(64)};
  const renderizar=(p)=>modelo.replace(/:'([a-z0-9_]+)'/g,(_,k)=>`'${p[k].replaceAll("'","''")}'`);
  const sql=renderizar(params);
  await db.exec(sql);
  assert.equal((await db.query("select count(*)::int as n from creative_review_requests where id=$1",[id])).rows[0].n,1);
  await assert.rejects(db.exec(renderizar({...params,sha256:"b".repeat(64)})),/alvo_qa_divergente/);
  await db.exec("rollback;");
  // COMMIT apenas nesta base efêmera; nunca executa a limpeza de QA real.
  await db.exec(sql.replace(/rollback;\s*$/i,"commit;"));
  assert.equal((await db.query("select count(*)::int as n from creative_review_requests where id=$1",[id])).rows[0].n,0);
  assert.equal((await db.query("select count(*)::int as n from creative_review_requests where id=$1",[legado])).rows[0].n,1);
});
