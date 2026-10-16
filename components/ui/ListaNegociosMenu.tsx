"use client";

import { useActionState, type ReactNode } from "react";
import { escolherNegocioAction, type EscolhaNegocioState } from "@/app/(public)/escolher-negocio/actions";

export function ListaNegociosMenu({ children }: { children: ReactNode }) {
  const [estado, action, pendente] = useActionState<EscolhaNegocioState, FormData>(escolherNegocioAction, {});
  return <form action={action} className="business-list-form">
    <fieldset className="business-list" aria-label="Negócios disponíveis" disabled={pendente}>{children}</fieldset>
    {pendente && <span className="business-opening" role="status">Abrindo negócio…</span>}
    {estado.erro && <span className="business-error" role="alert">{estado.erro}</span>}
  </form>;
}
