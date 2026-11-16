"use client";

import { useFormStatus } from "react-dom";
import type { Tema } from "@/lib/tema";
import { definirTemaAction } from "@/app/(protected)/conta/tema-actions";

function Escolha({ atual }: { atual: Tema }) {
  const { pending } = useFormStatus();
  return (
    <div className="tema-icones" role="group" aria-label="Aparência">
      <button type="submit" name="tema" value="claro" disabled={pending} aria-label="Usar tema claro" title="Tema claro" aria-pressed={atual === "claro"}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>
      </button>
      <button type="submit" name="tema" value="escuro" disabled={pending} aria-label="Usar tema escuro" title="Tema escuro" aria-pressed={atual === "escuro"}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20.5 14a8.5 8.5 0 0 1-10.5-10.5A8.5 8.5 0 1 0 20.5 14Z"/></svg>
      </button>
    </div>
  );
}

export function CampoDeTema({ atual }: { atual: Tema }) {
  return (
    <form action={definirTemaAction} className="tema-no-topo">
      <Escolha atual={atual} />
    </form>
  );
}
