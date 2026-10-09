/** Regra comum ao primeiro acesso e à redefinição de senha. */
export const TAMANHO_MINIMO_SENHA = 15;

const SENHAS_PREVISIVEIS = new Set([
  "123456789012345",
  "1234567890123456",
  "password123456789",
  "senha1234567890",
  "v2gmidia2026senha",
]);

export function validarNovaSenha(senha: string, confirmacao: string): string | null {
  if (Array.from(senha).length < TAMANHO_MINIMO_SENHA) {
    return `Use pelo menos ${TAMANHO_MINIMO_SENHA} caracteres na senha. Uma frase longa é uma boa opção.`;
  }

  const comparacao = senha.normalize("NFC").toLocaleLowerCase("pt-BR").trim();
  if (!comparacao || SENHAS_PREVISIVEIS.has(comparacao)
    || /^(.{1,8})\1+$/us.test(comparacao)) {
    return "Esta senha é fácil de adivinhar. Escolha uma frase longa e menos previsível.";
  }

  if (senha !== confirmacao) return "As senhas não coincidem.";
  return null;
}
