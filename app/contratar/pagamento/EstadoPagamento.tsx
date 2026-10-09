"use client";

import { useEffect, useState } from "react";

type Estado = "awaiting_payment" | "payment_approved" | "cancelled";

export function EstadoPagamento({ referencia, inicial }: { referencia: string; inicial: Estado }) {
  const [estado, setEstado] = useState<Estado>(inicial);
  useEffect(() => {
    if (estado !== "awaiting_payment") return;
    let vivo = true;
    const timer = setInterval(async () => {
      try {
        const resposta = await fetch(`/api/contratar/status?ref=${encodeURIComponent(referencia)}`, { cache: "no-store" });
        if (!resposta.ok) return;
        const corpo: unknown = await resposta.json();
        if (vivo && corpo && typeof corpo === "object" && "status" in corpo
            && (corpo.status === "payment_approved" || corpo.status === "cancelled")) {
          setEstado(corpo.status);
          window.location.reload();
        }
      } catch { /* A tela preserva o último estado conhecido. */ }
    }, 5000);
    return () => { vivo = false; clearInterval(timer); };
  }, [estado, referencia]);
  return <p className={estado === "payment_approved" ? "form-notice" : "form-warning"} role="status">
    {estado === "payment_approved" ? "Pagamento confirmado pelo Asaas. Você já pode criar seu acesso."
      : estado === "cancelled" ? "Este pedido foi cancelado. Fale com a V2G antes de tentar novamente."
      : "Aguardando confirmação do Asaas. Esta página acompanha o estado do pedido automaticamente."}
  </p>;
}
