import assert from "node:assert/strict";
import { test } from "node:test";
import { conciliarReserva } from "../lib/agenda/conciliacao.ts";

const candidato = { businessId: "negocio-1", orderId: "pedido-1",
  paymentStatus: "payment_approved",
  emailVerificado: "cliente@example.com", cnpj: "00000000000191" };
const conferir = (atual, candidatos = [candidato]) => conciliarReserva(atual, "agenda-v2g", candidatos);
const evento = { calendarId: "agenda-v2g", eventId: "evento-1", etag: "versao-1", status: "confirmed",
  inicio: "2026-10-14T13:00:00-03:00", fim: "2026-10-14T13:25:00-03:00",
  emailParticipante: "CLIENTE@example.com", cnpjInformado: "00000000000191" };

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
