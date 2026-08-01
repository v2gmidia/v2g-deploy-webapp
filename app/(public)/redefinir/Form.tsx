"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { redefinirAction, redefinirInitialState } from "./actions";

export function RedefinirForm() {
  const [state, formAction, pending] = useActionState(redefinirAction, redefinirInitialState);

  return (
    <>
      {state.error && <p className="form-error">{state.error}</p>}

      <form action={formAction}>
        <div className="field">
          <label htmlFor="senha-nova">Nova senha</label>
          <input
            id="senha-nova"
            name="senha"
            type="password"
            placeholder="Pelo menos 8 caracteres, com letras e números"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="senha-confirmar">Confirme a nova senha</label>
          <input
            id="senha-confirmar"
            name="confirmarSenha"
            type="password"
            placeholder="Repita a senha"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>
    </>
  );
}
