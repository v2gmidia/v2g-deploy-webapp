"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EntradaEditorial } from "@/components/ui/EntradaEditorial";
import { SITE_PUBLICO_ORIGEM } from "@/lib/site-publico";
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
  const mode = searchParams.get("modo") === "cadastro" ? "cadastro" : "login";
  const destino = (modo: "cadastro" | "login") => {
    const busca = new URLSearchParams({ modo });
    if (next) busca.set("next", next);
    return `/entrar?${busca.toString()}`;
  };

  const [signUpState, signUpFormAction, signUpPending] = useActionState(
    signUpAction,
    initialState,
  );
  const [signInState, signInFormAction, signInPending] = useActionState(
    signInAction,
    initialState,
  );

  return (
    <EntradaEditorial>
        <nav className="entrada-modos" aria-label="Acesso à conta">
          <a href={destino("login")} aria-current={mode === "login" ? "page" : undefined}>Entrar</a>
          <a href={destino("cadastro")} aria-current={mode === "cadastro" ? "page" : undefined}>Primeiro acesso</a>
        </nav>
        {mode === "cadastro" ? (
          <>
            <h1>Vamos criar seu acesso.</h1>
            <p className="entrada-introducao">Após a aprovação do pagamento, crie a conta com o e-mail informado na compra.</p>

            {signUpState.error && <p className="form-error" role="alert">{signUpState.error}</p>}
            {signUpState.message && <p className="form-notice" role="status">{signUpState.message}</p>}

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
                <label htmlFor="whatsapp">Seu WhatsApp</label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  placeholder="(11) 91234-5678"
                  autoComplete="tel"
                  required
                />
                <p className="note">
                  É por aqui que a gente avisa quando algo precisa de você. Usamos só para
                  isso — nada de spam, nada de vender sua lista.
                </p>
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

            <p className="entrada-ajuda">Ainda não contratou? <a href={`${SITE_PUBLICO_ORIGEM}/#plano`}>Conheça o plano V2G.</a></p>
          </>
        ) : (
          <>
            <h1>Bom te ver de novo.</h1>
            <p className="entrada-introducao">Entre para acompanhar seus anúncios e os próximos passos do seu negócio.</p>

            {signInState.error && <p className="form-error" role="alert">{signInState.error}</p>}

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
                <div className="entrada-senha-label">
                  <label htmlFor="senha-login">Senha</label>
                  <a href="/recuperar">Esqueci minha senha</a>
                </div>
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

            <p className="entrada-ajuda">Já contratou e ainda não tem acesso? <a href={destino("cadastro")}>Crie sua conta.</a></p>
          </>
        )}
    </EntradaEditorial>
  );
}
