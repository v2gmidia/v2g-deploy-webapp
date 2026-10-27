import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { triarReferencias } from "../lib/jev/triagem-referencias.ts";
import { avaliarCortesDePertinencia } from "../lib/jev/avaliar-cortes.ts";

const indice = process.argv.indexOf("--input");
if (indice < 0 || !process.argv[indice + 1]) {
  throw new Error("Uso: node scripts/relatorio-biblioteca-jev.mjs --input <arquivo.jev.json>");
}

const entrada = resolve(process.argv[indice + 1]);
if (!entrada.endsWith(".jev.json")) throw new Error("Esperado arquivo .jev.json");
const dados = JSON.parse(await readFile(entrada, "utf8"));
if (!dados.completo || !Array.isArray(dados.triagem) || !Array.isArray(dados.classificacoes) || !Array.isArray(dados.usos)) {
  throw new Error("A classificação não está completa");
}
const posRevisoes = process.argv.indexOf("--revisoes");
const revisoes = posRevisoes < 0 ? [] : JSON.parse(await readFile(resolve(process.argv[posRevisoes + 1]), "utf8"));
if (!Array.isArray(revisoes)) throw new Error("Revisões devem ser uma lista JSON");
// Recalcula a triagem: o arquivo Jev preserva a regra vigente quando foi gravado.
const triagem = triarReferencias(dados.triagem.map((item) => item.anuncio), dados.classificacoes);
const avaliacoes = avaliarCortesDePertinencia(triagem, revisoes);
const nomeSeguro = (valor) => String(valor ?? "").replace(/[|\r\n]/g, " ").trim().slice(0, 100);
const linha = (item) => {
  const anuncio = item.anuncio;
  const id = /^\d+$/.test(anuncio?.id ?? "") ? anuncio.id : null;
  if (!id) throw new Error("ID da Biblioteca inválido");
  const confianca = Number.isFinite(item.jev?.confianca)
    ? `${Math.round(item.jev.confianca * 100)}%` : "sem classificação";
  return `| [${id}](https://www.facebook.com/ads/library/?id=${id}) | ${nomeSeguro(anuncio.anunciante)} | ${anuncio.inicioExibido ?? "?"} | ${item.diasDesdeInicioExibido ?? "?"} | ${item.jev?.rotulo ?? "sem rótulo"} | ${confianca} |`;
};
const candidatos = triagem.filter((item) => item.destino === "candidato_para_revisao");
const revisar = triagem.filter((item) => item.destino === "revisao_de_classificacao");
const descartados = triagem.filter((item) => item.destino === "fora_do_recorte").length;
const tabela = (itens) => [
  "| ID | Anunciante exibido | Início exibido | Dias desde o início | Rótulo Jev | Confiança no rótulo |",
  "|---|---|---|---:|---|---:|",
  ...itens.map(linha),
].join("\n");
const tokens = dados.usos.reduce((acc, uso) => ({
  entrada: acc.entrada + (Number.isSafeInteger(uso.tokensEntrada) ? uso.tokensEntrada : 0),
  saida: acc.saida + (Number.isSafeInteger(uso.tokensSaida) ? uso.tokensSaida : 0),
}), { entrada: 0, saida: 0 });
const relatorio = [
  "# Triagem da Biblioteca — revisão humana",
  "",
  `Observado em: ${dados.observadoEm ?? "não informado"}. Amostra parcial; pesquisa e custo de coleta não medidos integralmente.`,
  `Jev: ${dados.classificacoes?.length ?? 0} classificações em ${dados.usos.length} lotes; ${tokens.entrada} tokens de entrada e ${tokens.saida} de saída. Custo monetário não confirmado.`,
  "A confiança mede separação entre rótulos do Jev; os dias são calculados à parte. Nenhuma das duas medidas é taxa de venda.",
  "",
  "## Cortes de pertinência em avaliação",
  "",
  "| Corte | Selecionados para revisão | Revisões humanas recebidas | Falsos positivos conhecidos | Falsos negativos conhecidos | Precisão | Cobertura |",
  "|---:|---:|---:|---:|---:|---:|---:|",
  ...avaliacoes.map((a) => `| ${Math.round(a.corte * 100)}% | ${a.selecionados} | ${a.revisados}/${a.total} | ${a.falsosPositivosConhecidos} | ${a.falsosNegativosConhecidos} | ${a.precisao === null ? "não medida" : `${Math.round(a.precisao * 100)}%`} | ${a.cobertura === null ? "não medida" : `${Math.round(a.cobertura * 100)}%`} |`),
  "",
  "Corte nenhum libera referência para uso automaticamente. É preciso revisar a amostra inteira para medir precisão/cobertura; direitos e resultado comercial continuam separados.",
  "",
  "## Candidatos para abrir e revisar",
  "",
  tabela(candidatos),
  "",
  "## Classificação que precisa de conferência",
  "",
  tabela(revisar),
  "",
  `${descartados} referências ficaram fora do recorte.`,
  "",
  "**Anúncio ativo e data inicial exibida não comprovam veiculação contínua, vendas, lucro, reputação ou direito de usar a imagem.** Verifique a oferta e o anunciante no link original antes de aprovar uma referência. Não copie a peça de terceiro para um criativo da V2G.",
  "",
].join("\n");
const saida = entrada.replace(/\.jev\.json$/, ".revisao.md");
await writeFile(saida, relatorio, "utf8");
console.log(`Relatório local: ${saida}; ${candidatos.length} candidatos, ${revisar.length} classificações a conferir, ${descartados} fora do recorte.`);
