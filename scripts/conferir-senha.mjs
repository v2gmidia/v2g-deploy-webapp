import assert from "node:assert/strict";
import { test } from "node:test";
import { TAMANHO_MINIMO_SENHA, validarNovaSenha } from "../lib/auth-senha.ts";

test("primeiro acesso recusa a senha curta sugerida para QA", () => {
  assert.equal(TAMANHO_MINIMO_SENHA, 15);
  assert.match(validarNovaSenha("123456", "123456"), /15 caracteres/);
});

test("senhas longas previsíveis e repetidas também são recusadas", () => {
  for (const senha of ["123456789012345", "V2GMIDIA2026SENHA", "aaaaaaaaaaaaaaa",
    "abcdabcdabcdabcd", "               "]) {
    assert.match(validarNovaSenha(senha, senha), /fácil de adivinhar/);
  }
});

test("confirmação divergente impede criação e redefinição", () => {
  assert.equal(validarNovaSenha("Uma frase longa só minha", "Outra frase longa só minha"),
    "As senhas não coincidem.");
});

test("frase longa com espaços e Unicode é aceita sem regra artificial de símbolos", () => {
  assert.equal(validarNovaSenha("Meu caderno azul dança", "Meu caderno azul dança"), null);
  assert.equal(validarNovaSenha("🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻", "🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻"),
    "Esta senha é fácil de adivinhar. Escolha uma frase longa e menos previsível.");
});
