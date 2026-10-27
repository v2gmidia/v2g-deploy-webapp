import { createHash } from "node:crypto";

export const VERSAO_DA_PROVENIENCIA_DO_UPLOAD = 1 as const;

/**
 * Prova técnica do arquivo recebido do cliente.
 *
 * Isto registra origem e integridade. Não é — e não pode virar por
 * inferência — autorização para enviar o material a um gerador externo.
 * Essa autorização tem contrato e registro separados.
 */
export function provenienciaDoUploadCliente(bytes: Uint8Array, registradoEm: string) {
  return {
    versao: VERSAO_DA_PROVENIENCIA_DO_UPLOAD,
    origem: "upload_cliente" as const,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    registradoEm,
    finalidadeDoUpload: "identidade_visual" as const,
  };
}
