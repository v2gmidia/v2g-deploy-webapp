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

export interface PendenciaDoOnboarding {
  titulo: string;
  corpo: string;
  href: "/onboarding" | "/onboarding/contas" | "/onboarding/marca" | "/onboarding/concluido";
  rotulo: string;
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
    (marca.aparenciaNaoSei || marca.aparencia.trim().length > 0 || marca.coresConfirmadas.length > 0) &&
    (marca.siteNaoTenho ? !dados.site_url : !!dados.site_url);
  return {
    faltamBasicas,
    contasProntas,
    marca,
    concluido: lerConclusao(doc) !== null && faltamBasicas.length === 0 && contasProntas && marcaPronta,
  };
}

/** Próximo passo exibido no Início, sem expulsar a pessoa da tela. */
export function pendenciaDoOnboarding(
  dados: DadosParaConclusao,
  reuniaoConfirmada: boolean,
): PendenciaDoOnboarding | null {
  const estado = estadoDaConclusao(dados);
  if (estado.faltamBasicas.length > 0) return {
    titulo: "Ainda faltam respostas sobre seu negócio",
    corpo: "O que você já respondeu continua guardado. Termine as perguntas para a equipe preparar o próximo passo deste negócio.",
    href: "/onboarding",
    rotulo: "Continuar perguntas",
  };
  if (!estado.contasProntas) return {
    titulo: "Ainda faltam as contas do negócio",
    corpo: "Confira os valores que ajudam a planejar os anúncios. Você pode marcar o que ainda não sabe e revisar com o gestor.",
    href: "/onboarding/contas",
    rotulo: "Continuar contas",
  };
  if (!estado.concluido) return {
    titulo: "Ainda falta conferir o visual da marca",
    corpo: "Revise os materiais e confirme quais cores representam este negócio antes de escolher um horário.",
    href: "/onboarding/marca",
    rotulo: "Conferir visual da marca",
  };
  if (!reuniaoConfirmada) return {
    titulo: "A confirmação da reunião ainda está pendente",
    corpo: "Seu cadastro está concluído. Se você marcou pelo Google, o clique em “Já marquei meu horário” não comprova a reserva; confira o e-mail do Google enquanto a V2G aguarda uma confirmação verificável.",
    href: "/onboarding/concluido",
    rotulo: "Conferir reunião",
  };
  return null;
}
