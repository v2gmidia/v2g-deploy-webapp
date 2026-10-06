import type {
  EstadoDaTriagem,
  MotivoDaTriagem,
  PrioridadeJev,
} from "../lib/jev/triagem.ts";

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODELO = "jev-1.13.0";
const LIMIARES = [0.5, 0.6, 0.7, 0.75] as const;

type Resposta = {
  answers?: {
    prioridade?: { choice?: unknown; confidence?: unknown };
    motivo?: { choice?: unknown; confidence?: unknown };
  };
};

type Caso = {
  id: string;
  estado: EstadoDaTriagem;
  esperado: { prioridade: PrioridadeJev; motivo: MotivoDaTriagem };
};

type Medicao = {
  caso: Caso;
  prioridade: PrioridadeJev | null;
  confiancaPrioridade: number | null;
  motivo: MotivoDaTriagem | null;
  confiancaMotivo: number | null;
  ms: number;
};

function pendencia(
  campo: string,
  motivo: string,
  diasEsperando: number | null,
): EstadoDaTriagem {
  return {
    versao: "jev-p0-v1",
    pendencias: [{ campo, motivo, caminho: "/teste-jev", diasEsperando }],
  };
}

// Casos inteiramente sintéticos. O esperado é a regra determinística atual,
// servindo de linha de base antes de qualquer comparação com revisão humana.
const CASOS: Caso[] = [
  { id: "prazo-5", estado: pendencia("campo_a", "nao_sei", 5), esperado: { prioridade: "alta", motivo: "prazo_operacional" } },
  { id: "prazo-6", estado: pendencia("campo_b", "nao_perguntado", 6), esperado: { prioridade: "alta", motivo: "prazo_operacional" } },
  { id: "prazo-9", estado: pendencia("campo_c", "nao_sei", 9), esperado: { prioridade: "alta", motivo: "prazo_operacional" } },
  { id: "nao-sei-0", estado: pendencia("campo_d", "nao_sei", 0), esperado: { prioridade: "media", motivo: "resposta_do_cliente" } },
  { id: "nao-sei-2", estado: pendencia("campo_e", "nao_sei", 2), esperado: { prioridade: "media", motivo: "resposta_do_cliente" } },
  { id: "nao-sei-sem-data", estado: pendencia("campo_f", "nao_sei", null), esperado: { prioridade: "media", motivo: "resposta_do_cliente" } },
  { id: "normal-0", estado: pendencia("campo_g", "nao_perguntado", 0), esperado: { prioridade: "baixa", motivo: "dados_insuficientes" } },
  { id: "normal-3", estado: pendencia("campo_h", "nao_perguntado", 3), esperado: { prioridade: "baixa", motivo: "dados_insuficientes" } },
  { id: "normal-sem-data", estado: pendencia("campo_i", "nao_perguntado", null), esperado: { prioridade: "baixa", motivo: "dados_insuficientes" } },
];

function prioridade(valor: unknown): PrioridadeJev | null {
  return valor === "alta" || valor === "media" || valor === "baixa" ? valor : null;
}

function motivo(valor: unknown): MotivoDaTriagem | null {
  return valor === "prazo_operacional" || valor === "acesso_ou_reuniao" ||
    valor === "resposta_do_cliente" || valor === "dados_insuficientes" ? valor : null;
}

function confianca(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

function percentil(valores: number[], percentual: number): number | null {
  if (valores.length === 0) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.min(ordenados.length - 1, Math.ceil(ordenados.length * percentual) - 1)] ?? null;
}

function numero(valor: number | null): string {
  return valor === null ? "invalido" : valor.toFixed(3);
}

async function medir(caso: Caso, chave: string): Promise<Medicao> {
  const inicio = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1_500);

  try {
    const resposta = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODELO,
        state: caso.estado,
        questions: {
          prioridade: {
            type: "choice",
            instructions: "Qual prioridade operacional esta pendencia deve receber?",
            criteria: {
              alta: "A espera ou o bloqueio exige revisao humana prioritaria.",
              media: "Precisa de revisao humana, mas nao supera um bloqueio ou prazo vencido.",
              baixa: "Pode permanecer na fila normal ate uma nova informacao.",
            },
          },
          motivo: {
            type: "choice",
            instructions: "Qual motivo descreve melhor a prioridade?",
            criteria: {
              prazo_operacional: "Prazo de atendimento ou espera exige acao.",
              acesso_ou_reuniao: "Acesso, agenda ou reuniao impede a proxima etapa.",
              resposta_do_cliente: "A resposta do cliente determina o proximo trabalho.",
              dados_insuficientes: "Faltam dados para a pessoa decidir com seguranca.",
            },
          },
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
    const corpo = await resposta.json() as Resposta;
    return {
      caso,
      prioridade: prioridade(corpo.answers?.prioridade?.choice),
      confiancaPrioridade: confianca(corpo.answers?.prioridade?.confidence),
      motivo: motivo(corpo.answers?.motivo?.choice),
      confiancaMotivo: confianca(corpo.answers?.motivo?.confidence),
      ms: Math.round(performance.now() - inicio),
    };
  } finally {
    clearTimeout(timeout);
  }
}

const chave = process.env.TYPESAFE_API_KEY;
if (!chave) {
  console.error("jev-medicao: TYPESAFE_API_KEY ausente");
  process.exitCode = 1;
} else {
  const medicoes: Medicao[] = [];
  for (const caso of CASOS) {
    try {
      const medicao = await medir(caso, chave);
      medicoes.push(medicao);
      console.log([
        `jev-medicao: ${caso.id}`,
        `esperado=${caso.esperado.prioridade}/${caso.esperado.motivo}`,
        `recebido=${medicao.prioridade ?? "invalido"}/${medicao.motivo ?? "invalido"}`,
        `confianca=${numero(medicao.confiancaPrioridade)}/${numero(medicao.confiancaMotivo)}`,
        `tempo=${medicao.ms}ms`,
      ].join(" :: "));
    } catch (erro) {
      const detalhe = erro instanceof Error && erro.name === "AbortError" ? "timeout" : "falha";
      console.error(`jev-medicao: ${caso.id} :: ${detalhe}`);
    }
  }

  const acertos = medicoes.filter((medicao) =>
    medicao.prioridade === medicao.caso.esperado.prioridade &&
    medicao.motivo === medicao.caso.esperado.motivo,
  );
  const tempos = medicoes.map((medicao) => medicao.ms);
  const resumoLimiar = LIMIARES.map((limiar) => {
    const aceitos = medicoes.filter((medicao) =>
      medicao.confiancaPrioridade !== null && medicao.confiancaMotivo !== null &&
      medicao.confiancaPrioridade >= limiar && medicao.confiancaMotivo >= limiar,
    ).length;
    return `${limiar.toFixed(2)}=${aceitos}/${medicoes.length}`;
  }).join(" :: ");

  console.log(`jev-medicao-resumo: respostas=${medicoes.length}/${CASOS.length} :: acordo-regra=${acertos.length}/${medicoes.length} :: p50=${percentil(tempos, 0.5) ?? "n/a"}ms :: p95=${percentil(tempos, 0.95) ?? "n/a"}ms :: limiares=${resumoLimiar}`);
  if (medicoes.length === 0) process.exitCode = 1;
}
