"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EntradaEditorial } from "@/components/ui/EntradaEditorial";
import { recuperarAction, type RecuperarActionState } from "./actions";
import { EsperaFormulario, useEsperaFormulario, useFocoResultado } from "../entrar/EsperaFormulario";
import { executarComFeedback } from "../entrar/acao-local";

const initialState: RecuperarActionState = {};

export default function RecuperarPage() {
  const [state, formAction, pending] = useActionState<RecuperarActionState,FormData>((anterior,dados)=>executarComFeedback(
    ()=>recuperarAction(anterior,dados),{error:"Não foi possível confirmar a solicitação. Confira seu e-mail antes de pedir outro link."}), initialState);
  const [email,setEmail] = useState("");
  const espera = useEsperaFormulario(pending);
  const resultado = useFocoResultado(pending,state.error ?? (state.enviado ? "solicitado" : undefined));

  return (
    <EntradaEditorial>
        <h1>Recuperar acesso.</h1>
        <p className="entrada-introducao">Informe seu e-mail e mandamos um link para trocar a senha.</p>

        {!pending && state.error && <p ref={resultado} tabIndex={-1} className="form-error" role="alert">{state.error}</p>}

        {state.enviado ? (
          <p ref={resultado} tabIndex={-1} className="form-notice" role="status">
            Se este e-mail estiver cadastrado, você vai receber um link para redefinir sua senha
            em instantes. Confira também a caixa de spam.
          </p>
        ) : (
          <form action={formAction} aria-busy={pending} onSubmit={e=>{espera.permitir(e);}}>
            <div className="field">
              <label htmlFor="email-recuperar">E-mail</label>
              <input
                id="email-recuperar"
                name="email"
                type="email"
                placeholder="voce@seunegocio.com.br"
                autoComplete="email"
                value={email} onChange={e=>setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Enviando…" : "Enviar link de recuperação"}
            </Button>
            <EsperaFormulario pendente={pending} fase={espera.fase}
              lenta="Solicitando o link de recuperação. Isso ainda não confirma a entrega do e-mail."
              longa="Ainda aguardamos o serviço de acesso. Evite solicitar outro link agora; seu e-mail continua no formulário." />
          </form>
        )}

        <a className="entrada-voltar" href="/entrar?modo=login">Voltar para o login</a>
    </EntradaEditorial>
  );
}
