import { migrarChaves } from "../../app/(fluxo)/onboarding/perguntas.ts";
import { documento } from "./marca.ts";

const OBRIGATORIAS_LEGADAS = ["nome", "ramo", "descricao", "praca"] as const;
const OBRIGATORIAS_OPERACIONAIS = [
  "operador", "nome", "contratante", "ramo", "descricao", "publico", "praca", "destino", "campanha",
] as const;
export type PerguntaBasica = (typeof OBRIGATORIAS_OPERACIONAIS)[number];

export interface RespostaBasica {
  texto: string;
  echo: string;
}

export function respostasBasicas(onboarding: unknown): Partial<Record<PerguntaBasica, RespostaBasica>> {
  const brutas = documento(onboarding).respostas;
  if (!brutas || typeof brutas !== "object" || Array.isArray(brutas)) return {};
  const migradas = migrarChaves(brutas as Record<string, unknown>);
  const saida: Partial<Record<PerguntaBasica, RespostaBasica>> = {};
  for (const chave of OBRIGATORIAS_OPERACIONAIS) {
    const resposta = migradas[chave];
    if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) continue;
    const valor = resposta as { texto?: unknown; echo?: unknown };
    const texto = typeof valor.texto === "string" ? valor.texto.trim() : "";
    if (!texto || (chave === "descricao" && [...texto].length < 10)) continue;
    saida[chave] = {
      texto,
      echo: typeof valor.echo === "string" && valor.echo.trim() ? valor.echo : texto,
    };
  }
  return saida;
}

export function faltamRespostasBasicas(onboarding: unknown): PerguntaBasica[] {
  const doc = documento(onboarding);
  const respostas = respostasBasicas(onboarding);
  // Documentos anteriores continuam válidos. A primeira gravação pelo fluxo
  // novo sobe a versão para 2 e passa a pedir o contexto operacional completo.
  const bruto = doc.respostas && typeof doc.respostas === "object" && !Array.isArray(doc.respostas)
    ? doc.respostas as Record<string, unknown> : {};
  const obrigatorias = bruto._contrato_operacional === "cadastro_operacional.v2" || Number(doc.versao) === 2
    ? OBRIGATORIAS_OPERACIONAIS
    : OBRIGATORIAS_LEGADAS;
  return obrigatorias.filter((chave) => !respostas[chave]);
}
