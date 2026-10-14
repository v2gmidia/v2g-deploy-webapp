/** Exemplos para ajudar o cliente a nomear a atividade. Não são nichos do backend. */
export const ATIVIDADES_SUGERIDAS = [
  "Academia",
  "Advocacia",
  "Barbearia",
  "Clínica de estética",
  "Clínica médica",
  "Consultoria",
  "Corretor de imóveis",
  "Dentista",
  "Escola ou curso",
  "Fisioterapeuta",
  "Loja de roupas",
  "Médico",
  "Mercado",
  "Oficina mecânica",
  "Padaria",
  "Pet shop",
  "Pizzaria",
  "Psicólogo",
  "Restaurante",
  "Salão de beleza",
  "Software",
  "Veterinário",
] as const;

const TERMOS: Record<string, string[]> = {
  Dentista: ["odontologia", "odontologista", "consultório odontológico"],
  Médico: ["medicina", "consultório médico"],
  "Clínica médica": ["consultório", "saúde"],
  "Corretor de imóveis": ["imobiliária", "imóveis"],
  "Escola ou curso": ["educação", "aulas"],
  "Pet shop": ["animais", "banho e tosa"],
  Software: ["sistema", "saas", "tecnologia"],
};

export function normalizarAtividade(valor: string): string {
  return valor.toLocaleLowerCase("pt-BR").normalize("NFD")
    .replace(/\p{Diacritic}/gu, "").trim();
}

export function buscarAtividades(consulta: string): string[] {
  const busca = normalizarAtividade(consulta);
  if (!busca) return ATIVIDADES_SUGERIDAS.slice(0, 8);
  return ATIVIDADES_SUGERIDAS.filter((atividade) =>
    [atividade, ...(TERMOS[atividade] ?? [])]
      .some((termo) => normalizarAtividade(termo).includes(busca))
  ).slice(0, 8);
}
