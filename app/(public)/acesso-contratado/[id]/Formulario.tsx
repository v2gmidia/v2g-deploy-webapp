"use client";
import { useActionState } from "react";
import { aceitarAcessoContratado } from "./actions";
export function FormularioAcessoContratado({id}:{id:string}) {
  const [state,action,pending] = useActionState(aceitarAcessoContratado,{});
  return <form action={action}>
    <input type="hidden" name="id" value={id}/>
    {state.erro && <p className="form-error" role="alert">{state.erro}</p>}
    <button className="cta" disabled={pending}>{pending ? "Conferindo…" : "Aceitar acesso ao negócio indicado"}</button>
  </form>;
}
