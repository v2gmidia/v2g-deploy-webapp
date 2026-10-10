import { createHash } from "node:crypto";

/** Identidade estável da tarefa interna correspondente a uma solicitação. */
export function idDaTarefaDeRevisao(solicitacaoId: string): string {
  const bytes = createHash("sha256").update(`v2g-revisao-criativo-v1:${solicitacaoId}`).digest().subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const TITULO_TAREFA_REVISAO = "Revisar criativo enviado";

export function descricaoDaTarefaDeRevisao(solicitacaoId: string, businessId: string): string {
  return `Solicitação ${solicitacaoId}. Conferir o arquivo privado em /gestor/criativos?negocio=${businessId} e registrar a decisão. A publicação continua manual.`;
}

/** A pendência só termina quando a decisão da peça é gravada na fonte. */
export function solicitacaoDaTarefaDeRevisao(id: string, businessId: string,
  descricao: string | null): string | null {
  const solicitacaoId = /^Solicitação ([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\./i
    .exec(descricao ?? "")?.[1];
  return solicitacaoId && id === idDaTarefaDeRevisao(solicitacaoId) &&
    descricao === descricaoDaTarefaDeRevisao(solicitacaoId, businessId) ? solicitacaoId : null;
}

export function ehTarefaDeRevisao(id: string, businessId: string, descricao: string | null): boolean {
  return solicitacaoDaTarefaDeRevisao(id, businessId, descricao) !== null;
}
