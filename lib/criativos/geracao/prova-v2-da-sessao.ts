import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { ramoCompativelComBarbearia } from "@/lib/jev/catalogo-barbearia";
import { hashDoPedido, type PedidoDeImagem } from "../pedido-imagem";
import { modoGeracaoNoApp } from "./configuracao-app";
import { provaContextoV2Valida, type ProvaContextoV2 } from "./contrato-fila";
import { aprovacaoPersistidaConfere, referenciaPersistidaConfere, catalogoPersistidoConfere,
  hashRegistroContexto, hashAprovacoesPersistidas } from "./contexto-referencia-publica";

const APROVACAO = "id, business_id, authorized_by, approved_by, approved_at, expires_at, revoked_at, created_at, version, manifest, manifest_sha256";
const CATALOGO = "public_reference_id, version, manifest, manifest_sha256, human_state, reviewed_by, reviewed_at, valid_until, revoked_at, created_at";

/** Expectativa SELECT-only para conferir o DTO do backend, nunca para conceder execução.
 * O pedido veio do banco da sessão; formulário não fornece hash/proof/consentimento.
 * Backend é autoridade e relê fontes antes de enfileirar, executar e servir o arquivo.
 */
export async function carregarProvaV2DaSessao(pedido: PedidoDeImagem): Promise<ProvaContextoV2 | null> {
  try {
    if (pedido.payload.versao !== 2 || pedido.content_hash !== hashDoPedido(pedido.payload)
      || pedido.status !== "awaiting_configuration") return null;
    const supa = await createClient();
    const { data: { user }, error } = await supa.auth.getUser();
    const ativo = await negocioAtivoDaSessao();
    if (error || !user || pedido.requested_by !== user.id || ativo.status !== "selecionado"
      || ativo.negocio.id !== pedido.business_id) return null;
    const b = await supa.from("businesses").select("id, profile_id, niche, onboarding")
      .eq("id", pedido.business_id).eq("profile_id", user.id).maybeSingle();
    if (b.error || b.data?.id !== pedido.business_id || b.data.profile_id !== user.id
      || !ramoCompativelComBarbearia(b.data.niche)) return null;
    // As fontes não têm SELECT de cliente: admin só depois de verificar sessão/dono sob RLS.
    const admin = createAdminClient();
    const contexto = await admin.from("creative_generation_context_approvals")
      .select(`${APROVACAO}, request_id, requested_by, brand_approval_id, reference_approval_id`)
      .eq("business_id", pedido.business_id).eq("request_id", pedido.id)
      .eq("requested_by", user.id).eq("authorized_by", user.id).maybeSingle();
    const c = contexto.data;
    if (contexto.error || !c || c.request_id !== pedido.id || c.requested_by !== user.id) return null;
    const [marca, referencia, logo] = await Promise.all([
      admin.from("creative_generation_brand_approvals").select(APROVACAO)
        .eq("id", c.brand_approval_id).eq("business_id", pedido.business_id).eq("authorized_by", user.id).maybeSingle(),
      admin.from("creative_generation_reference_approvals").select(`${APROVACAO}, public_reference_id, catalog_version, catalog_sha256`)
        .eq("id", c.reference_approval_id).eq("business_id", pedido.business_id).eq("authorized_by", user.id).maybeSingle(),
      supa.from("creatives").select("id, business_id, storage_path, copy, uso, arquivado_em, created_at")
        .eq("business_id", pedido.business_id).eq("uso", "logo").is("arquivado_em", null)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (marca.error || referencia.error || logo.error || !marca.data || !referencia.data || !logo.data) return null;
    const m = marca.data, f = referencia.data, vigente = logo.data, agora = new Date().toISOString();
    if (![c, m, f].every(r => aprovacaoPersistidaConfere(r, pedido.business_id, user.id, agora))
      || m.id !== c.brand_approval_id || f.id !== c.reference_approval_id
      || !referenciaPersistidaConfere(f, pedido.business_id, user.id, agora)
      || f.public_reference_id !== pedido.payload.referenciaId) return null;
    const catalogo = await admin.from("creative_reference_catalog").select(CATALOGO)
      .eq("public_reference_id", f.public_reference_id).order("version", { ascending: false }).limit(1).maybeSingle();
    const q = catalogo.data;
    if (catalogo.error || !q || !catalogoPersistidoConfere(q, agora)
      || q.public_reference_id !== f.public_reference_id || q.version !== f.catalog_version
      || q.manifest_sha256 !== f.catalog_sha256) return null;
    const marcaAprovada = m.manifest, ctx = c.manifest, material = marcaAprovada.logo;
    const origem = vigente.copy?.origemMaterial, marcaAtual = b.data.onboarding?.marca;
    const destino = modoGeracaoNoApp() === "fila_ficticia" ? "mock" : "gpt-image-2";
    if (marcaAprovada.versao !== 1 || marcaAprovada.request_id !== pedido.id || marcaAprovada.ia_autorizada !== true
      || marcaAprovada.uso_autorizado !== "geracao_original_do_cliente" || marcaAprovada.destino_autorizado !== destino
      || ctx.versao !== 2 || ctx.nicho_id !== "barbearia" || ctx.destino_autorizado !== destino
      || ctx.custo_autorizado !== true || ctx.quantidade_imagens !== 1
      || !marcaAtual || marcaAtual.aparenciaNaoSei !== false
      || hashRegistroContexto(marcaAtual) !== marcaAprovada.onboarding_marca_sha256
      || hashRegistroContexto(marcaAtual.coresConfirmadas) !== hashRegistroContexto(marcaAprovada.cores_confirmadas)
      || vigente.id !== material?.id || vigente.business_id !== pedido.business_id || vigente.uso !== "logo"
      || vigente.arquivado_em !== null || vigente.storage_path !== material.caminho
      || material.business_id !== pedido.business_id || material.uso !== "logo" || material.permitido !== true
      || material.autorizacao_id !== m.id || material.revisado_por !== m.approved_by
      || !origem || origem.versao !== 1 || origem.origem !== "upload_cliente"
      || origem.finalidadeDoUpload !== "identidade_visual" || origem.sha256 !== material.sha256
      || !Number.isFinite(Date.parse(origem.registradoEm)) || Date.parse(origem.registradoEm) > Date.parse(m.approved_at)
      || hashRegistroContexto(origem) !== marcaAprovada.proveniencia_upload_sha256) return null;
    const prova: ProvaContextoV2 = { version: 2, reference_id: f.public_reference_id, brand_material_id: vigente.id,
      brand_sha256: origem.sha256, approvals_sha256: hashAprovacoesPersistidas([c, m, f]),
      catalog_version: q.version, catalog_sha256: q.manifest_sha256 };
    return provaContextoV2Valida(prova) ? prova : null;
  } catch { return null; }
}
