import assert from "node:assert/strict";
import { avaliarPortaDeGeracao } from "../lib/criativos/porta-geracao.ts";

const inicial = { businessId: "barbearia-1", tipo: "inicial", historicoCompleto: true,
  tentativas: [], limiteTotalCentavos: 600, tetoDaProximaTentativaCentavos: 150 };
const concluida = (tipo, custoCentavos = 150) => ({ businessId: "barbearia-1", tipo,
  estado: "concluida", custoCentavos });
let casos = 0;
function teste(nome, entrada, esperado, resultadoEsperado = false) {
  const resultado = avaliarPortaDeGeracao(entrada);
  assert.equal(resultado.ok, resultadoEsperado, nome);
  if (esperado) assert.ok(!resultado.ok && resultado.bloqueios.includes(esperado), nome);
  casos += 1;
}

teste("inicial cabe no teto", inicial, null, true);
teste("sem limite aprovado", { ...inicial, limiteTotalCentavos: null }, "limite_nao_aprovado");
teste("sem pior custo conhecido", { ...inicial, tetoDaProximaTentativaCentavos: null }, "teto_da_chamada_desconhecido");
teste("consulta parcial falha fechada", { ...inicial, historicoCompleto: false }, "historico_incompleto");
teste("outra conta não entra no histórico", { ...inicial, tentativas: [{ ...concluida("inicial"), businessId: "outro" }] }, "historico_de_outro_negocio");
teste("custo anterior desconhecido bloqueia", { ...inicial, tentativas: [concluida("inicial", null)] }, "custo_desconhecido");
teste("reserva em aberto bloqueia", { ...inicial, tentativas: [{ ...concluida("inicial"), estado: "reservada" }] }, "tentativa_em_andamento");
teste("segunda inicial bloqueada", { ...inicial, tentativas: [concluida("inicial")] }, "imagem_inicial_ja_entregue");
const refacao = { ...inicial, tipo: "refacao", instrucaoDaRefacao: "Aumente o contraste",
  tentativas: [concluida("inicial")] };
teste("primeira refação permitida", refacao, null, true);
teste("refação exige imagem inicial", { ...refacao, tentativas: [] }, "imagem_inicial_pendente");
teste("refação exige instrução", { ...refacao, instrucaoDaRefacao: " " }, "instrucao_da_refacao_ausente");
teste("terceira refação permitida", { ...refacao, tentativas: [concluida("inicial"), concluida("refacao"), concluida("refacao")] }, null, true);
teste("quarta refação bloqueada", { ...refacao, tentativas: [concluida("inicial"), concluida("refacao"), concluida("refacao"), concluida("refacao")], limiteTotalCentavos: 1000 }, "limite_de_refacoes");
teste("falha cobrada consome saldo", { ...refacao, tentativas: [concluida("inicial"), { ...concluida("refacao", 400), estado: "falhou" }] }, "orcamento_insuficiente");
teste("negativo não é custo válido", { ...inicial, limiteTotalCentavos: -1 }, "limite_nao_aprovado");
console.log(`Porta local de geração: ${casos}/${casos} casos sintéticos passaram.`);
