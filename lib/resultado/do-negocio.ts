import "server-only";

import {
  consolidadoDaExecucao,
  consolidadoDoNegocio,
  fichaDaExecucao,
} from "@/lib/backend";
import { respostaDoDono, resultadoParaTela } from "./ler.ts";
import type { RespostaDoDono, ResultadoParaTela } from "./tipos.ts";

/**
 * O resultado do negócio, campanha por campanha.
 *
 * ============================================================
 * A REGRA DE SEGURANÇA, E ELA É O DESENHO — NÃO UMA CHECAGEM.
 *
 * `GET /execucoes/{id}` e `GET /execucoes/{id}/consolidado` **não têm
 * `profile_id`**. Quem tem o `X-V2G-Token` lê a execução de qualquer
 * cliente, e o servidor do Next tem o token. As duas rotas de negócio, ao
 * contrário, conferem o dono — perfil errado devolve 404, medido em
 * 10/09/2026:
 *
 *   GET /negocios/a85c37a9-…/consolidado?profile_id=<de outro usuário>
 *   → 404 {"detail":"negocio a85c37a9-… nao encontrado."}
 *
 * Então a ordem não é decoração: **o consolidado do negócio vem PRIMEIRO,
 * e os ids que ele devolve em `porExecucao` são a autorização.** Nenhum
 * outro id é consultável, porque nenhuma função deste módulo aceita um.
 *
 * Repare que não existe `resultadoDaCampanha(idExecucao)`. É de
 * propósito: uma função assim seria chamada de uma página com
 * `params.id`, e aí a proteção viraria um `if` que alguém esquece. Aqui o
 * id malicioso não é recusado — ele **não tem por onde entrar**.
 *
 * `pnpm conferir:campanha-da-sessao` trava isso por leitura de código.
 * ============================================================
 *
 * A JANELA é a padrão do backend (`ate` = hoje, `desde` = `ate - 29d`).
 * Não repetimos esses defaults: dois lugares decidindo a janela é a
 * família de defeito que este repositório passa a vida consertando.
 */

/** Em que ponto a campanha está — e os quatro são visualmente diferentes. */
export type EstadoDaCampanha =
  /**
   * A rodada ainda não montou campanha nenhuma na plataforma.
   *
   * Decidido pelo `status`, que é CHAVE e não texto: a campanha nasce
   * quando o pipeline chega em `estrutura_pronta`. Antes disso não há o
   * que ter dado.
   */
  | "sem-campanha"
  /** Campanha existe, e nenhum número chegou dela ainda. */
  | "sem-dado"
  /** Campanha existe e tem número. */
  | "com-dado";

/**
 * Os status em que a campanha JÁ EXISTE na plataforma.
 *
 * ============================================================
 * ISTO É INFERÊNCIA, E ESTÁ DECLARADO COMO INFERÊNCIA.
 *
 * O que responderia de verdade é `status_na_plataforma` — e o contrato do
 * dashboard diz, no item 4 da lista de pendências, que o coletor lê esse
 * campo e **o descarta junto com o resto**. Nenhuma rota o expõe.
 *
 * Então usamos o vocabulário do pipeline: `estrutura_pronta` é o estado
 * em que "a campanha nasceu PAUSED e espera o gestor" (handoff do
 * backend, 10/09/2026), e `gerado` é o terminal antigo. Qualquer status
 * anterior é rodada que ainda não montou campanha.
 *
 * O que esta inferência NÃO consegue dizer é se a campanha está NO AR ou
 * pausada — e essa distinção importa, porque `sem_gasto` tem duas causas
 * com desenhos opostos: "está pausada, por isso não gastou" (normal) e
 * "está no ar e não entregou" (problema). **Está na lista de pedidos ao
 * backend.**
 * ============================================================
 */
const STATUS_COM_CAMPANHA: readonly string[] = ["estrutura_pronta", "gerado"];

export interface CampanhaNaTela {
  idExecucao: string;
  /** o nome do negócio daquela rodada. `null` não vira texto nenhum. */
  nome: string | null;
  /** `meta` / `google`. `null` em 100% das execuções da V2G hoje. */
  canal: string | null;
  /** chave, não texto. Quem renderiza usa `estado`. */
  status: string | null;
  estado: EstadoDaCampanha;
  /** os números e a frase do backend */
  resultado: ResultadoParaTela;
}

export type EstadoDoNegocio =
  /** o negócio não tem execução nenhuma */
  | "sem-execucao"
  /** o backend não respondeu — e isso NÃO é "não tem campanha" */
  | "indisponivel"
  | "com-campanhas";

