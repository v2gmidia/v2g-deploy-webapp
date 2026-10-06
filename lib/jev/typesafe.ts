import "server-only";

import type { EstadoDaTriagem, SugestaoDaTriagem } from "./triagem";

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODELO = "jev-1.13.0";

type RespostaTypeSafe = {
  answers?: {
    prioridade?: { choice?: unknown; confidence?: unknown };
    motivo?: { choice?: unknown; confidence?: unknown };
  };
};

const CONFIANCA_MINIMA = 0.75;

function prioridade(bruto: unknown): SugestaoDaTriagem["prioridade"] | null {
  return bruto === "alta" || bruto === "media" || bruto === "baixa" ? bruto : null;
}

function motivo(bruto: unknown): SugestaoDaTriagem["motivo"] | null {
  return bruto === "prazo_operacional" || bruto === "acesso_ou_reuniao" ||
    bruto === "resposta_do_cliente" || bruto === "dados_insuficientes" ? bruto : null;
}

function confiancaSuficiente(bruto: unknown): boolean {
  return typeof bruto === "number" && Number.isFinite(bruto) && bruto >= CONFIANCA_MINIMA;
}

/**
 * Retorna nulo quando o piloto não foi ativado ou quando o provedor falha.
 * Quem chama deve cair na regra determinística e nunca bloquear uma pessoa.
 */
export async function sugerirComJev(
  estado: EstadoDaTriagem,
): Promise<SugestaoDaTriagem | null> {
  if (process.env.JEV_PILOTO_ATIVO !== "true") return null;
  const chave = process.env.TYPESAFE_API_KEY;
  if (!chave) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1_500);

  try {
    const resposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chave}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELO,
        state: estado,
        questions: {
          prioridade: {
            type: "choice",
            instructions: "Qual prioridade operacional esta pendência deve receber?",
            criteria: {
              alta: "A espera ou o bloqueio exige revisão humana prioritária.",
              media: "Precisa de revisão humana, mas não supera um bloqueio ou prazo vencido.",
              baixa: "Pode permanecer na fila normal até uma nova informação.",
            },
          },
          motivo: {
            type: "choice",
            instructions: "Qual motivo descreve melhor a prioridade?",
            criteria: {
              prazo_operacional: "Prazo de atendimento ou espera exige ação.",
              acesso_ou_reuniao: "Acesso, agenda ou reunião impede a próxima etapa.",
              resposta_do_cliente: "A resposta do cliente determina o próximo trabalho.",
              dados_insuficientes: "Faltam dados para a pessoa decidir com segurança.",
            },
          },
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!resposta.ok) {
      console.error("[jev] sugestao indisponivel ::", resposta.status);
      return null;
    }

    const corpo = (await resposta.json()) as RespostaTypeSafe;
    const valorDaPrioridade = prioridade(corpo.answers?.prioridade?.choice);
    const valorDoMotivo = motivo(corpo.answers?.motivo?.choice);
    if (!valorDaPrioridade || !valorDoMotivo ||
      !confiancaSuficiente(corpo.answers?.prioridade?.confidence) ||
      !confiancaSuficiente(corpo.answers?.motivo?.confidence)) {
      console.error("[jev] resposta fora do contrato");
      return null;
    }

    return {
      prioridade: valorDaPrioridade,
      motivo: valorDoMotivo,
      exigeRevisaoHumana: true,
    };
  } catch (erro) {
    const categoria = erro instanceof Error && erro.name === "AbortError" ? "timeout" : "falha";
    console.error("[jev] sugestao indisponivel ::", categoria);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
