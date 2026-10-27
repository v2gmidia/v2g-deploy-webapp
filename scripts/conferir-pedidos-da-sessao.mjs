import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { registerHooks } from "node:module";
import { hashDoPedido } from "../lib/criativos/pedido-imagem.ts";

const flagAnterior = process.env.V2G_CREATIVE_REQUESTS_ENABLED;
const fetchAnterior = globalThis.fetch;
const mocks = {
  "server-only": "export {};",
  "next/cache": "export const revalidatePath = p => globalThis.__pedidosOffline.revalidar(p);",
  "@/lib/supabase/server": "export const createClient = async () => globalThis.__pedidosOffline.cliente();",
  "@/lib/multiconta/ativo": "export const negocioAtivoDaSessao = async () => globalThis.__pedidosOffline.ativo();",
  "@/lib/jev/catalogo-da-sessao": "export const catalogoBarbeariaDisponivel = async () => globalThis.__pedidosOffline.referenciaPermitida;",
  "@/lib/criativos/geracao/backend-da-sessao": "export const geracaoNoAppPeloBackend = async () => { throw Error('fora do ensaio'); };",
  "@/lib/criativos/geracao/configuracao-app": "export const modoGeracaoNoApp = () => 'desligado'; export const submissaoRealHabilitada = () => false;",
  "@/lib/criativos/geracao/contrato-fila": "export const filaTerminal = () => true;",
  "@/lib/criativos/geracao/imagem-privada": "export const urlImagemGerada = () => null;",
};
const arquivos = {
  "@/lib/criativos/pedidos-da-sessao": "../lib/criativos/pedidos-da-sessao.ts",
  "@/lib/criativos/pedido-imagem": "../lib/criativos/pedido-imagem.ts",
  "./pedido-imagem": "../lib/criativos/pedido-imagem.ts",
};
const hooks = registerHooks({
  resolve(s, c, next) {
    if (Object.hasOwn(mocks, s)) return { url: `offline:${s}`, shortCircuit: true };
    if (Object.hasOwn(arquivos, s)) return { url: new URL(arquivos[s], import.meta.url).href, shortCircuit: true };
    return next(s, c);
  },
  load(u, c, next) {
    if (u.startsWith("offline:")) return { format: "module", source: mocks[u.slice(8)], shortCircuit: true };
    return next(u, c);
  },
});
globalThis.fetch = () => { throw Error("Rede proibida no ensaio"); };
const { carregarPedidosDaSessao } = await import("../lib/criativos/pedidos-da-sessao.ts");
const { guardarPedidoAction } = await import("../app/(protected)/criativos/geracao-actions.ts");
after(() => {
  hooks.deregister(); globalThis.fetch = fetchAnterior; delete globalThis.__pedidosOffline;
  if (flagAnterior === undefined) delete process.env.V2G_CREATIVE_REQUESTS_ENABLED;
  else process.env.V2G_CREATIVE_REQUESTS_ENABLED = flagAnterior;
});

