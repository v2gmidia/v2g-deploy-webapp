import assert from "node:assert/strict";
import { test } from "node:test";
import { resumirPendencias } from "../lib/alertas/pendencias.ts";

test("só mostra vazio quando ambas as fontes confirmam zero", () => {
  assert.deepEqual(resumirPendencias({ decisoesExibidas: 0, decisoesTotal: 0,
    ajustesExibidos: 0, ajustesTotal: 0 }),
    { total: 0, leituraCompleta: true, ajustesNaoExibidos: 0 });
  assert.equal(resumirPendencias({ decisoesExibidas: 0, decisoesTotal: 0,
    ajustesExibidos: 0, ajustesTotal: null }).leituraCompleta, false);
});

test("peças com ajuste fora dos 20 registros recentes continuam pendentes", () => {
  assert.deepEqual(resumirPendencias({ decisoesExibidas: 0, decisoesTotal: 0,
    ajustesExibidos: 0, ajustesTotal: 3 }),
    { total: 3, leituraCompleta: true, ajustesNaoExibidos: 3 });
});

test("recorte de decisões ou contagem indisponível não prova lista completa", () => {
  assert.deepEqual(resumirPendencias({ decisoesExibidas: 1000, decisoesTotal: 1001,
    ajustesExibidos: 2, ajustesTotal: 2 }),
    { total: 1003, leituraCompleta: false, ajustesNaoExibidos: 0 });
  assert.deepEqual(resumirPendencias({ decisoesExibidas: 1, decisoesTotal: null,
    ajustesExibidos: 0, ajustesTotal: 0 }),
    { total: null, leituraCompleta: false, ajustesNaoExibidos: 0 });
  assert.equal(resumirPendencias({ decisoesExibidas: 0, decisoesTotal: 0,
    ajustesExibidos: 1, ajustesTotal: 0 }).leituraCompleta, false);
});
