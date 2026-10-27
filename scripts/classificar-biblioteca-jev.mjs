import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { montarPedidoLoteJev, consultarJevLote } from "../lib/jev/lote-referencias.ts";
import { triarReferencias } from "../lib/jev/triagem-referencias.ts";

const args = process.argv.slice(2);
const posInput = args.indexOf("--input");
const executar = args.includes("--execute");
if (posInput < 0 || !args[posInput + 1]) {
  console.error("Uso: node classify.mjs --input <arquivo-da-coleta.json> [--execute]");
  process.exit(2);
}

const caminho = resolve(args[posInput + 1]);
const bytes = await readFile(caminho);
const hashEntrada = createHash("sha256").update(bytes).digest("hex");
const coleta = JSON.parse(bytes.toString("utf8"));
if (!Array.isArray(coleta.observacoes) || !coleta.consulta?.startsWith("https://www.facebook.com/ads/library/")) {
  throw new Error("Arquivo de coleta inválido");
}
const elegiveis = coleta.observacoes.filter((a) =>
  a.fonte === "biblioteca_meta_interface" && a.situacaoExibida === "ativo" &&
  a.midiaObservada === "imagem" && typeof a.resumoPublico === "string" && a.resumoPublico.trim());
if (elegiveis.length > 40) throw new Error("Mais de 40 imagens; reduza o lote antes de gastar");
const ids = new Set(elegiveis.map((a) => a.id));
if (ids.size !== elegiveis.length) throw new Error("IDs repetidos no arquivo de coleta");
const saida = caminho.replace(/\.json$/i, ".jev.json");
let anterior = null;
try { anterior = JSON.parse(await readFile(saida, "utf8")); } catch (erro) {
  if (erro?.code !== "ENOENT") throw erro;
}
if (anterior && anterior.hashEntrada !== hashEntrada) throw new Error("Coleta mudou após a primeira classificação");
const classificado = new Map((anterior?.classificacoes ?? []).map((r) => [r.id, r]));
const usos = anterior?.usos ?? [];
const faltantes = elegiveis.filter((a) => !classificado.has(a.id));
console.log(`Coleta: ${coleta.observacoes.length} anúncios; ${elegiveis.length} imagens elegíveis; ${faltantes.length} ainda sem Jev.`);
if (!executar) {
  console.log(`Prévia sem custo: ${Math.ceil(faltantes.length / 20)} lote(s) de até 20. Use --execute para chamar o Jev.`);
  process.exit(0);
}
if (!process.env.TYPESAFE_API_KEY) throw new Error("TYPESAFE_API_KEY ausente; nenhuma chamada feita");

for (let indice = 0; indice < faltantes.length; indice += 20) {
  const grupo = faltantes.slice(indice, indice + 20);
  const pedido = montarPedidoLoteJev(grupo);
  const resposta = await consultarJevLote(pedido, process.env.TYPESAFE_API_KEY);
  for (const item of resposta.classificacoes) classificado.set(item.id, item);
  usos.push({ quantidade: grupo.length, tokensEntrada: resposta.tokensEntrada, tokensSaida: resposta.tokensSaida });
  const classificacoes = elegiveis.map((a) => classificado.get(a.id)).filter(Boolean);
  const triagem = triarReferencias(elegiveis.filter((a) => classificado.has(a.id)), classificacoes)
    .sort((a, b) => (b.diasDesdeInicioExibido ?? -1) - (a.diasDesdeInicioExibido ?? -1));
  await writeFile(saida, JSON.stringify({
    hashEntrada, consulta: coleta.consulta, observadoEm: coleta.observadoEm,
    classificacoes, usos, triagem, completo: classificacoes.length === elegiveis.length,
  }, null, 2), "utf8");
  console.log(`Lote gravado: ${grupo.length} anúncios; ${classificacoes.length}/${elegiveis.length} classificados.`);
}
console.log(`Resultado local: ${saida}`);
console.log("Todos os candidatos ainda exigem revisão humana; longevidade não prova resultado.");