const businessId = "12345678-1234-4234-8234-123456789012";
const profileId = "22345678-1234-4234-8234-123456789012";
const id = "32345678-1234-4234-8234-123456789012";
let estado;
beforeEach(() => {
  process.env.V2G_CREATIVE_REQUESTS_ENABLED = "true";
  estado = { linhas: [], profileId, businessId, referenciaPermitida: false, falha: false, insercoes: 0, revalidacoes: [], consultas: 0 };
});
globalThis.__pedidosOffline = {
  get referenciaPermitida() { return estado.referenciaPermitida; },
  ativo: () => estado.businessId ? { status: "selecionado", negocio: { id: estado.businessId } } : { status: "sem_sessao" },
  revalidar: (p) => estado.revalidacoes.push(p),
  cliente: () => ({
    auth: { getUser: async () => ({ data: { user: estado.profileId ? { id: estado.profileId } : null }, error: null }) },
    from(tabela) {
      assert.equal(tabela, "creative_generation_requests");
      estado.consultas++;
      const filtros = {};
      const resultados = () => estado.linhas.filter((l) => Object.entries(filtros).every(([k, v]) => l[k] === v));
      const consulta = {
        select(colunas) { assert.equal(colunas, "id, business_id, requested_by, content_hash, payload, status, created_at"); return consulta; },
        eq(k, v) { filtros[k] = v; return consulta; },
        order(k, o) { assert.equal(k, "created_at"); assert.equal(o.ascending, false); return consulta; },
        async limit(n) { assert.equal(n, 20); return { data: resultados().slice(0, n), error: estado.falha ? {} : null }; },
        async maybeSingle() { return { data: resultados()[0] ?? null, error: estado.falha ? {} : null }; },
        async insert(pedido) {
          assert.deepEqual(Object.keys(pedido).sort(), ["business_id", "content_hash", "id", "payload", "requested_by"]);
          if (estado.falha) return { error: { code: "42P01" } };
          if (estado.linhas.some((l) => l.id === pedido.id)) return { error: { code: "23505" } };
          estado.insercoes++;
          estado.linhas.push({ ...structuredClone(pedido), status: "awaiting_configuration", created_at: "2026-10-20T20:00:00Z" });
          return { error: null };
        },
      };
      return consulta;
    },
  }),
};
function formulario() {
  const f = new FormData();
  for (const [k, v] of Object.entries({ requestId: id, businessId, objetivo: "Apresentar serviço",
    oferta: "Corte com horário marcado", acao: "Chamar no WhatsApp", confirmado: "on" })) f.set(k, v);
  return f;
}
test("action grava por sessão, recarrega no loader e confirma replay sem nova escrita", async () => {
  assert.equal((await guardarPedidoAction({}, formulario())).ok, true);
  const leitura = await carregarPedidosDaSessao(businessId);
  assert.equal(leitura.falhou, false);
  assert.equal(leitura.pedidos[0].payload.oferta, "Corte com horário marcado");
  assert.equal((await guardarPedidoAction({}, formulario())).repetido, true);
  assert.equal(estado.insercoes, 1);
  assert.deepEqual(estado.revalidacoes, ["/criativos", "/criativos"]);
});
test("action recusa aba de outro negócio antes de consultar a tabela", async () => {
  estado.businessId = "outro";
  assert.match((await guardarPedidoAction({}, formulario())).erro, /negócio selecionado mudou/);
  assert.equal(estado.consultas, 0);
});
test("tabela indisponível não confirma pedido nem apaga o erro do loader", async () => {
  estado.falha = true;
  assert.match((await guardarPedidoAction({}, formulario())).erro, /Não foi possível guardar/);
  assert.deepEqual(await carregarPedidosDaSessao(businessId), { pedidos: [], falhou: true });
  assert.equal(estado.revalidacoes.length, 0);
});
test("loader rejeita resultado inconsistente em vez de mostrar outra empresa", async () => {
  await guardarPedidoAction({}, formulario());
  estado.linhas[0].content_hash = "0".repeat(64);
  assert.deepEqual(await carregarPedidosDaSessao(businessId), { pedidos: [], falhou: true });
});
test("payload e hash válidos não dispensam conferência de status", async () => {
  await guardarPedidoAction({}, formulario());
  assert.equal(estado.linhas[0].content_hash, hashDoPedido(estado.linhas[0].payload));
  estado.linhas[0].status = "generated";
  assert.deepEqual(await carregarPedidosDaSessao(businessId), { pedidos: [], falhou: true });
});
test("action mantém referência escolhida após recarga e não aceita troca no mesmo pedido", async () => {
  estado.referenciaPermitida = true;
  const f = formulario(); f.set("referenciaId", "700155112131034");
  assert.equal((await guardarPedidoAction({}, f)).ok, true);
  const leitura = await carregarPedidosDaSessao(businessId);
  assert.equal(leitura.pedidos[0].payload.referenciaId, "700155112131034");
  f.set("referenciaId", "1077371334754860");
  assert.equal((await guardarPedidoAction({}, f)).ok, undefined);
  assert.equal(estado.insercoes, 1);
});
test("action recusa referência em negócio sem catálogo", async () => {
  const f = formulario(); f.set("referenciaId", "700155112131034");
  assert.equal((await guardarPedidoAction({}, f)).ok, undefined);
  assert.equal(estado.insercoes, 0);
});
