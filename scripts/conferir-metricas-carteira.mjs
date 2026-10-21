import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { lerPorExecucaoDaCarteira, VERSAO_DO_ADAPTADOR } from "../lib/gestor/contrato-metricas.ts";

// Uma só fixture canônica: lida no backend, sem cópia mantida neste repo.
const caminho = process.env.V2G_FIXTURE_CONTRATO_LOCAL
  ?? "C:/Users/victo/OneDrive/Documentos/GitHub/backend_v2g/tests/fixtures/e28_07_contrato_handoff.json";
const fixture = JSON.parse(readFileSync(caminho, "utf8"));
assert.equal(fixture.versao, VERSAO_DO_ADAPTADOR);
const casos = fixture.cenarios;
assert.equal(Object.keys(casos).length, 9);
const businessId = casos.vinculo_manual.business_id;
const execucaoId = casos.vinculo_manual.requisicao.id_execucao;
const operador = "33333333-3333-4333-8333-333333333333";
const dono = "44444444-4444-4444-8444-444444444444";
const outroBiz = "55555555-5555-4555-8555-555555555555";
const base = casos.sucesso_com_dados.contrato;
const entrada = (c = base) => ({ businessId, desde: c.desde, ate: c.ate });
function envelope(c = base, extras = {}) {
  return { business_id: businessId, desde: c.desde, ate: c.ate,
    investiu_centavos: 9999999, conversas: 9999999, // isca: totais de negócio são ignorados
    por_execucao: [{ id_execucao: execucaoId, contrato_de_leitura: structuredClone(c), ...extras }] };
}
const mocks = {
  "server-only": "export {};",
  "@/lib/supabase/server": "export const createClient = async () => globalThis.__carteiraOffline.cliente();",
  "@/lib/supabase/admin": "export const createAdminClient = () => globalThis.__carteiraOffline.admin();",
};
const arquivos = {
  "@/lib/gestor/contrato-metricas": "../lib/gestor/contrato-metricas.ts",
  "./cliente": "../lib/backend/cliente.ts",
  "./erros": "../lib/backend/erros.ts",
};
const hook = registerHooks({
  resolve(s,c,next) {
    if (Object.hasOwn(mocks,s)) return { url:`carteira-offline:${s}`,shortCircuit:true };
    if (Object.hasOwn(arquivos,s)) return {url:new URL(arquivos[s],import.meta.url).href,shortCircuit:true};
    return next(s,c);
  },
  load(u,c,next) {
    if (u.startsWith("carteira-offline:")) return {format:"module",source:mocks[u.slice(17)],shortCircuit:true};
    return next(u,c);
  },
});
let estado;
const fetchAnterior = globalThis.fetch;
process.env.V2G_BACKEND_URL = "https://backend-ficticio.invalid";
process.env.V2G_BACKEND_TOKEN = "token-ficticio-somente-no-processo-de-teste";
globalThis.fetch = async (url, opcoes) => {
  estado.chamadas.push({ url: String(url), metodo: opcoes.method });
  assert.equal(opcoes.method, "GET"); assert.equal(opcoes.cache, "no-store");
  assert.equal(opcoes.headers["X-V2G-Token"], "token-ficticio-somente-no-processo-de-teste");
  assert.deepEqual(estado.ordem.slice(0,3), ["sessao", "manager_accounts", "businesses"]);
  if (estado.falhaRede) throw Error("detalhe-privado-proibido");
  return new Response(JSON.stringify(estado.resposta), { status: estado.http, headers:{"Content-Type":"application/json"} });
};
const { lerMetricasDaCarteira } = await import("../lib/backend/metricas-da-carteira.ts");
after(() => { hook.deregister(); globalThis.fetch = fetchAnterior; delete globalThis.__carteiraOffline; });
beforeEach(() => {
  estado = { user: {id:operador,app_metadata:{papel:"operador"}}, authErro:null,
    atribuicoes:[{business_id:businessId,operator_profile_id:operador}],
    negocios:[{id:businessId,profile_id:dono}], falhaBanco:false,
    ordem:[], consultas:[], chamadas:[], http:200, resposta:envelope(), falhaRede:false };
});
globalThis.__carteiraOffline = {
  cliente: () => ({ auth:{getUser: async()=>{
    estado.ordem.push("sessao"); return {data:{user:estado.user},error:estado.authErro};
  }} }),
  admin: () => ({ from(tabela) {
    assert.ok(["manager_accounts","businesses"].includes(tabela));
    estado.ordem.push(tabela);
    const filtros={}; let colunas;
    const q = {
      select(c) {colunas=c;return q;}, eq(k,v) {filtros[k]=v;return q;},
      async maybeSingle() {
        estado.consultas.push({tabela,colunas,filtros});
        if (estado.falhaBanco) return {data:null,error:{message:"segredo-nao-repassar"}};
        const linhas=tabela==="manager_accounts"?estado.atribuicoes:estado.negocios;
        const achadas=linhas.filter(l=>Object.entries(filtros).every(([k,v])=>l[k]===v));
        if(achadas.length>1) return {data:null,error:{code:"duplicado"}};
        return {data:achadas[0]?Object.fromEntries(colunas.split(",").map(k=>[k.trim(),achadas[0][k.trim()]])):null,error:null};
      },
    }; return q;
  } }),
};

