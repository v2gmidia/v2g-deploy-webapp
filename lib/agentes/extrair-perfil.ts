import "server-only";

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";

import { listaParaPrompt } from "./campos";
import {
  categoriaDoStatus,
  falha,
  registrarErroExtracao,
  type Resultado,
} from "./erros";
import { esquemaDaExtracao, respostaTemForma } from "./esquema";
import { verificar, type Verificacao } from "./verificar";

/**
 * A chamada que lê a transcrição e devolve uma PROPOSTA.
 *
 * ============================================================
 * `import "server-only"` NA PRIMEIRA LINHA, E NÃO É DECORAÇÃO.
 *
 * `ANTHROPIC_API_KEY` é segredo de máquina: quem tem a chave gasta na
 * nossa conta. Se este módulo entrar num bundle de cliente, ela vai para o
 * navegador de todo mundo. O `server-only` faz o BUILD QUEBRAR nesse caso,
 * o que é infinitamente melhor que descobrir na fatura.
 * ============================================================
 *
 * Uma chamada, sem ferramentas, sem laço. Extração é função pura:
 * transcrição entra, JSON sai. O agente NÃO TEM ACESSO AO BANCO — e isso
 * não é regra de prompt, é ausência de ferramenta. Não existe caminho pelo
 * qual ele escreva no perfil, nem por engano nem por instrução escondida
 * dentro da transcrição.
 */

const MODELO = "claude-opus-5";

/**
 * Teto do que o modelo produz na resposta — e no Claude Opus 5 o
 * pensamento divide esse mesmo teto com o texto. Uma transcrição de 90
 * minutos gera algo como 25 campos com trecho: uns 6 mil tokens. O resto é
 * folga para o pensamento, porque estourar o teto devolve JSON pela
 * metade, e aí a garantia do `json_schema` não valeu de nada.
 */
const MAX_TOKENS = 16_000;

const ARQUIVO_DO_PROMPT = join(
  process.cwd(),
  "prompts",
  "extracao-perfil",
  "v1.md",
);

/** Transcrição menor que isso é reunião que não aconteceu. */
const MINIMO_DE_TRANSCRICAO = 200;

interface PromptRenderizado {
  texto: string;
  /**
   * `v1+hash`. O `v1` é a redação, versionada à mão; o hash cobre a lista
   * de campos, que é gerada. Sem o hash, acrescentar um campo ao catálogo
   * mudaria o prompt de verdade sem mudar a versão gravada — e a pergunta
   * "qual prompt produziu esta proposta" passaria a ter resposta errada,
   * que é pior que não ter resposta.
   */
  versao: string;
}

let cache: PromptRenderizado | null = null;

function carregarPrompt(): PromptRenderizado {
  if (cache) return cache;
  const bruto = readFileSync(ARQUIVO_DO_PROMPT, "utf8");
  const texto = bruto.replace("{{CAMPOS}}", listaParaPrompt());
  const hash = createHash("sha256").update(texto).digest("hex").slice(0, 8);
  cache = { texto, versao: "v1+" + hash };
  return cache;
}

export interface ExtracaoConcluida extends Verificacao {
  promptVersao: string;
  modelo: string;
  tokensEntrada: number;
  tokensSaida: number;
}

export interface PedidoDeExtracao {
  transcricao: string;
  /** Só para o log. A transcrição em si nunca é registrada. */
  entrevistaId?: string;
}

