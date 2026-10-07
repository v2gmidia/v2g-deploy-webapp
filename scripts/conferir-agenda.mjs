// node --test scripts/conferir-agenda.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { avaliarHorario, limiteDeAgendamento, podeRemarcar } from "../lib/agenda/regras.ts";

const data = (iso) => new Date(iso);
const agora = data("2026-10-09T12:00:00Z"); // sexta, 09h em São Paulo
const avaliar = (inicio, extras = {}) => avaliarHorario({
  inicio: data(inicio),
  agora,
  duracaoMinutos: 25,
  ocupacoes: [],
  ...extras,
});

test("prazo conta cinco dias úteis após sexta, no fuso de São Paulo", () => {
  assert.equal(limiteDeAgendamento(agora), "2026-10-16");
  assert.deepEqual(avaliar("2026-10-16T20:35:00Z"), { ok: true }); // 17h35–18h
  assert.deepEqual(avaliar("2026-10-19T13:00:00Z"), { ok: false, motivo: "fora_do_prazo" });
});

test("fim de semana, expediente e antecedência são barreiras independentes", () => {
  assert.deepEqual(avaliar("2026-10-10T13:00:00Z"), { ok: false, motivo: "fim_de_semana" });
  assert.deepEqual(avaliar("2026-10-09T12:29:00Z"), { ok: false, motivo: "antecedencia" });
  assert.deepEqual(avaliar("2026-10-09T12:30:00Z"), { ok: false, motivo: "fora_do_horario" });
  assert.deepEqual(avaliar("2026-10-09T13:00:00Z"), { ok: true }); // 10h local
  assert.deepEqual(avaliar("2026-10-09T20:36:00Z"), { ok: false, motivo: "fora_do_horario" });
});

test("o intervalo de 15 minutos vale antes e depois de outra reunião", () => {
  const ocupacoes = [{ inicio: data("2026-10-09T13:00:00Z"), fim: data("2026-10-09T13:25:00Z") }];
  assert.deepEqual(avaliar("2026-10-09T13:39:00Z", { ocupacoes }), { ok: false, motivo: "ocupado" });
  assert.deepEqual(avaliar("2026-10-09T13:40:00Z", { ocupacoes }), { ok: true });
  const depois = [{ inicio: data("2026-10-09T14:00:00Z"), fim: data("2026-10-09T14:25:00Z") }];
  assert.deepEqual(avaliar("2026-10-09T13:21:00Z", { ocupacoes: depois }), { ok: false, motivo: "ocupado" });
  assert.deepEqual(avaliar("2026-10-09T13:20:00Z", { ocupacoes: depois }), { ok: true });
});

test("a reunião dura exatamente 25 minutos e datas inválidas são recusadas", () => {
  assert.deepEqual(avaliar("2026-10-09T20:40:00Z", { duracaoMinutos: 20 }), { ok: false, motivo: "duracao_invalida" });
  assert.deepEqual(avaliar("2026-10-09T20:40:00Z", { duracaoMinutos: 25 }), { ok: false, motivo: "fora_do_horario" });
  assert.deepEqual(avaliar("invalida"), { ok: false, motivo: "data_invalida" });
  assert.deepEqual(avaliar("2026-10-09T13:00:00Z", { duracaoMinutos: 0 }), { ok: false, motivo: "duracao_invalida" });
  assert.deepEqual(avaliar("2026-10-09T13:00:00Z", { ocupacoes: [{ inicio: data("invalida"), fim: data("2026-10-09T13:25:00Z") }] }), { ok: false, motivo: "data_invalida" });
});

test("remarcação permite até 25 minutos antes, inclusive; ausência não depende desta regra", () => {
  const inicio = data("2026-10-09T14:00:00Z");
  assert.equal(podeRemarcar(inicio, data("2026-10-09T13:35:00Z")), true);
  assert.equal(podeRemarcar(inicio, data("2026-10-09T13:35:01Z")), false);
  assert.equal(podeRemarcar(inicio, data("invalida")), false);
});
