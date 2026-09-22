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
 * TRÊS ESTADOS DESDE 16/09/2026, para o laboratório visual.
 *
 * `pausado` é o da conta real e continua sendo o padrão — nenhum chamador
 * antigo muda. `no-ar` e `preparando` variam o MÍNIMO necessário para o
 * estado mudar: a veiculação e a medição. Os números não foram inventados
 * duas vezes; quando não há medição, o campo é `null`, nunca zero.
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
import type { ConsolidadoDoNegocio, ExecucaoDoNegocio } from "@/lib/dia-seguinte/tipos";

/** A palavra que o `grep` procura no `.next/`. Não use em outro lugar. */
export const SENTINELA = "EXEMPLO_SO_DE_DESENVOLVIMENTO_V2G";

// Inventados: nenhum destes existe no banco.
const NEGOCIO = "00000000-0000-4000-8000-00000000e001";
const EXECUCAO = "00000000-0000-4000-8000-00000000e002";

/** Os três estados que o laboratório desenha. */
/**
 * ============================================================
 * "chegada" ENTROU EM 22/09, e existe por um motivo só: é o único destes
 * quatro em que a CONEXÃO está pendente.
 *
 * Os outros três têm `conexaoAtiva: true`, então a etapa atual é sempre a
 * peça ou depois dela — e o defeito da cadeia (uma etapa POSTERIOR
 * marcada como feita) não aparece em nenhum. Sem este estado não havia
 * como capturar o antes e o depois do conserto.
 * ============================================================
 */
export type EstadoDeExemplo = "chegada" | "preparando" | "no-ar" | "pausado";

/** Quem aparece no casco. Inventado. */
export const CASCO_DE_EXEMPLO = {
  nome: "Piligrin",
  nomeNegocio: "Piligrin Atividades",
  inicial: "P",
} as const;

const CADASTRO_COMPLETO: ResumoDePendencias = {
  vazio: true,
  titulo: "Seu cadastro está completo",
  corpo: "Não falta nada do seu lado.",
  acao: null,
  nossaDivida: false,
  itens: [],
  quantosNaoSei: 0,
};

/** Frase do backend observada ao vivo na conta da V2G, 11/09/2026. */
const NIVEL_SEM_ALVO =
  "Ainda não definimos juntos quanto vale a pena pagar por cada pessoa que chega. Sem esse número não dá para dizer se está bom ou ruim.";

/**
 * A veiculação de cada estado. É o único eixo que muda entre `no-ar` e
 * `pausado` — e é de propósito: os dois têm os mesmos números, e o que
 * separa um do outro é o que a plataforma está fazendo com o anúncio
 * AGORA. Ver `lib/veiculacao/estado.ts`.
 */
const VEICULACAO: Record<EstadoDeExemplo, "no_ar" | "ja_foi_ao_ar" | "sem_evidencia"> = {
  chegada: "sem_evidencia",
  preparando: "sem_evidencia",
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
function consolidado(): ConsolidadoDoNegocio {
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
 * O estado que o Início desenha, no formato de `estadoDoCliente()`.
 *
 * O PADRÃO É `pausado` — o estado da conta real, e o que a `/exemplo/inicio`
 * já desenhava antes de existirem três. Nenhum chamador antigo muda.
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
  const medido = estado !== "preparando" && estado !== "chegada";
  // Só a `chegada` tem a conexão em aberto — é o que põe a etapa atual
  // ANTES da aprovação, e é aí que o defeito da cadeia aparece.
  const conectou = estado !== "chegada";
  const acumulado = medido ? consolidado() : null;

  return {
    temNegocio: true,
    negocioId: NEGOCIO,
    etapas: montarEtapas(
      {
        temNegocio: true,
        cadastro: CADASTRO_COMPLETO,
        conexaoAtiva: conectou,
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
        veiculacao: estado === "preparando" ? "nunca_foi_ao_ar" : VEICULACAO[estado] === "no_ar" ? "no_ar" : "ja_foi_ao_ar",
      },
      agora,
    ),
    proximo: null,
    melhoras: { fotos: 2, temLogo: true },
    blocosDaTrilha: 6,
    resultado: {
      investidoCentavos: medido ? 1025 : null,
      moeda: medido ? "BRL" : null,
      // conversas sem medição: a rota do negócio não manda o `medido`
      pessoas: null,
      cliques: medido ? 64 : null,
      impressoes: medido ? 1657 : null,
    },
    campanhasNoAr: [],
    verbaMensal: 2000,
    temNumero: medido,
    diaSeguinte: { execucao: exec, acumulado },
    veiculacao:
      estado === "preparando" || estado === "chegada"
        ? "nunca_foi_ao_ar"
        : estado === "no-ar"
          ? "no_ar"
          : "ja_foi_ao_ar",
  };
}
