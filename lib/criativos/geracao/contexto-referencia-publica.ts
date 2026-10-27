import "server-only";
import { createHash } from "node:crypto";
import { hashDoPedido, type PedidoDeImagem } from "../pedido-imagem";
import { conferirBaseContexto, conferirMaterialContexto, temTexto, uuidContexto,
  type ManifestoBackend } from "./triangulo-contexto";

export interface ReferenciaPublicaBackend {
  id_publico: string; origem: "meta_ads_library"; url: string; nicho_id: "barbearia";
  catalogo_versao: string; classificacao_jev: "servico_barbearia"; pertinencia_jev_percentual: string;
  jev_versao: string | null; anunciante: string; data_observada: string; observado_em: string | null;
  direcao_visual_abstrata: string; condicao_de_uso: string;
  uso: "inspiracao_abstrata_sem_reproducao"; permite_copiar: false;
}
/** Formato já definido por 07/08. Este módulo só lê; não cria consentimento. */
export interface AprovacaoPersistida<T> {
  id: string; business_id: string; authorized_by: string; approved_by: string;
  approved_at: string; expires_at: string; revoked_at: string | null; created_at: string;
  version: number; manifest: T; manifest_sha256: string;
}
export type PermissaoReferencia = Pick<ReferenciaPublicaBackend, "condicao_de_uso" | "uso" | "permite_copiar">;
export type ReferenciaPersistida = AprovacaoPersistida<PermissaoReferencia> & {
  public_reference_id: string; catalog_version: number; catalog_sha256: string;
};
export interface EntradaCatalogo {
  id_publico: string; origem: "meta_ads_library"; url: string; anunciante: string;
  data_observada: string; observado_em: string | null; inicio_exibido: string | null;
  situacao_exibida: "ativo" | "inativo" | "desconhecido"; midia_observada: "imagem" | "video" | "desconhecida";
  fonte_coleta: "biblioteca_meta_interface"; coleta_sha256: string; jev_sha256: string;
  nicho_id: "barbearia"; catalogo_versao: string;
  classificacao_jev: "servico_barbearia" | "fornecedor_barbearia" | "outro" | "indeterminado";
  confianca_jev: string; jev_versao: string | null; direcao_visual_abstrata: string | null;
}
export interface RegistroCatalogo {
  public_reference_id: string; version: number; manifest: EntradaCatalogo; manifest_sha256: string;
  human_state: "pending" | "reviewed" | "rejected" | "revoked"; reviewed_by: string | null;
  reviewed_at: string | null; valid_until: string | null; revoked_at: string | null; created_at: string;
}
type Material = ManifestoBackend["materiais"][number];
export interface MarcaPersistida {
  versao: 1; request_id: string; cores_confirmadas: string[]; onboarding_marca_sha256: string;
  proveniencia_upload_sha256: string; logo: Material; ia_autorizada: true;
  uso_autorizado: "geracao_original_do_cliente"; destino_autorizado: "gpt-image-2";
}
export interface ContextoPersistido {
  versao: 2; nicho_id: "barbearia"; central: ManifestoBackend["central"]; nicho: ManifestoBackend["nicho"];
  central_sha256: string; nicho_sha256: string; destino_autorizado: "gpt-image-2"; politica_versao: string;
  autorizacao_custo_id: string; custo_autorizado: true; quantidade_imagens: 1;
  estimativa_usd: string; reserva_usd: string; limite_usd: string;
}
export type ContextoAprovacaoPersistida = AprovacaoPersistida<ContextoPersistido> & {
  request_id: string; requested_by: string; brand_approval_id: string; reference_approval_id: string;
};
export interface EvidenciasBackend {
  contexto_id: string; contexto_versao: number; contexto_sha256: string;
  marca_id: string; marca_versao: number; marca_sha256: string;
  referencia_id: string; referencia_versao: number; referencia_sha256: string;
  autorizado_por: string; contexto_revisado_por: string; marca_revisada_por: string;
  referencia_revisada_por: string; aprovacoes_sha256: string;
  catalogo_versao: number; catalogo_sha256: string; catalogo_revisado_por: string; catalogo_registro_sha256: string;
}
export interface ManifestoReferenciaPublica extends ManifestoBackend {
  versao_contexto: 2; referencia_publica: ReferenciaPublicaBackend; evidencias_persistidas: EvidenciasBackend;
  autorizacao_custo_id: string;
}
export interface EntradaContextoReferencia {
  pedido: PedidoDeImagem; profileId: string; agora: string;
  onboardingMarca: { aparenciaNaoSei: false; coresConfirmadas: string[] };
  logoVigente: { id: string; business_id: string; storage_path: string; uso: "logo"; arquivado_em: null;
    copy: { origemMaterial: { versao: 1; origem: "upload_cliente"; sha256: string;
      registradoEm: string; finalidadeDoUpload: "identidade_visual" } } };
  contexto: ContextoAprovacaoPersistida; marca: AprovacaoPersistida<MarcaPersistida>; referencia: ReferenciaPersistida;
  catalogo: RegistroCatalogo; versaoCatalogoVigente: number;
}
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const HASH = /^[a-f0-9]{64}$/;
const CAMPOS_APROVACAO = ["id", "business_id", "authorized_by", "approved_by", "approved_at", "expires_at",
  "revoked_at", "created_at", "version", "manifest", "manifest_sha256"];
