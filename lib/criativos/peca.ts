/**
 * O que conta como PEÇA DE ANÚNCIO. Um lugar só.
 *
 * Desenho em `docs/lote-leitura-de-peca.md`. A medição do defeito que fez
 * este arquivo existir está em `docs/buraco-aprovar-sem-filtro.md`.
 *
 * ============================================================
 * A REGRA QUE FAZ ISTO DURAR:
 *
 *   **Nenhuma tela decide sozinha o que é peça de anúncio.**
 *
 * `creatives` guarda quatro coisas diferentes na mesma tabela (0010 fecha
 * o domínio de `uso`): a logo do cliente, as fotos de identidade dele, as
 * peças que a IA monta e as referências. Toda linha nasce `status =
 * 'draft'` — inclusive a logo, que nunca vai ser aprovada por ninguém.
 *
 * Uma leitura que filtra só por `status` traz logo. Foi isso que fez a
 * `/aprovar` apresentar o logo que o cliente subiu na `/conta` como "a
 * peça que a IA montou para você aprovar", enquanto a cadeia do `/inicio`,
 * lendo a mesma tabela com o filtro certo, dizia que a etapa de aprovação
 * estava concluída. Duas leituras, duas respostas, na mesma conta.
 *
 * Se a sua tela precisa de um recorte de `creatives` que não está aqui, o
 * lugar de acrescentá-lo é este arquivo — não o `page.tsx`.
 * ============================================================
 *
 * NÃO EXIGE `campaign_id`, e isso é decisão, não esquecimento. Ver
 * `docs/lote-leitura-de-peca.md` §3: exigir campanha faria a cadeia e a
 * tela discordarem de novo, pela ponta oposta — a cadeia contaria uma peça
 * que a tela esconderia.
 *
 * Sem `server-only`: são predicados puros sobre linha já lida, e o
 * conferidor precisa importá-los fora do Next.
 */

/** O domínio fechado de `creatives.uso` (migration 0010). */
export const USOS = ["logo", "identidade", "campanha", "referencia"] as const;
export type Uso = (typeof USOS)[number];

/** Peça de anúncio é `uso = 'campanha'`. Logo e identidade não são. */
export const USO_DE_ANUNCIO = "campanha";

/**
 * O mínimo que uma linha de `creatives` precisa expor para ser julgada
 * aqui. Estrutural de propósito: cada tela faz o `select` das colunas que
 * ela desenha, e nenhuma precisa mudar o `select` para caber neste tipo.
 */
export type PecaLida = {
  uso?: string | null;
  status?: string | null;
  arquivado_em?: string | null;
};

/**
 * As colunas que qualquer `select` precisa trazer para os predicados
 * abaixo poderem julgar a linha. Mesmo papel do `COLUNAS_DO_CADASTRO` em
 * `lib/cadastro/consultar.ts`: a lista mora junto de quem a lê.
 */
export const COLUNAS_DO_JULGAMENTO = "uso, status, arquivado_em";

/**
 * ============================================================
 * POR QUE ISTO ESTOURA EM VEZ DE DEVOLVER `false`.
 *
 * O cliente do Supabase aqui é **sem tipo gerado** — `select("id, uso")`
 * devolve linha destipada, e o TypeScript não tem como saber que
 * `arquivado_em` ficou de fora do `select`. Se ficar, `p.arquivado_em` é
 * `undefined`, o `?? null` transforma em `null`, e o filtro de arquivado
 * vira **regra inerte**: escrita, correta, e sem efeito nenhum. Peça
 * arquivada voltaria a contar, e nada acusaria.
 *
 * Coluna que faltou no `select` é erro de quem escreveu o código, nunca
 * estado do dado — então a resposta certa é parar, não escolher um
 * default. É o mesmo raciocínio do `docs/regra-inerte.md`, aplicado antes
 * de a regra ficar inerte.
 *
 * Use `COLUNAS_DO_JULGAMENTO` no `select` e isto nunca dispara.
 * ============================================================
 */
function julgavel(p: PecaLida, quem: string): void {
  for (const coluna of ["uso", "status", "arquivado_em"]) {
    if (!(coluna in p)) {
      throw new TypeError(
        `${quem}: a linha de creatives não trouxe a coluna "${coluna}". ` +
          `Ponha COLUNAS_DO_JULGAMENTO no select (lib/criativos/peca.ts).`,
      );
    }
  }
}

/**
 * É peça de anúncio VIGENTE.
 *
 * `arquivado_em` entra aqui, e não num predicado à parte, porque peça
 * arquivada não é "peça em outro estado": é arquivo que deixou de valer
 * (0014). Contá-la é o mesmo erro de contar a logo.
 */
export function ehPecaDeAnuncio(p: PecaLida): boolean {
  julgavel(p, "ehPecaDeAnuncio");
  return p.uso === USO_DE_ANUNCIO && (p.arquivado_em ?? null) === null;
}

/** Peça de anúncio vigente que espera o sim do cliente. */
export function esperaAprovacao(p: PecaLida): boolean {
  return ehPecaDeAnuncio(p) && p.status === "draft";
}

/** Peça de anúncio vigente que a revisão do Meta recusou. */
export function foiReprovada(p: PecaLida): boolean {
  return ehPecaDeAnuncio(p) && p.status === "rejected";
}

/**
 * A METADE SQL da mesma definição, para quem não pode trazer a tabela
 * inteira para descobrir qual linha quer (a `/aprovar` pede uma só).
 *
 * O tipo é estrutural — o que interessa do builder do PostgREST são os
 * dois métodos usados aqui, e amarrar no tipo concreto do
 * `PostgrestFilterBuilder` obrigaria cada chamador a repetir os genéricos
 * do `select` dele.
 *
 * **Esta metade e os predicados acima têm que dizer a mesma coisa.** Quem
 * mexer numa mexe na outra: `pnpm conferir:criativos` testa os predicados
 * com fixture e `pnpm medir:peca` roda esta contra o banco de verdade,
 * sobre as mesmas três linhas de alvo.
 */
export function apenasPecasDeAnuncio<Q>(query: Q): Q {
  const filtravel = query as unknown as FiltroMinimo;
  return filtravel.eq("uso", USO_DE_ANUNCIO).is("arquivado_em", null) as unknown as Q;
}

/**
 * O `Q` acima é solto e o corpo converte, em vez de `Q extends
 * FiltroMinimo`, e isso foi medido: com a restrição, o `tsc` estoura em
 * `TS2589 — type instantiation is excessively deep` na `/aprovar`. O
 * `PostgrestFilterBuilder` carrega seis genéricos que se reencaixam a cada
 * `.eq()`, e casá-los com um tipo estrutural recursivo faz o compilador
 * abrir a recursão inteira.
 *
 * O que se perde: o `tsc` não recusa mais `apenasPecasDeAnuncio(42)`. O
 * que se mantém: o tipo de RETORNO continua sendo exatamente o do builder
 * que entrou, então nada a jusante fica destipado — que é onde erro de
 * verdade aconteceria.
 */
type FiltroMinimo = {
  eq(coluna: string, valor: string): FiltroMinimo;
  is(coluna: string, valor: null): FiltroMinimo;
};
