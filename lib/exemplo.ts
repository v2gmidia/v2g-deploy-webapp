/**
 * O DADO FALSO DA BANCADA `/exemplo` — um arquivo só.
 *
 * ============================================================
 * ESTE ARQUIVO NÃO CHEGA A PRODUÇÃO, E A PROVA É O BUILD.
 *
 * O único caminho até aqui é um `await import()` em
 * `app/exemplo/[tela]/page.tsx`, dentro de
 * `process.env.NODE_ENV !== "production" ? … : null`. No build o Next troca
 * `NODE_ENV` pelo literal, a condição vira falsa, e o import some do grafo.
 * O preview da Vercel também roda com `NODE_ENV=production`.
 *
 * Depois de `pnpm build`, a sentinela abaixo não pode aparecer no pacote:
 *
 *     grep -rl "EXEMPLO_SO_DE_DESENVOLVIMENTO_V2G" .next --exclude-dir=dev --exclude-dir=cache   # → nada
 * ============================================================
 *
 * O CONTEÚDO é o dos prints de 15/09/2026: campanha pausada (já rodou e não
 * está no ar agora), R$ 10,25 investido, 64 cliques, 1.657 aparições e
 * conversas sem medição. Os números e as frases do backend repetem o que a
 * produção devolveu na conta da V2G; o que é inventado está marcado.
 *
 * ============================================================
 * QUATRO ESTADOS DESDE 17/09/2026 (rodada 5).
 *
 *   preparando  nada foi ao ar; a cadeia está aberta
 *   concluiu    acabou de ir ao ar; os números são os TRÊS DIAS reais
 *               da conta da V2G — é o que um cliente vê na primeira
 *               semana
 *   no-ar       O CLIENTE DE TRÊS MESES. Trinta dias de gasto e respostas
 *               do dono. **INVENTADO POR INTEIRO** — não existe conta
 *               real com esse histórico; existe para desenhar a tela de
 *               quem paga todo mês. Ver `consolidadoDeTresMeses`.
 *   pausado     a conta real, e o padrão — nenhum chamador antigo muda
 *
 * Quando não há medição, o campo é `null`, nunca zero.
 * ============================================================
 *
 * NÃO TEM LIGAÇÃO COM A FIXTURE DA `/inicio` (`lib/dev/fixtures-inicio.ts`).
 * Aquela é lida pela página real, com sessão, e a trava `conferir:inicio` §6
 * exige que só a `/inicio` a alcance. Esta é lida só pela bancada, sem
 * sessão, e não abre porta nenhuma: não há rota daqui para banco nem backend.
 *
 * OS IDS SÃO FALSOS DE PROPÓSITO. A tela chama actions que exigem sessão
 * antes de tocar o backend; mesmo assim, nenhum id real mora aqui.
 */
import { montarEtapas } from "@/lib/estado/frases";
import type { EstadoDoCliente } from "@/lib/estado/cliente";
import type { ResumoDePendencias } from "@/lib/cadastro/pendencias";
import type {
  ConsolidadoDoNegocio,
  DiaDoConsolidado,
  ExecucaoDoNegocio,
} from "@/lib/dia-seguinte/tipos";

/** A palavra que o `grep` procura no `.next/`. Não use em outro lugar. */
export const SENTINELA = "EXEMPLO_SO_DE_DESENVOLVIMENTO_V2G";

// Inventados: nenhum destes existe no banco.
const NEGOCIO = "00000000-0000-4000-8000-00000000e001";
const EXECUCAO = "00000000-0000-4000-8000-00000000e002";

/** Os estados que o laboratório desenha. */
export type EstadoDeExemplo = "preparando" | "concluiu" | "no-ar" | "pausado";

/** Quem aparece no casco. Inventado. */
export const CASCO_DE_EXEMPLO = {
  nome: "Piligrin",
  nomeNegocio: "Piligrin Atividades",
  inicial: "P",
} as const;

/** O id falso da execução, para a pergunta do dia da bancada. */
export const EXECUCAO_DE_EXEMPLO = EXECUCAO;

const CADASTRO_COMPLETO: ResumoDePendencias = {
  vazio: true,
  titulo: "Seu cadastro está completo",
  corpo: "Não falta nada do seu lado.",
  acao: null,
  nossaDivida: false,
  itens: [],
  quantosNaoSei: 0,
};

