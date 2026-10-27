import "server-only";
import { createHash } from "node:crypto";
import { hashDoPedido, type PedidoDeImagem } from "../pedido-imagem";
import type { DocumentoDeRegraVisual } from "../documentos-geracao";
import { UUID_GERACAO } from "./contrato-fila";
import { canonico } from "./contexto";
import { diaEmSaoPaulo } from "@/lib/dia-seguinte/dia";

type Origem = "identidade_cliente" | "anuncios_nicho";
type Aprovacao = { id: string; businessId: string; requestId: string; materialId: string;
  sha256: string; finalidade: "gerar_imagem"; destino: "gpt-image-2"; por: string; em: string };
export interface MaterialDoTriangulo {
  id: string; businessId: string; classe: Origem; nichoId: string | null;
  caminho: string; sha256: string; versao: string; fonte: string; observadoEm: string;
  condicaoDeUso: string; revisadoPor: string; revisadoEm: string;
  aprovacao: Aprovacao | null;
}
export interface EntradaDoTriangulo {
  pedido: PedidoDeImagem; profileId: string; agora: string; nichoId: string; nichoConfirmado: boolean;
  cores: { businessId: string; valores: string[]; origem: string; confirmadoEm: string };
  documentos: { central: DocumentoDeRegraVisual | null; nicho: DocumentoDeRegraVisual | null };
  escopoDocumentos: { central: string | null; nicho: string | null };
  materiais: MaterialDoTriangulo[];
  autorizacaoPiloto: { id: string; businessId: string; requestId: string; por: string; em: string;
    destino: "gpt-image-2"; quantidade: 1; estimativaUsd: string; reservaUsd: string; limiteUsd: string } | null;
  politicaVersao: string;
}
type DocumentoBackend = { versao: string; conteudo: string; revisado_por: string; revisado_em: string;
  business_id: string | null; nicho_id: string | null };
export interface ManifestoBackend {
  business_id: string; request_id: string; nicho_id: string; nicho_confirmado: true;
  central: DocumentoBackend; nicho: DocumentoBackend; cores: string; usar_fachada: false;
  materiais: { id: string; business_id: string; caminho: string; sha256: string; uso: "logo" | "referencia";
    autorizacao_id: string; revisado_por: string; permitido: true; fonte: string; observado_em: string; condicao_de_uso: string }[];
  destino_autorizado: "gpt-image-2"; politica_versao: string; estimativa_usd: string; reserva_usd: string; limite_usd: string;
}
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
const temHash = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const temTexto = (v: unknown, max = 2000): v is string => typeof v === "string" && Boolean(v.trim()) && v.length <= max;
const uuid = (v: unknown): v is string => typeof v === "string" && UUID_GERACAO.test(v) && v === v.toLowerCase();
function data(v: string, agora: string): boolean {
  return typeof v === "string" && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(v)
    && Number.isFinite(Date.parse(v)) && Date.parse(v) <= Date.parse(agora);
}
function usd(v: unknown): bigint | null {
  if (typeof v !== "string" || !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,18})?$/.test(v)) return null;
  const [inteiro = "0", fracao = ""] = v.split(".");
  return BigInt(inteiro) * 10n ** 18n + BigInt(fracao.padEnd(18, "0"));
}
function fonteConfere(m: MaterialDoTriangulo): boolean {
  if (m.classe === "identidade_cliente") return m.fonte === `arquivo_proprio:${m.id}`;
  try {
    const u = new URL(m.fonte);
    if (u.protocol !== "https:" || u.username || u.password || u.port) return false;
    return (u.hostname === "facebook.com" || u.hostname === "www.facebook.com")
      && u.pathname === "/ads/library/" && /^\d{10,20}$/.test(u.searchParams.get("id") ?? "");
  } catch { return false; }
}

/** Montador PURO de entrada do servidor para o ContextoAprovado já existente.
 * Não é loader, assinatura de aprovação, reserva de dinheiro ou autorização de execução.
 * Não recebe FormData/HTTP, não busca Pinterest/Meta, não lê bytes nem chama um modelo.
 * Só conectar após 07/08 fornecer fonte persistente confiável das aprovações.
 */
