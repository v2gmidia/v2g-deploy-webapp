/** Migração em PostgreSQL efêmero: sem Supabase, rede ou dados reais. */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";

const modulo = process.env.V2G_PGLITE_MODULE
  ?? "C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js";
const { PGlite } = await import(pathToFileURL(modulo).href);
const db = new PGlite();
const migration = (nome) => readFileSync(new URL(`../supabase/migrations/${nome}`, import.meta.url), "utf8");
const v1 = { versao: 1, objetivo: "Apresentar serviço", oferta: "Corte", acao: "Chamar no WhatsApp", promocao: false, validade: null };
const uploadV1 = { version: 1, objective: "whatsapp_messages", promotionEndsOn: null, confirmedAt: "2026-10-21T03:00:00.123Z" };
const perfil = "11111111-1111-4111-8111-111111111111";
const negocio = "22222222-2222-4222-8222-222222222222";
let antes;

before(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table public.profiles(id uuid primary key);
    create table public.businesses(id uuid primary key,profile_id uuid references profiles,dados_ficticios boolean not null default true);
    create table public.manager_accounts(business_id uuid,operator_profile_id uuid);
    create schema supabase_migrations;
    create table supabase_migrations.schema_migrations(version text,name text);`);
  await db.exec(migration("20261009034500_fila_revisao_criativos.sql"));
  await db.exec(migration("20261021032617_creative_review_upload_intent.sql"));
  await db.exec(migration("20261021001651_creative_generation_requests.sql"));
  await db.query("insert into profiles(id) values($1)", [perfil]);
  await db.query("insert into businesses(id,profile_id) values($1,$2)", [negocio, perfil]);
  antes = (await db.query(`select c.relname, c.relacl::text acl, c.relrowsecurity
    from pg_class c where c.oid in ('public.creative_generation_requests'::regclass,
      'public.creative_review_requests'::regclass) order by c.relname`)).rows;
  await db.exec(migration("20261026193000_referencia_publica_pedido_criativo.sql"));
});
after(async () => { await db.close(); });

const inserirPedido = (payload) => db.query(`insert into creative_generation_requests
  (id,business_id,requested_by,content_hash,payload) values($1,$2,$3,$4,$5)`,
  [randomUUID(), negocio, perfil, "a".repeat(64), JSON.stringify(payload)]);
const inserirEnvio = (upload) => {
  const id = randomUUID();
  return db.query(`insert into creative_review_requests
    (id,business_id,submitted_by,file_path,original_name,mime_type,size_bytes,sha256,upload_intent)
    values($1,$2,$3,$4,'ficticia.png','image/png',8,$5,$6)`,
  [id, negocio, perfil, `${negocio}/${id}`, "a".repeat(64), JSON.stringify(upload)]);
};
test("v1 continua aceito e v2 exige ID público em ambas as tabelas", async () => {
  await inserirPedido(v1);
  await inserirEnvio(uploadV1);
  await inserirPedido({ ...v1, versao: 2, referenciaId: "700155112131034" });
  await inserirEnvio({ ...uploadV1, version: 2, referenceId: "700155112131034" });
  for (const payload of [{ ...v1, versao: 2 }, { ...v1, versao: 2, referenciaId: "https://evil.example" }])
    await assert.rejects(inserirPedido(payload));
  for (const upload of [{ ...uploadV1, version: 2 },
    { ...uploadV1, version: 2, referenceId: "https://evil.example" },
    { ...uploadV1, version: 2, referenceId: "700155112131034", extra: true }])
    await assert.rejects(inserirEnvio(upload));
});
test("migration não amplia permissões ou desliga RLS", async () => {
  assert.deepEqual((await db.query(`select c.relname, c.relacl::text acl, c.relrowsecurity
    from pg_class c where c.oid in ('public.creative_generation_requests'::regclass,
      'public.creative_review_requests'::regclass) order by c.relname`)).rows, antes);
});