/**
 * Frase do backend observada ao vivo na conta da V2G, 11/09/2026.
 *
 * O cliente de três meses usa A MESMA — de propósito. É a única frase de
 * nível que já foi vista em produção, e a tela não inventa frase do
 * backend nem para dado falso.
 */
const NIVEL_SEM_ALVO =
  "Ainda não definimos juntos quanto vale a pena pagar por cada pessoa que chega. Sem esse número não dá para dizer se está bom ou ruim.";

/**
 * A veiculação de cada estado, como o BACKEND a manda.
 *
 * `concluiu` e `no-ar` mandam o mesmo `no_ar`: o que separa os dois NÃO
 * está na veiculação, e é exatamente essa a lacuna do momento (b). Ver
 * DUVIDA-11 em `docs/v2g-wireframes/DUVIDAS.md`.
 */
const VEICULACAO: Record<EstadoDeExemplo, "no_ar" | "ja_foi_ao_ar" | "sem_evidencia"> = {
  preparando: "sem_evidencia",
  concluiu: "no_ar",
  "no-ar": "no_ar",
  pausado: "ja_foi_ao_ar",
};

function execucao(estado: EstadoDeExemplo): ExecucaoDoNegocio {
  return {
    idExecucao: EXECUCAO,
    businessId: NEGOCIO,
    status: "cadastro_completo",
    andamento: "Tudo anotado. Começando a montar seu anúncio",
    pedeAcao: false,
    veiculacao: VEICULACAO[estado],
    atualizadoEm: "2026-09-09T02:35:50Z",
  };
}

/**
 * O lado da plataforma, com os números de produção. O lado do dono vem
 * vazio: nos prints ele ainda não tinha respondido a pergunta do dia.
 * `pessoasQueChegaram` é "0.0" e a tela NÃO escreve zero — sem a medição, o
 * zero mentiria; ela escreve a ausência.
 */
function consolidadoReal(): ConsolidadoDoNegocio {
  return {
    businessId: NEGOCIO,
    desde: "2026-08-12",
    ate: "2026-09-10",
    dias: [
      { dia: "2026-09-05", investiuCentavos: 531, pessoasQueChegaram: "0.0", viraramVenda: null, voltouCentavos: null },
      { dia: "2026-09-06", investiuCentavos: 462, pessoasQueChegaram: "0.0", viraramVenda: null, voltouCentavos: null },
      { dia: "2026-09-07", investiuCentavos: 32, pessoasQueChegaram: "0.0", viraramVenda: null, voltouCentavos: null },
    ],
    investiuCentavos: 1025,
    voltouCentavos: null,
    pessoasQueChegaram: "0.0",
    vendas: null,
    retornoPorReal: null,
    diasComOsDoisLados: 0,
    temDadoDaPlataforma: true,
    respondeuHoje: false,
    moeda: "BRL",
    nivel: "sem_alvo",
    nivelFrase: NIVEL_SEM_ALVO,
    cliques: 64,
    impressoes: 1657,
    diaDaPergunta: null,
    respondeuNoDia: null,
    execucoesSomadas: 1,
    diasComRespostaDeMaisDeUmaExecucao: 0,
    moedas: ["BRL"],
    porExecucao: [
      {
        idExecucao: EXECUCAO,
        moeda: "BRL",
        investiuCentavos: 1025,
        cliques: 64,
        impressoes: 1657,
        pessoasQueChegaram: "0.0",
        nivel: "sem_alvo",
        nivelFrase: NIVEL_SEM_ALVO,
      },
    ],
  };
}

/**
 * O CLIENTE DE TRÊS MESES — INVENTADO POR INTEIRO.
 *
 * ============================================================
 * Trinta dias (a janela que o consolidado pede), de 18/08 a 16/09, com
 * gasto medido em todos e resposta do dono em dezoito. Os valores saem de
 * uma fórmula fixa, não de sorteio: a captura de hoje e a de amanhã
 * mostram o mesmo número.
 *
 * O que continua VERDADEIRO mesmo sendo falso:
 *   - conversas sem medição (`pessoasQueChegaram: null`) — a rota real
 *     não manda o `medido`, e um cliente de três meses não muda isso;
 *   - `retornoPorReal: null` — a tela não mostra retorno por real, e o
 *     dado falso não vai tentá-la a mostrar;
 *   - a frase de nível é a única já observada em produção.
 * ============================================================
 */
