import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarioDaReservaAindaConfigurado, conciliarReserva, horarioConfirmadoGoogle,
  selecionarReservaExterna } from "../lib/agenda/conciliacao.ts";
import { descricaoDaReuniao } from "../lib/agenda/descricao-reuniao.ts";
import { CriacaoGoogleRecusada, rejeicaoDefinitivaDaCriacao } from "../lib/agenda/falhas-criacao.ts";

const candidato = { businessId: "negocio-1", orderId: "pedido-1",
  paymentStatus: "payment_approved",
  emailVerificado: "cliente@example.com", cnpj: "00000000000191" };
const conferir = (atual, candidatos = [candidato]) => conciliarReserva(atual, "agenda-v2g", candidatos);
const evento = { calendarId: "agenda-v2g", eventId: "evento-1", etag: "versao-1", status: "confirmed",
  inicio: "2026-10-14T13:00:00-03:00", fim: "2026-10-14T13:25:00-03:00",
  emailParticipante: "CLIENTE@example.com", cnpjInformado: "00000000000191" };
const eventoExterno = { id: "evento-externo-1", etag: "versao-externa-1", status: "confirmed",
  resumo: "Reunião inicial V2G (Cliente)",
  descricao: "**Reservado por** Cliente cliente@example.com\n**CNPJ do negócio atendido** CNPJ 00.000.000/0001-91",
  inicio: "2026-10-28T10:00:00-03:00", fim: "2026-10-28T10:25:00-03:00",
  participantes: ["gestor@v2gmidia.com.br", "CLIENTE@example.com"],
  htmlLink: "https://www.google.com/calendar/event?eid=seguro" };

test("troca de calendário mantém a reserva bloqueada para revisão", () => {
  assert.equal(calendarioDaReservaAindaConfigurado("agenda-v2g", "agenda-v2g"), true);
  assert.equal(calendarioDaReservaAindaConfigurado("agenda-v2g", "agenda-nova"), false);
  assert.equal(calendarioDaReservaAindaConfigurado("agenda-v2g", null), false);
});

test("somente rejeições explícitas do POST podem liberar uma reserva sem evento", () => {
  for (const status of [400, 401, 403, 404, 422]) {
    assert.equal(rejeicaoDefinitivaDaCriacao(status), true);
    assert.equal(new CriacaoGoogleRecusada(status).statusHttp, status);
  }
  for (const status of [200, 408, 409, 429, 500, 502, 503])
    assert.equal(rejeicaoDefinitivaDaCriacao(status), false);
});

test("reserva só é reconhecida com evento, calendário, e-mail e CNPJ conferidos", () => {
  assert.deepEqual(conferir(evento), {
    status: "reservado", businessId: "negocio-1", orderId: "pedido-1",
    chaveEvento: "agenda-v2g:evento-1", versao: "versao-1",
    inicio: evento.inicio, fim: evento.fim,
  });
});

test("evento sem CNPJ exposto permanece em revisão", () => {
  assert.deepEqual(conferir({ ...evento, cnpjInformado: null }),
    { status: "revisao", motivo: "cnpj" });
});

test("CNPJ com máscara corresponde ao mesmo negócio", () => {
  assert.equal(conferir({ ...evento, cnpjInformado: "00.000.000/0001-91" }).status, "reservado");
  assert.equal(conferir({ ...evento, cnpjInformado: "00.000.000/0001-92" }).status, "revisao");
  assert.equal(conferir({ ...evento, cnpjInformado: "0000000000019A" }).status, "revisao");
});

test("e-mail ou calendário de outro negócio não confirma reunião", () => {
  assert.equal(conferir({ ...evento, emailParticipante: "outro@example.com" }).status, "revisao");
  assert.equal(conferir({ ...evento, calendarId: "outro" }).status, "revisao");
});

test("duas compras do mesmo e-mail e CNPJ exigem revisão manual", () => {
  assert.deepEqual(conferir(evento, [candidato, { ...candidato, orderId: "pedido-2" }]),
    { status: "revisao", motivo: "vinculo_ambiguo_ou_ausente" });
});

test("reserva da página pública só entra com título, evento, participante e CNPJ verificáveis", () => {
  const resultado = selecionarReservaExterna([eventoExterno], "agenda-v2g", [candidato]);
  assert.equal(resultado.status, "encontrada");
  assert.equal(resultado.evento.id, eventoExterno.id);
  const comHtml = selecionarReservaExterna([{ ...eventoExterno,
    descricao: "<b>CNPJ do negócio atendido</b>: CNPJ&nbsp;00.000.000/0001-91" }], "agenda-v2g", [candidato]);
  assert.equal(comHtml.status, "encontrada");
});

test("sem evento externo confirmado a reunião permanece pendente", () => {
  assert.deepEqual(selecionarReservaExterna([], "agenda-v2g", [candidato]), { status: "ausente" });
  assert.deepEqual(selecionarReservaExterna([{ ...eventoExterno, status: "cancelled" }], "agenda-v2g", [candidato]), { status: "ausente" });
  assert.deepEqual(selecionarReservaExterna([{ ...eventoExterno, resumo: "Outro compromisso" }], "agenda-v2g", [candidato]), { status: "ausente" });
});

