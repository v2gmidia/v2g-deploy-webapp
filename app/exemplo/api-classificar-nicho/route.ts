import { NextResponse } from "next/server";
import { backendConfigurado, enviar } from "@/lib/backend/cliente";
import { acharPorTermos, rotuloDoNicho, type Palpite } from "../_onboarding/classificar";

/**
 * "NÃO ACHOU O SEU?" — o texto livre virando nicho.
 *
 * ============================================================
 * MESMO TRINCO DA BANCADA: em produção esta rota é 404.
 * `process.env.NODE_ENV !== "production"` vira literal no build e o corpo
 * inteiro morre no pacote, junto com a `/exemplo/[tela]`.
 * ============================================================
 *
 * ============================================================
 * DUAS CAMADAS, E A DE GRAÇA VEM PRIMEIRO.
 *
 * 1. `acharPorTermos` — os 113 `termos_de_busca` que o `GET /nichos` já
 *    devolve. Custa zero, responde na hora, e resolve o caso do briefing:
 *    "designer de interiores" cai em `arquitetura`.
 * 2. `POST /agentes/classificar-nicho` — existe e está no ar (conferido
 *    contra o `/openapi.json` em 22/09/2026, 51 rotas). Roda um LLM e
 *    CUSTA. Por isso é o degrau de baixo, não o de cima.
 *
 * Inverter a ordem seria pagar um modelo para descobrir que "dentista" é
 * `clinica-odontologica` — que está escrito numa lista que a gente já tem
 * na mão.
 *
 * ESTA ROTA NUNCA FOI EXERCITADA CONTRA O BACKEND. A camada 2 está
 * escrita e ligada, mas eu não a chamei: o briefing autorizou 2 chamadas
 * à OpenAI para medir transcrição, e nenhuma ao agente de classificação.
 * O que está conferido é a camada 1 (19 checagens) e a forma do contrato,
 * lida do OpenAPI. O primeiro POST de verdade é do Victor.
 * ============================================================
 */

/**
 * O contrato, lido do `/openapi.json` do backend em 22/09/2026.
 *
 * Entrada: `{ descricao_livre: string (minLength 10), nome_negocio?: string|null }`
 * Saída:   `{ nicho, justificativa, candidatos_alternativos, confianca (0..1),
 *             requer_revisao, observacao_do_modelo }`
 *
 * A validação mora aqui porque a rota é da bancada. No dia em que isto
 * virar produção ela se muda para `lib/nichos/validar.ts`, ao lado da
 * validação do `GET /nichos` — é a mesma fronteira e a mesma regra:
 * snake_case → camelCase acontece uma vez só, na borda.
 */
const MINIMO_DE_LETRAS = 10;

/**
 * Abaixo disto a proposta não vai para a tela — vai gente.
 *
 * ============================================================
 * O CUSTO DOS DOIS ERROS NÃO É O MESMO.
 *
 * Errar para MENOS (mandar para um humano alguém que o modelo teria
 * acertado) custa uma conversa. Errar para MAIS (propor "o seu caso é
 * Advogado" para quem conserta bicicleta) custa a confiança na primeira
 * tela em que a gente abriu a boca sobre o negócio dela — e ela ainda
 * não pagou nada para ter motivo de nos dar o benefício da dúvida.
 *
 * 0,6 é escolha minha, sem medição por trás: não rodei o agente uma vez
 * sequer, então não sei como a confiança dele se distribui. Está em
 * DUVIDAS.md esperando a primeira dúzia de casos reais para virar número
 * medido.
 * ============================================================
 */
const PISO_PARA_PROPOR = 0.6;

/** O que a tela recebe. `palpite: null` quer dizer "chama gente". */
interface Resposta {
  palpite: Palpite | null;
  /** true = não dá para propor; a tela oferece falar com uma pessoa */
  humano: boolean;
  /** por que foi para o humano — para a tela, e para o log da bancada */
  motivo?: string;
}

function responder(corpo: Resposta, status = 200) {
  return NextResponse.json(corpo, { status });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const corpo = (await request.json().catch(() => null)) as
    | { descricao?: unknown; nomeNegocio?: unknown }
    | null;
  const descricao = typeof corpo?.descricao === "string" ? corpo.descricao.trim() : "";
  const nomeNegocio = typeof corpo?.nomeNegocio === "string" ? corpo.nomeNegocio.trim() : "";

  // O mínimo é do backend (`minLength: 10`), e a tela já segura o botão
  // antes disso. Aqui é a segunda tranca: quem manda menos recebe um
  // pedido de mais, não um 500 do outro lado.
  if (descricao.length < MINIMO_DE_LETRAS) {
    return responder(
      {
        palpite: null,
        humano: false,
        motivo: "Conta um pouco mais sobre o que você faz — com uma frase curta eu não consigo entender.",
      },
      400,
    );
  }

  // ---- camada 1: de graça, e na hora
  const local = acharPorTermos(descricao);
  if (local) return responder({ palpite: local, humano: false });

  // ---- camada 2: o agente do backend
  if (!backendConfigurado()) {
    return responder({
      palpite: null,
      humano: true,
      motivo: "Sem V2G_BACKEND_URL/TOKEN no ambiente — a classificação por IA não roda aqui.",
    });
  }

  const r = await enviar("/agentes/classificar-nicho", {
    descricao_livre: descricao,
    nome_negocio: nomeNegocio || null,
  });

  if (!r.ok) {
    // A mensagem do `Resultado` já é escrita para o cliente ler — vem de
    // `lib/backend/erros.ts`, que é quem sabe traduzir categoria em frase.
    return responder({ palpite: null, humano: true, motivo: r.mensagem });
  }

  const d = r.dados as Record<string, unknown> | null;
  const nicho = typeof d?.nicho === "string" ? d.nicho : null;
  const confianca = typeof d?.confianca === "number" ? d.confianca : 0;
  const requerRevisao = d?.requer_revisao === true;
  const rotulo = nicho ? rotuloDoNicho(nicho) : null;

  // Nicho que a lista viva não reconhece é o mesmo caso de nicho nenhum:
  // a tela não tem rótulo para escrever, e escrever o identificador cru
  // ("clinica-odontologica") não é português.
  if (!nicho || !rotulo) {
    return responder({
      palpite: null,
      humano: true,
      motivo: "O backend respondeu um nicho que não está na lista viva.",
    });
  }

  if (requerRevisao || confianca < PISO_PARA_PROPOR) {
    return responder({
      palpite: null,
      humano: true,
      motivo: `Confiança ${confianca.toFixed(2)}${requerRevisao ? " e o próprio backend pediu revisão" : ""}.`,
    });
  }

  return responder({
    palpite: { nicho, rotulo, termo: descricao, origem: "backend", confianca },
    humano: false,
  });
}
