"use client";

import { useActionState } from "react";
import { revisarPecaAction, type EstadoDaRevisao } from "./actions";

export function DecidirPeca({ id }: { id: string }) {
  const [estado, acao, pendente] = useActionState<EstadoDaRevisao, FormData>(
    revisarPecaAction, {},
  );
  return <form action={acao} className="auth-card">
    <input type="hidden" name="id" value={id} />
    <label>Observação para o cliente
      <textarea name="nota" maxLength={2000} rows={2} placeholder="Explique ajustes ou motivo da recusa" />
    </label>
    <div className="form-actions">
      <button type="submit" name="decisao" value="approved_for_manual_publish" disabled={pendente}>Aprovar para publicação manual</button>
      <button type="submit" name="decisao" value="changes_requested" disabled={pendente}>Pedir ajustes</button>
      <button type="submit" name="decisao" value="rejected" disabled={pendente}>Recusar</button>
    </div>
    {estado.ok && <p className="form-notice" role="status">{estado.ok}</p>}
    {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
  </form>;
}
