/**
 * Prova offline: montador TypeScript real -> modelo Pydantic real candidato.
 * Uso: node scripts/conferir-onboarding-contrato-cruzado.mjs --backend <checkout>
 * Nao carrega .env, inicia servidor, chama API ou escreve em banco/provedor.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { register, syncBuiltinESMExports } from "node:module";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const redeProibida = () => { throw new Error("Rede proibida nesta conferencia offline."); };
globalThis.fetch = redeProibida;
for (const modulo of [http, https]) {
  modulo.request = redeProibida;
  modulo.get = redeProibida;
}
net.connect = redeProibida;
net.createConnection = redeProibida;
net.Socket.prototype.connect = redeProibida;
tls.connect = redeProibida;
syncBuiltinESMExports();

const args = process.argv.slice(2);
if (args.includes("--conferir-resposta")) {
  // Transporte controlado: corpo veio do modelo Python real, nunca da API.
  // O subprocesso tem react-server para respeitar server-only sem remove-lo.
  register("./resolvedor-hook.mjs", import.meta.url);
  process.env.V2G_BACKEND_URL = "https://onboarding-contract.invalid";
  process.env.V2G_BACKEND_TOKEN = "token-sintetico-sem-validade";
  const entrada = JSON.parse(readFileSync(0, "utf8"));
  const { conferirCadastroOperacional } = await import("../lib/backend/cadastro-operacional.ts");
  const respostas = [];
  for (const caso of entrada.casos) {
    let chamadas = 0;
    globalThis.fetch = async (url, opcoes) => {
      assert.equal(String(url), "https://onboarding-contract.invalid/cadastro/operacional");
      assert.equal(opcoes.method, "POST");
      assert.deepEqual(JSON.parse(opcoes.body), entrada.payload);
      assert.equal(opcoes.headers["X-V2G-Token"], "token-sintetico-sem-validade");
      assert.equal(opcoes.headers.Authorization, undefined);
      chamadas++;
      return new Response(JSON.stringify(caso.corpo), { status: 200,
        headers: { "Content-Type": "application/json" } });
    };
    try {
      const resultado = await conferirCadastroOperacional(entrada.payload);
      respostas.push({ nome: caso.nome, aceito: resultado.ok, chamadas });
    } finally {
      globalThis.fetch = redeProibida;
    }
  }
  console.log(JSON.stringify(respostas));
  process.exit(0);
}
const backendArg = args[args.indexOf("--backend") + 1];
if (!args.includes("--backend") || !backendArg || backendArg.startsWith("--")) {
  throw new Error("Informe --backend com a checkout candidata; nenhum endpoint remoto e usado.");
}
const backend = resolve(backendArg);
const python = resolve(backend, ".venv", "Scripts", "python.exe");
assert.ok(existsSync(python), "Interpretador da candidata backend ausente.");
const modelModule = args.includes("--model-module")
  ? args[args.indexOf("--model-module") + 1] : "src.dominio.cadastro_operacional";

// Importacao depois do bloqueio de rede, sem trocar a implementacao por mock.
const { montarCadastroOperacional } = await import("../lib/cadastro/montar.ts");
const { prepararReferenciaDePreco } = await import("../lib/onboarding/referencia-preco.ts");
assert.equal(typeof montarCadastroOperacional, "function");

function congelar(objeto) {
  if (objeto && typeof objeto === "object" && !Object.isFrozen(objeto)) {
    Object.freeze(objeto);
    for (const valor of Object.values(objeto)) congelar(valor);
  }
  return objeto;
}
const em = "2026-11-09T15:00:00.000Z";
const resposta = (texto) => ({ texto, em, origem: "digitado" });
function negocioBase() {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Industria de bebidas de teste",
    description: "Industria de chope de vinho para bares e pontos de venda.",
    monthly_budget: 3000,
    avg_ticket_min: null,
    avg_ticket_max: null,
    avg_direct_cost: null,
    target_profit_per_customer: null,
    onboarding: {
      versao: 2,
      respostas: {
        nome: resposta("Industria de bebidas de teste"),
        contratante: resposta("É o próprio anunciante"),
        operador: resposta("O próprio anunciante opera os anúncios"),
        descricao: resposta("Industria de chope de vinho para bares e pontos de venda."),
        publico: resposta("Bares e pontos de venda"),
        praca: resposta("Sao Paulo"),
        destino: resposta("WhatsApp"),
        campanha: resposta("Já existe uma campanha para acompanhar"),
      },
      arquivos: [{ id: "arquivo-sintetico", origem: "cliente", em }],
      contas: {
        custo: { echo: "nao sei", calculado: null, confirmado: false, naoSei: true, em },
        lucro: { echo: "nao sei", calculado: null, confirmado: false, naoSei: true, em },
      },
    },
  };
}
let falhas = 0;
let verificacoesLocais = 0;
const casos = [];
function conferirLocal(nome, executar) {
  try {
    executar();
    verificacoesLocais++;
    console.log(`PASS ${nome}`);
  } catch (erro) {
    falhas++;
    console.error(`FAIL ${nome}: ${erro.message}`);
  }
}
function montar(nome, negocio) {
  const antes = structuredClone(negocio);
  const resultado = montarCadastroOperacional(congelar(negocio));
  assert.deepEqual(negocio, antes, `${nome}: entrada e historico foram alterados`);
  assert.equal(resultado.completo, true, `${nome}: cadastro operacional incompleto`);
  assert.equal(resultado.validavel, true, `${nome}: contrato V2 indisponivel`);
  const payload = resultado.payload;
  for (const campo of ["ticket_medio", "custo_direto_medio", "lucro_desejado_por_cliente"]) {
    assert.equal(Object.hasOwn(payload, campo), false, `${nome}: ${campo} vazou para V2`);
  }
  assert.equal(payload.business_id, negocio.id);
  assert.equal(payload.versao_contrato, "cadastro_operacional.v2");
  assert.equal(Object.hasOwn(payload, "id_execucao"), false);
  casos.push({ nome, payload, aceito: true });
  return payload;
}
let base;
conferirLocal("B2B sem economia preserva desconhecidos e arquivos", () => {
  base = montar("B2B sem economia", negocioBase());
  assert.equal(base.relacao_de_acesso.modelo, "direto");
  assert.equal(base.anunciante.comprador_prioritario, "Bares e pontos de venda");
});
conferirLocal("B2B2B declarado nao exige economia", () => {
  const negocio = negocioBase();
  negocio.name = "Agencia de teste";
  negocio.onboarding.respostas.contratante = resposta("Agencia de teste");
  negocio.onboarding.respostas.operador = resposta("Uma agência ou gestor opera para o anunciante");
  const payload = montar("B2B2B sem economia", negocio);
  assert.equal(payload.relacao_de_acesso.modelo, "agencia_operadora");
  assert.equal(payload.relacao_de_acesso.identidade_com_acesso, "agencia");
  assert.equal(payload.relacao_de_acesso.contratante_nome, "Agencia de teste");
  assert.equal(payload.anunciante.nome, "Industria de bebidas de teste");
  assert.equal(negocio.name, "Agencia de teste");
});
conferirLocal("Dados financeiros legados preservados sem reaproveitamento automatico", () => {
  const negocio = negocioBase();
  Object.assign(negocio, { avg_ticket_min: 120, avg_ticket_max: 180,
    avg_direct_cost: 0, target_profit_per_customer: 40,
    procedencia: { avg_direct_cost: { origem: "confirmado", em } } });
  montar("Historico financeiro preservado", negocio);
});
conferirLocal("Omissao financeira nao preenche zero", () => {
  const negocio = negocioBase();
  for (const campo of ["avg_ticket_min", "avg_ticket_max", "avg_direct_cost", "target_profit_per_customer"]) {
    delete negocio[campo];
  }
  montar("Economia omitida", negocio);
});
conferirLocal("Referencia por fardo permanece referencia aproximada", () => {
  const negocio = negocioBase();
  const preparada = prepararReferenciaDePreco({ minimo: "R$ 69,00", maximo: "70,00",
    unidade: "fardo; quantidade interna nao confirmada", certeza: "aproximado" },
    "informacao sintetica do contratante", em);
  assert.equal(preparada.estado, "pronto");
  negocio.onboarding.respostas._oferta = { preco_referencia: preparada.referencia };
  const payload = montar("Faixa de preco por fardo", negocio);
  assert.equal(payload.oferta.preco_referencia.valor_min, 69);
  assert.equal(payload.oferta.preco_referencia.valor_max, 70);
  assert.equal(payload.oferta.preco_referencia.certeza, "aproximado");
});
conferirLocal("Preco zero explicitamente informado nao vira desconhecido", () => {
  const negocio = negocioBase();
  const preparada = prepararReferenciaDePreco({ minimo: "0", maximo: "0",
    unidade: "amostra promocional", certeza: "confirmado" }, "fixture", em);
  assert.equal(preparada.estado, "pronto");
  negocio.onboarding.respostas._oferta = { preco_referencia: preparada.referencia };
  const payload = montar("Preco zero confirmado", negocio);
  assert.equal(payload.oferta.preco_referencia.valor_min, 0);
});
conferirLocal("Identidade nao e inferida de texto livre", () => {
  const negocio = negocioBase();
  negocio.onboarding.respostas.operador = resposta("Talvez uma agencia parecida com o nome");
  const antes = structuredClone(negocio);
  const resultado = montarCadastroOperacional(congelar(negocio));
  assert.equal(resultado.completo, false);
  assert.deepEqual(negocio, antes);
});
conferirLocal("Verba zero nao conclui entrada operacional", () => {
  const negocio = negocioBase();
  negocio.monthly_budget = 0;
  assert.equal(montarCadastroOperacional(congelar(negocio)).completo, false);
});
conferirLocal("Descricao curta com emoji respeita caracteres do contrato", () => {
  const negocio = negocioBase();
  negocio.description = "🍷".repeat(5);
  negocio.onboarding.respostas.descricao = resposta(negocio.description);
  assert.equal(montarCadastroOperacional(congelar(negocio)).completo, false);
});
conferirLocal("Dez caracteres Unicode podem formar payload valido", () => {
  const negocio = negocioBase();
  negocio.description = "🍷".repeat(10);
  negocio.onboarding.respostas.descricao = resposta(negocio.description);
  montar("Descricao com dez caracteres Unicode", negocio);
});

if (base) {
  function mutar(nome, alterar, aceito = false) {
    const payload = structuredClone(base);
    alterar(payload);
    casos.push({ nome, payload, aceito });
  }
  mutar("Pydantic rejeita versao desconhecida", (p) => { p.versao_contrato = "cadastro_operacional.v999"; });
  mutar("Pydantic rejeita business_id invalido", (p) => { p.business_id = "negocio-sem-id"; });
  mutar("Pydantic rejeita verba zero", (p) => { p.orcamento_mensal_disponivel = 0; });
  mutar("Pydantic rejeita verba negativa", (p) => { p.orcamento_mensal_disponivel = -1; });
  mutar("Pydantic rejeita custo null extra", (p) => { p.custo_direto_medio = null; });
  mutar("Pydantic rejeita lucro zero extra", (p) => { p.lucro_desejado_por_cliente = 0; });
  mutar("Pydantic rejeita ticket extra", (p) => { p.ticket_medio = 69.5; });
  mutar("Pydantic rejeita cinco emojis como descricao minima", (p) => {
    p.anunciante.descricao_livre = "🍷".repeat(5);
  });
  mutar("Pydantic rejeita preco sem unidade", (p) => {
    p.oferta = { preco_referencia: { moeda: "BRL", valor_min: 69, certeza: "aproximado" } };
  });
  mutar("Pydantic rejeita faixa invertida", (p) => {
    p.oferta = { preco_referencia: { moeda: "BRL", valor_min: 70, valor_max: 69,
      unidade: "fardo", certeza: "aproximado" } };
  });
  mutar("Pydantic rejeita preco negativo", (p) => {
    p.oferta = { preco_referencia: { moeda: "BRL", valor_min: -1,
      unidade: "fardo", certeza: "confirmado" } };
  });
}

const pythonSource = String.raw`
import importlib
import json
import socket
import sys

def deny(*args, **kwargs):
    raise RuntimeError('Rede proibida nesta conferencia offline.')

socket.socket.connect = deny
socket.socket.connect_ex = deny
socket.create_connection = deny
sys.path.insert(0, sys.argv[1])
from pydantic import ValidationError
module = importlib.import_module(sys.argv[2])
model = getattr(module, 'CadastroOperacionalV2')
results = []
for case in json.loads(sys.stdin.buffer.read().decode('utf-8')):
    try:
        validated = model.model_validate(case['payload'])
    except ValidationError as exc:
        results.append({'nome': case['nome'], 'aceito': False,
            'erros': [{'loc': list(error['loc']), 'type': error['type']}
                for error in exc.errors()]})
    else:
        response = module.conferir_cadastro_operacional(validated)
        results.append({'nome': case['nome'], 'aceito': True,
            'campos': list(validated.model_fields_set),
            'resposta': response.model_dump(mode='json')})
print(json.dumps(results, ensure_ascii=True))
`;
const resultadoPython = spawnSync(python, ["-I", "-c", pythonSource, backend, modelModule], {
  input: JSON.stringify(casos), cwd: backend, encoding: "utf8",
  env: { ...process.env, PYTHONUTF8: "1", PYTHONDONTWRITEBYTECODE: "1" },
  timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true,
});
assert.ifError(resultadoPython.error);
assert.equal(resultadoPython.status, 0, `Modelo candidato nao executou: ${resultadoPython.stderr}`);
const resultados = JSON.parse(resultadoPython.stdout);
assert.equal(resultados.length, casos.length);
let cruzados = 0;
for (let i = 0; i < casos.length; i++) {
  conferirLocal(casos[i].nome, () => {
    assert.equal(resultados[i].nome, casos[i].nome);
    assert.equal(resultados[i].aceito, casos[i].aceito,
      `Desacordo com Pydantic real: ${JSON.stringify(resultados[i].erros ?? [])}`);
    cruzados++;
  });
}
const respostaReal = resultados.find((resultado) => resultado.aceito)?.resposta;
if (respostaReal && base) {
  const casosDeResposta = [{ nome: "Resposta Pydantic real aceita pelo adapter", corpo: respostaReal, aceito: true }];
  for (const [nome, campo, valor] of [
    ["Resposta de outro negocio recusada", "business_id", "00000000-0000-4000-8000-000000000002"],
    ["Resposta de versao desconhecida recusada", "versao_contrato", "cadastro_operacional.v999"],
    ["Resposta com publicacao autorizada recusada", "publicacao_autorizada", true],
  ]) {
    casosDeResposta.push({ nome, corpo: { ...structuredClone(respostaReal), [campo]: valor }, aceito: false });
  }
  const respostaNode = spawnSync(process.execPath,
    ["--conditions=react-server", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
      fileURLToPath(import.meta.url), "--conferir-resposta"], {
      input: JSON.stringify({ payload: base, casos: casosDeResposta }), encoding: "utf8",
      timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true,
    });
  assert.ifError(respostaNode.error);
  assert.equal(respostaNode.status, 0, `Adapter real nao executou: ${respostaNode.stderr}`);
  const respostasVerificadas = JSON.parse(respostaNode.stdout);
  assert.equal(respostasVerificadas.length, casosDeResposta.length);
  const positivaAceita = respostasVerificadas[0]?.aceito === true && respostasVerificadas[0]?.chamadas === 1;
  for (let i = 0; i < casosDeResposta.length; i++) {
    conferirLocal(casosDeResposta[i].nome, () => {
      if (i > 0) assert.equal(positivaAceita, true,
        "Caso negativo nao e prova enquanto a resposta real positiva for recusada.");
      assert.equal(respostasVerificadas[i].nome, casosDeResposta[i].nome);
      assert.equal(respostasVerificadas[i].chamadas, 1);
      assert.equal(respostasVerificadas[i].aceito, casosDeResposta[i].aceito);
    });
  }
}
console.log(`${verificacoesLocais} verificacoes passaram, ${falhas} falharam; ${cruzados}/${casos.length} contratos cruzados; rede bloqueada.`);
console.log("Limite: prova de contrato/pureza; persistencia SQL e publicacao QA nao sao exercitadas.");
if (falhas) process.exitCode = 1;
