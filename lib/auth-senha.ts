/** Regra comum ao primeiro acesso e à redefinição de senha. */
export const TAMANHO_MINIMO_SENHA = 15;

const SENHAS_PREVISIVEIS = new Set([
  "123456789012345",
  "1234567890123456",
  "password123456789",
  "senha1234567890",
  "v2gmidia2026senha",
]);

export type ForcaDaSenha = "vazia" | "fraca" | "media" | "forte";

/** Indicador simples de comprimento e padrões óbvios; a validação do servidor
 * continua sendo a fonte da regra. Não representa uma medida de entropia. */
export function forcaDaSenha(senha: string): ForcaDaSenha {
  if (!senha) return "vazia";
  const comparacao = senha.normalize("NFC").toLocaleLowerCase("pt-BR").trim();
  if (!comparacao || SENHAS_PREVISIVEIS.has(comparacao)
    || /^(.{1,8})\1+$/us.test(comparacao)
    || Array.from(senha).length < 10) return "fraca";
  return Array.from(senha).length < TAMANHO_MINIMO_SENHA ? "media" : "forte";
}

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
