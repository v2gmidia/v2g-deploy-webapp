/** Exemplos para ajudar o cliente a nomear a atividade. Não são nichos do backend. */
export const ATIVIDADES_SUGERIDAS = [
  "Academia",
  "Açougue",
  "Advocacia",
  "Agência de viagens",
  "Aluguel de equipamentos",
  "Arquitetura",
  "Assistência técnica",
  "Ateliê de costura",
  "Atendimento domiciliar de saúde",
  "Autopeças",
  "Autoescola",
  "Barbearia",
  "Buffet e eventos",
  "Cafeteria",
  "Clínica de diagnóstico",
  "Clínica de estética",
  "Clínica médica",
  "Clínica odontológica",
  "Clínica veterinária",
  "Confeitaria",
  "Construção e reformas",
  "Consultoria",
  "Contabilidade",
  "Corretor de imóveis",
  "Cursos profissionalizantes",
  "Cursos online",
  "Dentista",
  "Delivery de refeições",
  "Design de interiores",
  "Distribuidora de bebidas",
  "E-commerce",
  "Engenharia",
  "Escola de idiomas",
  "Escola de música",
  "Escola infantil",
  "Escola ou curso",
  "Estúdio de dança",
  "Estúdio de pilates",
  "Estúdio de tatuagem",
  "Farmácia",
  "Fisioterapeuta",
  "Floricultura",
  "Fotografia",
  "Gráfica e impressão",
  "Hamburgueria",
  "Hotel ou pousada",
  "Imobiliária",
  "Jardinagem e paisagismo",
  "Lavanderia",
  "Loja de artigos esportivos",
  "Loja de calçados",
  "Loja de cosméticos",
  "Loja de eletrônicos",
  "Loja de ferramentas",
  "Loja de materiais de construção",
  "Loja de móveis",
  "Loja de produtos naturais",
  "Loja de roupas",
  "Loja de suplementos",
  "Manutenção de ar-condicionado",
  "Marcenaria",
  "Médico",
  "Mercado",
  "Nutricionista",
  "Oficina mecânica",
  "Ótica",
  "Padaria",
  "Papelaria",
  "Personal trainer",
  "Pet shop",
  "Pizzaria",
  "Psicólogo",
  "Reparação de celulares",
  "Restaurante",
  "Salão de beleza",
  "Segurança eletrônica",
  "Serviços de beleza em domicílio",
  "Serviços elétricos",
  "Serviços hidráulicos",
  "Serviços de limpeza",
  "Serviços de mudanças",
  "Software",
  "Terapia ocupacional",
  "Transportadora",
  "Veterinário",
] as const;

const TERMOS: Record<string, string[]> = {
  "Ateliê de costura": ["costureira", "conserto de roupas"],
  "Buffet e eventos": ["festa", "casamento"],
  "Construção e reformas": ["obra", "reforma", "pedreiro"],
  "Delivery de refeições": ["marmita", "comida pronta"],
  Dentista: ["odontologia", "odontologista", "consultório odontológico"],
  "Estúdio de tatuagem": ["tatuador", "tattoo"],
  "Manutenção de ar-condicionado": ["ar condicionado", "refrigeração"],
  Médico: ["medicina", "consultório médico"],
  "Clínica médica": ["consultório", "saúde"],
  "Clínica odontológica": ["odontologia", "consultório odontológico"],
  "Corretor de imóveis": ["imobiliária", "imóveis"],
  "Design de interiores": ["decoração", "decorador"],
  "E-commerce": ["loja online", "comércio eletrônico"],
  "Escola ou curso": ["educação", "aulas"],
  "Marcenaria": ["móveis planejados", "marceneiro"],
  "Oficina mecânica": ["mecânico", "conserto de carro"],
  "Personal trainer": ["treinador", "professor de educação física"],
  "Pet shop": ["animais", "banho e tosa"],
  "Reparação de celulares": ["conserto de celular", "smartphone"],
  "Serviços elétricos": ["eletricista"],
  "Serviços hidráulicos": ["encanador"],
  Software: ["sistema", "saas", "tecnologia"],
};

export function normalizarAtividade(valor: string): string {
  return valor.toLocaleLowerCase("pt-BR").normalize("NFD")
    .replace(/\p{Diacritic}/gu, "").trim();
}

