export const BUCKET_REVISAO = "creative-review";
export const TAMANHO_MAXIMO_REVISAO = 9 * 1024 * 1024;

export type StatusRevisao = "uploading" | "upload_failed" | "awaiting_review"
  | "approved_for_manual_publish" | "changes_requested" | "rejected";

export function tipoRealDaImagem(bytes: Uint8Array): "image/jpeg" | "image/png" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    return "image/jpeg";
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10]
    .every((byte, index) => bytes[index] === byte)) return "image/png";
  return null;
}

export function caminhoDaRevisao(businessId: string, submissaoId: string): string {
  return `${businessId}/${submissaoId}`;
}

export function podeRepetirEnvio(status: StatusRevisao, updatedAt: string, agora: number): boolean {
  return status === "upload_failed" ||
    (status === "uploading" && agora - Date.parse(updatedAt) >= 2 * 60_000);
}

export function rotuloDaRevisao(status: StatusRevisao): string {
  switch (status) {
    case "uploading": return "Envio em andamento";
    case "upload_failed": return "Envio incompleto; tente novamente";
    case "awaiting_review": return "Recebido para revisão do gestor";
    case "approved_for_manual_publish": return "Aprovado pelo gestor; publicação manual pendente";
    case "changes_requested": return "Ajustes solicitados pelo gestor";
    case "rejected": return "Recusado pelo gestor";
  }
}
