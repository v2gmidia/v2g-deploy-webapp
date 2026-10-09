export type CheckoutPago = {
  eventoId: string;
  checkoutId: string;
  referencia: string | null;
  customerId: string | null;
  totalCentavos: number;
};
export type CheckoutEncerrado = {
  eventoId: string;
  checkoutId: string;
  tipo: "CHECKOUT_CANCELED" | "CHECKOUT_EXPIRED";
};

function registro(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Record<string, unknown> : null;
}

export function lerCheckoutPago(payload: unknown): CheckoutPago | null {
  const evento = registro(payload);
  const checkout = evento && registro(evento.checkout);
  if (!evento || !checkout || evento.event !== "CHECKOUT_PAID" || checkout.status !== "PAID")
    return null;
  if (typeof evento.id !== "string" || evento.id.length < 5
      || typeof checkout.id !== "string" || !/^[0-9a-f-]{36}$/i.test(checkout.id))
    return null;
  if (!Array.isArray(checkout.items) || checkout.items.length !== 1) return null;
  const item = registro(checkout.items[0]);
  if (!item || !Number.isInteger(item.quantity) || (item.quantity as number) < 1
      || (item.quantity as number) > 100 || typeof item.value !== "number"
      || !Number.isFinite(item.value)) return null;
  const centavos = Math.round(item.value * 100);
  if (Math.abs(centavos / 100 - item.value) > 0.00001) return null;
  return {
    eventoId: evento.id,
    checkoutId: checkout.id,
    referencia: typeof checkout.externalReference === "string" ? checkout.externalReference : null,
    customerId: typeof checkout.customer === "string" ? checkout.customer : null,
    totalCentavos: centavos * (item.quantity as number),
  };
}

export function lerCheckoutEncerrado(payload: unknown): CheckoutEncerrado | null {
  const evento = registro(payload);
  const checkout = evento && registro(evento.checkout);
  if (!evento || !checkout || (evento.event !== "CHECKOUT_CANCELED" && evento.event !== "CHECKOUT_EXPIRED"))
    return null;
  const estado = evento.event === "CHECKOUT_CANCELED" ? "CANCELED" : "EXPIRED";
  if (checkout.status !== estado || typeof evento.id !== "string" || evento.id.length < 5
      || typeof checkout.id !== "string" || !/^[0-9a-f-]{36}$/i.test(checkout.id)) return null;
  return { eventoId: evento.id, checkoutId: checkout.id, tipo: evento.event };
}
