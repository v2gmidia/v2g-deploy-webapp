/**
 * As três fixtures do `/inicio` — e o porquê de elas existirem.
 *
 * ============================================================
 * ESTE ARQUIVO NUNCA CHEGA A PRODUÇÃO. NÃO É PROMESSA: É MEDIÇÃO.
 *
 * Nada em `app/` o importa de forma estática. O único caminho até aqui é
 * um `await import()` dentro de um bloco guardado por
 * `process.env.NODE_ENV !== "production"`, em `app/(protected)/inicio/page.tsx`.
 *
 * O Next substitui `process.env.NODE_ENV` pelo literal `"production"` no
 * build, a condição vira `"production" !== "production"`, o bloco morre e
 * o `import()` morre com ele — então este módulo não entra no grafo.
 *
 * A PROVA é a sentinela abaixo: depois de `pnpm build`, procurá-la em
 * `.next/` tem que devolver zero. Se devolver um, o portão vazou.
 *
 *     grep -r "FIXTURE_SO_DE_DESENVOLVIMENTO_V2G" .next/ | wc -l   # → 0
 *
 * O segundo trinco é a variável `V2G_FIXTURE_INICIO`, que não existe em
 * nenhum ambiente da Vercel. Ela sozinha não bastaria — variável se
 * define no painel sem querer —, e o `NODE_ENV` sozinho também não:
 * juntos, um erro humano não abre a porta.
 * ============================================================
 *
 * POR QUE FIXTURE, E NÃO DADO DE VERDADE. Três estados precisam aparecer
 * na tela e nenhuma conta real está em dois deles hoje: a V2G saiu de
 * `aguardando_fotos` em 09/09, e nenhuma conta com business está sem
 * execução. Esperar o mundo entrar no estado certo para poder desenhá-lo
 * é como o produto chegou a ter uma tela que ninguém nunca viu.
 *
 * Os números de `com-dados` NÃO foram inventados: são o retorno literal
 * de produção em 11/09/2026, o mesmo de
 * `scripts/fixtures/consolidado-negocio-producao.json`.
 */
import { montarEtapas, type Etapa } from "@/lib/estado/frases";
import type { EstadoDoCliente } from "@/lib/estado/cliente";
import type { ResumoDePendencias } from "@/lib/cadastro/pendencias";
import type { ConsolidadoDoNegocio, ExecucaoDoNegocio } from "@/lib/dia-seguinte/tipos";
import type { EstadoDeVeiculacao } from "@/lib/veiculacao/estado";

/** A palavra que o `grep` procura no `.next/`. Não use em outro lugar. */
export const SENTINELA = "FIXTURE_SO_DE_DESENVOLVIMENTO_V2G";

export const NOMES_DE_FIXTURE = ["sem-execucao", "preparando", "com-dados"] as const;
export type NomeDeFixture = (typeof NOMES_DE_FIXTURE)[number];

export function ehNomeDeFixture(v: unknown): v is NomeDeFixture {
  return typeof v === "string" && (NOMES_DE_FIXTURE as readonly string[]).includes(v);
}

const NEGOCIO = "a85c37a9-df57-4829-985b-41bc306f8537";
const EXECUCAO = "aed42ce7-b1cd-49f8-9509-eb772aacb31a";

/** Cadastro sem pendência — o caso de quem já respondeu tudo. */
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
 * A frase de `andamento` vem do BACKEND, e a fixture repete a que ele
 * devolveu de verdade — não uma escrita aqui. Traduzir estado em texto
 * neste arquivo seria ensaiar a tela contra uma voz que o backend não usa.
 */
const ANDAMENTO_PREPARANDO =
  "Estamos com suas fotos na mão. Assim que a peça ficar pronta, você aprova.";
const ANDAMENTO_COM_DADOS = "Tudo anotado. Começando a montar seu anúncio";

