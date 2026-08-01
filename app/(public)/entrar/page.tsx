"use client";

import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ProofCard } from "@/components/ui/ProofCard";
import { signInAction, signUpAction, type AuthActionState } from "./actions";

const initialState: AuthActionState = {};

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarContent />
    </Suspense>
  );
}

function EntrarContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const [mode, setMode] = useState<"cadastro" | "login">("cadastro");

  const [signUpState, signUpFormAction, signUpPending] = useActionState(
    signUpAction,
    initialState,
  );
  const [signInState, signInFormAction, signInPending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <div className="auth-grid">
      <div className="auth-card">
        {mode === "cadastro" ? (
          <>
            <h1 className="auth-h">Seus anúncios, de volta às suas mãos.</h1>
            <p className="auth-sub">Crie sua conta em 30 segundos.</p>

            {signUpState.error && <p className="form-error">{signUpState.error}</p>}
            {signUpState.message && <p className="form-notice">{signUpState.message}</p>}

            <form action={signUpFormAction}>
              <input type="hidden" name="next" value={next} />
              <div className="field">
                <label htmlFor="nome">Seu nome</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  placeholder="Como você gosta de ser chamado?"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="whatsapp">Seu WhatsApp (opcional)</label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  placeholder="(11) 91234-5678"
                  autoComplete="tel"
                />
              </div>
              <div className="field">
                <label htmlFor="email-cadastro">Seu melhor e-mail</label>
                <input
                  id="email-cadastro"
                  name="email"
                  type="email"
                  placeholder="voce@seunegocio.com.br"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="senha-cadastro">Crie uma senha</label>
                <input
                  id="senha-cadastro"
                  name="senha"
                  type="password"
                  placeholder="Pelo menos 6 caracteres"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" disabled={signUpPending}>
                {signUpPending ? "Criando conta…" : "Criar minha conta"}
              </Button>
            </form>

            <div className="auth-foot">
              Já tenho conta{" "}
              <button type="button" className="link-btn" onClick={() => setMode("login")}>
                &rarr; Entrar
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="auth-h">Bom te ver de novo.</h1>
            <p className="auth-sub">Entre com seu e-mail e senha.</p>

            {signInState.error && <p className="form-error">{signInState.error}</p>}

            <form action={signInFormAction}>
              <input type="hidden" name="next" value={next} />
              <div className="field">
                <label htmlFor="email-login">E-mail</label>
                <input
                  id="email-login"
                  name="email"
                  type="email"
                  placeholder="voce@seunegocio.com.br"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="senha-login">Senha</label>
                <input
                  id="senha-login"
                  name="senha"
                  type="password"
                  placeholder="Sua senha"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" disabled={signInPending}>
                {signInPending ? "Entrando…" : "Entrar"}
              </Button>
            </form>

            <div className="auth-foot">
              <a href="/recuperar">Esqueci minha senha</a>
            </div>

            <div className="auth-foot">
              Novo por aqui?{" "}
              <button type="button" className="link-btn" onClick={() => setMode("cadastro")}>
                &rarr; Criar conta
              </button>
            </div>
          </>
        )}
      </div>

      <aside className="auth-aside">
        <ProofCard title="Seus dados protegidos">
          Protegidos pela LGPD. Usamos seu WhatsApp e e-mail só para avisos da sua conta —
          nada de spam, nada de vender sua lista.
        </ProofCard>
      </aside>
    </div>
  );
}
