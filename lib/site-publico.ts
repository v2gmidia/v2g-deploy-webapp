/** Origem única da LP: desenvolvimento local e endereço público vigente. */
export const SITE_PUBLICO_ORIGEM = process.env.NODE_ENV === "development"
  ? "http://localhost:5173"
  : "https://www.v2gmidia.com.br";
