/**
 * O que o cliente LÊ sobre o que ainda falta — num lugar só.
 *
 * SEM `server-only`: o fim do bloco 2 é componente de cliente.
 *
 * POR QUE A COPY MORA AQUI E NÃO NAS TELAS. As pendências aparecem em duas
 * superfícies de cliente (fim do bloco 2 e `/inicio`) que leem o MESMO
 * `montarCadastro`. Se cada uma escrevesse a própria frase, elas
 * divergiriam na primeira edição — e a pessoa leria "a gente te liga" numa
 * e "termine seu cadastro" na outra, sobre exatamente o mesmo campo. Dados
 * iguais e textos diferentes é pior que texto ruim: parece que o sistema
 * sabe duas coisas.
 *
 * A tela de operador NÃO usa isto, e é de propósito: audiência diferente,
 * linguagem diferente (`/saude-meta` já estabelece esse precedente). O que
 * as três compartilham é o `montarCadastro`, que é o dado.
 */

import type { Pendencia } from "./montar";

/**
 * O prazo até o bloco trocar de dono.
 *
 * CINCO DIAS, E NÃO SETE, e o motivo é medido: `lp/termos.html` dá o
 * direito de arrependimento do art. 49 do CDC nos **7 dias corridos** desde
 * a contratação, com devolução integral. Avisar no dia 7 que ainda não
 * ligamos seria entregar a informação no instante em que ela deixa de ser
 * acionável — ele lê que estamos devendo e já não pode fazer nada com
 * isso. No dia 5 a janela dele ainda está aberta.
 */
export const DIAS_ATE_TROCAR_DE_DONO = 5;

const WHATSAPP =
  "https://wa.me/5521936182176?text=Oi!%20Quero%20fechar%20as%20contas%20que%20faltam%20no%20meu%20cadastro.";

export interface Acao {
  rotulo: string;
  href: string;
}

export interface ResumoDePendencias {
  vazio: boolean;
  titulo: string;
  corpo: string;
  /**
   * O que a tela oferece. **Nulo quando a bola não está com o cliente** — e
   * essa é a regra que não se quebra: um "não sei" não ganha botão de
   * responder de novo. Reoferecer a mesma pergunta a quem já disse que não
   * sabe faz a pessoa chutar um número na segunda vez só para a tela parar
   * de pedir, e o desenho inteiro existe para não receber número chutado.
   */
  acao: Acao | null;
  /** a V2G está devendo a conversa há mais que o prazo */
  nossaDivida: boolean;
  /** os rótulos, na ordem em que aparecem na tela */
  itens: string[];
  /**
   * Quantos dos `itens` são "não sei".
   *
   * Exposto porque a trilha do onboarding precisa distinguir o campo que
   * espera O CLIENTE do campo que espera a GENTE, e ela não tem como
   * descobrir isso a partir dos rótulos. Sai daqui, e não de uma segunda
   * contagem em `lib/estado/`, porque contar pendência em dois lugares é o
   * defeito que este módulo existe para não ter.
   */
  quantosNaoSei: number;
}

function diasDesde(iso: string | undefined, agora: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return (agora.getTime() - t) / 86_400_000;
}

function lista(itens: string[]): string {
  if (itens.length === 1) return itens[0]!.toLowerCase();
  return (
    itens.slice(0, -1).map((i) => i.toLowerCase()).join(", ") +
    " e " +
    itens[itens.length - 1]!.toLowerCase()
  );
}

/**
 * `agora` é PARÂMETRO, não `new Date()` lá dentro. É o que torna o corte
 * do dia 5 testável sem esperar cinco dias.
 */
