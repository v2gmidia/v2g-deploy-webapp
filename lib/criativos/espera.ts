import { TETO_DA_ESPERA_MS } from "./limites.mjs";

/** A espera termina no navegador; a Server Action pode continuar no servidor. */
export class EsperaEstourou extends Error {}

export function comTetoDeEspera<T>(promessa: Promise<T>): Promise<T> {
  const sinal = AbortSignal.timeout(TETO_DA_ESPERA_MS);
  return Promise.race([
    promessa,
    new Promise<never>((_, rejeitar) => {
      sinal.addEventListener("abort", () => rejeitar(new EsperaEstourou()), { once: true });
    }),
  ]);
}
