/** Recorte local de links públicos observados em 26/10/2026. Não são peças da V2G. */
export const REFERENCIAS_BARBEARIA_PILOTO = [
  { id: "700155112131034", inicioExibido: "2025-08-06" },
  { id: "1077371334754860", inicioExibido: "2026-09-05" },
  { id: "28357550183861540", inicioExibido: "2026-09-09" },
  { id: "1960166948294064", inicioExibido: "2026-09-30" },
  { id: "1862469011406661", inicioExibido: "2026-10-07" },
  { id: "1637507581144329", inicioExibido: "2026-10-07" },
  { id: "1005062889271219", inicioExibido: "2026-10-07" },
  { id: "1321900363242819", inicioExibido: "2026-10-09" },
  { id: "1649312520268945", inicioExibido: "2026-10-14" },
  { id: "1120124473885575", inicioExibido: "2026-10-08" },
] as const;

export const URL_BIBLIOTECA = "https://www.facebook.com/ads/library/?id=";

export function idPublicoDeAnuncioValido(id: unknown): id is string {
  return typeof id === "string" && /^\d{10,20}$/.test(id);
}

export function referenciaDaBiblioteca(id: unknown) {
  return typeof id === "string" ? REFERENCIAS_BARBEARIA_PILOTO.find((r) => r.id === id) ?? null : null;
}

export function ramoCompativelComBarbearia(ramo: unknown): boolean {
  return typeof ramo === "string" && /\bbarbearia\b/i.test(ramo.normalize("NFKC"));
}