test("duplicidade externa ou dois negócios compatíveis exigem revisão e não liberam nova reserva", () => {
  assert.deepEqual(selecionarReservaExterna([eventoExterno, { ...eventoExterno, id: "evento-externo-2" }], "agenda-v2g", [candidato]),
    { status: "revisao", motivo: "mais_de_um_evento" });
  const outroNegocio = { ...candidato, businessId: "negocio-2", orderId: "pedido-2" };
  assert.deepEqual(selecionarReservaExterna([eventoExterno], "agenda-v2g", [candidato, outroNegocio]),
    { status: "revisao", motivo: "vinculo_ambiguo_ou_ausente" });
});

test("pedido pendente ou cancelado não confirma reserva", () => {
  for (const paymentStatus of ["awaiting_payment", "proof_received", "cancelled"]) {
    assert.deepEqual(conferir(evento, [{ ...candidato, paymentStatus }]),
      { status: "revisao", motivo: "vinculo_ambiguo_ou_ausente" });
  }
});

test("cancelamento mínimo usa vínculo já confirmado do mesmo evento", () => {
  const anterior = { chaveEvento: "agenda-v2g:evento-1", businessId: "negocio-1",
    orderId: "pedido-1", status: "reservado" };
  const resultado = conciliarReserva({ calendarId: "agenda-v2g", eventId: "evento-1",
    status: "cancelled" }, "agenda-v2g", [], anterior);
  assert.equal(resultado.status, "cancelado");
  assert.equal(resultado.chaveEvento, "agenda-v2g:evento-1");
  assert.equal(resultado.versao, "cancelled");
  assert.equal(resultado.businessId, "negocio-1");
  assert.equal(resultado.orderId, "pedido-1");
});

test("cancelamento sem reserva anterior ou de outro evento não derruba reunião", () => {
  const cancelado = { calendarId: "agenda-v2g", eventId: "evento-1", status: "cancelled" };
  const anterior = { chaveEvento: "agenda-v2g:evento-2", businessId: "negocio-1",
    orderId: "pedido-1", status: "reservado" };
  assert.equal(conferir(cancelado).status, "revisao");
  assert.equal(conciliarReserva(cancelado, "agenda-v2g", [], anterior).status, "revisao");
  assert.equal(conciliarReserva({ ...cancelado, calendarId: "outra-agenda" }, "agenda-v2g",
    [], { ...anterior, chaveEvento: "outra-agenda:evento-1" }).status, "revisao");
  assert.equal(conciliarReserva(cancelado, "agenda-v2g", [],
    { ...anterior, chaveEvento: "agenda-v2g:evento-1", status: "cancelado" }).status, "revisao");
});

test("evento sem versão ou horário válido não produz reserva", () => {
  assert.equal(conferir({ ...evento, etag: "" }).status, "revisao");
  assert.equal(conferir({ ...evento, fim: evento.inicio }).status, "revisao");
  assert.equal(conferir({ ...evento, inicio: "2026-10-14T13:00:00" }).status, "revisao");
  assert.equal(conferir({ ...evento, fim: "2026-10-14T13:25:00" }).status, "revisao");
});

test("horário alterado no Google é normalizado; evento sem horário válido exige revisão", () => {
  assert.deepEqual(horarioConfirmadoGoogle("2026-10-14T14:00:00-03:00", "2026-10-14T14:25:00-03:00"),
    { inicio: "2026-10-14T17:00:00.000Z", fim: "2026-10-14T17:25:00.000Z" });
  assert.equal(horarioConfirmadoGoogle(null, "2026-10-14T14:25:00-03:00"), null);
  assert.equal(horarioConfirmadoGoogle("2026-10-14T14:00:00", "2026-10-14T14:25:00"), null);
  assert.equal(horarioConfirmadoGoogle("2026-10-14T14:25:00-03:00", "2026-10-14T14:00:00-03:00"), null);
});

test("convite da reunião resume declarações e lacunas sem transformar oferta antiga em decisão", () => {
  const descricao = descricaoDaReuniao({ respostas: {
    ramo: { texto: "Academia", origem: "texto" },
    descricao: { texto: "Treino de força\n e mobilidade", origem: "texto" },
    oferta: { texto: "Anunciar plano anual", origem: "texto" },
    publico: { texto: "Adultos que buscam treinamento", origem: "texto" },
    motivo: { texto: "Ainda não sei explicar", origem: "chip" },
  } }, "00000000000191");
  assert.match(descricao, /Academia/);
  assert.match(descricao, /Treino de força e mobilidade/);
  assert.match(descricao, /Adultos que buscam treinamento/);
  assert.match(descricao, /Para confirmar na reunião: O que o cliente procura/);
  assert.doesNotMatch(descricao, /Anunciar plano anual/);
  assert.doesNotMatch(descricao, /Treino de força\n e mobilidade/);
});

test("convite sem resposta não afirma perfil, diferencial ou ausência de dúvidas", () => {
  const descricao = descricaoDaReuniao({}, "00000000000191");
  assert.match(descricao, /CNPJ 00\.000\.000\/0001-91/);
  assert.doesNotMatch(descricao, /Diferencial:|Quem compra:|Para confirmar na reunião:/);
});
