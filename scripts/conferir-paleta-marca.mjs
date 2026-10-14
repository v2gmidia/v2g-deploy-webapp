import assert from "node:assert/strict";
import test from "node:test";
import { juntarPaleta } from "../lib/identidade/paleta.ts";

test("cores de vários arquivos entram sem apagar as já escolhidas", () => {
  const cores = juntarPaleta(["#1144CC"], [
    { hex: "#11BB44", peso: 0.7 }, { hex: "#E14A35", peso: 0.5 },
  ]);
  assert.deepEqual(cores, ["#1144CC", "#11BB44", "#E14A35"]);
});

test("tons repetidos são unidos e o limite de seis cores vale para o conjunto", () => {
  const cores = juntarPaleta(["#1144CC"], [
    { hex: "#1548CF", peso: 1 },
    ...["#11BB44", "#E14A35", "#DDBC18", "#9D43C4", "#18B2BB", "#315B65"]
      .map((hex, i) => ({ hex, peso: 0.9 - i * 0.1 })),
  ]);
  assert.equal(cores.length, 6);
  assert.equal(cores.filter((cor) => cor === "#1144CC" || cor === "#1548CF").length, 1);
});
