/** Offline: nao le .env, nao usa rede e nao aplica SQL/configuracao. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ambienteTs} from '../../../scripts/test-utils/ts-isolado.mjs';
import {configProducao} from '../../../scripts/test-utils/config-producao.mjs';

const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const manifest=JSON.parse(read('configuracao-preparada.json'));
const observed=JSON.parse(read('metadados-observados.json'));
const checks=[];
const check=(name,fn)=>{fn();checks.push(name);};
const policy=ambienteTs().load('lib/contratacao/ambiente-producao.ts');
const source=read('../../../lib/contratacao/ambiente-producao.ts');
const readinessPath='../../../supabase/migrations/20261105194728_public_checkout_production_readiness.sql';
const readiness=read(readinessPath);

function validate(m){
  assert.equal(m.status,'prepared-not-applied');
  assert.equal(m.applyNow,false);
  assert.equal(m.projectId,'prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl');
  assert.equal(m.productionDatabase,'ushccxpoxjikzqnwhgfd');
  assert.equal(m.checkoutUrl,policy.URL_COMPRA_PRODUCAO);
  assert.equal(new Set(m.config.map(e=>e.name)).size,m.config.length);
  for(const row of m.config){
    if(row.kind==='flag') assert.equal(row.preparedValue,'false',row.name);
    if(row.kind==='secret') assert.equal(row.preparedValue,null,row.name);
  }
  assert.equal(m.webhook.enabled,false);
  assert.equal(m.webhook.endpoint,m.origin+'/api/webhooks/asaas-production-payment');
  assert.equal(m.financialTrial.authorized,false);
  for(const key of ['account','buyer','method','amountCents','recurrence']) assert.equal(m.financialTrial[key],null);
  for(const key of new Set([...source.matchAll(/\bc\.([A-Z][A-Z0-9_]*)/g)].map(m=>m[1]))) {
    // Segredos Sandbox sao comparados para impedir reutilizacao; nao sao preparados para producao.
    if(!['ASAAS_API_KEY','ASAAS_WEBHOOK_TOKEN'].includes(key))
      assert.ok(m.config.some(e=>e.name===key),'Configuracao omitida: '+key);
  }
}

check('manifesto completo e fechado; nenhum segredo ou ensaio autorizado',()=>validate(manifest));
check('ativacao acidental invalida o preparo',()=>{
  for(const row of manifest.config.filter(e=>e.kind==='flag')){
    const changed=structuredClone(manifest);
    changed.config.find(e=>e.name===row.name).preparedValue='true';
    assert.throws(()=>validate(changed),undefined,row.name);
  }
});
check('preparo permanece OFF mesmo com segredos ficticios completos',()=>{
  const env=configProducao(); // Somente fixtures .invalid, sem ambiente herdado.
  for(const row of manifest.config){
    if(row.kind==='platform') env[row.name]=row.expected;
    else if(row.preparedValue!==null) env[row.name]=row.preparedValue;
  }
  assert.equal(policy.processamentoProducaoSeguro(env),false);
  assert.equal(policy.novasComprasProducaoSeguras(env),false);
});
check('fechar vendas preserva processamento separado quando futuramente autorizado',()=>{
  const env={...configProducao(),V2G_PRODUCTION_CHECKOUT_ENABLED:'false'};
  assert.equal(policy.processamentoProducaoSeguro(env),true);
  assert.equal(policy.novasComprasProducaoSeguras(env),false);
  for(const patch of [{VERCEL_ENV:'preview'},{VERCEL_PROJECT_ID:'prj_outro'},
    {NEXT_PUBLIC_SUPABASE_URL:'https://zskpijnqgkqwxksqmzmf.supabase.co'}])
    assert.equal(policy.processamentoProducaoSeguro({...env,...patch}),false);
});
check('inventario e SQL limitados a catalogos em somente leitura',()=>{
  assert.equal(observed.readOnly,'on');
  assert.equal(observed.productionDatabase,manifest.productionDatabase);
  const sql=read('preflight-somente-leitura.sql');
  assert.match(sql,/begin transaction read only/i);
  assert.doesNotMatch(sql,/\b(?:insert|update|delete|alter|create|drop|grant|revoke)\s+(?:into|from|table|function|schema|on)\b/i);
  assert.doesNotMatch(sql,/\b(?:from|join)\s+(?:public|auth)\./i);
});
check('endpoint, cadastro e recuperacao apontam para portas reais',()=>{
  assert.match(read('../../../app/api/webhooks/asaas-production-payment/route.ts'),/processarWebhookPagamento/);
  for(const path of ['../../../app/(public)/entrar/actions.ts','../../../app/(public)/recuperar/actions.ts'])
    assert.ok(read(path).includes('/auth/confirmar'));
  assert.deepEqual(manifest.auth.redirectUrls,[manifest.origin+'/auth/confirmar']);
});

const requiredColumns=readiness.slice(readiness.indexOf('-- Todas as colunas'),readiness.indexOf('foreach sig'));
const missingColumns=[...requiredColumns.matchAll(/\('([^']+)','([^']+)'\)/g)]
  .map(([,table,column])=>({table,column}))
  .filter(({table,column})=>!observed.tables.find(t=>t.name===table)?.columns?.includes(column));
const report={validation:'pass',checks:checks.length,details:checks,
  productionReadiness:'blocked',notApplied:true,externalEffects:0,
  observedAt:observed.observedAt,
  missingTables:observed.tables.filter(t=>!t.present).map(t=>t.name),
  missingFunctions:observed.functions.filter(f=>!f.present).map(f=>f.name),
  missingColumns,
  absentConfigNames:manifest.config.filter(e=>e.kind!=='platform'&&!observed.envMetadata.envs.some(o=>o.key===e.name)).map(e=>e.name),
  references:[['ambiente-producao.ts',source],['readiness.sql',readiness]].map(([name,text])=>({name,sha256:createHash('sha256').update(text).digest('hex')}))};
writeFileSync(new URL('resultado-preparo.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({validation:report.validation,checks:report.checks,productionReadiness:report.productionReadiness,
  missingTables:report.missingTables.length,missingFunctions:report.missingFunctions.length,missingColumns:missingColumns.length,externalEffects:0}));
