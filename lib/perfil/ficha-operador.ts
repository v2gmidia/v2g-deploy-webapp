/** Leitura pura da ficha; sem acesso a banco, ambiente ou rede. */
export const CAMPOS_DA_FICHA = [
  ["name", "Nome do negócio"], ["description", "O que vende"],
  ["niche", "Ramo informado"], ["city", "Cidade"],
  ["radius_km", "Alcance dos anúncios (km)"], ["cep", "CEP"],
  ["atende_somente_no_local", "Atende somente no local"],
  ["site_url", "Site"], ["instagram_handle", "Instagram"],
  ["avg_ticket_min", "Ticket mínimo informado (R$)"],
  ["avg_ticket_max", "Ticket máximo informado (R$)"],
  ["avg_direct_cost", "Custo direto por venda (R$)"],
  ["target_profit_per_customer", "Lucro desejado por cliente (R$)"],
  ["monthly_budget", "Verba mensal de mídia (R$)"],
  ["differentiators", "Diferenciais"], ["guarantee", "Garantia"],
  ["delivery_time", "Prazo de entrega"], ["payment_policy", "Condições de pagamento"],
  ["business_hours", "Horários"], ["availability", "Disponibilidade"],
] as const;

function objeto(valor: unknown): Record<string, unknown> {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Record<string, unknown> : {};
}

export const LIMITE_FICHAS = 1000;

export function coberturaDaConsulta(retornados: number, total: number | null): string {
  if (total === null || !Number.isInteger(total) || total < retornados) {
    return retornados + " negócio(s) retornado(s). Total não confirmado; esta consulta pode ser parcial.";
  }
  return retornados < total
    ? "Recorte: " + retornados + " de " + total + " negócios. A fila e as fichas abaixo cobrem somente os registros retornados, começando pelos atualizados há mais tempo."
    : retornados + " negócio(s) retornado(s) de " + total + " informado(s) nesta consulta.";
}

export function pracaOriginal(linha: Record<string, unknown>) {
  const respostas = objeto(objeto(linha.onboarding).respostas);
  // Mesma precedência de migrarChaves: uma chave nova, mesmo vazia, vence.
  const resposta = objeto(respostas.praca === undefined ? respostas["3"] : respostas.praca);
  const texto = typeof resposta.texto === "string" ? resposta.texto.trim() : "";
  const echo = typeof resposta.echo === "string" ? resposta.echo.trim() : "";
  if (!texto && !echo) return null;
  return {
    texto: echo || texto,
    origem: resposta.origem === "texto" ? "Texto livre informado pelo cliente"
      : resposta.origem === "chip" ? "Opção selecionada pelo cliente"
      : "Forma da resposta não registrada ou não reconhecida",
    em: typeof resposta.em === "string" && resposta.em.trim() ? resposta.em : null,
  };
}

/** Resposta literal do bloco da marca, sem tratá-la como paleta confirmada. */
export function marcaOriginal(linha: Record<string, unknown>) {
  const marca = objeto(objeto(linha.onboarding).marca);
  const em = typeof marca.em === "string" && marca.em.trim() ? marca.em : null;
  if (!em) return null;
  const naoSei = marca.aparenciaNaoSei === true;
  const texto = typeof marca.aparencia === "string" ? marca.aparencia.trim() : "";
  return {
    texto: naoSei ? "Cliente ainda não sabe como descrever o visual da marca"
      : texto || "Nenhuma descrição visual registrada",
    origem: naoSei ? "Estado “não sei” informado pelo cliente"
      : texto ? "Descrição informada pelo cliente" : "Resposta sem descrição reconhecida",
    siteNaoTenho: marca.siteNaoTenho === true,
    em,
  };
}

export function valorDaFicha(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "Não informado";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "number") return Number.isFinite(valor)
    ? new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(valor)
    : "Valor inválido";
  if (typeof valor === "string") return valor.trim() || "Não informado";
  if (Array.isArray(valor)) return valor.length === 0 ? "Nenhum item informado"
    : valor.map(valorDaFicha).join("; ");
  return "Formato não reconhecido";
}

export function camposDaFicha(linha: Record<string, unknown>) {
  const procedencia = objeto(linha.procedencia);
  const origens: Record<string, string> = {
    confirmado: "Confirmado pelo cliente", manual: "Registrado manualmente",
    extraido: "Extraído — não equivale a confirmação",
  };
  return CAMPOS_DA_FICHA.map(([campo, rotulo]) => {
    const registro = objeto(procedencia[campo]);
    const origem = typeof registro.origem === "string" && Object.hasOwn(origens, registro.origem)
      ? origens[registro.origem] : undefined;
    return { campo, rotulo, valor: valorDaFicha(linha[campo]),
      origem: origem ?? "Origem não registrada ou não reconhecida",
      em: typeof registro.em === "string" ? registro.em : null };
  });
}
