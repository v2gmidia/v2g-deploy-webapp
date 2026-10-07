import type { NegocioAcessivel } from "./escolha";

export type NegocioDoPerfil = NegocioAcessivel & { created_at: string };
export type PedidoDoNegocio = {
  business_id: string | null;
  status: string;
  buyer_email: string | null;
  buyer_profile_id: string | null;
};

/** A propriedade da linha não basta: cada negócio comprado precisa estar liberado. */
export function negociosLiberados(entrada: {
  negocios: NegocioDoPerfil[];
  pedidos: PedidoDoNegocio[];
  perfilId: string;
  emailVerificado: string | null;
  legadoEm: string | null;
  operador: boolean;
}): NegocioAcessivel[] {
  const { negocios, pedidos, perfilId, emailVerificado, legadoEm, operador } = entrada;
  const marcoLegado = legadoEm ? Date.parse(legadoEm) : NaN;
  const email = emailVerificado?.trim().toLowerCase() ?? null;
  const tinhaNegocioNoMarco = Number.isFinite(marcoLegado) && negocios.some((negocio) =>
    Number.isFinite(Date.parse(negocio.created_at)) && Date.parse(negocio.created_at) <= marcoLegado);
  const primeiroSemPedido = negocios
    .filter((negocio) => Number.isFinite(Date.parse(negocio.created_at))
      && Date.parse(negocio.created_at) > marcoLegado
      && !pedidos.some((pedido) => pedido.business_id === negocio.id))
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))[0]?.id;

  return negocios.filter((negocio) => {
    if (operador) return true;
    const pedidosDoNegocio = pedidos.filter((pedido) => pedido.business_id === negocio.id);
    const aprovado = pedidosDoNegocio.some((pedido) => pedido.status === "payment_approved"
      && !!email && pedido.buyer_email?.trim().toLowerCase() === email
      && (pedido.buyer_profile_id === perfilId || pedido.buyer_profile_id === null));
    if (aprovado && email) return true;

    if (!Number.isFinite(marcoLegado)) return false;
    const criadoEm = Date.parse(negocio.created_at);
    if (!Number.isFinite(criadoEm)) return false;
    // Linhas anteriores à trava continuam alcançáveis, inclusive quando há
    // uma nova compra ainda pendente para o mesmo negócio.
    if (criadoEm <= marcoLegado) return true;
    // Um legado sem negócio pode terminar seu primeiro cadastro. Negócios
    // nascidos de pedidos posteriores só entram depois da aprovação.
    return !tinhaNegocioNoMarco && pedidos.length === 0 && pedidosDoNegocio.length === 0
      && negocio.id === primeiroSemPedido;
  }).map(({ id, name }) => ({ id, name }));
}
