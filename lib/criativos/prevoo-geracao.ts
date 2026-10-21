import { prepararBriefingVisual, type EntradaDoBriefing } from "./briefing-geracao.ts";
import { conferirDocumentosDaGeracao, type DocumentosDaGeracao } from "./documentos-geracao.ts";
import { avaliarPortaDeGeracao, type EntradaDaPortaDeGeracao } from "./porta-geracao.ts";
import { selecionarMarcaParaGeracao, type EntradaDaSelecaoDeMarca } from "./selecionar-marca.ts";

/**
 * Junta as três decisões locais antes de qualquer leitura de arquivo ou chamada paga.
 * Não substitui sessão/RLS, consentimento persistido, reserva transacional ou provedor.
 */
export interface EntradaDoPrevooDeGeracao {
  marca: EntradaDaSelecaoDeMarca;
  contexto: Omit<EntradaDoBriefing, "logo" | "fachada">;
  documentos: DocumentosDaGeracao;
  custo: EntradaDaPortaDeGeracao;
}

export function prepararPrevooDeGeracao(entrada: EntradaDoPrevooDeGeracao) {
  const businessId = entrada.contexto.businessId.trim();
  if (!businessId || entrada.marca.businessId !== businessId
    || entrada.custo.businessId !== businessId) {
    return { ok: false as const, etapa: "negocio" as const,
      pendencias: ["negocios_divergentes"] as const };
  }

  const marca = selecionarMarcaParaGeracao(entrada.marca);
  if (!marca.ok) return { ok: false as const, etapa: "marca" as const,
    pendencias: marca.pendencias };

  const contexto = prepararBriefingVisual({ ...entrada.contexto,
    logo: marca.logo, fachada: marca.fachada });
  if (!contexto.ok) return { ok: false as const, etapa: "contexto" as const,
    pendencias: contexto.pendencias };

  const documentos = conferirDocumentosDaGeracao(contexto.briefing, entrada.documentos);
  if (!documentos.ok) return { ok: false as const, etapa: "documentos" as const,
    pendencias: documentos.pendencias };

  const custo = avaliarPortaDeGeracao(entrada.custo);
  if (!custo.ok) return { ok: false as const, etapa: "custo" as const,
    pendencias: custo.bloqueios };

  return { ok: true as const, briefing: contexto.briefing,
    documentos: { central: documentos.central, nicho: documentos.nicho },
    saldoDepoisDaReservaCentavos: custo.saldoDepoisDaReservaCentavos,
    refacoesRestantesDepois: custo.refacoesRestantesDepois };
}
