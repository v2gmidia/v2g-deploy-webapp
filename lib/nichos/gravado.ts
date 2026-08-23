// A extensão `.ts` é explícita porque o `conferir:nichos` importa este
// arquivo direto do Node — mesma regra do resto de `lib/nichos/`.
import { nichoPeloIdentificador } from "./busca.ts";
import type { Nicho } from "./tipos";

/**
 * Como se LÊ o que está gravado em `businesses.niche`.
 *
 * ============================================================
 * A COLUNA GUARDA O IDENTIFICADOR, NÃO O RÓTULO — desde 23/08.
 *
 * Até 22/08 ela guardava `"Dentista"`. A inversão tem dois motivos, e o
 * segundo é o caro:
 *
 *  1. o rótulo é do backend e pode mudar. Se alguém editar o
 *     `nome_exibicao` no `knowledge/`, toda linha gravada antes fica com
 *     o texto velho, e não há como saber que ela ficou;
 *  2. o pipeline escolhe o documento do nicho PELO IDENTIFICADOR. Uma
 *     coluna de rótulos obriga uma tradução no meio do caminho, e a
 *     tradução mora onde a lista viva não está.
 *
 * Feito em 23/08 porque era barato: medido no banco, ZERO linhas tinham
 * rótulo válido — as três com valor tinham `Clínica / Consultório` (que
 * nunca foi nicho) e `padaria` (fictícia). Depois de gravar rótulo por
 * algumas semanas, a mesma inversão precisaria de migration com um mapa
 * escrito à mão, que é a lista paralela que este lote existe para matar.
 * ============================================================
 *
 * Função pura, sem `server-only`: a tela do cliente precisa dela para
 * mostrar rótulo, e o `conferir:nichos` precisa alcançá-la.
 */

export type NichoGravado =
  /** coluna nula ou em branco */
  | { tipo: "vazio" }
  /** o valor é um identificador da lista viva — a tela mostra o rótulo */
  | { tipo: "reconhecido"; nicho: Nicho }
  /**
   * Há lista viva e o valor não é nenhum dos nichos dela. Duas origens
   * legítimas: o texto livre de quem não se achou na lista (`padaria`), e
   * as respostas do onboarding antigo (`Clínica / Consultório`).
   */
  | { tipo: "nao-reconhecido"; valor: string }
  /**
   * O `GET /nichos` não respondeu. NÃO É A MESMA COISA que não
   * reconhecer — sem lista não dá para afirmar que o valor está fora
   * dela, e dizer ao cliente "esse ramo não está na nossa lista" quando
   * quem falhou fomos nós é o sistema culpando ele pelo próprio defeito.
   * A mesma distinção dos dois recados de recusa em `escolha.ts`.
   */
  | { tipo: "sem-lista"; valor: string };

/**
 * O recado de quando o valor gravado não é nicho da lista viva.
 *
 * NÃO ACUSA, e não sugere o vizinho mais próximo. Quem tem
 * `Clínica / Consultório` na coluna respondeu de boa-fé um onboarding que
 * oferecia aquilo; quem tem `padaria` escreveu a verdade sobre o próprio
 * negócio. O convite é para escolher, e a saída pelo texto livre continua
 * aberta — ver `docs/decisoes.md`, 22/08.
 */
export const NICHO_FORA_DA_LISTA =
  "Esse ramo não está na nossa lista — escolha o seu, e se não achar, escreva do seu jeito.";

/**
 * O recado do estado degradado: o `GET /nichos` não respondeu.
 *
 * ============================================================
 * A LINHA É PARTE DA DECISÃO, NÃO ENFEITE — Victor, 22/08.
 *
 * "Escreva do seu jeito" sozinho parece que nunca houve lista: a pessoa
 * não tem como saber que está vendo um estado degradado, e conclui que o
 * produto é assim. Dizer que a lista não carregou é a diferença entre uma
 * falha nossa e uma limitação nossa.
 *
 * MORA AQUI PORQUE SÃO DUAS TELAS. Nasceu escrita à mão dentro do
 * `Chat.tsx`; quando a `/meu-negocio` passou a precisar da mesma frase,
 * copiar teria criado o segundo texto que envelhece sozinho — que é, em
 * miniatura, o defeito que este lote inteiro está consertando.
 * ============================================================
 */
export const LISTA_NAO_CARREGOU =
  "A lista de ramos não carregou agora. Escreva o seu do jeito que você chama — a gente confere depois.";

/**
 * O que a `/meu-negocio` mostra no lugar do ramo quando JÁ HÁ VALOR
 * gravado e a lista não carregou.
 *
 * ============================================================
 * SEM A LISTA, O VALOR NÃO PODE APARECER — ele é identificador.
 *
 * Achado na verificação de 23/08, no navegador, e não no código: com o
 * catálogo fora a tela mostrava `clinica-odontologica` cru para o dono do
 * consultório. É exatamente o defeito que o
 * `buraco-meu-negocio-nicho-livre.md` previu para o dia em que o
 * armazenamento invertesse — jargão na tela que existe para o cliente
 * conferir o que a gente entendeu do negócio dele.
 *
 * Quem traduz identificador em rótulo é a lista viva. Sem ela não há
 * tradução, e as alternativas eram piores: desentortar o identificador
 * ("Clinica odontologica") é inventar rótulo sem acento e sem voz de
 * dono, e mostrar "a gente ainda não sabe" é mentira — sabemos, só não
 * conseguimos escrever o nome agora.
 *
 * O CAMPO TAMBÉM NÃO GANHA BOTÃO nesse estado, e é a mesma decisão: o
 * único editor possível sem lista é o texto livre, e ele trocaria um
 * `clinica-odontologica` válido pela frase da pessoa — nossa queda
 * rebaixando o dado dela. O resto da tela continua editável.
 * ============================================================
 */
export const NICHO_GUARDADO_SEM_LISTA =
  "Não deu para carregar o nome do seu ramo agora — ele continua guardado. Recarregue daqui a pouco.";

export function lerNichoGravado(lista: Nicho[] | null, valor: unknown): NichoGravado {
  const texto = typeof valor === "string" ? valor.trim() : "";
  if (!texto) return { tipo: "vazio" };
  if (!lista) return { tipo: "sem-lista", valor: texto };

  const achado = nichoPeloIdentificador(lista, texto);
  if (achado) return { tipo: "reconhecido", nicho: achado };

  return { tipo: "nao-reconhecido", valor: texto };
}

/**
 * O NOME do ramo, para a tela.
 *
 * Rótulo quando o valor é reconhecido; a frase da própria pessoa quando
 * não é. E **vazio quando não há lista** — porque ali o valor gravado é
 * identificador, e devolvê-lo seria `clinica-odontologica` aparecendo
 * para o dono do consultório, que é a regra de zero jargão quebrada.
 *
 * ============================================================
 * O VAZIO DO `sem-lista` É PROPOSITAL, E É O PADRÃO SEGURO.
 *
 * Quem chama precisa tratar esse caso à parte — a `/meu-negocio` mostra
 * o `NICHO_GUARDADO_SEM_LISTA` no lugar. Se um dia alguém esquecer, o
 * pior que acontece é a linha ficar sem nome; se esta função devolvesse
 * o valor cru, o esquecimento vazaria jargão para a tela do cliente sem
 * ninguém notar. Errar para o lado de não mostrar nada.
 * ============================================================
 */
export function rotuloDoNichoGravado(gravado: NichoGravado): string {
  switch (gravado.tipo) {
    case "reconhecido":
      return gravado.nicho.rotulo;
    case "nao-reconhecido":
      return gravado.valor;
    default:
      return "";
  }
}
