import { pilotoQaHabilitado } from "../piloto-qa/acesso";

type ConfiguracaoAgencia = {
  flag?: string;
  supabaseUrl?: string;
  ambiente?: string;
  pilotoQa?: string;
};

/** Apresentação apenas: não libera negócio, pagamento, papel ou conexão Meta. */
export function agenciaHabilitada(config: ConfiguracaoAgencia = {
  flag: process.env.V2G_AGENCY_PORTFOLIO_ENABLED,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  ambiente: process.env.VERCEL_ENV,
  pilotoQa: process.env.V2G_QA_PILOT_ACCESS_ENABLED,
}): boolean {
  if (pilotoQaHabilitado({ flag: config.pilotoQa, supabaseUrl: config.supabaseUrl })) return true;
  if (config.flag !== "true" || config.ambiente !== "production" || !config.supabaseUrl) return false;
  try {
    const url = new URL(config.supabaseUrl);
    return url.protocol === "https:" && url.hostname === "ushccxpoxjikzqnwhgfd.supabase.co"
      && !url.username && !url.password && !url.port && url.pathname === "/" && !url.search && !url.hash;
  } catch { return false; }
}
