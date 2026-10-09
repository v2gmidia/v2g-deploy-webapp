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
  external_id?: string;
  name?: string | null;
  is_active?: boolean;
}

export interface UnidadeDoPortfolio {
  order_id: string;
  ad_account_id: string | null;
}

export interface ExecucaoDoPortfolio {
  id: string;
  business_id: string | null;
  status: string;
  campanha_meta: unknown;
  status_na_plataforma: string | null;
  status_lido_em: string | null;
  criado_em: string;
}

export interface LinhaDoPortfolio {
  id: string;
  nome: string;
  atualizadoEm: string;
  instagram: { rotulo: string; url: string } | null;
  instagramInformadoSemLink: boolean;
  descricaoParaReuniao: string | null;
  diferenciaisParaReuniao: string[];
  contas: number;
  contasDetalhe: {
    id: string;
    nome: string;
    identificador: string;
    ativa: boolean;
    vinculo: "pedido_aprovado" | "sem_unidade_aprovada";
  }[];
  unidadesAprovadasLivres: number;
  pedido: string | null;
  contrato: string | null;
  pendenciasCadastro: number;
  onboardingConcluido: boolean;
  prioridade: number;
  proximaAcao: string;
  origem: "pedido" | "cadastro" | "onboarding" | "operacao";
  execucoes: number;
  ultimaExecucao: {
    id: string;
    estado: string;
    criadaEm: string;
  } | null;
  ultimaCampanha: {
    idExecucao: string;
    estadoNaPlataforma: string | null;
    plataformaLidaEm: string | null;
  } | null;
}

/** Aceita apenas perfil público; um valor livre do cadastro nunca vira URL arbitrária. */
export function instagramParaRevisao(valor: string | null | undefined): { rotulo: string; url: string } | null {
  const texto = valor?.trim() ?? "";
  const perfil = /^(?:@)?([A-Za-z0-9._]{1,30})$/.exec(texto)
    ?? /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:\?.*)?$/i.exec(texto);
  if (!perfil || perfil[1] === ".") return null;
  const nome = perfil[1];
  return { rotulo: `@${nome}`, url: `https://www.instagram.com/${nome}/` };
}

