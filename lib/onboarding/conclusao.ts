import { lerConta, ticketEscalar, type RespostaDeConta } from "../cadastro/montar.ts";
import { faltamRespostasBasicas } from "./bloco-um.ts";
import { documento, lerConclusao, lerMarca } from "./marca.ts";

export interface DadosParaConclusao {
  onboarding?: unknown;
  site_url?: string | null;
  avg_ticket_min: number | string | null;
  avg_ticket_max: number | string | null;
  avg_direct_cost: number | string | null;
  target_profit_per_customer: number | string | null;
}

function numero(valor: number | string | null | undefined): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : null;
}

/** Mesmo veredito para cliente, página inicial e carteira interna. Reserva é outro estado. */
export function estadoDaConclusao(dados: DadosParaConclusao) {
  const doc = documento(dados.onboarding);
  const faltamBasicas = faltamRespostasBasicas(doc);
  const contas = (doc.contas ?? {}) as Partial<Record<"ticket" | "custo" | "lucro", RespostaDeConta>>;
  const contasProntas = [
    lerConta(ticketEscalar(numero(dados.avg_ticket_min), numero(dados.avg_ticket_max)), contas.ticket),
    lerConta(numero(dados.avg_direct_cost), contas.custo),
    lerConta(numero(dados.target_profit_per_customer), contas.lucro),
  ].every((leitura) => leitura.estado === "respondida" || leitura.estado === "nao_sei");
  const marca = lerMarca(doc);
  const marcaPronta = marca !== null &&
    (marca.aparenciaNaoSei || marca.aparencia.trim().length > 0) &&
    (marca.siteNaoTenho ? !dados.site_url : !!dados.site_url);
  return {
    faltamBasicas,
    contasProntas,
    marca,
    concluido: lerConclusao(doc) !== null && faltamBasicas.length === 0 && contasProntas && marcaPronta,
  };
}
