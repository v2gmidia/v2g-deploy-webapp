import { createHash } from "node:crypto";
import type { TipoDeTarefa } from "./tarefas";

const ITENS = [
  {
    tipo: "review_instagram",
    titulo: "Avaliar Instagram antes da reunião",
    descricao: "Reservar cerca de 10 minutos para avaliar apresentação, conteúdo e clareza da oferta. Registrar orientação sem tratar avaliação como veto à compra.",
  },
  {
    tipo: "collect_access",
    titulo: "Conferir acessos com o cliente",
    descricao: "Na reunião, conferir os acessos necessários e registrar o que ainda depende do cliente. Não marcar como resolvido sem verificação.",
  },
  {
    tipo: "choose_first_creative",
    titulo: "Definir o primeiro criativo",
    descricao: "Na reunião, decidir com o cliente qual peça preparar. A publicação inicial continua manual e depende das travas comerciais e operacionais.",
  },
] as const satisfies readonly { tipo: TipoDeTarefa; titulo: string; descricao: string }[];

function idDeterministico(negocioId: string, tipo: TipoDeTarefa): string {
  const bytes = createHash("sha256").update(`v2g-preparacao-v1:${negocioId}:${tipo}`).digest().subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function tarefasDaPreparacao(negocioId: string) {
  return ITENS.map((item) => ({ ...item, id: idDeterministico(negocioId, item.tipo) }));
}
