"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { ProofCard } from "@/components/ui/ProofCard";
import { recuperarAction, type RecuperarActionState } from "./actions";

const initialState: RecuperarActionState = {};

export default function RecuperarPage() {
  const [state, formAction, pending] = useActionState(recuperarAction, initialState);

  return (
    <div className="auth-grid">
      <div className="auth-card">
        <h1 className="auth-h">Recuperar acesso.</h1>
        <p className="auth-sub">Informe seu e-mail e mandamos um link para trocar a senha.</p>

        {state.error && <p className="form-error">{state.error}</p>}

        {state.enviado ? (
          <p className="form-notice">
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

        <div className="auth-foot">
          <a href="/entrar">&larr; Voltar para o login</a>
        </div>
      </div>

      <aside className="auth-aside">
        <ProofCard title="Seus dados protegidos">
          Nunca dizemos se um e-mail está ou não cadastrado — o link só funciona se a conta
          existir, mas a mensagem na tela é sempre a mesma.
        </ProofCard>
      </aside>
    </div>
  );
}
