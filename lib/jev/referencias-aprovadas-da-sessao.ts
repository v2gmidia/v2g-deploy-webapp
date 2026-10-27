import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { ramoCompativelComBarbearia } from "./catalogo-barbearia";
import { catalogoPersistidoConfere, type RegistroCatalogo } from "@/lib/criativos/geracao/contexto-referencia-publica";

export interface ReferenciaRevisadaParaApp {
  id: string; versao: number; idPublico: string; url: string;
  observadoEm: string; direcaoAbstrata: string;
}
export type CatalogoRevisado = { estado: "disponivel"; referencias: ReferenciaRevisadaParaApp[]; truncado: boolean }
  | { estado: "desligado" | "acesso_recusado" | "indisponivel"; referencias: []; truncado: false };
const COLUNAS = "public_reference_id, version, manifest, manifest_sha256, human_state, reviewed_by, reviewed_at, valid_until, revoked_at, created_at";

/** Preparação SELECT-only do catálogo mínimo já proposto por 07/08. Não está ligada à UI.
 * O catálogo estático continua descoberta/intenção, nunca aprovação para gerar.
 * Catálogo é compartilhado, sem material/dado de cliente. Admin só após conferir sessão/negócio.
 * Revisão do catálogo não autoriza uso por IA no negócio; aprovação específica fica separada.
 * Não cria tabela, aprovação, bucket ou arquivo de anúncio. Falha não vira catálogo vazio.
 */
export async function carregarReferenciasAprovadasDaSessao(businessId: string, agora = new Date().toISOString()): Promise<CatalogoRevisado> {
  const fechado = (estado: "desligado" | "acesso_recusado" | "indisponivel"): CatalogoRevisado => ({ estado, referencias: [], truncado: false });
  if (process.env.V2G_CREATIVE_REFERENCE_PILOT_ENABLED !== "true") return fechado("desligado");
  try {
    const supa = await createClient();
    const { data: { user }, error } = await supa.auth.getUser();
    const ativo = await negocioAtivoDaSessao();
    if (error || !user || ativo.status !== "selecionado" || ativo.negocio.id !== businessId) return fechado("acesso_recusado");
    const negocio = await supa.from("businesses").select("id, profile_id, niche")
      .eq("id", businessId).eq("profile_id", user.id).maybeSingle();
    if (negocio.error) return fechado("indisponivel");
    if (!negocio.data || negocio.data.id !== businessId || negocio.data.profile_id !== user.id
      || !ramoCompativelComBarbearia(negocio.data.niche)) return fechado("acesso_recusado");
    const r = await createAdminClient().from("creative_reference_catalog").select(COLUNAS)
      .order("version", { ascending: false }).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(41);
    if (r.error || !Array.isArray(r.data)) return fechado("indisponivel");
    const referencias: ReferenciaRevisadaParaApp[] = [], vistos = new Set<string>();
    for (const linha of r.data.slice(0, 40)) {
      // Nunca mostrar dado cruzado nem esconder resposta malformada como ausência de referência.
      if (typeof linha?.public_reference_id !== "string" || !/^\d{10,20}$/.test(linha.public_reference_id)) return fechado("indisponivel");
      const id = linha.public_reference_id;
      if (vistos.has(id)) continue;
      vistos.add(id); // Revisão revogada/expirada mais nova não ressuscita versão anterior.
      if (!catalogoPersistidoConfere(linha as RegistroCatalogo, agora)) continue;
      referencias.push({ id: `${id}:${linha.version}`, versao: linha.version, idPublico: id, url: linha.manifest.url,
        observadoEm: linha.manifest.data_observada, direcaoAbstrata: linha.manifest.direcao_visual_abstrata });
    }
    return { estado: "disponivel", referencias, truncado: r.data.length > 40 };
  } catch { return fechado("indisponivel"); }
}
