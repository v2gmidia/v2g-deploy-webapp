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

function execucao(): ExecucaoDoNegocio {
  return {
    idExecucao: EXECUCAO,
    businessId: NEGOCIO,
    status: "cadastro_completo",
    andamento: "Tudo anotado. Começando a montar seu anúncio",
    pedeAcao: false,
    // "já foi ao ar" é o que o backend devolve para a campanha PAUSADA.
    veiculacao: "ja_foi_ao_ar",
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

/** O estado que a `/inicio` desenha, no formato de `estadoDoCliente()`. */
export function exemploDoInicio(agora: Date): EstadoDoCliente {
  const exec = execucao();
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
        temNumero: true,
        execucaoDoBackend: exec,
        execucaoIlegivel: false,
        veiculacao: "ja_foi_ao_ar",
      },
      agora,
    ),
    proximo: null,
    melhoras: { fotos: 2, temLogo: true },
    blocosDaTrilha: 6,
    resultado: {
      investidoCentavos: 1025,
      moeda: "BRL",
      // conversas sem medição: a rota do negócio não manda o `medido`
      pessoas: null,
      cliques: 64,
      impressoes: 1657,
    },
    campanhasNoAr: [],
    verbaMensal: 2000,
    temNumero: true,
    diaSeguinte: { execucao: exec, acumulado: consolidado() },
    veiculacao: "ja_foi_ao_ar",
  };
}
