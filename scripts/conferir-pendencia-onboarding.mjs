import assert from "node:assert/strict";
import test from "node:test";
import { pendenciaDoOnboarding } from "../lib/onboarding/conclusao.ts";

const em = "2026-10-16T12:00:00.000Z";
const resposta = (texto) => ({ texto, echo: texto, origem: "texto", em });
const documentoCompleto = () => ({
  versao: 9,
  respostas: {
    nome: resposta("Negócio"),
    ramo: resposta("Serviços"),
    descricao: resposta("Descrição completa do negócio"),
    praca: resposta("Brasil inteiro"),
  },
  contas: {
    ticket: { echo: "100", calculado: 100, confirmado: true, em },
    custo: { echo: "Não sei", calculado: null, confirmado: false, naoSei: true, em },
    lucro: { echo: "Não sei", calculado: null, confirmado: false, naoSei: true, em },
  },
  marca: { aparencia: "", coresConfirmadas: ["#1144CC"], aparenciaNaoSei: false, siteNaoTenho: true, em },
  conclusao: { em, proximoPasso: "agendamento_pendente" },
});

const dados = (onboarding) => ({
  onboarding,
  site_url: null,
  avg_ticket_min: 100,
  avg_ticket_max: 100,
  avg_direct_cost: null,
  target_profit_per_customer: null,
});

test("cadastro concluído continua com reunião pendente sem confirmação externa", () => {
  const pendencia = pendenciaDoOnboarding(dados(documentoCompleto()), false);
  assert.equal(pendencia?.href, "/onboarding/concluido");
  assert.match(pendencia?.corpo ?? "", /não comprova a reserva/);
});

test("reserva confirmada remove a pendência da reunião", () => {
  assert.equal(pendenciaDoOnboarding(dados(documentoCompleto()), true), null);
});

test("respostas incompletas apontam para o começo sem apagar o documento", () => {
  const onboarding = documentoCompleto();
  delete onboarding.respostas.descricao;
  assert.equal(pendenciaDoOnboarding(dados(onboarding), false)?.href, "/onboarding");
  assert.equal(onboarding.contas.ticket.echo, "100");
});
