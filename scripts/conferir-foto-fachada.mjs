import assert from "node:assert/strict";
import { test } from "node:test";
import { tipoFotoRegistrado, tipoFotoValido } from "../lib/identidade/tipo-foto.ts";

test("só aceita tipos declarados de foto do negócio", () => {
  assert.equal(tipoFotoValido("fachada"), "fachada");
  assert.equal(tipoFotoValido("ambiente"), "ambiente");
  assert.equal(tipoFotoValido("produto"), "produto");
  assert.equal(tipoFotoValido("video"), null);
  assert.equal(tipoFotoValido(""), null);
});

test("lê a declaração guardada sem presumir tipo para fotos antigas", () => {
  assert.equal(tipoFotoRegistrado({ identidade: { tipoFoto: "fachada" } }), "fachada");
  assert.equal(tipoFotoRegistrado({ declaracao: { em: "2026-10-19" } }), null);
  assert.equal(tipoFotoRegistrado({ identidade: { tipoFoto: "qualquer" } }), null);
  assert.equal(tipoFotoRegistrado(null), null);
});
