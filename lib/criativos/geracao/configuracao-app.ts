import "server-only";

/** Sem modo explícito de laboratório, a UI só consulta a execução real existente.
 * Nenhum valor desta configuração é autorização de gasto ou chamada ao provedor.
 */
export function modoGeracaoNoApp(): "real_leitura" | "fila_ficticia" | "real_dispatch" {
  if (process.env.V2G_CREATIVE_APP_MODE === "real_dispatch") return "real_dispatch";
  return process.env.V2G_CREATIVE_APP_MODE === "fila_ficticia" ? "fila_ficticia" : "real_leitura";
}
export function submissaoRealHabilitada(): boolean {
  return modoGeracaoNoApp() === "real_dispatch" && process.env.V2G_CREATIVE_REAL_SUBMISSION_ENABLED === "true";
}
