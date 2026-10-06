"use client";

import { useFormStatus } from "react-dom";
import type { Tema } from "@/app/layout";
import { definirTemaAction } from "@/app/(protected)/conta/tema-actions";

function Escolha({ atual }: { atual: Tema }) {
  const { pending } = useFormStatus();
  return (
    <label className="tema-compacto">
      <span>Aparência</span>
      <select
        key={atual}
        name="tema"
        defaultValue={atual}
        disabled={pending}
        aria-label="Aparência"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="claro">Claro</option>
        <option value="escuro">Escuro</option>
        <option value="sistema">Do aparelho</option>
      </select>
    </label>
  );
}

export function CampoDeTema({ atual }: { atual: Tema }) {
  return (
    <form action={definirTemaAction} className="tema-no-topo">
      <Escolha atual={atual} />
      <noscript><button type="submit">Aplicar tema</button></noscript>
    </form>
  );
}
