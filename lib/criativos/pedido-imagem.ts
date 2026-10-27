import { createHash } from "node:crypto";
import { referenciaDaBiblioteca } from "../jev/catalogo-barbearia.ts";

/** Pedido durável, ainda sem autorização de gasto, uso por IA ou publicação. */
interface ConteudoBase {
  objetivo: string;
  oferta: string;
  acao: string;
  promocao: boolean;
  validade: string | null;
}
export type ConteudoDoPedido = (ConteudoBase & { versao: 1 })
  | (ConteudoBase & { versao: 2; referenciaId: string });

export interface PedidoDeImagem {
  id: string;
  business_id: string;
  requested_by: string;
  content_hash: string;
  payload: ConteudoDoPedido;
  status: "awaiting_configuration";
  created_at: string;
}

export interface RepositorioDePedidos {
  buscar(id: string, businessId: string): Promise<PedidoDeImagem | null>;
  inserir(pedido: Omit<PedidoDeImagem, "created_at">): Promise<"criado" | "conflito">;
}

export type FalhaDoPedido = "indisponivel" | "negocio_mudou" | "dados_invalidos"
  | "prazo_invalido" | "confirmacao_ausente" | "envio_alterado";
export type ResultadoDoPedido = { ok: true; id: string; repetido: boolean }
  | { ok: false; motivo: FalhaDoPedido };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const texto = (valor: unknown, maximo: number) => typeof valor === "string"
  && valor.trim().length >= 2 && valor.trim().length <= maximo ? valor.trim() : null;

export function hashDoPedido(payload: ConteudoDoPedido): string {
  // Ordem canônica, independente da ordem das propriedades de um JSON recebido.
  return createHash("sha256").update(JSON.stringify([
    payload.versao, payload.objetivo, payload.oferta, payload.acao,
    payload.promocao, payload.validade,
    ...(payload.versao === 2 ? [payload.referenciaId] : []),
  ])).digest("hex");
}

/** Não usa ID de sessão/negócio declarado no formulário como autorização. */
export async function registrarPedidoDeImagem(entrada: {
  habilitado: boolean;
  id: unknown;
  negocioEsperado: unknown;
  objetivo: unknown;
  oferta: unknown;
  acao: unknown;
  promocao: boolean;
  validade: unknown;
  confirmado: boolean;
  referenciaId?: unknown;
  referenciasHabilitadas?: boolean;
}, portas: {
  sessao: () => Promise<{ profileId: string; businessId: string } | null>;
  repositorio: RepositorioDePedidos;
  hoje: string;
}): Promise<ResultadoDoPedido> {
  if (!entrada.habilitado) return { ok: false, motivo: "indisponivel" };
  try {
    const sessao = await portas.sessao();
    if (!sessao || sessao.businessId !== entrada.negocioEsperado)
      return { ok: false, motivo: "negocio_mudou" };
    const objetivo = texto(entrada.objetivo, 500);
    const oferta = texto(entrada.oferta, 500);
    const acao = texto(entrada.acao, 200);
    if (typeof entrada.id !== "string" || !UUID.test(entrada.id)
      || !objetivo || !oferta || !acao)
      return { ok: false, motivo: "dados_invalidos" };
    if (!entrada.confirmado) return { ok: false, motivo: "confirmacao_ausente" };
    const validade = entrada.promocao && typeof entrada.validade === "string"
      ? entrada.validade : null;
    if (entrada.promocao && (!validade || !/^\d{4}-\d{2}-\d{2}$/.test(validade)
      || !Number.isFinite(Date.parse(`${validade}T12:00:00Z`))
      || new Date(`${validade}T12:00:00Z`).toISOString().slice(0, 10) !== validade
      || validade < portas.hoje)) return { ok: false, motivo: "prazo_invalido" };

    const referenciaId = entrada.referenciaId === null || entrada.referenciaId === undefined || entrada.referenciaId === ""
      ? null : entrada.referenciaId;
    if (referenciaId !== null && (!entrada.referenciasHabilitadas || !referenciaDaBiblioteca(referenciaId)))
      return { ok: false, motivo: "dados_invalidos" };
    const base = { objetivo, oferta, acao, promocao: entrada.promocao, validade };
    const payload: ConteudoDoPedido = referenciaId === null ? { versao: 1, ...base }
      : { versao: 2, ...base, referenciaId: referenciaId as string };
    const pedido: Omit<PedidoDeImagem, "created_at"> = {
      id: entrada.id.toLowerCase(), business_id: sessao.businessId,
      requested_by: sessao.profileId, content_hash: hashDoPedido(payload),
      payload, status: "awaiting_configuration",
    };
    const conferirExistente = (atual: PedidoDeImagem | null): ResultadoDoPedido => {
      if (!atual || atual.id !== pedido.id || atual.business_id !== pedido.business_id
        || atual.requested_by !== pedido.requested_by || atual.content_hash !== pedido.content_hash
        || hashDoPedido(atual.payload) !== pedido.content_hash)
        return { ok: false, motivo: "envio_alterado" };
      return { ok: true, id: pedido.id, repetido: true };
    };
    const anterior = await portas.repositorio.buscar(pedido.id, pedido.business_id);
    if (anterior) return conferirExistente(anterior);
    const insercao = await portas.repositorio.inserir(pedido);
    if (insercao === "criado") return { ok: true, id: pedido.id, repetido: false };
    // Concorrência/replay: nunca faz upsert ou altera o conteúdo já confirmado.
    return conferirExistente(await portas.repositorio.buscar(pedido.id, pedido.business_id));
  } catch {
    return { ok: false, motivo: "indisponivel" };
  }
}

export const RECADOS_DO_PEDIDO: Record<FalhaDoPedido, string> = {
  indisponivel: "Não foi possível guardar o pedido agora. Confira a lista antes de repetir o envio; nenhuma imagem foi gerada.",
  negocio_mudou: "O negócio selecionado mudou ou o acesso terminou. Atualize a página antes de continuar.",
  dados_invalidos: "Preencha objetivo, oferta e destino da resposta dentro dos limites indicados.",
  prazo_invalido: "Confira a validade da promoção: escolha hoje ou uma data futura.",
  confirmacao_ausente: "Confirme os dados do pedido antes de guardar.",
  envio_alterado: "Este envio já está ligado a outro conteúdo. Abra um novo pedido para guardar a alteração.",
};