/** Fila operacional: só estados comprovados no banco; reunião e campanha exigem fonte externa. */
export function montarPortfolio(
  negocios: NegocioDoPortfolio[],
  pedidos: PedidoDoPortfolio[],
  contratos: ContratoDoPortfolio[],
  contas: ContaDoPortfolio[],
  execucoes: ExecucaoDoPortfolio[] = [],
  unidades: UnidadeDoPortfolio[] = [],
): LinhaDoPortfolio[] {
  // A consulta vem do mais novo para o mais antigo; reprocessar um documento
  // antigo não pode substituir o estado do contrato vigente.
  const contratosPorPedido = new Map<string, string>();
  for (const contrato of contratos) {
    if (!contratosPorPedido.has(contrato.order_id)) contratosPorPedido.set(contrato.order_id, contrato.status);
  }
  const contasPorNegocio = new Map<string, ContaDoPortfolio[]>();
  for (const conta of contas) {
    const lista = contasPorNegocio.get(conta.business_id) ?? [];
    lista.push(conta);
    contasPorNegocio.set(conta.business_id, lista);
  }
  const pedidoPorId = new Map(pedidos.map((pedido) => [pedido.id, pedido]));
  const contaPorId = new Map(contas.map((conta) => [conta.id, conta]));
  const contasComUnidadeAprovada = new Set<string>();
  const unidadesLivresPorNegocio = new Map<string, number>();
  for (const unidade of unidades) {
    const pedido = pedidoPorId.get(unidade.order_id);
    if (!pedido?.business_id || pedido.status !== "payment_approved") continue;
    if (unidade.ad_account_id) {
      const conta = contaPorId.get(unidade.ad_account_id);
      if (conta?.business_id === pedido.business_id) contasComUnidadeAprovada.add(conta.id);
    } else {
      unidadesLivresPorNegocio.set(pedido.business_id, (unidadesLivresPorNegocio.get(pedido.business_id) ?? 0) + 1);
    }
  }
  const pedidosPorNegocio = new Map<string, PedidoDoPortfolio[]>();
  const execucoesPorNegocio = new Map<string, ExecucaoDoPortfolio[]>();
  for (const execucao of execucoes) {
    if (!execucao.business_id) continue;
    const lista = execucoesPorNegocio.get(execucao.business_id) ?? [];
    lista.push(execucao);
    execucoesPorNegocio.set(execucao.business_id, lista);
  }
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
    const contasDoNegocio = contasPorNegocio.get(negocio.id) ?? [];
    const quantidadeContas = contasDoNegocio.length;
    const contasDetalhe: LinhaDoPortfolio["contasDetalhe"] = contasDoNegocio.map((conta) => ({
      id: conta.id,
      nome: conta.name?.trim() || conta.external_id || "Conta sem nome",
      identificador: conta.external_id ?? conta.id,
      ativa: conta.is_active ?? true,
      vinculo: contasComUnidadeAprovada.has(conta.id) ? "pedido_aprovado" : "sem_unidade_aprovada",
    }));
    const execucoesDoNegocio = (execucoesPorNegocio.get(negocio.id) ?? [])
      .sort((a, b) => Date.parse(b.criado_em) - Date.parse(a.criado_em));
    const ultima = execucoesDoNegocio[0] ?? null;
    const ultimaCampanha = execucoesDoNegocio.find((e) => e.campanha_meta != null) ?? null;
    const contrato = pedido ? contratosPorPedido.get(pedido.id) ?? null : null;
    const instagram = instagramParaRevisao(negocio.instagram_handle);

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
      instagram,
      instagramInformadoSemLink: !!negocio.instagram_handle?.trim() && !instagram,
      descricaoParaReuniao: negocio.description?.trim() || null,
      diferenciaisParaReuniao: Array.isArray(negocio.differentiators)
        ? negocio.differentiators.filter((valor): valor is string => typeof valor === "string" && !!valor.trim()) : [],
      contas: quantidadeContas,
      contasDetalhe,
      unidadesAprovadasLivres: unidadesLivresPorNegocio.get(negocio.id) ?? 0,
      pedido: pedido?.status ?? null,
      contrato,
      pendenciasCadastro,
      onboardingConcluido,
      prioridade,
      proximaAcao,
      origem,
      execucoes: execucoesDoNegocio.length,
      ultimaExecucao: ultima ? {
        id: ultima.id,
        estado: ultima.status,
        criadaEm: ultima.criado_em,
      } : null,
      ultimaCampanha: ultimaCampanha ? {
        idExecucao: ultimaCampanha.id,
        estadoNaPlataforma: ultimaCampanha.status_na_plataforma,
        plataformaLidaEm: ultimaCampanha.status_lido_em,
      } : null,
    };
  }).sort((a, b) => a.prioridade - b.prioridade || a.nome.localeCompare(b.nome, "pt-BR"));
}

export type FiltroDoPortfolio = "todos" | "minhas" | "pedidos" | "onboarding" | "cadastro" | "contas" | "campanhas";

export function filtrarPortfolio(linhas: LinhaDoPortfolio[], busca: string, filtro: FiltroDoPortfolio, minhasContas?: ReadonlySet<string>) {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  return linhas.filter((linha) => {
    if (termo && !`${linha.nome} ${linha.id}`.toLocaleLowerCase("pt-BR").includes(termo)) return false;
    if (filtro === "minhas") return minhasContas?.has(linha.id) ?? false;
    if (filtro === "pedidos") return linha.origem === "pedido";
    if (filtro === "onboarding") return !linha.onboardingConcluido;
    if (filtro === "cadastro") return linha.pendenciasCadastro > 0;
    if (filtro === "contas") return linha.unidadesAprovadasLivres > 0 || linha.contasDetalhe.some((conta) => conta.vinculo === "sem_unidade_aprovada");
    if (filtro === "campanhas") return linha.ultimaCampanha !== null;
    return true;
  });
}
