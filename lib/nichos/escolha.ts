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
 * Função pura, e de propósito: a decisão fica fora do `"use server"`,
 * onde o `conferir:nichos` consegue alcançá-la. Quem busca a lista é o
 * chamador.
 */

export type ConferenciaDeNicho =
  | {
      ok: true;
      texto: string;
      /**
       * A escolha veio dos chips de RESERVA, com o `GET /nichos` fora.
       *
       * Quem grava usa isto para marcar a procedência como `aproximacao`
       * em vez de `confirmado` — ver `PROCEDENCIA_DA_RESERVA` abaixo.
       */
      viaReserva: boolean;
    }
  | { ok: false; erro: string };

/**
 * ============================================================
 * O CHIP DE RESERVA NÃO É UMA ESCOLHA, E O DADO TEM QUE DIZER ISSO.
 *
 * "Clínica / Consultório" cobre TRÊS nichos reais de uma vez; "Loja
 * física" não cobre nenhum. Gravar isso como `confirmado` — o nível mais
 * alto da escala — deixaria a linha indistinguível de uma escolha feita
 * numa lista real, e o gestor lendo a coluna não teria como saber que
 * aquilo foi palpite de um momento em que o sistema estava degradado.
 *
 * `aproximacao` nasceu na migration `0021` só para isto. Ele fica ABAIXO
 * de `confirmado` de graça: as duas travas que protegem valor do cliente
 * (`0013` e `0019`) comparam com o literal `'confirmado'`, então um valor
 * marcado assim PODE ser corrigido por proposta de agente — que é o
 * certo, porque ele é um palpite, não uma afirmação do dono.
 *
 * O TEXTO LIVRE NÃO ENTRA AQUI. Quem escreveu "padaria" com as próprias
 * palavras deu uma resposta de verdade, não um palpite sobre uma lista
 * errada. Aquilo é `confirmado`, mesmo durante a degradação.
 * ============================================================
 */
export const PROCEDENCIA_DA_RESERVA = "aproximacao" as const;
export const PROCEDENCIA_DA_LISTA_VIVA = "confirmado" as const;

/**
 * O recado de quando a lista viva não veio.
 *
 * NÃO É "essa opção não existe". A diferença importa: quando a lista está
 * no ar e o texto não casa, o cliente mandou coisa que não existe. Quando
 * a lista NÃO está no ar, nós é que não conseguimos conferir — e acusar o
 * cliente de escolher opção inexistente é o sistema culpando ele pelo
 * próprio defeito. O convite a tentar de novo é honesto porque a falha é
 * transitória de verdade.
 */
export const NAO_DEU_PARA_CONFERIR =
  "Não consegui confirmar sua escolha agora. Tente de novo em instantes.";

export const NAO_E_OPCAO = "Essa opção não existe nesta pergunta.";

export function conferirEscolhaDeNicho(args: {
  /** a lista viva, ou `null` quando o `GET /nichos` não respondeu */
  lista: Nicho[] | null;
  /** os `echo` dos chips de reserva — o que a tela mostra com o backend fora */
  reserva: string[];
  /** o que o cliente mandou */
  texto: string;
}): ConferenciaDeNicho {
  const { lista, reserva, texto } = args;

  if (lista) {
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
    return { ok: true, texto: achado.rotulo, viaReserva: false };
  }

  // Sem lista viva, a tela mostrou a reserva — então é contra a reserva
  // que se confere. Igualdade exata, que é o que ela sempre foi.
  if (reserva.includes(texto)) return { ok: true, texto, viaReserva: true };

  return { ok: false, erro: NAO_DEU_PARA_CONFERIR };
}
