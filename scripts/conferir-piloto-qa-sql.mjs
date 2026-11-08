/** Banco local descartável: prova escopo da concessão e da RPC sem Meta ou QA remoto. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

const { PGlite } = await import(pathToFileURL(process.env.V2G_PGLITE_MODULE ??
  "C:/Users/victo/v2g-finance/node_modules/@electric-sql/pglite/dist/index.js").href);
const migration = readFileSync(new URL("../supabase/migrations/20261105233528_qa_pilot_access.sql", import.meta.url), "utf8");

test("piloto QA: uma pessoa, um negócio, uma conta e revogação", async () => {
  const db = new PGlite();
  const owner = "09e25ab4-b55b-48d1-bfde-181e41192bb6";
  const business = "9cb85308-02cc-4ce7-bacf-15be77f9ba5e";
  const other = randomUUID(), connection = randomUUID();
  const account = "act_1165478988908157";
  const call = (profile, external = account, page = "206296256098753") => db.query(
    "select public.registrar_conta_piloto_qa($1,$2,$3,$4,'CA Dúú Gomes','BRL',$5) as id",
    [business, connection, profile, external, page],
  );
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key);
      create table public.businesses(id uuid primary key, profile_id uuid references auth.users(id));
      create table public.meta_connections(id uuid primary key, business_id uuid, meta_page_id text);
      create table public.commercial_orders(id uuid primary key, business_id uuid, status text);
      create table public.ad_accounts(
        id uuid primary key default gen_random_uuid(), business_id uuid, meta_connection_id uuid,
        external_id text, name text, currency text, ownership text, status text,
        is_active boolean default true, unique(business_id, external_id));
    `);
    await db.exec(migration);
    await db.query("insert into auth.users(id) values ($1),($2)", [owner, other]);
    await db.query("insert into public.businesses(id,profile_id) values ($1,$2)", [business, owner]);
    await db.query("insert into public.meta_connections(id,business_id) values ($1,$2)", [connection, business]);
    await db.query(`insert into public.qa_pilot_access
      (business_id,profile_id,ad_account_external_id,meta_page_id,granted_by,reason,expires_at)
      values ($1,$2,$3,'206296256098753',$2,'Piloto interno autorizado em QA',now()+interval '30 days')`,
      [business, owner, account]);

    assert.equal((await db.query("select has_table_privilege('authenticated','public.qa_pilot_access','SELECT') as ok")).rows[0].ok, false);
    assert.equal((await db.query("select has_function_privilege('authenticated','public.registrar_conta_piloto_qa(uuid,uuid,uuid,text,text,text,text)','EXECUTE') as ok")).rows[0].ok, false);
    await assert.rejects(call(other), /piloto qa nao autorizado/);
    await assert.rejects(call(owner, "act_9999999999999999"), /piloto qa nao autorizado/);
    await assert.rejects(call(owner, account, "9999999999999999"), /piloto qa nao autorizado/);

    const result = await call(owner);
    assert.ok(result.rows[0].id);
    assert.equal((await db.query("select count(*)::int as n from public.ad_accounts")).rows[0].n, 1);
    assert.equal((await db.query("select meta_page_id from public.meta_connections where id=$1", [connection])).rows[0].meta_page_id, "206296256098753");
    assert.equal((await db.query("select count(*)::int as n from public.commercial_orders")).rows[0].n, 0);

    const order = randomUUID();
    await db.query("insert into public.commercial_orders(id,business_id,status) values ($1,$2,'cancelled')", [order, business]);
    await assert.rejects(call(owner), /negocio com pedido deve usar fluxo contratado/);
    await db.query("delete from public.commercial_orders where id=$1", [order]);

    await db.query("update public.qa_pilot_access set revoked_at=now() where business_id=$1", [business]);
    await assert.rejects(call(owner), /piloto qa nao autorizado/);
  } finally {
    await db.close();
  }
});
