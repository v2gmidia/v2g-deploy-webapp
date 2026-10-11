import assert from "node:assert/strict";
import { test } from "node:test";
import { TAMANHO_MINIMO_SENHA, criteriosDaSenha, forcaDaSenha, validarNovaSenha } from "../lib/auth-senha.ts";

test("o indicador só chama forte uma senha que a regra do servidor aceita", () => {
  assert.equal(forcaDaSenha(""), "vazia");
  assert.equal(forcaDaSenha("123456"), "fraca");
  assert.equal(forcaDaSenha("Frase curta"), "fraca");
  assert.equal(forcaDaSenha("aaaaaaaaaaaaaaa"), "fraca");
  assert.equal(forcaDaSenha("Meu caderno azul dança"), "media");
  assert.equal(forcaDaSenha("Meu caderno azul dança 8!"), "forte");
  assert.equal(validarNovaSenha("Meu caderno azul dança 8!", "Meu caderno azul dança 8!"), null);
  assert.deepEqual(criteriosDaSenha("Abcdefghijklm1!"), {
    tamanho: true, maiuscula: true, minuscula: true, numero: true, especial: true,
  });
});

test("primeiro acesso recusa a senha curta sugerida para QA", () => {
  assert.equal(TAMANHO_MINIMO_SENHA, 15);
  assert.match(validarNovaSenha("123456", "123456"), /15 caracteres/);
});

test("senhas longas previsíveis e repetidas também são recusadas", () => {
  for (const senha of ["123456789012345", "V2GMIDIA2026SENHA", "aaaaaaaaaaaaaaa",
    "abcdabcdabcdabcd", "               "]) {
    assert.ok(validarNovaSenha(senha, senha));
  }
});

test("confirmação divergente impede criação e redefinição", () => {
  assert.equal(validarNovaSenha("Uma frase longa só minha 8!", "Outra frase longa só minha 8!"),
    "As senhas não coincidem.");
});

test("criação e redefinição exigem critérios claros sem alterar o login antigo", () => {
  assert.match(validarNovaSenha("Meu caderno azul dança", "Meu caderno azul dança"), /número e caractere especial/);
  assert.equal(validarNovaSenha("Meu caderno azul dança 8!", "Meu caderno azul dança 8!"), null);
  assert.equal(validarNovaSenha("🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻", "🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻"),
    "Esta senha é fácil de adivinhar. Escolha outra combinação.");
});
