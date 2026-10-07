import { montarCadastro, type NegocioParaCadastro } from "../cadastro/montar";
import { lerConclusao } from "../onboarding/marca";

export interface NegocioDoPortfolio extends NegocioParaCadastro {
  dados_ficticios: boolean;
  updated_at: string;
  created_at: string;
  cadastro_estado?: string | null;
}

export interface PedidoDoPortfolio {
  id: string;
  business_id: string | null;
  status: string;
  created_at: string;
}

export interface ContratoDoPortfolio {
  order_id: string;
  status: string;
}

export interface ContaDoPortfolio {
  business_id: string;
  id: string;
}

export interface LinhaDoPortfolio {
  id: string;
  nome: string;
  atualizadoEm: string;
  contas: number;
  pedido: string | null;
  contrato: string | null;
  pendenciasCadastro: number;
  onboardingConcluido: boolean;
  prioridade: number;
  proximaAcao: string;
  origem: "pedido" | "cadastro" | "onboarding" | "operacao";
}

/** Fila operacional: só estados comprovados no banco; reunião e campanha exigem fonte externa. */
export function montarPortfolio(
  negocios: NegocioDoPortfolio[],
  pedidos: PedidoDoPortfolio[],
  contratos: ContratoDoPortfolio[],
  contas: ContaDoPortfolio[],
): LinhaDoPortfolio[] {
  const contratosPorPedido = new Map(contratos.map((c) => [c.order_id, c.status]));
  const contasPorNegocio = new Map<string, number>();
  for (const conta of contas) contasPorNegocio.set(conta.business_id, (contasPorNegocio.get(conta.business_id) ?? 0) + 1);
  const pedidosPorNegocio = new Map<string, PedidoDoPortfolio[]>();
  for (const pedido of pedidos) {
    if (!pedido.business_id) continue;
    const lista = pedidosPorNegocio.get(pedido.business_id) ?? [];
    lista.push(pedido);
    pedidosPorNegocio.set(pedido.business_id, lista);
  }

  return negocios.filter((n) => !n.dados_ficticios).map((negocio) => {
    const lista = (pedidosPorNegocio.get(negocio.id) ?? [])
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    const pedido = lista[0] ?? null;
    const cadastro = montarCadastro(negocio);
    const pendenciasCadastro = cadastro.completo ? 0 : cadastro.pendencias.length;
    const onboardingConcluido = lerConclusao(negocio.onboarding) !== null;
    const quantidadeContas = contasPorNegocio.get(negocio.id) ?? 0;
    const contrato = pedido ? contratosPorPedido.get(pedido.id) ?? null : null;

    let prioridade = 5;
    let proximaAcao = "Conferir ficha e situação da operação";
    let origem: LinhaDoPortfolio["origem"] = "operacao";
    if (pedido?.status === "proof_received") {
      prioridade = 1; proximaAcao = "Conferir comprovante Pix no pedido"; origem = "pedido";
    } else if (pedido?.status === "awaiting_payment") {
      prioridade = 2; proximaAcao = "Aguardar pagamento; acesso ainda fechado"; origem = "pedido";
    } else if (pedido?.status === "payment_approved" && contrato !== "signed") {
      prioridade = 2; proximaAcao = contrato ? "Conferir assinatura do contrato" : "Preparar contrato após revisão jurídica"; origem = "pedido";
    } else if (!pedido && negocio.cadastro_estado === "enviado") {
      prioridade = 4; proximaAcao = "Conta anterior ao fluxo de compra: conferir ficha e operação"; origem = "operacao";
    } else if (!onboardingConcluido) {
      prioridade = 3; proximaAcao = "Onboarding ainda não concluído"; origem = "onboarding";
    } else if (pendenciasCadastro > 0) {
      prioridade = 3; proximaAcao = "Resolver campos do cadastro com o cliente"; origem = "cadastro";
    } else if (quantidadeContas === 0) {
      prioridade = 4; proximaAcao = "Conferir conta de anúncios e acessos"; origem = "operacao";
    } else {
      prioridade = 4; proximaAcao = "Reunião: confirmar no Google antes de preparar campanha"; origem = "operacao";
    }
    return {
      id: negocio.id,
      nome: negocio.name?.trim() || "Negócio sem nome",
      atualizadoEm: negocio.updated_at,
      contas: quantidadeContas,
      pedido: pedido?.status ?? null,
      contrato,
      pendenciasCadastro,
      onboardingConcluido,
      prioridade,
      proximaAcao,
      origem,
    };
  }).sort((a, b) => a.prioridade - b.prioridade || a.nome.localeCompare(b.nome, "pt-BR"));
}
