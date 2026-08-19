/**
 * Confere `montarCadastro()` contra o schema REAL do backend.
 *
 *   node scripts/conferir-cadastro.ts
 *
 * O schema é baixado do `/openapi.json` na hora, e não copiado à mão para
 * dentro do teste. Uma cópia à mão envelhece em silêncio: o backend aperta
 * uma restrição, o teste continua verde, e a descoberta acontece como 422 em
 * produção. Baixar é o que faz este script poder falhar por um motivo que
 * ninguém escreveu aqui.
 *
 * O `/openapi.json` responde SEM token (backend-integracao.md §0), então
 * este script roda em qualquer máquina, sem segredo nenhum.
 *
 * ELE NÃO CHAMA `POST /cadastro`. Aquilo abre execução de verdade
 * ("Primeiro toque do cliente. Abre a execucao.") e sujaria a fila que o
 * `/saude-meta` lê. O envio é assunto do lote E.
 */

import {
  montarCadastro,
  NOME_PROVISORIO,
  type CampoObrigatorio,
  type NegocioParaCadastro,
} from "../lib/cadastro/montar.ts";

const URL_SCHEMA =
  process.env.V2G_BACKEND_URL?.replace(/\/$/, "") ?? "https://api.v2gmidia.com.br";

// ------------------------------------------------------- validador mínimo

type Schema = Record<string, unknown>;

/**
 * As palavras-chave que este validador entende. Qualquer outra que apareça
 * no schema PARA o script.
 *
 * É a parte mais importante do arquivo. Um validador que ignora o que não
 * conhece transforma restrição nova em aprovação silenciosa — e aí o teste
 * passa porque não olhou, que é pior que não existir. Se o backend passar a
 * exigir `maxLength` num campo, este script tem que gritar, não relevar.
 */
const CONHECIDAS = new Set([
  "type", "properties", "required", "items", "anyOf", "$ref",
  "enum", "minLength", "maxLength", "minimum", "maximum",
  "exclusiveMinimum", "exclusiveMaximum", "pattern",
  "title", "description", "default", "format",
]);

const desconhecidas: string[] = [];

