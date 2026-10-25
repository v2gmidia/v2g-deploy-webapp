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
  assert.equal(TAMANHO_MINIMO_SENHA, 12);
  assert.match(validarNovaSenha("123456", "123456"), /12 caracteres/);
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

test("limite de 12 aceita criterios completos e rejeita 11 ou classe ausente", () => {
  const aceita = "K7!mQ2@vR9#s";
  assert.equal(aceita.length, 12);
  assert.equal(validarNovaSenha(aceita, aceita), null);
  assert.equal(forcaDaSenha(aceita), "forte");
  assert.match(validarNovaSenha(aceita.slice(0, 11), aceita.slice(0, 11)), /12 caracteres/);
  for (const senha of ["k7!mq2@vr9#s", "K7!MQ2@VR9#S", "Km!mQx@vRx#s", "K71mQ22vR93s"])
    assert.match(validarNovaSenha(senha, senha), /maiúscula, letra minúscula, número e caractere especial/);
  for (const senha of ["Senha123456!", "Password123!"]) assert.ok(validarNovaSenha(senha, senha));
});

test("criação e redefinição exigem critérios claros sem alterar o login antigo", () => {
  assert.match(validarNovaSenha("Meu caderno azul dança", "Meu caderno azul dança"), /número e caractere especial/);
  assert.equal(validarNovaSenha("Meu caderno azul dança 8!", "Meu caderno azul dança 8!"), null);
  assert.equal(validarNovaSenha("🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻", "🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻🌻"),
    "Esta senha é fácil de adivinhar. Escolha outra combinação.");
});
