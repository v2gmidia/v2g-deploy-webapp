"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { EntradaEditorial } from "@/components/ui/EntradaEditorial";
import { recuperarAction, type RecuperarActionState } from "./actions";

const initialState: RecuperarActionState = {};

export default function RecuperarPage() {
  const [state, formAction, pending] = useActionState(recuperarAction, initialState);

  return (
    <EntradaEditorial>
        <h1>Recuperar acesso.</h1>
        <p className="entrada-introducao">Informe seu e-mail e mandamos um link para trocar a senha.</p>

        {state.error && <p className="form-error" role="alert">{state.error}</p>}

        {state.enviado ? (
          <p className="form-notice" role="status">
            Se este e-mail estiver cadastrado, você vai receber um link para redefinir sua senha
            em instantes. Confira também a caixa de spam.
          </p>
        ) : (
          <form action={formAction}>
            <div className="field">
              <label htmlFor="email-recuperar">E-mail</label>
              <input
                id="email-recuperar"
                name="email"
                type="email"
                placeholder="voce@seunegocio.com.br"
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando…" : "Enviar link de recuperação"}
            </Button>
          </form>
        )}

        <a className="entrada-voltar" href="/entrar?modo=login">Voltar para o login</a>
    </EntradaEditorial>
  );
}
