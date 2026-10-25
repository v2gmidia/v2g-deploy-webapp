import { lacunasParaReuniao, lerBriefingDeTrafego } from "../onboarding/briefing-trafego.ts";
import { documento } from "../onboarding/marca.ts";
import { identificarDocumentoContratante } from "../contratacao/documento-contratante.ts";

function resumir(valor: string): string {
  const limpo = valor.replace(/[\x00-\x1f\x7f]+/g, " ").replace(/\s+/g, " ").trim();
  return limpo.length > 180 ? `${limpo.slice(0, 177).trimEnd()}…` : limpo;
}

/** Texto visível também ao convidado; apenas declarações do próprio cliente. */
export function descricaoDaReuniao(onboarding: unknown, cnpj: string): string {
  const respostas = documento(documento(onboarding).respostas);
  const briefing = lerBriefingDeTrafego(onboarding);
  const linhas = [
    `Contratante: ${identificarDocumentoContratante(cnpj)}. Reunião inicial V2G de 25 minutos.`,
    "Respostas declaradas no onboarding quando a reserva foi feita; confira a ficha atual no WebApp.",
  ];
  for (const [chave, rotulo] of [
    ["ramo", "Tipo de negócio"],
    ["descricao", "Produtos e serviços"],
  ] as const) {
    const texto = documento(respostas[chave]).texto;
    if (typeof texto === "string" && texto.trim()) linhas.push(`${rotulo}: ${resumir(texto)}`);
  }
  for (const [chave, rotulo] of [
    ["publico", "Quem compra"],
    ["motivo", "O que procura"],
    ["resultado", "O que recebe"],
    ["diferencial", "Diferencial"],
    ["prova", "Exemplos disponíveis"],
  ] as const) {
    const resposta = briefing[chave];
    if (resposta.estado === "informado") linhas.push(`${rotulo}: ${resumir(resposta.texto)}`);
  }
  const lacunas = lacunasParaReuniao(briefing);
  if (lacunas.length) linhas.push(`Para confirmar na reunião: ${lacunas.join("; ")}.`);
  linhas.push("Os materiais de marca enviados são consultados separadamente no WebApp.");
  return linhas.join("\n");
}
