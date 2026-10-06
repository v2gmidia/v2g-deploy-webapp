import { migrarChaves } from "../../app/(fluxo)/onboarding/perguntas.ts";
import { documento } from "./marca.ts";

const OBRIGATORIAS = ["nome", "ramo", "descricao", "praca"] as const;
export type PerguntaBasica = (typeof OBRIGATORIAS)[number];

export interface RespostaBasica {
  texto: string;
  echo: string;
}

export function respostasBasicas(onboarding: unknown): Partial<Record<PerguntaBasica, RespostaBasica>> {
  const brutas = documento(onboarding).respostas;
  if (!brutas || typeof brutas !== "object" || Array.isArray(brutas)) return {};
  const migradas = migrarChaves(brutas as Record<string, unknown>);
  const saida: Partial<Record<PerguntaBasica, RespostaBasica>> = {};
  for (const chave of OBRIGATORIAS) {
    const resposta = migradas[chave];
    if (!resposta || typeof resposta !== "object" || Array.isArray(resposta)) continue;
    const valor = resposta as { texto?: unknown; echo?: unknown };
    const texto = typeof valor.texto === "string" ? valor.texto.trim() : "";
    if (!texto || (chave === "descricao" && texto.length < 10)) continue;
    saida[chave] = {
      texto,
      echo: typeof valor.echo === "string" && valor.echo.trim() ? valor.echo : texto,
    };
  }
  return saida;
}

export function faltamRespostasBasicas(onboarding: unknown): PerguntaBasica[] {
  const respostas = respostasBasicas(onboarding);
  return OBRIGATORIAS.filter((chave) => !respostas[chave]);
}
