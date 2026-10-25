/** Regra comum ao primeiro acesso e à redefinição de senha. */
export const TAMANHO_MINIMO_SENHA = 12;

const SENHAS_PREVISIVEIS = new Set([
  "senha123456!",
  "password123!",
  "123456789012345",
  "1234567890123456",
  "password123456789",
  "senha1234567890",
  "v2gmidia2026senha",
]);

export type ForcaDaSenha = "vazia" | "fraca" | "media" | "forte";

export function criteriosDaSenha(senha: string) {
  return {
    tamanho: Array.from(senha).length >= TAMANHO_MINIMO_SENHA,
    maiuscula: /\p{Lu}/u.test(senha),
    minuscula: /\p{Ll}/u.test(senha),
    numero: /\p{N}/u.test(senha),
    especial: /[\p{P}\p{S}]/u.test(senha),
  };
}

function previsivel(senha: string) {
  const comparacao = senha.normalize("NFC").toLocaleLowerCase("pt-BR").trim();
  return !comparacao || SENHAS_PREVISIVEIS.has(comparacao)
    || /^(.{1,8})\1+$/us.test(comparacao);
}

/** Indicador dos critérios exigidos; não representa uma medida de entropia. */
export function forcaDaSenha(senha: string): ForcaDaSenha {
  if (!senha) return "vazia";
  if (previsivel(senha)) return "fraca";
  const atendidos = Object.values(criteriosDaSenha(senha)).filter(Boolean).length;
  if (atendidos === 5) return "forte";
  return atendidos >= 3 ? "media" : "fraca";
}

export function validarNovaSenha(senha: string, confirmacao: string): string | null {
  if (Array.from(senha).length < TAMANHO_MINIMO_SENHA) {
    return `Use pelo menos ${TAMANHO_MINIMO_SENHA} caracteres na senha.`;
  }

  if (previsivel(senha)) {
    return "Esta senha é fácil de adivinhar. Escolha outra combinação.";
  }

  const criterios = criteriosDaSenha(senha);
  if (!criterios.maiuscula || !criterios.minuscula || !criterios.numero || !criterios.especial) {
    return "Inclua letra maiúscula, letra minúscula, número e caractere especial.";
  }

  if (senha !== confirmacao) return "As senhas não coincidem.";
  return null;
}
