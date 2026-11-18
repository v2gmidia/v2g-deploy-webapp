// Confere a proposta contra funções puras da fonte publicada. Sem rede ou .env.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(process.argv[2]||'C:/Users/victo/.codex/private-backups/v2g/2026-11-17-comercial-oficial-producao/source-webapp');
const matrix=JSON.parse(await readFile(join(here,'matriz.json'),'utf8'));
const load=path=>import(pathToFileURL(join(root,path)).href);
const official=await load('lib/contratacao/ambiente-comercial-oficial-v1.ts');
const delivery=await load('lib/contratacao/entrega-contexto-v1.ts');
const recurrence=await load('lib/contratacao/recorrencia-contexto-v1.ts');
const checkout=await load('lib/contratacao/checkout-contexto-v1.ts');
const checks=[];
function check(name,actual,expected){assert.deepEqual(actual,expected,name);checks.push(name);}
const synthetic={NODE_ENV:'production',VERCEL:'1',VERCEL_ENV:'production',
  VERCEL_PROJECT_ID:'prj_XkBzxAXLf9piL4yqIqT6ZA4pmOCl',
  VERCEL_PROJECT_PRODUCTION_URL:'app.v2gmidia.com.br',
  NEXT_PUBLIC_SUPABASE_URL:'https://ushccxpoxjikzqnwhgfd.supabase.co',
  NEXT_PUBLIC_SITE_URL:'https://app.v2gmidia.com.br',ASAAS_ENVIRONMENT:'production',
  V2G_PRODUCTION_CHECKOUT_URL:'https://app.v2gmidia.com.br/contratar',
  ASAAS_PRODUCTION_API_KEY:'synthetic-production-key-not-a-credential',
  ASAAS_PRODUCTION_WEBHOOK_TOKEN:'synthetic-webhook-placeholder-not-a-credential',
  TURNSTILE_SITE_KEY:'synthetic-site',TURNSTILE_SECRET_KEY:'synthetic-secret',
  V2G_TURNSTILE_ALLOWED_HOSTNAMES:'app.v2gmidia.com.br',
  V2G_CHECKOUT_SECURITY_HASH_SECRET:'synthetic-hash-placeholder-not-a-credential',
  V2G_PRODUCTION_PAYMENT_EMAIL_RESEND_API_KEY:'synthetic-resend-not-a-credential',
  V2G_PRODUCTION_PAYMENT_EMAIL_FROM:'pagamentos@send.v2gmidia.com.br'};
const current={...synthetic,...Object.fromEntries(matrix.webappChanges.map(x=>[x.key,x.from]))};
const state=env=>({entry:official.entradaComercialOficialAtiva(env),financial:official.financeiroComercialOficialAtivo(env),
  checkout:checkout.checkoutContextoAtivo(env),delivery:delivery.entregaContextoAtiva(env),
  coverage:official.coberturaComercialOficialAtiva(env),recurrence:recurrence.recorrenciaContextoAtiva(env)});
check('17 alterações únicas',new Set(matrix.webappChanges.map(x=>x.key)).size,17);
check('nenhuma execução autorizada',matrix.executionAuthorized,false);
check('uma unidade de R$ 500', [matrix.scope.unitCount,matrix.scope.amountCents],[1,50000]);
for(const x of matrix.webappChanges)check('OFF observado: '+x.key,matrix.evidence.observedWeb.envs.find(e=>e.key===x.key)?.value,x.from);
check('estado fechado',state(current),{entry:false,financial:false,checkout:false,delivery:false,coverage:false,recurrence:false});
const entry={...current,...Object.fromEntries(matrix.webappChanges.filter(x=>x.phase==='entry').map(x=>[x.key,x.to]))};
check('entrada não cobra nem envia',state(entry),{entry:true,financial:false,checkout:false,delivery:false,coverage:false,recurrence:false});
const processing={...entry,...Object.fromEntries(matrix.webappChanges.filter(x=>x.phase==='processing').map(x=>[x.key,x.to]))};
check('processamento antes de permitir compra',state(processing),{entry:true,financial:true,checkout:false,delivery:true,coverage:true,recurrence:true});
const enabled={...synthetic,...Object.fromEntries(matrix.webappChanges.map(x=>[x.key,x.to]))};
check('matriz futura completa satisfaz os guards',state(enabled),{entry:true,financial:true,checkout:true,delivery:true,coverage:true,recurrence:true});
for(const key of ['V2G_COMMERCIAL_PRODUCTION_ENTRY_V1_ENABLED','V2G_COMMERCIAL_FINANCIAL_V1_ENABLED','V2G_COMMERCIAL_CHECKOUT_V1_ENABLED',
  'V2G_PRODUCTION_CHECKOUT_ENABLED','V2G_PRODUCTION_PAYMENT_PROCESSING_ENABLED','V2G_PRODUCTION_URL_CONFIRMED',
  'V2G_PRODUCTION_PAYMENT_EMAIL_ENABLED','V2G_PRODUCTION_3DS_CONFIRMED','V2G_CHECKOUT_API_ENABLED','V2G_CHECKOUT_SECURITY_ENABLED',
  'V2G_CHECKOUT_3DS_SCHEMA_ENABLED','V2G_CHECKOUT_3DS_ENABLED'])check('checkout exige '+key,checkout.checkoutContextoAtivo({...enabled,[key]:'false'}),false);
for(const [key,value] of [['VERCEL_PROJECT_ID','other-project'],['NEXT_PUBLIC_SUPABASE_URL','https://zskpijnqgkqwxksqmzmf.supabase.co'],
  ['NEXT_PUBLIC_SITE_URL','https://v2g-deploy-webapp.vercel.app']])check('recusa identidade divergente: '+key,checkout.checkoutContextoAtivo({...enabled,[key]:value}),false);
const closeNew={...enabled,V2G_COMMERCIAL_CHECKOUT_V1_ENABLED:'false',V2G_PRODUCTION_CHECKOUT_ENABLED:'false',V2G_CHECKOUT_API_ENABLED:'false'};
check('fechar compra preserva conciliação/cobertura',state(closeNew),{entry:true,financial:true,checkout:false,delivery:true,coverage:true,recurrence:true});
check('LP sem divulgação de compra',[matrix.publicPurchase.lpEntry,matrix.publicPurchase.lpBuyCTA],['0','0']);
check('limite de exclusividade declarado',matrix.publicPurchase.exclusiveBuyerGatePresent,false);
const result={checkedAt:new Date().toISOString(),checks:checks.length,passed:true,scope:'Funções puras da fonte publicada com valores sintéticos; sem rede/.env/configuração real.',
  doesNotProve:['credenciais reais','handshake LP','webhook autenticado','pagamento real','entrega em caixa','nova sessão','restrição exclusiva do piloto'],names:checks};
await writeFile(join(here,'verificacao-local.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,checks:checks.length,externalCalls:0,productionMutations:0}));