const camposExatos = (v: object, campos: string[]) => Object.keys(v).length === campos.length && campos.every(k => Object.hasOwn(v, k));

/** Compatível com json.dumps(sort_keys=True, ensure_ascii=False), sem floats ambíguos. */
export function canonicoPersistido(v: unknown): string {
  if (v === null || typeof v === "string" || typeof v === "boolean") return JSON.stringify(v);
  if (typeof v === "number" && Number.isSafeInteger(v)) return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonicoPersistido).join(",")}]`;
  if (v && typeof v === "object") {
    const comparar = (a: string, b: string) => {
      const x = Array.from(a, c => c.codePointAt(0)!), y = Array.from(b, c => c.codePointAt(0)!);
      for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i]! - y[i]!;
      return x.length - y.length;
    };
    return `{${Object.keys(v).sort(comparar).map(k => `${JSON.stringify(k)}:${canonicoPersistido((v as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  throw Error("json_persistido_invalido");
}
export const hashRegistroContexto = (v: unknown) => hash(canonicoPersistido(v));

// PostgreSQL UTC -> mesmo formato datetime do model_dump(mode="json") do Pydantic.
function dataPython(v: string): string {
  const m = typeof v === "string" && /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(?:Z|\+00:00)$/.exec(v);
  if (!m || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 19) !== m[1]) throw Error("data_invalida");
  const fracao = (m[2] ?? "").padEnd(6, "0");
  return `${m[1]}${/^0+$/.test(fracao) ? "" : `.${fracao}`}Z`;
}
function modeloAprovacao(r: AprovacaoPersistida<unknown>) {
  return Object.fromEntries(CAMPOS_APROVACAO.map(k => [k, ["approved_at", "expires_at", "created_at"].includes(k)
    ? dataPython(r[k as "approved_at"]) : r[k as keyof typeof r]]));
}
export function hashAprovacoesPersistidas(registros: AprovacaoPersistida<unknown>[]): string {
  return hashRegistroContexto(registros.map(modeloAprovacao));
}
export function aprovacaoPersistidaConfere(r: AprovacaoPersistida<unknown>, businessId: string, profileId: string, agora: string): boolean {
  try {
    const t = Date.parse(agora);
    return Boolean(r && Number.isFinite(t) && uuidContexto(r.id) && uuidContexto(r.approved_by)
      && r.approved_by !== "00000000-0000-0000-0000-000000000000"
      && r.business_id === businessId && r.authorized_by === profileId && r.revoked_at === null
      && Number.isSafeInteger(r.version) && r.version >= 1
      && Date.parse(dataPython(r.approved_at)) <= t && t < Date.parse(dataPython(r.expires_at))
      && Date.parse(dataPython(r.created_at)) <= t && HASH.test(r.manifest_sha256)
      && hashRegistroContexto(r.manifest) === r.manifest_sha256);
  } catch { return false; }
}
export function referenciaPersistidaConfere(r: ReferenciaPersistida, businessId: string, profileId: string, agora: string): boolean {
  try {
    const f = r.manifest;
    return aprovacaoPersistidaConfere(r, businessId, profileId, agora)
      && camposExatos(f, ["condicao_de_uso", "uso", "permite_copiar"])
      && /^\d{10,20}$/.test(r.public_reference_id) && Number.isSafeInteger(r.catalog_version) && r.catalog_version >= 1
      && HASH.test(r.catalog_sha256)
      && temTexto(f.condicao_de_uso, 1000) && f.condicao_de_uso.trim().length >= 10
      && f.uso === "inspiracao_abstrata_sem_reproducao" && f.permite_copiar === false;
  } catch { return false; }
}

function percentual(confianca: string): string {
  if (!/^(?:0(?:\.\d{1,18})?|1(?:\.0{1,18})?)$/.test(confianca)) throw Error("confianca_invalida");
  const [inteiro, decimal = ""] = confianca.split(".");
  const escala = 10n ** BigInt(decimal.length), n = BigInt(`${inteiro}${decimal}`) * 100n;
  if (n < 80n * escala || n > 100n * escala) throw Error("pertinencia_insuficiente");
  return decimal.length ? `${n / escala}.${(n % escala).toString().padStart(decimal.length, "0")}` : n.toString();
}
function dataCivil(v: string): boolean {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
}
function manifestCatalogo(r: RegistroCatalogo): EntradaCatalogo {
  return { ...r.manifest, observado_em: r.manifest.observado_em === null ? null : dataPython(r.manifest.observado_em) };
}
export function catalogoPersistidoConfere(r: RegistroCatalogo, agora: string): boolean {
  try {
    const m = r.manifest, t = Date.parse(agora);
    return Number.isFinite(t) && Number.isSafeInteger(r.version) && r.version >= 1
      && /^\d{10,20}$/.test(r.public_reference_id) && r.public_reference_id === m.id_publico
      && r.human_state === "reviewed" && r.revoked_at === null && uuidContexto(r.reviewed_by)
      && Date.parse(dataPython(r.reviewed_at!)) <= t && t < Date.parse(dataPython(r.valid_until!))
      && Date.parse(dataPython(r.created_at)) <= t
      && camposExatos(m, ["id_publico", "origem", "url", "anunciante", "data_observada", "observado_em", "inicio_exibido", "situacao_exibida", "midia_observada", "fonte_coleta", "coleta_sha256", "jev_sha256", "nicho_id", "catalogo_versao", "classificacao_jev", "confianca_jev", "jev_versao", "direcao_visual_abstrata"])
      && m.origem === "meta_ads_library" && m.url === `https://www.facebook.com/ads/library/?id=${m.id_publico}`
      && temTexto(m.anunciante, 120) && dataCivil(m.data_observada) && m.data_observada <= r.reviewed_at!.slice(0, 10)
      && (m.observado_em === null || Date.parse(dataPython(m.observado_em)) <= Date.parse(r.reviewed_at!))
      && (m.inicio_exibido === null || dataCivil(m.inicio_exibido))
      && m.situacao_exibida === "ativo" && m.midia_observada === "imagem" && m.fonte_coleta === "biblioteca_meta_interface"
      && HASH.test(m.coleta_sha256) && HASH.test(m.jev_sha256) && m.nicho_id === "barbearia"
      && temTexto(m.catalogo_versao, 100) && m.classificacao_jev === "servico_barbearia" && Boolean(percentual(m.confianca_jev))
      && (m.jev_versao === null || temTexto(m.jev_versao, 100))
      && temTexto(m.direcao_visual_abstrata, 1200) && m.direcao_visual_abstrata.trim().length >= 10
      && r.manifest_sha256 === hashRegistroContexto(manifestCatalogo(r));
  } catch { return false; }
}

/** Espelho de conferência do loader 07/08, nunca substituto da autorização persistida.
 * Sem SQL/escrita, download, reserva, n8n ou provedor. Não aceitar esta entrada por HTTP.
 * Backend continua relendo aprovadores/revogação/proveniência antes de executar e servir.
 */
export function prepararContextoReferenciaPublica(e: EntradaContextoReferencia):
  { ok: true; manifesto: ManifestoReferenciaPublica; hash: string } | { ok: false; pendencias: string[] } {
  try {
    const p = e.pedido, c = e.contexto, m = e.marca, f = e.referencia;
    if (!uuidContexto(e.profileId) || !uuidContexto(p.business_id) || !uuidContexto(p.id)
      || p.requested_by !== e.profileId || p.payload.versao !== 2 || p.content_hash !== hashDoPedido(p.payload)
      || p.status !== "awaiting_configuration" || ![c, m, f].every(r => aprovacaoPersistidaConfere(r, p.business_id, e.profileId, e.agora))
      || !referenciaPersistidaConfere(f, p.business_id, e.profileId, e.agora)
      || !catalogoPersistidoConfere(e.catalogo, e.agora) || e.catalogo.version !== e.versaoCatalogoVigente
      || e.catalogo.version !== f.catalog_version || e.catalogo.manifest_sha256 !== f.catalog_sha256
      || e.catalogo.public_reference_id !== p.payload.referenciaId
      || c.request_id !== p.id || c.requested_by !== e.profileId || c.brand_approval_id !== m.id
      || c.reference_approval_id !== f.id || f.public_reference_id !== p.payload.referenciaId)
      return { ok: false, pendencias: ["pedido_ou_aprovacoes_persistidas_divergentes"] };
    const marca = m.manifest, ctx = c.manifest, logo = marca.logo, vigente = e.logoVigente, origem = vigente.copy.origemMaterial;
    if (!camposExatos(marca, ["versao", "request_id", "cores_confirmadas", "onboarding_marca_sha256", "proveniencia_upload_sha256", "logo", "ia_autorizada", "uso_autorizado", "destino_autorizado"])
      || !camposExatos(ctx, ["versao", "nicho_id", "central", "nicho", "central_sha256", "nicho_sha256", "destino_autorizado", "politica_versao", "autorizacao_custo_id", "custo_autorizado", "quantidade_imagens", "estimativa_usd", "reserva_usd", "limite_usd"])
      || marca.versao !== 1 || marca.request_id !== p.id || marca.ia_autorizada !== true
      || marca.uso_autorizado !== "geracao_original_do_cliente" || marca.destino_autorizado !== "gpt-image-2"
      || ctx.versao !== 2 || ctx.nicho_id !== "barbearia" || ctx.destino_autorizado !== "gpt-image-2"
      || ctx.custo_autorizado !== true || ctx.quantidade_imagens !== 1 || !uuidContexto(ctx.autorizacao_custo_id)
      || marca.onboarding_marca_sha256 !== hashRegistroContexto(e.onboardingMarca) || e.onboardingMarca.aparenciaNaoSei !== false
      || canonicoPersistido(marca.cores_confirmadas) !== canonicoPersistido(e.onboardingMarca.coresConfirmadas)
      || vigente.id !== logo.id || vigente.business_id !== p.business_id || vigente.uso !== "logo" || vigente.arquivado_em !== null
      || vigente.storage_path !== logo.caminho || logo.uso !== "logo" || logo.autorizacao_id !== m.id
      || logo.revisado_por !== m.approved_by || origem.versao !== 1 || origem.origem !== "upload_cliente"
      || origem.finalidadeDoUpload !== "identidade_visual" || origem.sha256 !== logo.sha256
      || marca.proveniencia_upload_sha256 !== hashRegistroContexto(origem)
      || Date.parse(dataPython(origem.registradoEm)) > Date.parse(m.approved_at)
      || ctx.central_sha256 !== hash(ctx.central.conteudo) || ctx.nicho_sha256 !== hash(ctx.nicho.conteudo))
      return { ok: false, pendencias: ["marca_documentos_ou_custo_nao_autorizados"] };
    const base = { pedido: p, profileId: e.profileId, agora: e.agora, nichoId: "barbearia", nichoConfirmado: true,
      cores: { businessId: p.business_id, valores: marca.cores_confirmadas, origem: "onboarding.marca", confirmadoEm: m.approved_at },
      documentos: { central: { tipo: "central" as const, versao: ctx.central.versao, conteudo: ctx.central.conteudo,
        nichoId: ctx.central.nicho_id, revisadoPor: ctx.central.revisado_por, revisadoEm: ctx.central.revisado_em },
      nicho: { tipo: "nicho" as const, versao: ctx.nicho.versao, conteudo: ctx.nicho.conteudo,
        nichoId: ctx.nicho.nicho_id, revisadoPor: ctx.nicho.revisado_por, revisadoEm: ctx.nicho.revisado_em } },
      escopoDocumentos: { central: ctx.central.business_id, nicho: ctx.nicho.business_id },
      autorizacaoPiloto: { id: ctx.autorizacao_custo_id, businessId: p.business_id, requestId: p.id, por: c.approved_by,
        em: c.approved_at, destino: "gpt-image-2" as const, quantidade: 1 as const,
        estimativaUsd: ctx.estimativa_usd, reservaUsd: ctx.reserva_usd, limiteUsd: ctx.limite_usd }, politicaVersao: ctx.politica_versao };
    const faltas = conferirBaseContexto(base);
    if (!conferirMaterialContexto({ id: logo.id, businessId: logo.business_id, classe: "identidade_cliente", nichoId: null,
      caminho: logo.caminho, sha256: logo.sha256, versao: String(m.version), fonte: logo.fonte, observadoEm: logo.observado_em,
      condicaoDeUso: logo.condicao_de_uso, revisadoPor: logo.revisado_por, revisadoEm: m.approved_at,
      aprovacao: { id: m.id, businessId: p.business_id, requestId: p.id, materialId: logo.id, sha256: logo.sha256,
        finalidade: "gerar_imagem", destino: "gpt-image-2", por: m.approved_by, em: m.approved_at } }, base)) faltas.add("logo_autorizado_divergente");
    if (faltas.size) return { ok: false, pendencias: [...faltas] };
    const manifesto: ManifestoReferenciaPublica = {
      versao_contexto: 2, business_id: p.business_id, request_id: p.id, nicho_id: "barbearia", nicho_confirmado: true,
      autorizacao_custo_id: ctx.autorizacao_custo_id,
      central: { ...ctx.central, revisado_em: dataPython(ctx.central.revisado_em) },
      nicho: { ...ctx.nicho, revisado_em: dataPython(ctx.nicho.revisado_em) },
      cores: marca.cores_confirmadas.join(", "), usar_fachada: false,
      materiais: [{ ...logo, observado_em: dataPython(logo.observado_em) }],
      referencia_publica: { ...f.manifest, id_publico: e.catalogo.manifest.id_publico, origem: "meta_ads_library",
        url: e.catalogo.manifest.url, nicho_id: "barbearia", catalogo_versao: e.catalogo.manifest.catalogo_versao,
        classificacao_jev: "servico_barbearia", pertinencia_jev_percentual: percentual(e.catalogo.manifest.confianca_jev),
        jev_versao: e.catalogo.manifest.jev_versao, anunciante: e.catalogo.manifest.anunciante,
        data_observada: e.catalogo.manifest.data_observada, observado_em: manifestCatalogo(e.catalogo).observado_em,
        direcao_visual_abstrata: e.catalogo.manifest.direcao_visual_abstrata! },
      evidencias_persistidas: { contexto_id: c.id, contexto_versao: c.version, contexto_sha256: c.manifest_sha256,
        marca_id: m.id, marca_versao: m.version, marca_sha256: m.manifest_sha256,
        referencia_id: f.id, referencia_versao: f.version, referencia_sha256: f.manifest_sha256,
        autorizado_por: e.profileId, contexto_revisado_por: c.approved_by, marca_revisada_por: m.approved_by,
        referencia_revisada_por: f.approved_by, aprovacoes_sha256: hashAprovacoesPersistidas([c, m, f]),
        catalogo_versao: e.catalogo.version, catalogo_sha256: e.catalogo.manifest_sha256, catalogo_revisado_por: e.catalogo.reviewed_by!,
        catalogo_registro_sha256: hashRegistroContexto({ ...e.catalogo, manifest: manifestCatalogo(e.catalogo),
          reviewed_at: dataPython(e.catalogo.reviewed_at!), valid_until: dataPython(e.catalogo.valid_until!), created_at: dataPython(e.catalogo.created_at) }) },
      destino_autorizado: "gpt-image-2", politica_versao: ctx.politica_versao,
      estimativa_usd: ctx.estimativa_usd, reserva_usd: ctx.reserva_usd, limite_usd: ctx.limite_usd,
    };
    const serializado = canonicoPersistido(manifesto);
    if (Buffer.byteLength(serializado) > 65536) return { ok: false, pendencias: ["contexto_excessivo"] };
    return { ok: true, manifesto: JSON.parse(serializado), hash: hash(serializado) };
  } catch { return { ok: false, pendencias: ["fontes_persistidas_invalidas"] }; }
}
