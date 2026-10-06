// node --test scripts/conferir-lembretes.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { planejarLembretes } from "../lib/agenda/lembretes.ts";

const data = (iso) => new Date(iso);
const inicio = data("2026-10-09T16:00:00Z");
const marcos = (resultado) => resultado.ok
  ? resultado.lembretes.map((item) => [item.marco, item.previstoPara.toISOString()])
  : [];

test("reunião confirmada com antecedência tem quatro horários planejados", () => {
  const plano = planejarLembretes(inicio, data("2026-10-07T16:00:00Z"));
  assert.equal(plano.ok, true);
  assert.deepEqual(marcos(plano), [
    ["um_dia", "2026-10-08T16:00:00.000Z"],
    ["duas_horas", "2026-10-09T14:00:00.000Z"],
    ["trinta_minutos", "2026-10-09T15:30:00.000Z"],
    ["cinco_minutos", "2026-10-09T15:55:00.000Z"],
  ]);
});

test("reserva próxima não inventa avisos cujo horário já passou", () => {
  assert.deepEqual(
    marcos(planejarLembretes(inicio, data("2026-10-09T14:30:00Z"))).map(([marco]) => marco),
    ["trinta_minutos", "cinco_minutos"],
  );
  assert.deepEqual(
    marcos(planejarLembretes(inicio, data("2026-10-09T15:30:00Z"))).map(([marco]) => marco),
    ["cinco_minutos"],
  );
  assert.deepEqual(
    marcos(planejarLembretes(inicio, data("2026-10-09T15:56:00Z"))),
    [],
  );
});

test("datas inválidas ou reunião iniciada são recusadas", () => {
  assert.deepEqual(planejarLembretes(data("inválida"), data("2026-10-07T16:00:00Z")), { ok: false, motivo: "data_invalida" });
  assert.deepEqual(planejarLembretes(inicio, inicio), { ok: false, motivo: "reuniao_ja_iniciada" });
  assert.deepEqual(planejarLembretes(inicio, data("2026-10-10T16:00:00Z")), { ok: false, motivo: "reuniao_ja_iniciada" });
});
