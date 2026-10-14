import assert from "node:assert/strict";
import test from "node:test";
import { sugerirHorarios } from "../lib/agenda/horarios.ts";

test("a grade respeita 25 minutos de reunião e 15 de intervalo", () => {
  const agora = new Date("2026-10-14T12:00:00Z"); // 09:00 em São Paulo
  const horarios = sugerirHorarios(agora, []);
  assert.deepEqual(horarios.slice(0, 3), [
    "2026-10-14T13:00:00.000Z",
    "2026-10-14T13:40:00.000Z",
    "2026-10-14T14:20:00.000Z",
  ]);
});

test("compromisso Google ocupado retira o horário e seu intervalo", () => {
  const horarios = sugerirHorarios(new Date("2026-10-14T12:00:00Z"), [
    { inicio: new Date("2026-10-14T13:00:00Z"), fim: new Date("2026-10-14T13:25:00Z") },
  ]);
  assert.equal(horarios[0], "2026-10-14T13:40:00.000Z");
});
