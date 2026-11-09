// Central: SQL final em PostgreSQL descartável; sem rede, .env ou banco externo.
import assert from 'node:assert/strict';
import { fixture, read, snapshot } from '../u5/fixture.mjs';
const db = await fixture();
const applyName = 'qa_reconciliacao_u5_documentos_acesso_historico_20261108';
const returnName = 'qa_reconciliacao_u5_documentos_acesso_historico_retorno_20261108';
const before = await snapshot(db);
let stage = 'PRE';
try {
  // Drift somente no default, mantendo corpo/assinatura/ACL anteriores.
  const fn = 'public.escrever_apenas_se_livre(uuid,text,jsonb,text,text,uuid)';
  const original = (await db.query('select pg_get_functiondef($1::regprocedure) body',[fn])).rows[0].body;
  assert.equal(original.split('DEFAULT NULL::uuid').length-1,1);
  await db.exec(original.replace('DEFAULT NULL::uuid',"DEFAULT '00000000-0000-0000-0000-000000000099'::uuid"));
  const drift = await snapshot(db);
  assert.deepEqual(drift.functions,before.functions);
  assert.notDeepEqual(drift.u3_function_details,before.u3_function_details);
  const defaultGuard = /pais\/helpers\/U1-U4|detalhes.*proteg|argumentos|defaults/;
  await assert.rejects(db.exec(read('u5-conferir-pre.sql')),defaultGuard);
  await db.exec('rollback');
  await assert.rejects(db.exec(read('u5-aplicar.sql')),defaultGuard);
  assert.deepEqual(await snapshot(db),drift);
  await db.exec(original);
  assert.deepEqual(await snapshot(db),before);
  await db.exec(read('u5-conferir-pre.sql'));
  stage = 'APLICAR';
  await db.exec(read('u5-aplicar.sql'));
  await db.query('insert into supabase_migrations.schema_migrations values($1,$2)', ['20261109990001', applyName]);
  await db.exec(read('u5-verificar.sql'));
  const after = await snapshot(db);
  assert.equal(before.ledger.length, 48);
  assert.equal(after.ledger.length, 49);
  assert.deepEqual(after.ledger.filter(x => x.version !== '20261109990001'), before.ledger);
  const names = ['fiscal_obligations', 'commercial_manual_evidence', 'historical_contract_access', 'historical_contract_access_events'];
  assert.equal(after.relations.filter(x => names.includes(x.relname)).length, 4);
  assert.equal(after.sequences[0].max, '9223372036854775807');
  // Os dois máximos viram o mesmo Number em JS. SQL/texto deve distingui-los.
  assert.equal(Number('9223372036854775807'), Number('9223372036854775806'));
  await db.exec('alter sequence public.historical_contract_access_events_id_seq maxvalue 9223372036854775806;');
  await assert.rejects(db.exec(read('u5-verificar.sql')), /delta\/corpos\/ACL\/triggers\/geracao divergiram/);
  await db.exec('rollback');
  await db.exec('alter sequence public.historical_contract_access_events_id_seq maxvalue 9223372036854775807;');
  assert.deepEqual(await snapshot(db), after);
  const privileges = (await db.query(`select
    has_table_privilege('anon','public.fiscal_obligations','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') anon_fiscal,
    has_table_privilege('service_role','public.fiscal_obligations','SELECT') service_select,
    has_table_privilege('service_role','public.fiscal_obligations','INSERT') service_insert,
    has_table_privilege('service_role','public.fiscal_obligations','UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN') service_extra,
    has_table_privilege('service_role','public.historical_contract_access_events','INSERT,UPDATE,DELETE') direct_events,
    has_function_privilege('anon','public.aceitar_acesso_contratado(uuid)','EXECUTE') anon_accept,
    has_function_privilege('authenticated','public.aceitar_acesso_contratado(uuid)','EXECUTE') owner_accept,
    has_function_privilege('authenticated','public.emitir_acesso_contratado(uuid,uuid,uuid,text)','EXECUTE') customer_issue
  `)).rows[0];
  assert.deepEqual(privileges, {anon_fiscal:false,service_select:true,service_insert:true,service_extra:false,direct_events:false,anon_accept:false,owner_accept:true,customer_issue:false});
  // Um dependente posterior deve impedir o retorno sem apagar o dependente.
  await db.exec('create view public.u5_central_later_dependency as select id from public.historical_contract_access;');
  await assert.rejects(db.exec(read('u5-retornar.sql')), /depend|view/i);
  assert.equal((await db.query("select to_regclass('public.u5_central_later_dependency') is not null ok")).rows[0].ok,true);
  await db.exec('drop view public.u5_central_later_dependency;');
  assert.deepEqual(await snapshot(db), after);
  await db.exec(read('u5-retornar.sql'));
  await db.query('insert into supabase_migrations.schema_migrations values($1,$2)', ['20261109990002', returnName]);
  const returned = await snapshot(db);
  assert.equal(returned.ledger.length, 50);
  const a = structuredClone(before), b = structuredClone(returned);
  delete a.ledger; delete b.ledger;
  assert.deepEqual(b, a);
  console.log(JSON.stringify({ok:true,local:true,remote:false,ledger:'48 -> 49 -> 50',priorPairsPreserved:48,newTables:4,defaultOnlyDriftRefusedBeforeDDL:true,bigintExactAndNegative:true,effectivePrivileges:true,laterViewRefusesReturnWithoutLoss:true,metadataRestored:true}));
} catch(e) { e.message = `${stage}: ${e.message}`; throw e; }
finally { await db.close(); }
