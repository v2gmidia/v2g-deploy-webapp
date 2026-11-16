import { lerPublicacao } from "../criativos/publicacao.ts";

export type ResumoDaCarteira = {
  situacao: string; proximo: string; temPendencia: boolean | null;
  titulo: string; corpo: string; rotulo: string;
};
type RevisaoResumida = { id: string; business_id: string; sha256: string; status: string };
const ESTADOS = new Set(["uploading", "upload_failed", "awaiting_review", "approved_for_manual_publish", "changes_requested", "rejected"]);
export function resumirCarteira(businessId: string, revisoes: RevisaoResumida[], publicacoes: unknown[], falhou = false): ResumoDaCarteira {
  const falha: ResumoDaCarteira = { situacao: "Conferência indisponível", proximo: "Consultar novamente as peças",
    temPendencia: null, titulo: "Conferir as peças do cliente", corpo: "Não conseguimos conferir todas as etapas agora. Isso não significa que os arquivos foram apagados.", rotulo: "Abrir criativos" };
  if (falhou || revisoes.some(r => r.business_id !== businessId || !ESTADOS.has(r.status))
    || publicacoes.some(p => !p || typeof p !== "object" || (p as { business_id?: unknown }).business_id !== businessId)) return falha;
  const pendente = revisoes.find(r => ["changes_requested", "awaiting_review", "uploading", "upload_failed"].includes(r.status));
  if (pendente) {
    const ajuste = pendente.status === "changes_requested";
    return { situacao: ajuste ? "Ajustes solicitados" : pendente.status === "awaiting_review" ? "Peça em revisão" : "Conferir envio da peça",
      proximo: ajuste ? "Conferir o retorno do gestor" : "Acompanhar a revisão da peça", temPendencia: true,
      titulo: ajuste ? "Conferir os ajustes da peça" : "Acompanhar a revisão da peça",
      corpo: ajuste ? "O gestor pediu ajustes. Confira o retorno antes de preparar a próxima versão." : "A peça ainda não tem uma aprovação concluída. Acompanhe o envio e a decisão do gestor.", rotulo: "Ver peça e acompanhamento" };
  }
  const aprovada = revisoes.find(r => r.status === "approved_for_manual_publish"
    && !publicacoes.some(p => lerPublicacao(p, r)));
  if (aprovada) return { situacao: "Conferir publicação", proximo: "Confirmar a publicação da peça", temPendencia: true,
    titulo: "Conferir a publicação da peça", corpo: "A peça foi aprovada. Falta conferir o registro de publicação com o gestor responsável.", rotulo: "Ver peça e acompanhamento" };
  if (revisoes.some(r => r.status === "rejected")) return { situacao: "Peça recusada", proximo: "Conferir o retorno e preparar outra peça", temPendencia: true,
    titulo: "Conferir a peça recusada", corpo: "Uma peça foi recusada pelo gestor. Confira o retorno antes de enviar uma nova versão.", rotulo: "Ver peça e acompanhamento" };
  if (!revisoes.length) return { situacao: "Sem peça recebida nesta fila", proximo: "Conferir a biblioteca ou enviar uma peça", temPendencia: true,
    titulo: "Conferir as peças do cliente", corpo: "Não há pedidos de revisão nesta fila. Consulte a biblioteca ou escolha uma imagem para enviar. O envio não publica o anúncio.", rotulo: "Abrir criativos" };
  return { situacao: "Etapas das peças conferidas", proximo: "Acompanhar peças e resultados", temPendencia: false,
    titulo: "Acompanhar este cliente", corpo: "Confira as peças e os resultados do período. Um registro manual de publicação não confirma entrega atual.", rotulo: "Abrir criativos" };
}
