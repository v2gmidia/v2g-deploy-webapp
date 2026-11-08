"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CriteriosSenha } from "@/components/ui/CriteriosSenha";
import { IconeVisibilidadeSenha } from "@/components/ui/IconeVisibilidadeSenha";
import { TAMANHO_MINIMO_SENHA } from "@/lib/auth-senha";
import { redefinirAction, type RedefinirActionState } from "./actions";
import { EsperaFormulario, useEsperaFormulario, useFocoResultado } from "../entrar/EsperaFormulario";
import { executarComFeedback } from "../entrar/acao-local";

const redefinirInitialState: RedefinirActionState = {};

export function RedefinirForm() {
  const [state, formAction, pending] = useActionState<RedefinirActionState,FormData>((anterior,dados)=>executarComFeedback(
    ()=>redefinirAction(anterior,dados),{error:"Não foi possível confirmar a alteração. Tente entrar com a nova senha antes de pedir outro link."}), redefinirInitialState);
  const [senha, setSenha] = useState("");
  const [confirmacao,setConfirmacao] = useState("");
  const espera = useEsperaFormulario(pending);
  const erro = useFocoResultado(pending,state.error);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);

  return (
    <>
      {!pending && state.error && <p ref={erro} tabIndex={-1} className="form-error" role="alert">{state.error}</p>}

      <form action={formAction} aria-busy={pending} onSubmit={e=>{espera.permitir(e);}}>
        <div className="field">
          <label htmlFor="senha-nova">Nova senha</label>
          <span className="entrada-campo-senha"><input
            id="senha-nova"
            name="senha"
            type={mostrarSenha ? "text" : "password"}
            placeholder="Uma frase longa e única"
            autoComplete="new-password"
            minLength={TAMANHO_MINIMO_SENHA}
            value={senha}
            onChange={evento => setSenha(evento.target.value)}
            aria-describedby="criterios-senha-nova"
            required
          /><button type="button" aria-controls="senha-nova"
            aria-label={mostrarSenha ? "Ocultar nova senha" : "Mostrar nova senha"}
            aria-pressed={mostrarSenha} onClick={() => setMostrarSenha(valor => !valor)}>
            <IconeVisibilidadeSenha visivel={mostrarSenha} /></button></span>
          <CriteriosSenha senha={senha} id="criterios-senha-nova" />
        </div>
        <div className="field">
          <label htmlFor="senha-confirmar">Confirme a nova senha</label>
          <span className="entrada-campo-senha"><input
            id="senha-confirmar"
            name="confirmarSenha"
            value={confirmacao} onChange={e=>setConfirmacao(e.target.value)}
            type={mostrarConfirmacao ? "text" : "password"}
            placeholder="Repita a senha"
            autoComplete="new-password"
            minLength={TAMANHO_MINIMO_SENHA}
            required
          /><button type="button" aria-controls="senha-confirmar"
            aria-label={mostrarConfirmacao ? "Ocultar confirmação" : "Mostrar confirmação"}
            aria-pressed={mostrarConfirmacao} onClick={() => setMostrarConfirmacao(valor => !valor)}>
            <IconeVisibilidadeSenha visivel={mostrarConfirmacao} /></button></span>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar nova senha"}
        </Button>
        <EsperaFormulario pendente={pending} fase={espera.fase}
          lenta="Salvando sua nova senha. Aguarde a confirmação antes de sair."
          longa="Ainda não recebemos a confirmação. A senha pode já ter sido alterada; evite salvar novamente. Se precisar sair, tente entrar com a nova senha antes de pedir outro link." />
      </form>
    </>
  );
}
