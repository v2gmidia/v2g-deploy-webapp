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
  /**
   * O rótulo já achatado, no formato "Nicho — Subtipo".
   *
   * O exemplo que estava aqui era "Petshop — Banho, tosa e veterinário",
   * e `petshop` saiu do catálogo em setembro. Sem subtipo nenhum vivo
   * hoje, qualquer exemplo concreto vira ficção datada — então o formato
   * fica descrito, e não ilustrado.
   */
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
   * É isto que vai no chip e é isto que é gravado em `businesses.niche`.
   */
  rotulo: string;
  /**
   * O que a busca casa além do rótulo.
   *
   * ============================================================
   * NÃO CONTE OS TERMOS AQUI. A LISTA É DO BACKEND.
   *
   * Este comentário dizia "183 termos nos dez nichos (medido em
   * 22/08/2026)". Em 22/09/2026 são **113 termos em 8 nichos** — o
   * Gabriel encolheu o `knowledge/` de propósito, e o número aqui virou
   * mentira sem que ninguém escrevesse uma linha errada.
   *
   * Um número de catálogo vivo copiado para comentário envelhece
   * sozinho. Quem quiser a conta de hoje roda `pnpm conferir:nichos`:
   * ele imprime o censo da lista VIVA a cada execução, e é o único lugar
   * deste repositório que tem direito de afirmar quantos são.
   * ============================================================
   *
   * Vêm com acento — hoje **35 dos 113** — e é por isso que comparar
   * exige normalizar OS DOIS LADOS. Ver `busca.ts`.
   */
  termosDeBusca: string[];
  /**
   * NÃO SÃO EXIBIDOS NESTE LOTE (handoff §10). Vêm validados assim mesmo
   * para que uma mudança de contrato apareça na fronteira, e porque o
   * lote que os exibir vai precisar gravar `nicho` E `sub_tipo` — o
   * `CadastroCompleto` não tem nenhum dos dois hoje.
   *
   * **Vazio nos OITO, medido em 22/09/2026 — zero subtipos na lista
   * inteira.** Já teve: até 22/08 o `petshop` trazia três, e `petshop`
   * saiu do catálogo. Continuam sendo validados para que uma mudança de
   * contrato apareça na fronteira, e não três telas adiante.
   */
  subTipos: SubTipoDeNicho[];
}
