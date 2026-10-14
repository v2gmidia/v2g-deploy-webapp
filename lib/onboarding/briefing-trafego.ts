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