/** Associação operacional conservadora. O texto que o cliente escreveu continua intacto. */
export function familiaDaAtividade(valor: string): string | null {
  const tipo = normalizarAtividade(valor);
  if (/cabeleireir|salao de beleza|barbearia|servicos de beleza|clinica de estetica/.test(tipo)) return "Beleza e cuidados pessoais";
  if (/dentist|odontolog/.test(tipo)) return "Odontologia";
  if (/arquitet|design de interiores/.test(tipo)) return "Arquitetura e interiores";
  if (/restaurante|pizzaria|hamburgueria|cafeteria|delivery de refeicoes/.test(tipo)) return "Alimentação";
  return null;
}

export function buscarAtividades(consulta: string): string[] {
  const busca = normalizarAtividade(consulta);
  if (!busca) return ATIVIDADES_SUGERIDAS.slice(0, 8);
  return ATIVIDADES_SUGERIDAS.filter((atividade) =>
    [atividade, ...(TERMOS[atividade] ?? [])]
      .some((termo) => normalizarAtividade(termo).includes(busca))
  ).slice(0, 8);
}

/** Exemplos de escrita, nunca fatos sobre o cliente nem segmentação aprovada. */
export function exemplosDaAtividade(atividade: string): Record<string, string> {
  const tipo = normalizarAtividade(atividade);
  if (familiaDaAtividade(tipo) === "Beleza e cuidados pessoais") return {
    descricao: "Ex.: cortes, coloração e tratamentos, conforme o serviço escolhido",
    publico: "Ex.: mulheres adultas que moram perto do salão e cuidam do cabelo regularmente",
    motivo: "Ex.: querem cortar, tratar ou mudar a cor do cabelo com orientação",
    resultado: "Ex.: recebe o atendimento contratado, como corte ou coloração",
  };
  if (tipo.includes("academia") || tipo.includes("pilates")) return {
    descricao: "Ex.: musculação, aulas em grupo e avaliação inicial",
    publico: "Ex.: pessoas que querem ganhar massa muscular ou recuperar a mobilidade",
    motivo: "Ex.: querem treinar perto de casa com orientação",
    resultado: "Ex.: acesso aos treinos e aulas incluídos no plano escolhido",
  };
  if (tipo.includes("dentist") || tipo.includes("odontolog")) return {
    descricao: "Ex.: consultas, limpeza e tratamentos odontológicos",
    publico: "Ex.: moradores da cidade que procuram atendimento odontológico",
    motivo: "Ex.: precisam avaliar um incômodo ou manter os cuidados em dia",
    resultado: "Ex.: avaliação e tratamento contratado, conforme cada caso",
  };
  if (tipo.includes("clinica medica") || tipo === "medico" || tipo.includes("fisioterap")) return {
    descricao: "Ex.: consultas, avaliações e acompanhamentos disponíveis",
    publico: "Ex.: pessoas da região que procuram atendimento na especialidade",
    motivo: "Ex.: querem avaliar uma queixa ou acompanhar a própria saúde",
    resultado: "Ex.: recebe a consulta ou o serviço contratado, conforme cada caso",
  };
  if (tipo.includes("restaurante") || tipo.includes("pizzaria") || tipo.includes("hamburgueria")) return {
    descricao: "Ex.: refeições no salão, retirada e entrega",
    publico: "Ex.: pessoas da região que costumam pedir comida pelo WhatsApp",
    motivo: "Ex.: querem uma refeição pronta para hoje",
    resultado: "Ex.: recebe o pedido escolhido no local ou por entrega",
  };
  if (tipo.includes("software") || tipo.includes("consultoria")) return {
    descricao: "Ex.: implantação, suporte e planos do serviço",
    publico: "Ex.: donos de pequenos negócios que precisam organizar o atendimento",
    motivo: "Ex.: querem reduzir trabalho manual ou entender um problema da operação",
    resultado: "Ex.: acesso ao sistema ou às entregas do serviço contratado",
  };
  if (tipo.includes("marcenaria") || tipo.includes("arquitetura") || tipo.includes("interiores")) return {
    descricao: "Ex.: projetos sob medida, execução e acompanhamento",
    publico: "Ex.: pessoas reformando a casa ou montando um espaço comercial",
    motivo: "Ex.: precisam planejar um ambiente para usar melhor o espaço",
    resultado: "Ex.: projeto ou móvel definido no orçamento aprovado",
  };
  return {};
}