function resolver(schema: Schema, raiz: Schema): Schema {
  const ref = schema["$ref"];
  if (typeof ref !== "string") return schema;
  const caminho = ref.replace(/^#\//, "").split("/");
  let atual: unknown = raiz;
  for (const passo of caminho) atual = (atual as Record<string, unknown>)?.[passo];
  return (atual as Schema) ?? {};
}

function conferirKeywords(schema: Schema, onde: string) {
  for (const k of Object.keys(schema)) {
    if (!CONHECIDAS.has(k)) desconhecidas.push(`${onde}.${k}`);
  }
}

/** Devolve a lista de problemas. Vazia = válido. */
function validar(
  valor: unknown,
  schema: Schema,
  raiz: Schema,
  onde = "$",
): string[] {
  schema = resolver(schema, raiz);
  conferirKeywords(schema, onde);
  const erros: string[] = [];

  if (Array.isArray(schema["anyOf"])) {
    const alternativas = schema["anyOf"] as Schema[];
    const ok = alternativas.some(
      (alt) => validar(valor, alt, raiz, onde).length === 0,
    );
    if (!ok) erros.push(`${onde}: não bate com nenhuma alternativa do anyOf`);
    return erros;
  }

  const tipo = schema["type"];

  if (tipo === "null") {
    if (valor !== null) erros.push(`${onde}: esperava null`);
    return erros;
  }

  if (tipo === "object") {
    if (valor === null || typeof valor !== "object" || Array.isArray(valor)) {
      erros.push(`${onde}: esperava object`);
      return erros;
    }
    const obj = valor as Record<string, unknown>;
    const props = (schema["properties"] ?? {}) as Record<string, Schema>;
    for (const req of (schema["required"] ?? []) as string[]) {
      if (obj[req] === undefined) erros.push(`${onde}.${req}: obrigatório e ausente`);
    }
    for (const [chave, sub] of Object.entries(props)) {
      if (obj[chave] === undefined) continue;
      erros.push(...validar(obj[chave], sub, raiz, `${onde}.${chave}`));
    }
    return erros;
  }

  if (tipo === "array") {
    if (!Array.isArray(valor)) {
      erros.push(`${onde}: esperava array`);
      return erros;
    }
    const itens = schema["items"] as Schema | undefined;
    if (itens) {
      valor.forEach((v, i) => erros.push(...validar(v, itens, raiz, `${onde}[${i}]`)));
    }
    return erros;
  }

  if (tipo === "string") {
    if (typeof valor !== "string") {
      erros.push(`${onde}: esperava string`);
      return erros;
    }
    const min = schema["minLength"];
    if (typeof min === "number" && valor.length < min) {
      erros.push(`${onde}: minLength ${min}, tem ${valor.length}`);
    }
    const max = schema["maxLength"];
    if (typeof max === "number" && valor.length > max) {
      erros.push(`${onde}: maxLength ${max}, tem ${valor.length}`);
    }
    const pat = schema["pattern"];
    if (typeof pat === "string" && !new RegExp(pat).test(valor)) {
      erros.push(`${onde}: não bate com o pattern`);
    }
    const en = schema["enum"];
    if (Array.isArray(en) && !en.includes(valor)) {
      erros.push(`${onde}: fora do enum ${JSON.stringify(en)}`);
    }
    return erros;
  }

  if (tipo === "number" || tipo === "integer") {
    if (typeof valor !== "number" || !Number.isFinite(valor)) {
      erros.push(`${onde}: esperava number`);
      return erros;
    }
    const min = schema["minimum"];
    if (typeof min === "number" && valor < min) {
      erros.push(`${onde}: minimum ${min}, tem ${valor}`);
    }
    const exMin = schema["exclusiveMinimum"];
    if (typeof exMin === "number" && valor <= exMin) {
      erros.push(`${onde}: exclusiveMinimum ${exMin}, tem ${valor}`);
    }
    const max = schema["maximum"];
    if (typeof max === "number" && valor > max) {
      erros.push(`${onde}: maximum ${max}, tem ${valor}`);
    }
    return erros;
  }

  if (tipo === "boolean") {
    if (typeof valor !== "boolean") erros.push(`${onde}: esperava boolean`);
    return erros;
  }

  return erros;
}

// ------------------------------------------------------------- os alvos

/** Um negócio completo, plausível: padaria de bairro. */
function negocioCompleto(): NegocioParaCadastro {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Padaria do Zé",
    description: "Padaria de bairro com pães, bolos e salgados feitos no dia.",
    avg_ticket_min: 25,
    avg_ticket_max: 25,
    avg_direct_cost: 10,
    target_profit_per_customer: 6,
    monthly_budget: 600,
    cep: "18040-000",
    site_url: null,
    instagram_handle: "padariadoze",
    atende_somente_no_local: true,
    differentiators: ["pão quente de hora em hora"],
    guarantee: null,
    delivery_time: null,
    payment_policy: "pix e cartão",
    business_hours: "6h às 20h",
    availability: null,
    onboarding: {},
  };
}

/** Como cada campo obrigatório é apagado da linha do banco. */
const APAGAR: Record<CampoObrigatorio, (n: NegocioParaCadastro) => void> = {
  nome_negocio: (n) => { n.name = NOME_PROVISORIO; },
  descricao_livre: (n) => { n.description = null; },
  ticket_medio: (n) => { n.avg_ticket_min = null; n.avg_ticket_max = null; },
  custo_direto_medio: (n) => { n.avg_direct_cost = null; },
  lucro_desejado_por_cliente: (n) => { n.target_profit_per_customer = null; },
  orcamento_mensal_disponivel: (n) => { n.monthly_budget = null; },
};