/**
 * `veiculacao` entrou em 11/09, depois desta fixture nascer.
 *
 * Os valores repetem o que o backend devolve de verdade: `sem_evidencia`
 * é o default do schema, e `ja_foi_ao_ar` foi o único observado ao vivo
 * — na conta da V2G, junto com `status_na_plataforma: "PAUSED"`. Ver
 * `lib/veiculacao/estado.ts`.
 */
function execucao(
  status: string,
  andamento: string,
  pedeAcao: boolean,
  veiculacao: string | null,
): ExecucaoDoNegocio {
  return {
    idExecucao: EXECUCAO,
    businessId: NEGOCIO,
    status,
    andamento,
    pedeAcao,
    veiculacao,
    atualizadoEm: "2026-09-09T02:35:50Z",
  };
}

/**
 * O consolidado do negócio, com os números reais de produção.
 *
 * `pessoasQueChegaram` é `"0.0"` e **não vira zero na tela**: a rota do
 * negócio não manda `pessoas_que_chegaram_medido`, e sem a prova de que a
 * conta conta contato o zero mente. `retornoPorReal` vem preenchido de
 * propósito — é o `"117.07"` do payload real, e a tela precisa provar que
 * NÃO o mostra (item B1).
 */
function consolidadoComDados(): ConsolidadoDoNegocio {
  return {
    businessId: NEGOCIO,
    desde: "2026-08-12",
    ate: "2026-09-10",
    dias: [
      { dia: "2026-08-31", investiuCentavos: null, pessoasQueChegaram: null, viraramVenda: 10, voltouCentavos: 20000 },
      { dia: "2026-09-01", investiuCentavos: null, pessoasQueChegaram: null, viraramVenda: 12, voltouCentavos: 100000 },
      { dia: "2026-09-05", investiuCentavos: 531, pessoasQueChegaram: "0.0", viraramVenda: null, voltouCentavos: null },
      { dia: "2026-09-06", investiuCentavos: 462, pessoasQueChegaram: "0.0", viraramVenda: null, voltouCentavos: null },
      { dia: "2026-09-07", investiuCentavos: 32, pessoasQueChegaram: "0.0", viraramVenda: null, voltouCentavos: null },
    ],
    investiuCentavos: 1025,
    voltouCentavos: 120000,
    pessoasQueChegaram: "0.0",
    vendas: 22,
    retornoPorReal: "117.07",
    diasComOsDoisLados: 0,
    temDadoDaPlataforma: true,
    respondeuHoje: false,
    moeda: "BRL",
    nivel: "sem_alvo",
    nivelFrase:
      "Ainda não definimos juntos quanto vale a pena pagar por cada pessoa que chega. Sem esse número não dá para dizer se está bom ou ruim.",
    cliques: 64,
    impressoes: 1657,
    diaDaPergunta: null,
    respondeuNoDia: null,
    execucoesSomadas: 2,
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
        nivelFrase:
          "Ainda não definimos juntos quanto vale a pena pagar por cada pessoa que chega. Sem esse número não dá para dizer se está bom ou ruim.",
      },
      {
        idExecucao: "98447192-3968-4fb1-8062-b14d6a8751ae",
        moeda: null,
        investiuCentavos: null,
        cliques: null,
        impressoes: null,
        pessoasQueChegaram: null,
        nivel: "sem_dado",
        nivelFrase:
          "Ainda não recebemos os números desses dias. Assim que a plataforma enviar, eles aparecem aqui.",
      },
    ],
  };
}