export async function extrairPerfil(
  pedido: PedidoDeExtracao,
): Promise<Resultado<ExtracaoConcluida>> {
  const transcricao = pedido.transcricao?.trim() ?? "";
  if (transcricao.length < MINIMO_DE_TRANSCRICAO) {
    return falha("transcricao_vazia");
  }

  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave) {
    registrarErroExtracao("extrair", {
      categoria: "sem_chave",
      entrevistaId: pedido.entrevistaId,
    });
    return falha("sem_chave");
  }

  const prompt = carregarPrompt();
  const cliente = new Anthropic({ apiKey: chave });

  let resposta;
  try {
    // Streaming porque a saída é longa: sem ele, a requisição corre risco
    // de bater no timeout de HTTP antes de o modelo terminar. Não há
    // interesse nos eventos — `finalMessage()` devolve a mensagem inteira.
    const fluxo = cliente.messages.stream({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      system: prompt.texto,
      output_config: {
        // O sweep de esforço é o botão de custo desta chamada. `medium`
        // é o ponto de partida, não uma conclusão: no Claude Opus 5 os
        // níveis baixos rendem bem, e extrair campo com citação é tarefa
        // limitada — mas quem mexer aqui precisa reconferir a taxa de
        // trecho reprovado, que é o sintoma de leitura apressada.
        effort: "medium",
        format: { type: "json_schema", schema: esquemaDaExtracao() },
      },
      messages: [
        {
          role: "user",
          content:
            "<transcricao>\n" +
            transcricao +
            "\n</transcricao>\n\nDevolva um item para cada campo da lista.",
        },
      ],
    });

    resposta = await fluxo.finalMessage();
  } catch (erro) {
    const status =
      erro instanceof Anthropic.APIError ? erro.status : undefined;
    const categoria =
      erro instanceof Anthropic.APIConnectionTimeoutError
        ? "tempo_esgotado"
        : erro instanceof Anthropic.APIConnectionError
          ? "rede"
          : typeof status === "number"
            ? categoriaDoStatus(status)
            : "rede";
    registrarErroExtracao("extrair", {
      categoria,
      status,
      entrevistaId: pedido.entrevistaId,
    });
    return falha(categoria, status);
  }

  // `stop_reason` ANTES de `content`. Uma recusa devolve 200 com content
  // vazio, e ler `content[0]` sem conferir quebra com erro de índice em
  // vez de dizer o que houve.
  if (resposta.stop_reason === "refusal") {
    registrarErroExtracao("extrair", {
      categoria: "recusado",
      entrevistaId: pedido.entrevistaId,
    });
    return falha("recusado");
  }

  // Teto estourado devolve JSON cortado no meio. É `resposta_ilegivel` com
  // causa conhecida — e a mensagem diz isso, para ninguém abrir o log
  // atrás de um mistério que não existe.
  if (resposta.stop_reason === "max_tokens") {
    registrarErroExtracao("extrair", {
      categoria: "resposta_ilegivel",
      codigo: "max_tokens",
      entrevistaId: pedido.entrevistaId,
    });
    return falha("resposta_ilegivel");
  }

  const texto = resposta.content.find((b) => b.type === "text");
  if (!texto || texto.type !== "text") {
    registrarErroExtracao("extrair", {
      categoria: "resposta_ilegivel",
      codigo: "sem_bloco_de_texto",
      entrevistaId: pedido.entrevistaId,
    });
    return falha("resposta_ilegivel");
  }

  let cru: unknown;
  try {
    cru = JSON.parse(texto.text);
  } catch {
    registrarErroExtracao("extrair", {
      categoria: "resposta_ilegivel",
      codigo: "json_invalido",
      entrevistaId: pedido.entrevistaId,
    });
    return falha("resposta_ilegivel");
  }

  if (!respostaTemForma(cru)) {
    registrarErroExtracao("extrair", {
      categoria: "resposta_ilegivel",
      codigo: "forma_inesperada",
      entrevistaId: pedido.entrevistaId,
    });
    return falha("resposta_ilegivel");
  }

  // A verificação roda contra a transcrição ORIGINAL, não contra a que foi
  // mandada. São a mesma string hoje; se um dia entrar recorte ou
  // truncagem no meio, conferir contra a versão enviada validaria o trecho
  // contra um texto que o operador não vai ver na tela.
  const verificacao = verificar(cru.campos, transcricao);

  return {
    ok: true,
    dados: {
      ...verificacao,
      promptVersao: prompt.versao,
      modelo: MODELO,
      tokensEntrada: resposta.usage.input_tokens,
      tokensSaida: resposta.usage.output_tokens,
    },
  };
}
