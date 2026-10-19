"use client";

import { useState, type ReactNode } from "react";

type Aba = "pendencias" | "atualizacoes" | "todos";

export function AbasDeAvisos({
  pendencias,
  atualizacoes,
  quantasPendencias,
  quantasAtualizacoes,
}: {
  pendencias: ReactNode;
  atualizacoes: ReactNode;
  quantasPendencias: number | null;
  quantasAtualizacoes: number;
}) {
  const [aba, setAba] = useState<Aba>((quantasPendencias ?? 0) > 0 ? "pendencias" : "atualizacoes");

  return <>
    <div className="avisos-abas" role="tablist" aria-label="Filtrar avisos">
      <button type="button" role="tab" aria-selected={aba === "pendencias"}
        onClick={() => setAba("pendencias")}>
        Precisa de você {quantasPendencias !== null && <span>{quantasPendencias}</span>}
      </button>
      <button type="button" role="tab" aria-selected={aba === "atualizacoes"}
        onClick={() => setAba("atualizacoes")}>
        Atualizações <span>{quantasAtualizacoes}</span>
      </button>
      <button type="button" role="tab" aria-selected={aba === "todos"}
        onClick={() => setAba("todos")}>
        Todos
      </button>
    </div>

    <div className="avisos-conteudo">
      {(aba === "pendencias" || aba === "todos") && pendencias}
      {(aba === "atualizacoes" || aba === "todos") && atualizacoes}
    </div>
  </>;
}
