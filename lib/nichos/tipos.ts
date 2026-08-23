/**
 * O tipo de um nicho, como o backend o descreve.
 *
 * SEM `server-only`, e é de propósito: o filtro da busca roda no
 * NAVEGADOR (decisão do handoff §2), então o componente de cliente
 * precisa do tipo. Quem faz a chamada HTTP é `lib/backend/nichos.ts`,
 * esse sim `server-only` — o `X-V2G-Token` não pode vazar para o bundle.
 *
 * A tradução snake_case → camelCase acontece na fronteira, em
 * `lib/backend/nichos.ts`, e em nenhum outro lugar. Aqui já é camelCase.
 */

export interface SubTipoDeNicho {
  id: string;
  rotulo: string;
  /** o rótulo já achatado: "Petshop — Banho, tosa e veterinário" */
  nomeExibicao: string;
}

export interface Nicho {
  /**
   * O identificador. Chama-se `nicho` e não `slug` de propósito — é o
   * nome que o backend usa em `knowledge/`, e renomear aqui criaria duas
   * palavras para a mesma coisa.
   */
  nicho: string;
  /**
   * Voz de dono, não de catálogo: `clinica-odontologica` → "Dentista".
   *
   * É isto que vai no chip e é isto que a tela mostra — mas NÃO é o que
   * vai para `businesses.niche`. A coluna guarda o `nicho` acima desde
   * 23/08; ver `lib/nichos/gravado.ts` para o porquê da inversão.
   */
  rotulo: string;
  /**
   * O que a busca casa além do rótulo. 183 termos nos dez nichos
   * (medido em 22/08/2026). Vêm com acento — `rodízio`, `japonês`,
   * `ração` — e é por isso que comparar exige normalizar OS DOIS LADOS.
   * Ver `busca.ts`.
   */
  termosDeBusca: string[];
  /**
   * NÃO SÃO EXIBIDOS NESTE LOTE (handoff §10). Vêm validados assim mesmo
   * para que uma mudança de contrato apareça na fronteira, e porque o
   * lote que os exibir vai precisar gravar `nicho` E `sub_tipo` — o
   * `CadastroCompleto` não tem nenhum dos dois hoje.
   *
   * Vazio em nove dos dez; só `petshop` tem três.
   */
  subTipos: SubTipoDeNicho[];
}
