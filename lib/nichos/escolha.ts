// A extensão `.ts` é explícita porque o `conferir:nichos` importa este
// arquivo direto do Node, sem bundler para resolver especificador sem
// extensão. Vale para todo import de RUNTIME dentro de `lib/nichos/` — os
// `import type` somem na compilação e não precisam. O
// `allowImportingTsExtensions` do tsconfig já autoriza a forma, e o Next
// resolve igual.
import { nichoPeloRotulo } from "./busca.ts";
import type { Nicho } from "./tipos";

/**
 * A conferência da escolha de nicho, no SERVIDOR.
 *
 * ============================================================
 * ISTO É O QUE IMPEDE FORJAR `origem: "chip"`.
 *
 * O `actions.ts` sempre conferiu resposta de chip contra as opções da
 * pergunta — "o cliente não escolhe o que quiser só porque manda o campo
 * `origem`". Com o nicho vindo do `GET /nichos`, NENHUM nicho está em
 * `pergunta.opcoes`, e a checagem antiga passou a ter dois desfechos, os
 * dois ruins: recusar toda escolha válida, ou alguém remover a checagem e
 * reabrir o buraco que ela fecha.
 *
 * A saída é esta: conferir contra a MESMA lista viva que a tela mostrou.
 * ============================================================
 *
 * ============================================================
 * SEM LISTA VIVA, NENHUM CHIP É ACEITO. NÃO EXISTE LISTA DE RESERVA.
 *
 * Decisão do Victor, 22/08. Existiam cinco chips fixos que apareciam com o
 * backend fora, e eles **não são nichos**: "Clínica / Consultório" cobre
 * três de uma vez, "Loja física" não cobre nenhum. Gravar um deles seria
 * palpite com cara de escolha do cliente.
 *
 * Quando o catálogo está fora, a verdade é que **não sabemos o nicho**. A
 * tela passa a oferecer só o texto livre, e a frase da pessoa é gravada
 * como `confirmado` — porque ela é verdade: foi ela que disse.
 *
 * É o mesmo princípio do `padaria` não achar nada. Não inventamos o vizinho
 * mais próximo; admitimos que não temos.
 * ============================================================
 *
 * Função pura, e de propósito: a decisão fica fora do `"use server"`,
 * onde o `conferir:nichos` consegue alcançá-la. Quem busca a lista é o
 * chamador.
 */

export type ConferenciaDeNicho =
  | { ok: true; texto: string }
  | { ok: false; erro: string };

/**
 * O recado de quando a lista viva não veio.
 *
 * NÃO É "essa opção não existe". A diferença importa: quando a lista está
 * no ar e o texto não casa, o cliente mandou coisa que não existe. Quando
 * a lista NÃO está no ar, nós é que não conseguimos conferir — e acusar o
 * cliente de escolher opção inexistente é o sistema culpando ele pelo
 * próprio defeito.
 *
 * Este recado alcança um caso real, não só o forjado: a lista estava no ar
 * quando a tela carregou, a pessoa tocou num chip, e o backend caiu antes
 * da resposta chegar. O convite a tentar de novo é honesto porque a falha
 * é transitória de verdade.
 */
export const NAO_DEU_PARA_CONFERIR =
  "Não consegui confirmar sua escolha agora. Tente de novo em instantes.";

export const NAO_E_OPCAO = "Essa opção não existe nesta pergunta.";

export function conferirEscolhaDeNicho(args: {
  /** a lista viva, ou `null` quando o `GET /nichos` não respondeu */
  lista: Nicho[] | null;
  /** o que o cliente mandou */
  texto: string;
}): ConferenciaDeNicho {
  const { lista, texto } = args;

  // Sem lista, não há contra o que conferir — e não há lista de reserva
  // para cair. Nenhum chip passa.
  if (!lista) return { ok: false, erro: NAO_DEU_PARA_CONFERIR };

  const achado = nichoPeloRotulo(lista, texto);
  if (!achado) return { ok: false, erro: NAO_E_OPCAO };

  // ============================================================
  // DEVOLVE O RÓTULO DA LISTA, NÃO O TEXTO DO CLIENTE.
  //
  // `nichoPeloRotulo` casa normalizado, então "dentista" e "DENTISTA"
  // entram aqui e casam. Gravar o que chegou deixaria a coluna com
  // grafias diferentes para o mesmo nicho — e a coluna é lida por tela,
  // por conferidor e um dia por relatório. O que é gravado é sempre a
  // grafia canônica do backend.
  // ============================================================
  return { ok: true, texto: achado.rotulo };
}