function etapas(args: {
  conexaoAtiva: boolean;
  pecasProntas: number;
  publicadaEm: string | null;
  temNumero: boolean;
  execucaoDoBackend: ExecucaoDoNegocio | null;
  veiculacao: EstadoDeVeiculacao;
  agora: Date;
}): Etapa[] {
  return montarEtapas(
    {
      temNegocio: true,
      cadastro: CADASTRO_COMPLETO,
      conexaoAtiva: args.conexaoAtiva,
      cadastroEnviadoEm: "2026-08-19T23:31:49.646Z",
      execucao: null,
      pecasProntas: args.pecasProntas,
      pecasParaAprovar: 0,
      campanhaCriadaEm: null,
      publicacaoFalhou: false,
      publicadaEm: args.publicadaEm,
      temNumero: args.temNumero,
      execucaoDoBackend: args.execucaoDoBackend,
      execucaoIlegivel: false,
      veiculacao: args.veiculacao,
    },
    args.agora,
  );
}

const SEM_RESULTADO = {
  investidoCentavos: null,
  moeda: null,
  pessoas: null,
  cliques: null,
  impressoes: null,
} as const;

/**
 * A fixture pedida, já no formato que a tela consome.
 *
 * Devolve `null` para nome desconhecido — quem chama trata como "sem
 * fixture" e segue pela leitura real, em vez de quebrar.
 */
export function fixtureDoInicio(nome: string, agora: Date): EstadoDoCliente | null {
  if (!ehNomeDeFixture(nome)) return null;

  if (nome === "sem-execucao") {
    // Tem negócio e cadastro fechado; o pipeline ainda não devolveu
    // execução. É o estado de quem acabou de terminar o onboarding.
    return {
      temNegocio: true,
      negocioId: NEGOCIO,
      etapas: etapas({
        conexaoAtiva: false,
        pecasProntas: 0,
        publicadaEm: null,
        temNumero: false,
        execucaoDoBackend: null,
        veiculacao: "nao_sabemos",
        agora,
      }),
      proximo: null,
      melhoras: { fotos: 0, temLogo: false },
      blocosDaTrilha: 6,
      resultado: { ...SEM_RESULTADO },
      campanhasNoAr: [],
      verbaMensal: 2000,
      temNumero: false,
      diaSeguinte: { execucao: null, acumulado: null },
      veiculacao: "nao_sabemos",
    };
  }

  if (nome === "preparando") {
    const exec = execucao("aguardando_fotos", ANDAMENTO_PREPARANDO, true, "sem_evidencia");
    return {
      temNegocio: true,
      negocioId: NEGOCIO,
      etapas: etapas({
        conexaoAtiva: true,
        pecasProntas: 0,
        publicadaEm: null,
        temNumero: false,
        execucaoDoBackend: exec,
        veiculacao: "nao_sabemos",
        agora,
      }),
      proximo: null,
      melhoras: { fotos: 2, temLogo: true },
      blocosDaTrilha: 6,
      resultado: { ...SEM_RESULTADO },
      campanhasNoAr: [],
      verbaMensal: 2000,
      temNumero: false,
      diaSeguinte: { execucao: exec, acumulado: null },
      veiculacao: "nao_sabemos",
    };
  }

  // com-dados
  const exec = execucao("cadastro_completo", ANDAMENTO_COM_DADOS, false, "ja_foi_ao_ar");
  const acumulado = consolidadoComDados();
  return {
    temNegocio: true,
    negocioId: NEGOCIO,
    etapas: etapas({
      conexaoAtiva: true,
      pecasProntas: 0,
      publicadaEm: null,
      temNumero: true,
      execucaoDoBackend: exec,
      veiculacao: "ja_foi_ao_ar",
      agora,
    }),
    proximo: null,
    melhoras: { fotos: 2, temLogo: true },
    blocosDaTrilha: 6,
    resultado: {
      // `pessoas` continua `null` porque a rota do NEGÓCIO não devolve o
      // `medido` — é assim em produção, e a fixture não conserta o que a
      // API não manda.
      investidoCentavos: 1025,
      moeda: "BRL",
      pessoas: null,
      cliques: 64,
      impressoes: 1657,
    },
    campanhasNoAr: [],
    verbaMensal: 2000,
    temNumero: true,
    diaSeguinte: { execucao: exec, acumulado },
    veiculacao: "ja_foi_ao_ar",
  };
}
