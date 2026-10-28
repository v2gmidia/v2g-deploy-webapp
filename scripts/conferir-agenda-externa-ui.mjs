import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const externa = await readFile("app/(fluxo)/onboarding/concluido/AgendaExterna.tsx", "utf8");
const propria = await readFile("app/(fluxo)/onboarding/concluido/AgendaPropria.tsx", "utf8");
const actions = await readFile("app/(fluxo)/onboarding/concluido/agenda-actions.ts", "utf8");

test("abrir a agenda externa nunca vira confirmação de reunião", () => {
  assert.match(externa, /Isso não prova que a reserva foi concluída/);
  assert.match(externa, /Abrir este link não reserva um horário/);
  assert.doesNotMatch(externa, /Já marquei|Reunião confirmada/);
});

test("retorno no mesmo navegador evita uma segunda abertura acidental", () => {
  assert.match(externa, /localStorage\.setItem/);
  assert.match(externa, /Se recebeu o e-mail de confirmação, não escolha outro horário/);
  assert.match(externa, /Não concluí a reserva ou não recebi o e-mail/);
});

test("reserva externa confirmada é somente leitura para cancelar e remarcar", () => {
  assert.match(propria, /!estado\.gerenciadaNoApp/);
  assert.match(propria, /Use o e-mail de confirmação para remarcar ou cancelar/);
});

test("conciliação externa vem antes de oferecer agenda interna livre", () => {
  const importacao = actions.indexOf("await importarReservaExterna");
  const horarios = actions.indexOf("await ocupacoesDaAgenda", importacao);
  assert.ok(importacao >= 0 && horarios > importacao);
  assert.match(actions, /reserva_externa_/);
});
