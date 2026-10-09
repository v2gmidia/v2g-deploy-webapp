export type DocumentoPorPedido = {
  order_id: string;
  status: string;
  created_at: string;
};

/** Uma versão anterior assinada não supera a situação do documento atual. */
export function ultimoDocumentoPorPedido(documentos: DocumentoPorPedido[]): Map<string, string> {
  const ordenados = [...documentos].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const ultimos = new Map<string, string>();
  for (const documento of ordenados)
    if (!ultimos.has(documento.order_id)) ultimos.set(documento.order_id, documento.status);
  return ultimos;
}