export interface ResultadoDoNegocio {
  estado: EstadoDoNegocio;
  campanhas: CampanhaNaTela[];
  /**
   * Mais de uma moeda no negócio.
   *
   * Vem de `moedas` do backend, que é quem sabe: com duas, ele manda o
   * topo do consolidado nulo de propósito e a quebra em `porExecucao`.
   * **Quem monta a tela nunca soma entre campanhas** — e como cada
   * campanha é um card com a própria moeda, não há o que somar.
   */
  moedasMisturadas: boolean;
  moedas: string[];
  /**
   * O que o DONO informou — uma vez, no nível do negócio. Item B2.
   *
   * ============================================================
   * FICA FORA DE `campanhas[]`, E É O PONTO.
   *
   * Sai do topo do acumulado, que é a rota que resolve a regra do "não
   * soma". Pendurado no card, o mesmo número dizia que uma campanha que
   * nunca foi ao ar trouxe R$ 1.200,00 — ver o bloco de `RespostaDoDono`
   * em `./tipos.ts`, com a medição das duas execuções da V2G.
   * ============================================================
   *
   * `null` quando o backend não respondeu — a mesma distinção de sempre
   * entre "não perguntamos ainda" e "não conseguimos ler".
   */
  doDono: RespostaDoDono | null;
}

const VAZIO: ResultadoDoNegocio = {
  estado: "indisponivel",
  campanhas: [],
  moedasMisturadas: false,
  moedas: [],
  doDono: null,
};

export async function resultadoDoNegocio(args: {
  /** de `businesses` sob RLS, nunca de formulário */
  businessId: string;
  /** de `auth.getUser()`, nunca de formulário */
  profileId: string;
}): Promise<ResultadoDoNegocio> {
  // ---- 1. a porta, e ela é a que confere o dono ----
  const acumulado = await consolidadoDoNegocio({
    businessId: args.businessId,
    profileId: args.profileId,
  });

  if (!acumulado.ok) {
    // Backend fora não é "cliente sem campanha". Confundir os dois faria a
    // tela dizer a um cliente pagante que ele não tem anúncio nenhum.
    return VAZIO;
  }

  const { porExecucao, moedas } = acumulado.dados;

  if (porExecucao.length === 0) {
    return {
      estado: "sem-execucao",
      campanhas: [],
      moedasMisturadas: false,
      moedas: [],
      doDono: null,
    };
  }

  // ---- 2. uma campanha por ficha — e as fichas são a lista autorizada ----
  //
  // Em paralelo porque são independentes entre si. Uma que falhe não
  // derruba as outras: vira `null` e sai da lista, com o log de
  // `chamar()` registrando o motivo.
  const campanhas = await Promise.all(
    porExecucao.map(async (ficha): Promise<CampanhaNaTela | null> => {
      const [respFicha, respConsolidado] = await Promise.all([
        fichaDaExecucao({ idExecucao: ficha.idExecucao }),
        consolidadoDaExecucao({ idExecucao: ficha.idExecucao }),
      ]);

      if (!respConsolidado.ok) return null;
      const c = respConsolidado.dados;
      const identificacao = respFicha.ok ? respFicha.dados : null;

      const temCampanha =
        identificacao?.status !== undefined && identificacao?.status !== null
          ? STATUS_COM_CAMPANHA.includes(identificacao.status)
          : // Sem status não dá para afirmar que a campanha não existe. E
            // ter dado é prova de que existe — número não sai do nada.
            c.temDadoDaPlataforma;

      const estado: EstadoDaCampanha = c.temDadoDaPlataforma
        ? "com-dado"
        : temCampanha
          ? "sem-dado"
          : "sem-campanha";

      return {
        idExecucao: ficha.idExecucao,
        nome: identificacao?.nomeNegocio ?? null,
        canal: identificacao?.canal ?? null,
        status: identificacao?.status ?? null,
        estado,
        resultado: resultadoParaTela({
          recorte: c,
          // Só a rota da execução manda o medido, e é por isso que a tela
          // compõe por execução em vez de ler só o acumulado.
          medido: c.pessoasQueChegaramMedido,
        }),
      };
    }),
  );

  const vivas = campanhas.filter((c): c is CampanhaNaTela => c !== null);

  return {
    estado: vivas.length === 0 ? "indisponivel" : "com-campanhas",
    // A mais recente primeiro: `porExecucao` já vem nessa ordem do
    // backend (`criado_em desc`), e reordenar aqui seria uma segunda
    // opinião sobre qual campanha importa mais.
    campanhas: vivas,
    moedasMisturadas: moedas.length > 1,
    moedas,
    // O ACUMULADO, e nunca uma das fichas. Ver `respostaDoDono` em
    // `./ler.ts`: as duas rotas satisfazem o mesmo tipo, e quem passasse
    // a da execução traria de volta o defeito que o B2 fechou.
    doDono: respostaDoDono(acumulado.dados),
  };
}
