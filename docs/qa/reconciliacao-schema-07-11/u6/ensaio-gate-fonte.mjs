// Regressao isolada da fonte corrigida, somente PGlite. Nao usa runners anteriores.
import assert from 'node:assert/strict';
import {fixture,read} from './fixture.mjs';
const db=await fixture();
try{
 await db.exec(read('delta.sql'));
 const scalar=async q=>Object.values((await db.query(q)).rows[0])[0];
 await db.exec('set role service_role');assert.equal(await scalar('select public.checkout_producao_schema_v1()'),1);await db.exec('reset role');
 await db.exec('revoke insert on public.commercial_orders from service_role;');
 assert.equal(await scalar("select has_table_privilege('service_role','public.commercial_orders','INSERT')"),false);
 await db.exec('set role service_role');const gate=await scalar('select public.checkout_producao_schema_v1()');
 assert.equal(gate,0);
 console.log(JSON.stringify({correctedSourceGateAfterRevoke:gate,effectiveInsert:false,local:true,remote:false}));
}finally{await db.close();}
