"use client";

import { useActionState } from "react";
import { sincronizarTarefaPecaAction, type EstadoDaRevisao } from "./actions";

export function SincronizarTarefa({ id }: { id: string }) {
  const [estado, acao, pendente] = useActionState<EstadoDaRevisao, FormData>(
    sincronizarTarefaPecaAction, {},
  );
  return <form action={acao}>
    <input type="hidden" name="id" value={id} />
    <button type="submit" disabled={pendente}>Conferir tarefa interna</button>
    {estado.ok && <p className="form-notice" role="status">{estado.ok}</p>}
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
  </form>;
}
