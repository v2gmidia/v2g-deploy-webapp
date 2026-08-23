import "server-only";
import { obter } from "./cliente";
import { falha, registrarErroBackend, type Resultado } from "./erros";
import { validarListaDeNichos } from "@/lib/nichos/validar";
import type { Nicho } from "@/lib/nichos/tipos";

/**
 * `GET /nichos` — a lista viva de nichos do backend.
 *
 * READ-ONLY. É a fonte única da lista; este repositório NÃO tem uma cópia
 * dela e não deve ganhar uma. A lista de cinco opções escritas à mão em
 * `perguntas.ts` é exatamente o problema que este lote existe para
 * apagar: ela cobria três nichos com uma opção, nenhum com duas, e
 * deixava `academia`, `oficina-mecanica` e `petshop` inalcançáveis.
 *
 * Medido em 22/08/2026 contra `https://api.v2gmidia.com.br`:
 * dez nichos, 183 termos de busca, 3,8 KB de JSON, mediana de 17 ms.
 *
 * ============================================================
 * SEM O HEADER ELE DEVOLVE 401, NÃO 404.
 *
 * O middleware do backend cobre tudo, com quatro exceções públicas
 * (`/saude`, `/docs`, `/redoc`, `/openapi.json`). Não existe caminho que
 * produza 404 para rota existente. Um 401 lido como "essa rota não
 * existe" já custou tempo nesta história — se der 401, o que falta é o
 * token, não o deploy.
 * ============================================================
 */

/**
 * O teto de espera, e ele NÃO vem do contrato do backend — por isso não
 * está na tabela `TIMEOUTS` do `cliente.ts`, que lista os tempos que o
 * backend realmente leva.
 *
 * Este número é outra coisa: é quanto tempo uma pessoa no meio de uma
 * conversa pode ficar esperando a tela abrir. A medição diz 17 ms de
 * mediana e 60 ms a frio; 2,5 s é quarenta vezes o pior caso medido, o
 * que significa que só uma degradação real chega aqui. Estourado o teto,
 * quem chama mostra os chips de reserva em vez de segurar a página.
 */
const TETO_DE_ESPERA_MS = 2_500;

/**
 * ============================================================
 * NÃO HÁ CACHE AQUI, E É ESCOLHA ADIADA — NÃO ESQUECIMENTO.
 *
 * Hoje cada renderização da tela e cada resposta de `ramo` fazem um
 * `GET /nichos`. Medido em 22/08/2026: 17 ms de mediana, 3,8 KB. Um
 * catálogo de dez itens que muda de mês em mês, buscado a cada vez.
 *
 * A OPÇÃO REGISTRADA, para quando valer: cache manual em memória no
 * processo do servidor, com TTL curto — um `Map` com o momento da última
 * busca, devolvendo o valor guardado enquanto ele não vence. Manual, e
 * não `unstable_cache`/`revalidate`, porque o que se quer é uma linha
 * legível que qualquer um consegue invalidar, não um comportamento do
 * framework para descobrir depois.
 *
 * POR QUE NÃO AGORA (decisão do Victor, 22/08): a medição na tela vem
 * antes. Se a lista aparece sem atraso perceptível, o cache é otimização
 * prematura — e otimização prematura aqui custa caro no lugar errado,
 * porque uma lista guardada é uma lista que envelhece.
 *
 * NÃO CONFUNDA COM O QUE O HANDOFF §10 PROÍBE. Lá o proibido é cachear a
 * lista **como fallback estático**: uma cópia que sobrevive à queda do
 * backend e vira a lista paralela que este lote existe para matar. Um TTL
 * curto que expira e volta a buscar é outra coisa. Se alguém implementar
 * isto, a regra que não se quebra é: **vencido o TTL sem resposta do
 * backend, entra a RESERVA — nunca o valor velho.**
 * ============================================================
 */

/**
 * A lista de nichos, ou uma falha.
 *
 * NÃO FILTRA `generico`. Quem filtra é o backend, e é lá que a regra
 * mora — `generico` é o destino de quem não casa, não uma escolha de
 * lista. Medido em 22/08/2026: ele não vem. Se um dia vier, vai aparecer
 * como chip na tela, e isso é melhor que sumir com ele aqui: um remendo
 * silencioso deste lado recria a lista paralela que este lote está
 * matando, só que invisível.
 */
export async function listarNichos(): Promise<Resultado<Nicho[]>> {
  const resposta = await obter("/nichos", {
    contexto: "nichos",
    timeoutMs: TETO_DE_ESPERA_MS,
  });

  if (!resposta.ok) return resposta;

  const validado = validarListaDeNichos(resposta.dados);
  if (!validado) {
    registrarErroBackend("nichos", {
      metodo: "GET",
      caminho: "/nichos",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }

  return { ok: true, dados: validado };
}