for (const [nome, caso] of Object.entries(casos)) {
  test(`fixture canônica ${nome}`, async () => {
    if (caso.tipo === "erro_http") {
      estado.http=caso.status; estado.resposta=caso.corpo??{};
      const r=await lerMetricasDaCarteira(entrada());
      assert.equal(r.ok,false);
      assert.equal(r.motivo,caso.status===401?"acesso_negado":caso.status===404?"nao_encontrado":"conflito");
      assert.doesNotMatch(JSON.stringify(r),/X-V2G-Token|detail|segredo/);
      return;
    }
    if(caso.tipo==="vinculo") {
      // A fixture de escrita não se torna leitura nem aciona POST automático.
      estado.resposta=caso;
      const r=await lerMetricasDaCarteira(entrada());
      assert.equal(r.ok,false);assert.equal(r.motivo,"resposta_invalida");
      assert.ok(estado.chamadas.every(c=>c.metodo==="GET"));return;
    }
    const c=caso.contrato;estado.resposta=envelope(c);
    const r=await lerMetricasDaCarteira(entrada(c));assert.equal(r.ok,true);
    const l=r.campanhas[0];assert.equal(l.execucaoId,execucaoId);
    assert.deepEqual(l.periodo,{desde:c.desde,ate:c.ate});
    assert.equal(l.metricas.cliquesNoLink.valor,null);assert.equal(l.metricas.conversas.valor,null);
    assert.ok(l.metricas.cliquesNoLink.motivo.includes(c.motivos_de_ausencia.cliques_no_link));
    assert.equal(l.motivosDeAusencia.cliques_no_link,c.motivos_de_ausencia.cliques_no_link);
    assert.equal("vendas" in l.metricas,false);assert.equal("saudavel" in l,false);
    if(nome==="sucesso_com_dados") {
      assert.equal(l.metricas.cliquesTotais.valor,8);assert.equal(l.metricas.resultadosAtribuidos.valor,"2");
      assert.equal(l.completude,"desconhecida");assert.equal(l.metricas.investimentoCentavos.valor,null);
    }
    if(nome==="sem_dados") {
      assert.equal(l.completude,"sem_dados");assert.equal(l.zeroObservado,null);assert.equal(l.diasComDados,0);
      assert.ok(Object.values(l.metricas).every(m=>m.valor===null));
    }
    if(nome==="zero_real") {
      assert.equal(l.zeroObservado,true);assert.equal(l.diasComDados,1);
      assert.equal(l.metricas.cliquesTotais.valor,0);assert.equal(l.metricas.impressoes.valor,0);
    }
    if(nome==="parcial_desatualizado") {
      assert.equal(l.parcial,true);assert.equal(l.carimboAnteriorAoFim,true);
      assert.doesNotMatch(l.avisos.join(" "),/API falhou|campanha não entregou/);
    }
    if(nome==="metricas_origem_heterogenea") {
      assert.equal(l.completude,"inconsistente");assert.equal(l.origemHeterogenea,true);
      assert.ok(Object.values(l.metricas).every(m=>m.valor===null));
    }
  });
}
test("sessão ausente, user_metadata e agência não abrem carteira nem chamam backend",async()=>{
  for(const user of [null,{id:operador,user_metadata:{papel:"operador"}},
    {id:operador,app_metadata:{papel:"gestor_agencia"}},{id:operador,app_metadata:{papel:"cliente"}}]) {
    estado.user=user;
    assert.equal((await lerMetricasDaCarteira(entrada())).motivo,"acesso_negado");
  }
  assert.equal(estado.consultas.length,0);assert.equal(estado.chamadas.length,0);
});
test("outra carteira e conta manipulada são negadas antes do backend",async()=>{
  estado.atribuicoes[0].operator_profile_id="outro";
  assert.equal((await lerMetricasDaCarteira(entrada())).motivo,"acesso_negado");
  assert.equal((await lerMetricasDaCarteira({...entrada(),businessId:outroBiz})).motivo,"acesso_negado");
  assert.equal(estado.chamadas.length,0);
});
test("identidade de proprietário vem do banco, nunca do parâmetro nem do operador",async()=>{
  const r=await lerMetricasDaCarteira({...entrada(),profileId:"injetado"});assert.equal(r.ok,true);
  const url=new URL(estado.chamadas[0].url);
  assert.equal(url.pathname,`/negocios/${businessId}/consolidado`);
  assert.equal(url.searchParams.get("profile_id"),dono);
  assert.notEqual(url.searchParams.get("profile_id"),operador);
});
test("falha ou duplicidade da atribuição fecha leitura; nenhum fallback V2G",async()=>{
  estado.falhaBanco=true;assert.equal((await lerMetricasDaCarteira(entrada())).motivo,"indisponivel");
  estado.falhaBanco=false;estado.atribuicoes.push({...estado.atribuicoes[0]});
  assert.equal((await lerMetricasDaCarteira(entrada())).motivo,"indisponivel");
  assert.equal(estado.chamadas.length,0);
});
test("UUID e período inválidos não abrem sessão/rede",async()=>{
  for(const e of [{...entrada(),businessId:"../outro"},{...entrada(),desde:"2026-02-30"},
    {...entrada(),desde:"2026-10-22",ate:"2026-10-20"}]) assert.equal((await lerMetricasDaCarteira(e)).motivo,"dados_invalidos");
  assert.equal(estado.ordem.length,0);
});
test("envelope de outro negócio, duplicado ou sem contrato é recusado",async()=>{
  for(const e of [{...envelope(),business_id:outroBiz},
    {...envelope(),por_execucao:[...envelope().por_execucao,...envelope().por_execucao]},
    {...envelope(),por_execucao:[{id_execucao:execucaoId}]},
    {...envelope(),desde:"2026-10-19"}]) {
    estado.resposta=e;assert.equal((await lerMetricasDaCarteira(entrada())).motivo,"resposta_invalida");
  }
});
test("origem inconsistente ignora até irmãos positivos que tentam preencher os nulos",()=>{
  const c=casos.metricas_origem_heterogenea.contrato;
  const l=lerPorExecucaoDaCarteira(envelope(c,{investiu_centavos:1000,cliques:90,impressoes:800,pessoas_que_chegaram:"10"}),entrada(c))[0];
  assert.ok(Object.values(l.metricas).every(m=>m.valor===null));
});
test("conflito de origem ou total irmão retira números em vez de conferir verde",()=>{
  const c=structuredClone(base);c.origens_metricas[0].id_campanha="outra";
  for(const e of [envelope(c),envelope(base,{cliques:999}),envelope(base,{moeda:"USD"})]) {
    const l=lerPorExecucaoDaCarteira(e,entrada())[0];assert.equal(l.completude,"inconsistente");
    assert.ok(Object.values(l.metricas).every(m=>m.valor===null));
  }
});
test("decimal é preservado e nulos/ausência não viram zero",()=>{
  const c=structuredClone(base);c.resultados_atribuidos="12345678901234567890.123456";
  const l=lerPorExecucaoDaCarteira(envelope(c),entrada())[0];
  assert.equal(l.metricas.resultadosAtribuidos.valor,c.resultados_atribuidos);
  assert.equal(l.metricas.investimentoCentavos.valor,null);
  delete c.cliques_total;assert.equal(lerPorExecucaoDaCarteira(envelope(c),entrada()),null);
});
test("sem fuso, carimbo ambíguo não inventa desatualização; fuso conhecido permite comparar",()=>{
  const c=structuredClone(base);c.coletado_em="2026-10-20T01:00:00Z";
  assert.equal(lerPorExecucaoDaCarteira(envelope(c),entrada())[0].carimboAnteriorAoFim,null);
  c.fuso="America/Sao_Paulo";
  assert.equal(lerPorExecucaoDaCarteira(envelope(c),entrada())[0].carimboAnteriorAoFim,true);
});
test("rede/erro inesperado é normalizado e não contém detalhe privado",async()=>{
  estado.falhaRede=true;const r=await lerMetricasDaCarteira(entrada());
  assert.equal(r.ok,false);assert.equal(r.motivo,"indisponivel");
  assert.doesNotMatch(JSON.stringify(r),/detalhe-privado|token-ficticio/);
});
test("identidade falsamente completa, campo inválido e dia sem origem não são saudáveis",()=>{
  const semIds=structuredClone(base);semIds.identidade.ids_criativos=[];
  assert.equal(lerPorExecucaoDaCarteira(envelope(semIds),entrada()),null);
  const invalido=structuredClone(base);invalido.impressoes=-1;
  assert.equal(lerPorExecucaoDaCarteira(envelope(invalido),entrada()),null);
  for(const mudanca of [{dias_com_dados:0},{origens_metricas:[]},{fonte:"google_ads_api"}]) {
    const c={...structuredClone(base),...mudanca};
    const l=lerPorExecucaoDaCarteira(envelope(c),entrada())[0];
    assert.equal(l.completude,"inconsistente");assert.ok(Object.values(l.metricas).every(m=>m.valor===null));
  }
});
