import { tipoFotoRegistrado } from "../identidade/tipo-foto.ts";
import type { MaterialDaMarca } from "./briefing-geracao";

/**
 * Seleção pura a partir de linhas carregadas por um servidor já autorizado.
 * Não busca dados, não verifica sessão e não envia arquivos. A action futura
 * deve verificar a posse do negócio e a prova de uso em fonte confiável.
 */
export interface LinhaDeMarca {
  id: string;
  business_id: string;
  uso: string;
  storage_path: string | null;
  created_at: string;
  arquivado_em: string | null;
  copy: unknown;
}

/** Não confundir com a declaração do upload: ela não autoriza IA externa. */
export interface AutorizacaoDeGeracao {
  imagemId: string;
  businessId: string;
  finalidade: "geracao_imagem";
  autorizadoEm: string;
  autorizadoPor: string;
  revogadoEm: string | null;
}

export interface EntradaDaSelecaoDeMarca {
  businessId: string;
  logoId: string;
  usarFachada: boolean;
  fachadaId: string | null;
  linhas: LinhaDeMarca[];
  autorizacoesConferidas: AutorizacaoDeGeracao[];
}

export type PendenciaDaMarca =
  | "negocio_ausente"
  | "logo_nao_elegivel"
  | "fachada_nao_elegivel"
  | "autorizacao_logo_ausente"
  | "autorizacao_fachada_ausente";

function dataValida(valor: string | null | undefined): boolean {
  return Boolean(valor && Number.isFinite(Date.parse(valor)));
}

function imagemElegivel(
  linhas: LinhaDeMarca[], businessId: string, id: string | null,
  uso: "logo" | "identidade", tipoFoto?: "fachada",
): LinhaDeMarca | null {
  if (!id) return null;
  const candidatas = linhas.filter((linha) => linha.id === id);
  if (candidatas.length !== 1) return null;
  const linha = candidatas[0]!;
  if (linha.business_id !== businessId || linha.uso !== uso || linha.arquivado_em !== null
    || !dataValida(linha.created_at) || !linha.storage_path
    || !linha.storage_path.startsWith(`identidade/${businessId}/`)) return null;
  if (tipoFoto && tipoFotoRegistrado(linha.copy) !== tipoFoto) return null;
  return linha;
}

function temAutorizacao(
  autorizacoes: AutorizacaoDeGeracao[], businessId: string, imagemId: string,
): boolean {
  return autorizacoes.some((item) => item.imagemId === imagemId
    && item.businessId === businessId && item.finalidade === "geracao_imagem"
    && Boolean(item.autorizadoPor.trim()) && dataValida(item.autorizadoEm)
    && item.revogadoEm === null);
}

function material(
  linha: LinhaDeMarca, tipo: MaterialDaMarca["tipo"],
): MaterialDaMarca {
  return {
    businessId: linha.business_id,
    caminhoPrivado: linha.storage_path!,
    tipo,
    origem: `creatives:${linha.id}`,
    registradoEm: linha.created_at,
    autorizadoParaGeracao: true,
  };
}

export function selecionarMarcaParaGeracao(entrada: EntradaDaSelecaoDeMarca):
  | { ok: true; logo: MaterialDaMarca; fachada: MaterialDaMarca | null }
  | { ok: false; pendencias: PendenciaDaMarca[] } {
  const pendencias: PendenciaDaMarca[] = [];
  const businessId = entrada.businessId.trim();
  if (!businessId || businessId.includes("/")) pendencias.push("negocio_ausente");

  const logo = imagemElegivel(entrada.linhas, businessId, entrada.logoId, "logo");
  if (!logo) pendencias.push("logo_nao_elegivel");
  else if (!temAutorizacao(entrada.autorizacoesConferidas, businessId, logo.id))
    pendencias.push("autorizacao_logo_ausente");

  const fachada = entrada.usarFachada
    ? imagemElegivel(entrada.linhas, businessId, entrada.fachadaId, "identidade", "fachada")
    : null;
  if (entrada.usarFachada) {
    if (!fachada) pendencias.push("fachada_nao_elegivel");
    else if (!temAutorizacao(entrada.autorizacoesConferidas, businessId, fachada.id))
      pendencias.push("autorizacao_fachada_ausente");
  }
  if (pendencias.length) return { ok: false, pendencias };
  return { ok: true, logo: material(logo!, "logo"),
    fachada: fachada ? material(fachada, "fachada") : null };
}