export function prepararTrianguloDoServidor(e: EntradaDoTriangulo):
  { ok: true; manifesto: ManifestoBackend; hash: string; hashesDocumentos: { central: string; nicho: string } }
  | { ok: false; pendencias: string[] } {
  const faltas = new Set<string>();
  const p = e.pedido;
  if (!uuid(p.id) || !uuid(p.business_id) || !uuid(e.profileId) || p.requested_by !== e.profileId
    || p.status !== "awaiting_configuration" || p.content_hash !== hashDoPedido(p.payload)) faltas.add("pedido_ou_dono_divergente");
  if (!Number.isFinite(Date.parse(e.agora))) faltas.add("data_de_conferencia_invalida");
  if (!e.nichoConfirmado || !temTexto(e.nichoId, 200)) faltas.add("nicho_nao_confirmado");
  const hoje = Number.isFinite(Date.parse(e.agora)) ? diaEmSaoPaulo(new Date(e.agora)) : "";
  const prazo = p.payload.validade;
  if (p.payload.promocao && (!prazo || !/^\d{4}-\d{2}-\d{2}$/.test(prazo)
    || !Number.isFinite(Date.parse(`${prazo}T12:00:00Z`))
    || new Date(`${prazo}T12:00:00Z`).toISOString().slice(0, 10) !== prazo || prazo < hoje)) faltas.add("promocao_vencida_ou_sem_prazo");
  if (e.cores.businessId !== p.business_id || !temTexto(e.cores.origem) || !data(e.cores.confirmadoEm, e.agora)
    || !Array.isArray(e.cores.valores) || e.cores.valores.length < 1 || e.cores.valores.length > 6
    || e.cores.valores.some(c => !/^#[0-9a-fA-F]{6}$/.test(c))) faltas.add("identidade_nao_confirmada");
  for (const tipo of ["central", "nicho"] as const) {
    const d = e.documentos[tipo];
    if (!d || d.tipo !== tipo || !temTexto(d.versao, 120) || !temTexto(d.conteudo, 12000)
      || !temTexto(d.revisadoPor, 200) || !data(d.revisadoEm, e.agora)
      || d.nichoId !== (tipo === "nicho" ? e.nichoId : null)
      || ![null, p.business_id].includes(e.escopoDocumentos[tipo])) faltas.add(`documento_${tipo}_ausente_ou_divergente`);
  }
  for (const classe of ["identidade_cliente", "anuncios_nicho"] as const) {
    if (e.materiais.filter(m => m.classe === classe).length !== 1) faltas.add(`${classe}_ausente_ou_duplicado`);
  }
  if (e.materiais.length !== 2 || new Set(e.materiais.map(m => m.id)).size !== 2
    || new Set(e.materiais.map(m => m.sha256)).size !== 2) faltas.add("materiais_duplicados_ou_excedentes");
  for (const m of e.materiais) {
    const prefixo = `${m.classe === "identidade_cliente" ? "identidade" : "referencias"}/${p.business_id}/`;
    const a = m.aprovacao;
    const relativo = m.caminho.startsWith(prefixo) ? m.caminho.slice(prefixo.length) : "";
    if (!uuid(m.id) || m.businessId !== p.business_id || !temHash(m.sha256) || !temTexto(m.versao, 120)
      || !relativo || /[%\\?#]/.test(relativo) || relativo.split("/").some(s => !s || s === "." || s === "..")
      || !data(m.observadoEm, e.agora) || !data(m.revisadoEm, e.agora) || !temTexto(m.revisadoPor, 200)
      || !temTexto(m.condicaoDeUso) || !fonteConfere(m)
      || m.nichoId !== (m.classe === "identidade_cliente" ? null : e.nichoId)) faltas.add(`material_${m.classe}_invalido`);
    if (!a || !temTexto(a.id, 200) || a.businessId !== p.business_id || a.requestId !== p.id || a.materialId !== m.id
      || a.sha256 !== m.sha256 || a.finalidade !== "gerar_imagem" || a.destino !== "gpt-image-2"
      || !temTexto(a.por, 200) || !data(a.em, e.agora)) faltas.add(`autorizacao_${m.classe}_ausente_ou_divergente`);
  }
  const piloto = e.autorizacaoPiloto;
  const estimativa = usd(piloto?.estimativaUsd), reserva = usd(piloto?.reservaUsd), limite = usd(piloto?.limiteUsd);
  if (!piloto || !temTexto(piloto.id, 200) || piloto.businessId !== p.business_id || piloto.requestId !== p.id
    || piloto.quantidade !== 1 || piloto.destino !== "gpt-image-2" || !temTexto(piloto.por, 200) || !data(piloto.em, e.agora)
    || estimativa === null || reserva === null || limite === null || estimativa <= 0n || estimativa > reserva || reserva > limite)
    faltas.add("piloto_uma_imagem_sem_autorizacao_ou_orcamento");
  if (!temTexto(e.politicaVersao, 120)) faltas.add("politica_sem_versao");
  if (faltas.size) return { ok: false, pendencias: [...faltas] };
  function documento(tipo: "central" | "nicho"): DocumentoBackend {
    const d = e.documentos[tipo]!;
    return { versao: d.versao, conteudo: d.conteudo, revisado_por: d.revisadoPor, revisado_em: d.revisadoEm,
      business_id: e.escopoDocumentos[tipo], nicho_id: d.nichoId };
  }
  const manifesto: ManifestoBackend = {
    business_id: p.business_id, request_id: p.id, nicho_id: e.nichoId, nicho_confirmado: true,
    central: documento("central"), nicho: documento("nicho"), cores: e.cores.valores.join(", "), usar_fachada: false,
    materiais: [...e.materiais].sort((a, b) => a.classe.localeCompare(b.classe, "en")).map(m => ({
      id: m.id, business_id: m.businessId, caminho: m.caminho, sha256: m.sha256,
      uso: m.classe === "identidade_cliente" ? "logo" : "referencia", autorizacao_id: m.aprovacao!.id,
      revisado_por: m.revisadoPor, permitido: true, observado_em: m.observadoEm, condicao_de_uso: m.condicaoDeUso,
      fonte: canonico({ versao: 1, classe: m.classe, fonte: m.fonte, nichoId: m.nichoId, materialVersao: m.versao,
        revisadoEm: m.revisadoEm, autorizacao: m.aprovacao,
        piloto: { id: piloto!.id, quantidade: piloto!.quantidade, por: piloto!.por, em: piloto!.em } }),
    })), destino_autorizado: "gpt-image-2", politica_versao: e.politicaVersao,
    estimativa_usd: piloto!.estimativaUsd, reserva_usd: piloto!.reservaUsd, limite_usd: piloto!.limiteUsd,
  };
  const serializado = canonico(manifesto);
  if (Buffer.byteLength(serializado) > 65536) return { ok: false, pendencias: ["contexto_excessivo"] };
  return { ok: true, manifesto: JSON.parse(serializado) as ManifestoBackend, hash: hash(serializado),
    hashesDocumentos: { central: hash(manifesto.central.conteudo), nicho: hash(manifesto.nicho.conteudo) } };
}