/**
 * Valores de FRONTEIRA: cada um é o vizinho inválido do limite medido.
 * Sem eles, o teste provaria só que campo ausente é recusado — e o erro
 * caro não é o campo ausente, é o zero que passa por número.
 */
const FRONTEIRAS: Array<{
  nome: string;
  campo: CampoObrigatorio;
  aplicar: (n: NegocioParaCadastro) => void;
}> = [
  { nome: "ticket = 0 (exclusiveMinimum 0)", campo: "ticket_medio",
    aplicar: (n) => { n.avg_ticket_min = 0; n.avg_ticket_max = 0; } },
  { nome: "verba = 0 (exclusiveMinimum 0)", campo: "orcamento_mensal_disponivel",
    aplicar: (n) => { n.monthly_budget = 0; } },
  { nome: "custo = -1 (minimum 0)", campo: "custo_direto_medio",
    aplicar: (n) => { n.avg_direct_cost = -1; } },
  { nome: "lucro = -1 (minimum 0)", campo: "lucro_desejado_por_cliente",
    aplicar: (n) => { n.target_profit_per_customer = -1; } },
  { nome: "descrição com 9 caracteres (minLength 10)", campo: "descricao_livre",
    aplicar: (n) => { n.description = "123456789"; } },
];

// ------------------------------------------------------------------ corrida

let falhas = 0;
const ok = (m: string) => console.log(`  ok    ${m}`);
const nok = (m: string) => { falhas++; console.log(`  FALHA ${m}`); };

const resposta = await fetch(`${URL_SCHEMA}/openapi.json`);
if (!resposta.ok) {
  console.error(`Não consegui baixar o schema: HTTP ${resposta.status}`);
  process.exit(2);
}
const spec = (await resposta.json()) as Schema;
const schemaCadastro = (spec["components"] as Schema)?.["schemas"] as
  | Record<string, Schema>
  | undefined;
const alvo = schemaCadastro?.["CadastroCompleto"];
if (!alvo) {
  console.error("O schema CadastroCompleto sumiu do /openapi.json.");
  process.exit(2);
}

console.log(`schema de ${URL_SCHEMA}/openapi.json`);
console.log(`obrigatórios no schema: ${JSON.stringify(alvo["required"])}\n`);

// --- 0. o validador detecta alguma coisa?
//
// Sem isto o relatório inteiro é suspeito: um validador que sempre devolve
// lista vazia faz todo o resto imprimir "ok". As seções 1 a 4 só provam algo
// depois que esta provar que o instrumento mede.
console.log("0. controle negativo — o validador falha quando deve");
const controles: Array<[string, unknown]> = [
  ["ticket_medio = 0", { ticket_medio: 0 }],
  ["descricao_livre com 9 caracteres", { descricao_livre: "123456789" }],
  ["nome_negocio como número", { nome_negocio: 123 }],
  ["custo_direto_medio negativo", { custo_direto_medio: -1 }],
  ["diferenciais_selecionados como string", { diferenciais_selecionados: "pão quente" }],
];
for (const [nome, remendo] of controles) {
  const base = montarCadastro(negocioCompleto());
  if (!base.completo) { nok(`${nome}: não consegui montar o payload base`); continue; }
  const ruim = { ...base.payload, ...(remendo as object) };
  const erros = validar(ruim, alvo, spec);
  if (erros.length === 0) nok(`${nome}: o validador ACEITOU — ele não está medindo`);
  else ok(`${nome} → recusado (${erros[0]})`);
}
// e o detector de restrição desconhecida: ele acusa?
validar({ x: 1 }, { type: "object", properties: { x: { type: "number", multipleOf: 2 } } }, spec, "$probe");
if (desconhecidas.some((d) => d.endsWith("multipleOf"))) {
  ok("restrição desconhecida (multipleOf) foi acusada");
} else {
  nok("restrição desconhecida passou batido — a seção 5 não vale nada");
}
desconhecidas.length = 0; // a sonda não conta para a conferência real

