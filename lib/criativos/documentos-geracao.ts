import type { BriefingVisual } from "./briefing-geracao.ts";

/** Conteúdo versionado e revisado; carregamento/autorização cabem ao servidor. */
export interface DocumentoDeRegraVisual {
  tipo: "central" | "nicho";
  versao: string;
  nichoId: string | null;
  conteudo: string;
  revisadoPor: string;
  revisadoEm: string;
}

export interface DocumentosDaGeracao {
  central: DocumentoDeRegraVisual | null;
  nicho: DocumentoDeRegraVisual | null;
}

export type PendenciaDeDocumento =
  | "documento_central_indisponivel"
  | "documento_nicho_indisponivel";

function documentoConferido(
  documento: DocumentoDeRegraVisual | null,
  tipo: DocumentoDeRegraVisual["tipo"],
  versao: string,
  nichoId: string | null,
): documento is DocumentoDeRegraVisual {
  return Boolean(documento && documento.tipo === tipo && documento.versao === versao
    && documento.nichoId === nichoId && documento.conteudo.trim()
    && documento.revisadoPor.trim() && Number.isFinite(Date.parse(documento.revisadoEm)));
}

export function conferirDocumentosDaGeracao(
  briefing: BriefingVisual, documentos: DocumentosDaGeracao,
): { ok: true; central: DocumentoDeRegraVisual; nicho: DocumentoDeRegraVisual }
  | { ok: false; pendencias: PendenciaDeDocumento[] } {
  const pendencias: PendenciaDeDocumento[] = [];
  if (!documentoConferido(documentos.central, "central",
    briefing.documentoCentralVersao, null))
    pendencias.push("documento_central_indisponivel");
  if (!documentoConferido(documentos.nicho, "nicho",
    briefing.documentoNichoVersao, briefing.nichoId))
    pendencias.push("documento_nicho_indisponivel");
  if (pendencias.length) return { ok: false, pendencias };
  return { ok: true, central: documentos.central!, nicho: documentos.nicho! };
}
