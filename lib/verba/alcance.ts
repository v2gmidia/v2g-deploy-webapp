/**
 * ONDE O ANÚNCIO VAI APARECER — a decisão, separada da tela.
 *
 * Mora fora do `page.tsx` para poder ser conferida sem sessão e sem
 * navegador (`scripts/conferir-verba.ts`). A tela que dependia desta
 * decisão afirmava, sem medir, que a página do Facebook do cliente estava
 * sem endereço; um erro assim não aparece em teste de tipo nem em build —
 * só numa asserção que exercite os três estados com as linhas reais do
 * banco. Ver `docs/qa3-telas-isoladas.md` §1.
 *
 * Sem `server-only` e sem import de servidor: o conferidor roda em node
 * puro.
 */

export type EstadoDoAlcance =
  /** temos a coordenada: o raio que o cliente escolheu é o que está valendo */
  | "ponto"
  /** resolvido para a cidade inteira: mais largo do que ele pediu, e a gente sabe disso */
  | "cidade"
  /** ninguém resolveu nada ainda — "não sei", que NÃO é "ele não tem endereço" */
  | "nao_sabemos";

export interface GeoDoNegocio {
  geo_lat: unknown;
  geo_key: string | null;
}

/**
 * Três estados, não dois.
 *
 * O `else` de antes juntava "resolvido para cidade" com "nunca
 * perguntamos" e chamava os dois de "sua página está sem endereço". Em
 * 20/08/2026, `geo_resolved_at` estava nulo nas quatro linhas de
 * `businesses`: a cascata nunca tinha rodado para ninguém, e mesmo assim
 * a tela acusava a página do cliente.
 *
 * `geo_lat` nulo é ausência de informação nossa, não uma afirmação sobre
 * o negócio dele.
 */
export function estadoDoAlcance(negocio: GeoDoNegocio): EstadoDoAlcance {
  if (negocio.geo_lat !== null && negocio.geo_lat !== undefined) return "ponto";
  if (negocio.geo_key) return "cidade";
  return "nao_sabemos";
}

/**
 * A cidade como ela deve aparecer numa frase.
 *
 * `businesses.city` é o que o CLIENTE digitou — "Rio de janeiro", com "j"
 * minúsculo, é o valor real da conta medida, e a tela imprimia isso cru no
 * meio de uma frase.
 *
 * Capitaliza só para EXIBIR. O valor gravado não se toca: é dele, tem
 * procedência registrada (`confirmar_campo_do_cliente`), e reescrever no
 * banco seria corrigir o que ele disse sem ele pedir.
 *
 * As preposições ficam minúsculas — "Rio de Janeiro", não "Rio De
 * Janeiro". Sem isso a correção ficaria mais feia que o defeito.
 */
const MIUDAS = new Set(["de", "da", "do", "das", "dos", "e"]);

export function cidadeParaTela(bruta: string): string {
  return bruta
    .trim()
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .filter(Boolean)
    .map((palavra, i) =>
      i > 0 && MIUDAS.has(palavra)
        ? palavra
        : palavra.charAt(0).toLocaleUpperCase("pt-BR") + palavra.slice(1),
    )
    .join(" ");
}