// --- 1. o lado que passa
console.log("1. negócio completo");
const completo = montarCadastro(negocioCompleto());
if (!completo.completo) {
  nok(`montarCadastro recusou um negócio completo: ${JSON.stringify(completo.pendencias)}`);
} else {
  ok("montarCadastro devolveu completo");
  const erros = validar(completo.payload, alvo, spec);
  if (erros.length) erros.forEach((e) => nok(`schema recusou o payload — ${e}`));
  else ok("o payload valida contra o schema baixado");
}

// --- 2. os seis obrigatórios, um a um, nos DOIS sentidos
console.log("\n2. cada obrigatório ausente");
for (const campo of Object.keys(APAGAR) as CampoObrigatorio[]) {
  const negocio = negocioCompleto();
  APAGAR[campo](negocio);
  const r = montarCadastro(negocio);

  if (r.completo) {
    nok(`${campo}: montarCadastro deixou passar sem o campo`);
    continue;
  }
  const achou = r.pendencias.find((p) => p.campo === campo);
  if (!achou) {
    nok(`${campo}: virou pendência de outro campo (${r.pendencias.map((p) => p.campo)})`);
    continue;
  }

  // A volta: o payload sem este campo é recusado LÁ também? Se o schema
  // aceitasse, a nossa checagem seria mais dura que a deles — e estaria
  // barrando cliente por regra que o backend não tem.
  if (completo.completo) {
    const mutilado = { ...completo.payload } as Record<string, unknown>;
    delete mutilado[campo];
    const errosLa = validar(mutilado, alvo, spec);
    if (errosLa.length === 0) {
      nok(`${campo}: nós barramos, o schema aceita — a regra é nossa, não deles`);
      continue;
    }
  }
  ok(`${campo}: barrado aqui (${achou.motivo} → ${achou.onde}) e recusado pelo schema`);
}

// --- 3. as fronteiras
console.log("\n3. valores de fronteira");
for (const caso of FRONTEIRAS) {
  const negocio = negocioCompleto();
  caso.aplicar(negocio);
  const r = montarCadastro(negocio);
  if (r.completo) nok(`${caso.nome}: passou, e não devia`);
  else if (!r.pendencias.some((p) => p.campo === caso.campo)) {
    nok(`${caso.nome}: barrado, mas pelo campo errado`);
  } else ok(caso.nome);
}

// --- 4. os três motivos de pendência
console.log("\n4. os três motivos vêm do jsonb, não da coluna");
const casosMotivo: Array<[string, unknown, string]> = [
  ["nada perguntado", {}, "nao_perguntado"],
  ["não sei", { contas: { custo: { echo: "Não sei", calculado: null, confirmado: false, naoSei: true, em: "" } } }, "nao_sei"],
  ["calculado sem confirmar", { contas: { custo: { echo: "metade", calculado: 12, confirmado: false, em: "" } } }, "nao_confirmado"],
];
for (const [nome, onboarding, esperado] of casosMotivo) {
  const negocio = negocioCompleto();
  negocio.avg_direct_cost = null;
  negocio.onboarding = onboarding;
  const r = montarCadastro(negocio);
  const p = r.completo ? undefined : r.pendencias.find((x) => x.campo === "custo_direto_medio");
  if (p?.motivo === esperado) ok(`${nome} → ${esperado}`);
  else nok(`${nome}: esperava ${esperado}, veio ${p?.motivo ?? "nenhuma pendência"}`);
}

// --- 5. o validador olhou tudo?
console.log("\n5. palavras-chave do schema");
if (desconhecidas.length) {
  const unicas = [...new Set(desconhecidas.map((d) => d.split(".").pop()))];
  nok(`o schema usa restrição que este validador NÃO confere: ${unicas.join(", ")}`);
  console.log("       (uma restrição não conferida vira aprovação silenciosa — ajuste CONHECIDAS)");
} else {
  ok("nenhuma restrição do schema ficou sem conferência");
}

console.log(falhas === 0 ? "\nTUDO CERTO" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
