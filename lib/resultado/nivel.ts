/**
 * O vocabulário do nível — os catorze slugs, e nada além disso.
 *
 * ============================================================
 * ESTE ARQUIVO NÃO ESCREVE FRASE. QUEM ESCREVE É O BACKEND.
 *
 * Até 10/09/2026 ele tinha sete frases próprias, escritas aqui, e o
 * contrato do dashboard proíbe isso em negrito: *"A tela não traduz o
 * nível. O slug (`sem_alvo`) é chave de máquina; quem escreve para o dono
 * é o backend"*, em `metricas/andamento.py::FRASE_PARA_O_DONO`.
 *
 * O motivo é mecânico, e a gente viveu os dois lados dele:
 *
 *   - do lado do backend há um teste que REPROVA nível sem frase
 *     (`test_andamento.py::TestTodoNivelTemFrase`). Nível novo não nasce
 *     mudo;
 *   - do lado daqui não havia nada equivalente. A tabela local declarava
 *     SETE níveis onde o contrato declara CATORZE, e os sete que faltavam
 *     — `alerta_inicial`, `alerta_urgente`, `pausa_automatica`,
 *     `em_avaliacao`, `gargalo`, `sem_base`, `medicao_nao_verificada` —
 *     não eram "sem frase": eram `FRASES[nivel]` devolvendo `undefined` e
 *     `frase.titulo` derrubando a página.
 *
 * Pior: as frases locais já DIVERGIAM. A daqui para `sem_alvo` dizia
 * "Sua campanha está no ar" — afirmação sobre o estado da campanha que
 * ninguém mediu. A do backend diz "Ainda não definimos juntos quanto vale
 * a pena pagar por cada pessoa que chega". Duas definições de como está
 * indo, e a que divergia era a nossa, que ninguém audita.
 * ============================================================
 */

/**
 * Os CATORZE do contrato, na ordem em que ele os apresenta.
 *
 * ============================================================
 * ISTO É VOCABULÁRIO CONHECIDO, NÃO PORTEIRA.
 *
 * Nenhuma tela pode exigir que o nível esteja nesta lista para mostrar a
 * frase. Decisão do Victor, 10/09/2026: **nível que `ehNivel()` não
 * conhece mostra a `nivelFrase` do mesmo jeito.** A lista serve a quem
 * quiser ramificar — e ramificar é opcional.
 *
 * Se fosse porteira, o décimo quinto nível que o backend criar apareceria
 * mudo para o cliente, que é exatamente o defeito que este arquivo
 * causava antes.
 * ============================================================
 */
export const NIVEIS = [
  // Os seis que JULGAM.
  "ok",
  "alerta_inicial",
  "alerta_urgente",
  "pausa_automatica",
  "em_avaliacao",
  "gargalo",
  // Os oito que dizem "ainda não dá para afirmar". Nenhum é erro.
  "em_aprendizado",
  "sem_base",
  "sem_dado",
  "sem_gasto",
  "sem_alvo",
  "sem_medicao",
  "medicao_nao_verificada",
  "sem_comparacao",
] as const;

export type Nivel = (typeof NIVEIS)[number];

/**
 * O slug está no vocabulário que conhecemos?
 *
 * **`false` não autoriza esconder a frase.** Ver o bloco de `NIVEIS`.
 */
export function ehNivel(v: unknown): v is Nivel {
  return typeof v === "string" && (NIVEIS as readonly string[]).includes(v);
}
