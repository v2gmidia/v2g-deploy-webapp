import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { registerHooks } from "node:module";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";

const businessId = "11111111-1111-4111-8111-111111111111";
const operatorId = "22222222-2222-4222-8222-222222222222";
const ownerId = "33333333-3333-4333-8333-333333333333";
const env = {
  V2G_QA_MANAGER_METRICS_REHEARSAL_ENABLED: "true", V2G_MANAGER_WORK_ENABLED: "true",
  V2G_MANAGER_METRICS_READ_ENABLED: "true", VERCEL_PROJECT_ID: "prj_1IAiggJ2vbiT2h4kmbTW3UZIAStn",
  VERCEL_PROJECT_PRODUCTION_URL: "v2g-webapp-qa.vercel.app",
  NEXT_PUBLIC_SITE_URL: "https://v2g-webapp-qa.vercel.app",
  NEXT_PUBLIC_SUPABASE_URL: "https://zskpijnqgkqwxksqmzmf.supabase.co",
  V2G_QA_MANAGER_BUSINESS_ID: businessId, V2G_QA_MANAGER_OPERATOR_PROFILE_ID: operatorId,
  V2G_QA_MANAGER_BUSINESS_NAME: "Negócio fictício <QA>",
  V2G_QA_MANAGER_DESDE: "2026-10-20", V2G_QA_MANAGER_ATE: "2026-10-26",
  V2G_BACKEND_URL: "https://ia-backend-qa.5hue9s.easypanel.host",
};
const names = [...Object.keys(env), "V2G_QA_MANAGER_BACKEND_READ_VERIFIED"];
const previous = Object.fromEntries(names.map(k => [k, process.env[k]]));
const mocks = {
  "server-only": "export {};",
  "next/navigation": "export function notFound(){throw new Error('NOT_FOUND')} ;",
  "@/lib/supabase/server": "export const createClient = async () => globalThis.__qaManager.client();",
  "@/lib/supabase/admin": "export const createAdminClient = () => globalThis.__qaManager.admin();",
  "@/lib/backend/metricas-da-carteira": "export const lerMetricasDaCarteira = async (args) => globalThis.__qaManager.metrics(args);",
};
const hook = registerHooks({
  resolve(s,c,next) {
    if (Object.hasOwn(mocks,s)) return {url:`qa-mock:${s}`,shortCircuit:true};
    const base = s.startsWith("@/") ? new URL(`../${s.slice(2)}`,import.meta.url)
      : s.startsWith(".") && c.parentURL?.startsWith("file:") ? new URL(s,c.parentURL) : null;
    if (base) for (const suffix of ["", ".ts", ".tsx"]) {
      const url = new URL(`${base.href}${suffix}`);
      if (existsSync(url) && /\.(tsx?|css)$/.test(url.pathname)) return {url:url.href,shortCircuit:true};
    }
    return next(s,c);
  },
  load(u,c,next) {
    if (u.startsWith("qa-mock:")) return {format:"module",source:mocks[u.slice(8)],shortCircuit:true};
    if (u.endsWith(".css")) return {format:"module",source:"export default new Proxy({}, {get:(_,k)=>String(k)})",shortCircuit:true};
    if (u.startsWith("file:") && /\.tsx?$/.test(u)) return {format:"module",shortCircuit:true,
      source:ts.transpileModule(readFileSync(fileURLToPath(u),"utf8"),{fileName:fileURLToPath(u),
        compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText};
    return next(u,c);
  },
});
let state;
globalThis.__qaManager = {
  client: () => ({auth:{getUser:async()=>{
    state.calls.push("session"); return {data:{user:state.user},error:state.authError};
  }}}),
  admin: () => {
    state.calls.push("admin");
    return {from(table){
      assert.ok(["manager_accounts","businesses","creative_review_requests"].includes(table));
      const filters={}; let columns;
      const run=async()=>{
        state.queries.push({table,filters:{...filters},columns});
        if (state.failTable===table) return {error:{message:"PRIVATE_DATABASE_ERROR"},data:null,count:null};
        const row=table==="manager_accounts" ? state.assignment : state.business;
        if (table==="creative_review_requests") {
          assert.deepEqual(filters,{business_id:businessId});
          return {data:state.queue,error:null,count:state.queue.length};
        }
        const found=row && Object.entries(filters).every(([k,v])=>row[k]===v);
        return {data:found?Object.fromEntries(columns.split(",").map(k=>[k.trim(),row[k.trim()]])):null,error:null};
      };
      const q={select(c){columns=c;return q},eq(k,v){filters[k]=v;return q},order(){return q},
        limit(){return q},maybeSingle:run,then(resolve,reject){return run().then(resolve,reject)}};
      return q;
    }};
  },
  metrics:async(args)=>{state.metrics.push(args); return state.result;},
};
const {default:Page}=await import("../app/(supergestor)/supergestor/homologacao/page.tsx");
const render=async()=>renderToStaticMarkup(await Page());
const denied=async()=>assert.rejects(render,/NOT_FOUND/);
beforeEach(()=>{
  for (const name of names) delete process.env[name];
  Object.assign(process.env,env);
  state={calls:[],queries:[],metrics:[],user:{id:operatorId,app_metadata:{papel:"operador"}},
    assignment:{business_id:businessId,operator_profile_id:operatorId},
    business:{id:businessId,name:env.V2G_QA_MANAGER_BUSINESS_NAME,profile_id:ownerId,dados_ficticios:true},
    queue:[{id:"test-piece",original_name:"imagem-ficticia.png",status:"changes_requested",reviewed_at:null}],
    result:{ok:true,businessId,versao:"e28-07-v1",campanhas:[]}};
});
after(()=>{for(const name of names) previous[name]===undefined ? delete process.env[name] : process.env[name]=previous[name];
  delete globalThis.__qaManager; hook.deregister();});

test("flags ausentes/diferentes negam antes de sessão/admin",async()=>{
  for(const name of names.slice(0,3)) for(const value of [undefined,"false","TRUE"]) {
    Object.assign(process.env,env); if(value===undefined) delete process.env[name];else process.env[name]=value;
    await denied();
  }
  assert.deepEqual(state.calls,[]);
});
test("projeto/host/banco/URL de produção negam mesmo com flags copiadas",async()=>{
  for(const name of ["VERCEL_PROJECT_ID","VERCEL_PROJECT_PRODUCTION_URL","NEXT_PUBLIC_SITE_URL","NEXT_PUBLIC_SUPABASE_URL"]) {
    Object.assign(process.env,env); process.env[name]="producao-ou-host-adulterado"; await denied();
  }
  assert.deepEqual(state.calls,[]);
});
test("recorte incompleto, UUID inválido e datas inválidas/invertidas negam sem admin",async()=>{
  for(const [name,value] of [["V2G_QA_MANAGER_BUSINESS_ID","invalid"],["V2G_QA_MANAGER_OPERATOR_PROFILE_ID",""],
    ["V2G_QA_MANAGER_DESDE","2026-02-30"],["V2G_QA_MANAGER_ATE","2026-10-01"],["V2G_QA_MANAGER_BUSINESS_NAME",""]]) {
    Object.assign(process.env,env);process.env[name]=value;await denied();
  }
  assert.deepEqual(state.calls,[]);
});
test("anônimo, cliente, agência, outro operador, user_metadata e erro Auth negam antes de admin",async()=>{
  for(const user of [null,{id:operatorId,app_metadata:{papel:"cliente"}},
    {id:operatorId,app_metadata:{papel:"gestor_agencia"}},
    {id:ownerId,app_metadata:{papel:"operador"}}, {id:operatorId,user_metadata:{papel:"operador"}}]) {
    state.user=user;await denied();
  }
  state.user={id:operatorId,app_metadata:{papel:"operador"}};state.authError={message:"expired"};await denied();
  assert.ok(state.calls.every(c=>c==="session"));assert.deepEqual(state.queries,[]);assert.deepEqual(state.metrics,[]);
});
test("vínculo ausente, divergente ou erro não lê negócio/fila/backend",async()=>{
  for(const assignment of [null,{business_id:businessId,operator_profile_id:ownerId}]) {
    state.assignment=assignment;await denied();
  }
  state.failTable="manager_accounts";await denied();
  assert.ok(state.queries.every(q=>q.table==="manager_accounts"));assert.deepEqual(state.metrics,[]);
});
test("negócio real, nome alterado, dono inválido ou erro bloqueiam fila e backend",async()=>{
  for(const patch of [{dados_ficticios:false},{name:"Outro negócio"},{profile_id:"invalid"},{id:ownerId}]) {
    state.business={id:businessId,name:env.V2G_QA_MANAGER_BUSINESS_NAME,profile_id:ownerId,dados_ficticios:true,...patch};
    await denied();
  }
  assert.ok(state.queries.every(q=>q.table!=="creative_review_requests"));assert.deepEqual(state.metrics,[]);
});
test("página real: fila exata, texto escapado e aviso permanente; backend fechado por padrão",async()=>{
  const html=await render();assert.match(html,/Homologação QA/);assert.match(html,/Negócio fictício &lt;QA&gt;/);
  assert.match(html,/Ajustes solicitados/);assert.match(html,/Nenhum número foi consultado/);
  assert.match(html,new RegExp(`negocio=${businessId}`));assert.deepEqual(state.metrics,[]);
  assert.deepEqual(state.queries.map(q=>q.table),["manager_accounts","businesses","creative_review_requests"]);
});
test("origem desconhecida/HTTP/produção permanece sem chamada mesmo com aprovação ligada",async()=>{
  process.env.V2G_QA_MANAGER_BACKEND_READ_VERIFIED="true";
  for(const origin of ["http://ia-backend-qa.5hue9s.easypanel.host","https://backend-prod.invalid",""]) {
    process.env.V2G_BACKEND_URL=origin;assert.match(await render(),/Nenhum número foi consultado/);
  }
  assert.deepEqual(state.metrics,[]);
});
test("backend aprovado recebe só recorte do servidor; query não amplia alvo ou período",async()=>{
  process.env.V2G_QA_MANAGER_BACKEND_READ_VERIFIED="true";
  const html=renderToStaticMarkup(await Page({searchParams:Promise.resolve({businessId:ownerId,desde:"2000-01-01"})}));
  assert.match(html,/Nenhuma execução retornada/);assert.equal(state.metrics.length,1);
  assert.equal(state.metrics[0].businessId,businessId);assert.equal(state.metrics[0].desde,env.V2G_QA_MANAGER_DESDE);
});
test("erro de fila é indisponibilidade e estado desconhecido não vira aprovado",async()=>{
  state.failTable="creative_review_requests";let html=await render();
  assert.match(html,/fila não pôde ser consultada/);assert.doesNotMatch(html,/PRIVATE_DATABASE_ERROR|0 peça/);
  state.failTable=null;state.queue[0].status="misterio";html=await render();assert.match(html,/Estado a conferir/);
});
test("consumidor existente mantém mensagem normalizada e ausência distinta de zero",async()=>{
  process.env.V2G_QA_MANAGER_BACKEND_READ_VERIFIED="true";
  state.result={ok:false,motivo:"resposta_invalida",mensagem:"NAO_USAR_CORPO_CRU"};
  const html=await render();assert.match(html,/Contrato de leitura ausente ou incompatível/);
  assert.doesNotMatch(html,/NAO_USAR_CORPO_CRU/);
});