export function resumirPendencias(
  pendencias: Pendencia[],
  agora: Date,
): ResumoDePendencias {
  if (pendencias.length === 0) {
    return {
      vazio: true, titulo: "", corpo: "", acao: null,
      nossaDivida: false, itens: [], quantosNaoSei: 0,
    };
  }

  const itens = pendencias.map((p) => p.rotulo);
  const naoSei = pendencias.filter((p) => p.motivo === "nao_sei");
  const acionaveis = pendencias.filter((p) => p.motivo !== "nao_sei");

  // Só o "não sei" conta para o prazo, e a distinção é o ponto: o campo
  // que ninguém perguntou depende DELE, e cobrar por isso é justo. O "não
  // sei" depende de NÓS ligarmos — e aí o relógio corre contra a gente.
  const maisVelho = Math.max(
    ...naoSei.map((p) => diasDesde(p.desde, agora) ?? 0),
    0,
  );
  const nossaDivida = naoSei.length > 0 && maisVelho >= DIAS_ATE_TROCAR_DE_DONO;

  if (nossaDivida) {
    return {
      vazio: false,
      titulo: "Ainda não te ligamos — e isso é nosso",
      corpo: `Falta ${lista(naoSei.map((p) => p.rotulo))} para sua campanha poder começar, e a gente combinou de resolver isso com você numa conversa. Já passou do tempo. Se quiser puxar agora, é só chamar.`,
      acao: { rotulo: "Falar com a gente", href: WHATSAPP },
      nossaDivida: true,
      itens,
      quantosNaoSei: naoSei.length,
    };
  }

  if (acionaveis.length === 0) {
    return {
      vazio: false,
      titulo: "A gente te liga pra fechar isso",
      corpo: `Falta ${lista(naoSei.map((p) => p.rotulo))} — e são as contas que a gente prefere fazer junto com você, por telefone. Leva uns 10 minutos. O resto já está guardado.`,
      // SEM AÇÃO, de propósito. Ver o comentário de `acao`.
      acao: null,
      nossaDivida: false,
      itens,
      quantosNaoSei: naoSei.length,
    };
  }

  const primeiro = acionaveis[0]!;
  const soUm = acionaveis.length === 1;

  // ============================================================
  // "AINDA NÃO SEI" É MENTIRA SOBRE UM CAMPO PREENCHIDO.
  //
  // O `abaixo_do_piso` é o campo que a pessoa RESPONDEU e cujo valor não
  // serve. Dizer "ainda não sei quanto você quer investir" para quem
  // digitou R$ 200 apaga a resposta dela e faz o sistema parecer
  // desmemoriado — ela vai digitar 200 de novo.
  //
  // Por isso estes saem da frase do "ainda não sei" e ganham a própria,
  // com o número dela e o nosso. O `detalhe` vem do `montarCadastro`, que
  // é onde os dois números se encontram.
  // ============================================================
  const semResposta = acionaveis.filter((p) => p.motivo !== "abaixo_do_piso");
  const naoServe = acionaveis.filter((p) => p.motivo === "abaixo_do_piso");

  const frases: string[] = [];
  if (semResposta.length > 0) {
    frases.push(`Ainda não sei ${lista(semResposta.map((p) => p.rotulo))}.`);
  }
  for (const p of naoServe) {
    // O `detalhe` sempre existe para este motivo — `montarCadastro` o
    // preenche junto. O fallback é para o caso de alguém acrescentar um
    // campo com este motivo e esquecer o número.
    frases.push(
      p.detalhe
        ? `Pra sua campanha rodar, ${p.detalhe} por mês.`
        : `${p.rotulo} está abaixo do nosso mínimo.`,
    );
  }
  if (naoSei.length > 0) {
    frases.push(`E ${lista(naoSei.map((p) => p.rotulo))} a gente resolve por telefone.`);
  }

  const soAjuste = semResposta.length === 0 && naoServe.length > 0;

  return {
    vazio: false,
    titulo: soAjuste
      ? "Falta ajustar sua verba"
      : soUm
        ? "Falta uma coisa pro seu anúncio começar"
        : "Falta pouco pro seu anúncio começar",
    corpo: frases.join(" "),
    acao: {
      rotulo:
        primeiro.motivo === "nao_confirmado"
          ? "Confirmar um valor"
          : primeiro.motivo === "abaixo_do_piso"
            ? "Ajustar minha verba"
            : "Terminar meu cadastro",
      href: primeiro.onde,
    },
    nossaDivida: false,
    itens,
    quantosNaoSei: naoSei.length,
  };
}
