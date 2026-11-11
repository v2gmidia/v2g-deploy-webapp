import { coresDaLogo, type CorDaLogo } from "./cores-da-logo";

type LogoSalvo = { url: string | null; caminho: string };
type Resultado = { ok: true; cores: CorDaLogo[] } | { ok: false };
const TETO_BYTES = 9 * 1024 * 1024;

/** Leitura do arquivo já autorizado pela página; nunca envia material para IA. */
export async function coresDoLogoSalvo(
  logo: LogoSalvo,
  businessId: string,
  signal: AbortSignal,
  portas = { buscar: fetch, extrair: coresDaLogo },
): Promise<Resultado> {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(businessId) || !logo.url
      || !logo.caminho.startsWith(`identidade/${businessId}/`)
      || logo.caminho.split("/").some(parte => parte === ".." || parte === ".")) return { ok: false };
    const url = new URL(logo.url);
    if (url.protocol !== "https:" || url.hostname !== "zskpijnqgkqwxksqmzmf.supabase.co"
      || url.username || url.password || url.port
      || decodeURIComponent(url.pathname) !== `/storage/v1/object/sign/v2g-midia/${logo.caminho}`) return { ok: false };
    if (signal.aborted) return { ok: false };
    const resposta = await portas.buscar(url.href, {
      signal, credentials: "omit", cache: "no-store", redirect: "error",
    });
    const tipo = resposta.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!resposta.ok || !["image/png", "image/jpeg", "image/webp", "image/avif"].includes(tipo)
      || Number(resposta.headers.get("content-length")) > TETO_BYTES) return { ok: false };
    const imagem = await resposta.blob();
    if (signal.aborted || imagem.size === 0 || imagem.size > TETO_BYTES) return { ok: false };
    const cores = await portas.extrair(new File([imagem], "logo-salvo", { type: tipo }), 6);
    return signal.aborted ? { ok: false } : { ok: true, cores };
  } catch {
    return { ok: false };
  }
}
