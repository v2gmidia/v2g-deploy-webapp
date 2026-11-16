import { cadastroUsaContratoOperacional } from "../cadastro/montar.ts";
import { estadoDaConclusao as estadoLegado, pendenciaDoOnboarding as pendenciaLegada } from "./conclusao-legada.ts";
import { faltamRespostasBasicas } from "./bloco-um.ts";
import { documento, lerConclusao, lerMarca } from "./marca.ts";

export interface DadosParaConclusao {
  onboarding?: unknown;
  site_url?: string | null;
  avg_ticket_min?: number | string | null;
  avg_ticket_max?: number | string | null;
  avg_direct_cost?: number | string | null;
  target_profit_per_customer?: number | string | null;
}

export interface PendenciaDoOnboarding {
  titulo: string;
  corpo: string;
  href: "/onboarding" | "/onboarding/contas" | "/onboarding/marca" | "/onboarding/concluido";
  rotulo: string;
}

function dadosLegados(dados: DadosParaConclusao) {
  return { ...dados, avg_ticket_min: dados.avg_ticket_min ?? null, avg_ticket_max: dados.avg_ticket_max ?? null,
    avg_direct_cost: dados.avg_direct_cost ?? null, target_profit_per_customer: dados.target_profit_per_customer ?? null };
}

/** Mesmo veredito para cliente, página inicial e carteira interna. Reserva é outro estado. */
export function estadoDaConclusao(dados: DadosParaConclusao) {
  if (!cadastroUsaContratoOperacional(dados.onboarding)) return estadoLegado(dadosLegados(dados));
  const doc = documento(dados.onboarding);
  const faltamBasicas = faltamRespostasBasicas(doc);
  const respostas = doc.respostas && typeof doc.respostas === "object" && !Array.isArray(doc.respostas)
    ? doc.respostas as Record<string, unknown> : {};
  const operador = respostas.operador && typeof respostas.operador === "object" && !Array.isArray(respostas.operador)
    ? (respostas.operador as { texto?: unknown }).texto : null;
  const agenciaOperadora = operador === "Uma agência ou gestor opera para o anunciante";
  const contatosBrutos = respostas._contatos_anunciante;
  const contatos = contatosBrutos && typeof contatosBrutos === "object" && !Array.isArray(contatosBrutos)
    ? contatosBrutos as Record<string, unknown> : {};
  const siteDoAnunciante = typeof contatos.site_url === "string" && contatos.site_url.trim()
    ? contatos.site_url : null;
  const marca = lerMarca(doc);
  const marcaPronta = marca !== null &&
    (marca.aparenciaNaoSei || marca.aparencia.trim().length > 0 || marca.coresConfirmadas.length > 0) &&
    (agenciaOperadora
      ? (marca.siteNaoTenho ? contatos.site_nao_tem === true : !!siteDoAnunciante)
      : (marca.siteNaoTenho ? !dados.site_url : !!dados.site_url));
  return {
    faltamBasicas,
    // Compatibilidade de leitura para componentes antigos. Não é mais uma
    // guarda da entrada; diagnóstico econômico é etapa futura e separada.
    contasProntas: true,
    marca,
    concluido: lerConclusao(doc) !== null && faltamBasicas.length === 0 && marcaPronta,
  };
}

/** Próximo passo exibido no Início, sem expulsar a pessoa da tela. */
export function pendenciaDoOnboarding(
  dados: DadosParaConclusao,
  reuniaoConfirmada: boolean,
): PendenciaDoOnboarding | null {
  if (!cadastroUsaContratoOperacional(dados.onboarding)) return pendenciaLegada(dadosLegados(dados), reuniaoConfirmada);
  const estado = estadoDaConclusao(dados);
  if (estado.faltamBasicas.length > 0) return {
    titulo: "Ainda faltam respostas sobre seu negócio",
    corpo: "O que você já respondeu continua guardado. Termine as perguntas para a equipe preparar o próximo passo deste negócio.",
    href: "/onboarding",
    rotulo: "Continuar perguntas",
  };
  if (!estado.concluido) return {
    titulo: "Ainda falta conferir o visual da marca",
    corpo: "Revise os materiais e confirme quais cores representam este negócio antes de escolher um horário.",
    href: "/onboarding/marca",
    rotulo: "Conferir visual da marca",
  };
  if (!reuniaoConfirmada) return {
    titulo: "Cadastro concluído. Vamos à reunião",
    corpo: "As informações do seu negócio estão salvas. Se você recebeu o e-mail do Google, não escolha outro horário. Abrir a agenda não comprova a reserva; a V2G só confirma quando localiza o evento.",
    href: "/onboarding/concluido",
    rotulo: "Conferir reunião",
  };
  return null;
}
