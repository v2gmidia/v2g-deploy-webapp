/**
 * A LEITURA DOS QUATRO CARIMBOS DE `campaigns`.
 *
 * SEM `server-only`, e é de propósito: esta é transformação PURA, não
 * toca banco nem rede, e precisa ser alcançável por três lados — o
 * componente de servidor que desenha a tela do operador, um componente
 * de cliente que venha a precisar, e o conferidor, que a exercita sem
 * subir Next. É a mesma divisão de `lib/nichos/busca.ts` (puro) e
 * `lib/backend/nichos.ts` (`server-only`).
 *
 * Quem faz as consultas é `lib/campanha/ativacao.ts`. Aqui só entra o
 * que já foi lido.
 */

/**
 * O QUE OS QUATRO CARIMBOS DIZEM, JUNTOS.
 *
 * ============================================================
 * NENHUM DOS QUATRO RESPONDE SOZINHO. É a comparação que responde.
 *
 * `ativada_em` preenchido não quer dizer "rodando": quer dizer "já foi
 * ativada alguma vez". Uma campanha ativada segunda e pausada quarta tem
 * os dois pares preenchidos, e quem lê só o primeiro conclui que ela está
 * no ar. A tela do cliente diria "seu anúncio está rodando" sobre algo
 * parado — e é o tipo de erro que só aparece na fatura.
 *
 * A regra está escrita na migration 0024, e esta função é a única
 * tradução dela em código. Quem precisar do estado chama aqui; quem
 * comparar datas por conta vai discordar dela um dia.
 * ============================================================
 */
export type EstadoDaVeiculacao =
  /** ativada depois da última pausa — está rodando */
  | "rodando"
  /** pausada depois da última ativação — parada, já rodou */
  | "parada"
  /** ativada e nunca pausada — rodando desde a primeira vez */
  | "rodando_desde_sempre"
  /** nenhum carimbo — nunca saiu do pausado */
  | "nunca_ativada";

export interface LeituraDosCarimbos {
  estado: EstadoDaVeiculacao;
  /** a frase, em português, para a tela do operador */
  frase: string;
  /** quem fez a última mudança, se houve */
  ultimoAutor: string | null;
  /** quando foi a última mudança, se houve */
  ultimoQuando: string | null;
}

export function lerCarimbos(args: {
  ativadaEm: string | null;
  ativadaPor: string | null;
  pausadaEm: string | null;
  pausadaPor: string | null;
}): LeituraDosCarimbos {
  const { ativadaEm, ativadaPor, pausadaEm, pausadaPor } = args;

  if (!ativadaEm && !pausadaEm) {
    return {
      estado: "nunca_ativada",
      frase: "Nunca saiu do pausado.",
      ultimoAutor: null,
      ultimoQuando: null,
    };
  }

  if (ativadaEm && !pausadaEm) {
    return {
      estado: "rodando_desde_sempre",
      frase: "Rodando desde a primeira ativação — nunca foi pausada.",
      ultimoAutor: ativadaPor,
      ultimoQuando: ativadaEm,
    };
  }

  // Pausada sem nunca ter sido ativada por nós é estado possível: a
  // campanha nasce PAUSED na publicação, e alguém pode ter mandado pausar
  // de novo. Não é "rodou e parou" — é "nunca rodou", com carimbo.
  if (!ativadaEm && pausadaEm) {
    return {
      estado: "nunca_ativada",
      frase: "Nunca foi ativada. A última ação foi uma pausa.",
      ultimoAutor: pausadaPor,
      ultimoQuando: pausadaEm,
    };
  }

  const a = new Date(ativadaEm!).getTime();
  const p = new Date(pausadaEm!).getTime();

  // Empate vai para PARADA. Se as duas datas forem iguais ao
  // milissegundo, alguma coisa estranha aconteceu, e no escuro a leitura
  // conservadora é a que NÃO afirma que está gastando.
  if (a > p) {
    return {
      estado: "rodando",
      frase: "Rodando. Foi reativada depois da última pausa.",
      ultimoAutor: ativadaPor,
      ultimoQuando: ativadaEm,
    };
  }

  return {
    estado: "parada",
    frase: "Parada. Já rodou antes.",
    ultimoAutor: pausadaPor,
    ultimoQuando: pausadaEm,
  };
}