function consolidadoDeTresMeses(): ConsolidadoDoNegocio {
  const inicio = Date.UTC(2026, 7, 18); // 18/08/2026
  const dias: DiaDoConsolidado[] = [];
  let investiu = 0;
  let voltou = 0;
  let vendas = 0;
  let comOsDois = 0;

  for (let i = 0; i < 30; i++) {
    const dia = new Date(inicio + i * 86_400_000).toISOString().slice(0, 10);
    const gasto = 2400 + ((i * 373) % 1100);
    // o dono respondeu em 18 dos 30 dias; nos outros 12 o lado dele é null
    const respondeu = i % 5 !== 1 && i % 5 !== 3;
    const v = respondeu ? (i * 7) % 4 : null;
    const r = v === null ? null : v * 8900;
    dias.push({
      dia,
      investiuCentavos: gasto,
      pessoasQueChegaram: null,
      viraramVenda: v,
      voltouCentavos: r,
    });
    investiu += gasto;
    if (v !== null && r !== null) {
      vendas += v;
      voltou += r;
      comOsDois += 1;
    }
  }

  return {
    businessId: NEGOCIO,
    desde: "2026-08-18",
    ate: "2026-09-16",
    dias,
    investiuCentavos: investiu,
    voltouCentavos: voltou,
    pessoasQueChegaram: null,
    vendas,
    retornoPorReal: null,
    diasComOsDoisLados: comOsDois,
    temDadoDaPlataforma: true,
    respondeuHoje: false,
    moeda: "BRL",
    nivel: "sem_alvo",
    nivelFrase: NIVEL_SEM_ALVO,
    cliques: 2184,
    impressoes: 61403,
    diaDaPergunta: null,
    respondeuNoDia: null,
    execucoesSomadas: 1,
    diasComRespostaDeMaisDeUmaExecucao: 0,
    moedas: ["BRL"],
    porExecucao: [
      {
        idExecucao: EXECUCAO,
        moeda: "BRL",
        investiuCentavos: investiu,
        cliques: 2184,
        impressoes: 61403,
        pessoasQueChegaram: null,
        nivel: "sem_alvo",
        nivelFrase: NIVEL_SEM_ALVO,
      },
    ],
  };
}

/**
 * O estado que o Início desenha, no formato de `estadoDoCliente()`.
 *
 * O PADRÃO É `pausado` — o estado da conta real, e o que a `/exemplo/inicio`
 * já desenhava antes de existirem outros. Nenhum chamador antigo muda.
 *
 * EM `preparando` NÃO HÁ NÚMERO NENHUM, e isso não é um estado "vazio": é
 * ausência de medição. Os campos ficam `null` e a tela omite a seção — o
 * zero seria uma afirmação falsa sobre o dinheiro do cliente.
 */
export function exemploDoInicio(
  agora: Date,
  estado: EstadoDeExemplo = "pausado",
): EstadoDoCliente {
  const exec = execucao(estado);
  const medido = estado !== "preparando";
  const acumulado =
    estado === "preparando" ? null : estado === "no-ar" ? consolidadoDeTresMeses() : consolidadoReal();
  const veiculacao =
    estado === "preparando" ? "nunca_foi_ao_ar" : VEICULACAO[estado] === "no_ar" ? "no_ar" : "ja_foi_ao_ar";

  return {
    temNegocio: true,
    negocioId: NEGOCIO,
    etapas: montarEtapas(
      {
        temNegocio: true,
        cadastro: CADASTRO_COMPLETO,
        conexaoAtiva: true,
        cadastroEnviadoEm: "2026-08-19T23:31:49.646Z",
        execucao: null,
        pecasProntas: 0,
        pecasParaAprovar: 0,
        campanhaCriadaEm: null,
        publicacaoFalhou: false,
        publicadaEm: null,
        temNumero: medido,
        execucaoDoBackend: exec,
        execucaoIlegivel: false,
        veiculacao,
      },
      agora,
    ),
    proximo: null,
    melhoras: { fotos: 2, temLogo: true },
    blocosDaTrilha: 6,
    resultado: {
      investidoCentavos: acumulado ? acumulado.investiuCentavos : null,
      moeda: acumulado ? acumulado.moeda : null,
      // conversas sem medição: a rota do negócio não manda o `medido`
      pessoas: null,
      cliques: acumulado ? acumulado.cliques : null,
      impressoes: acumulado ? acumulado.impressoes : null,
    },
    campanhasNoAr: [],
    verbaMensal: 2000,
    temNumero: medido,
    diaSeguinte: { execucao: exec, acumulado },
    veiculacao,
  };
}
