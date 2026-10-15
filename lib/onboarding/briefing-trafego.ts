import { documento } from "./marca.ts";

export const NAO_SEI_BRIEFING = "Ainda não sei explicar";

export type RespostaDeBriefing =
  | { estado: "informado"; texto: string }
  | { estado: "nao_sei" | "ausente"; texto: null };

/** Respostas declaradas pelo cliente; não produz diagnóstico nem inferência. */
export function lerBriefingDeTrafego(onboarding: unknown): {
  oferta: RespostaDeBriefing;
  publico: RespostaDeBriefing;
  motivo: RespostaDeBriefing;
  resultado: RespostaDeBriefing;
  diferencial: RespostaDeBriefing;
  prova: RespostaDeBriefing;
} {
  const respostas = documento(documento(onboarding).respostas);
  function ler(chave: "oferta" | "publico" | "motivo" | "resultado" | "diferencial" | "prova"): RespostaDeBriefing {
    const registro = documento(respostas[chave]);
    const texto = typeof registro.texto === "string" ? registro.texto.trim() : "";
    if (!texto) return { estado: "ausente", texto: null };
    if (registro.origem === "chip" && texto === NAO_SEI_BRIEFING)
      return { estado: "nao_sei", texto: null };
    return { estado: "informado", texto };
  }
  return {
    oferta: ler("oferta"), publico: ler("publico"), motivo: ler("motivo"),
    resultado: ler("resultado"), diferencial: ler("diferencial"), prova: ler("prova"),
  };
}

/** Pontos que o cliente deixou explicitamente para conferir com o gestor. */
export function lacunasParaReuniao(briefing: ReturnType<typeof lerBriefingDeTrafego>): string[] {
  const campos = [
    ["publico", "Quem costuma comprar"],
    ["motivo", "O que o cliente procura"],
    ["resultado", "O que recebe após a compra"],
    ["diferencial", "Por que escolhe a empresa"],
  ] as const;
  return campos.filter(([chave]) => briefing[chave].estado === "nao_sei")
    .map(([, rotulo]) => rotulo);
}
