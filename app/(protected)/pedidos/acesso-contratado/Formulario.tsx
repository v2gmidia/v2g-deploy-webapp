"use client";
import { useActionState } from "react";
import { decidirAcessoContratado } from "./actions";
import styles from "./acesso.module.css";
export function FormularioConcessao() {
  const [state,action,pending] = useActionState(decidirAcessoContratado,{});
  return <form action={action} className={styles.form}>
    <div className="field"><label htmlFor="modo">Operação</label><select id="modo" name="modo"><option value="emitir">Emitir liberação</option><option value="revogar">Revogar liberação</option></select></div>
    <div className="field"><label htmlFor="id">ID da evidência conferida para emitir, ou ID da liberação para revogar</label><input id="id" name="id" required maxLength={36}/></div>
    <div className="field"><label htmlFor="note">Motivo e referência da conferência</label><textarea id="note" name="note" required minLength={5} maxLength={1000}/></div>
    <label className={styles.confirmacao}><input type="checkbox" name="confirmed" value="yes" required/> Conferi a contratação histórica, a autoridade do destinatário e o negócio exato. Para revogar, conferi o impacto desta liberação.</label>
    {state.erro && <p className="form-error" role="alert">{state.erro}</p>}
    {state.ok && <p className="form-notice" role="status">{state.ok}</p>}
    {state.caminho && <p className={styles.link}>Link de primeiro acesso: <a href={state.caminho}>{state.caminho}</a></p>}
    <button className="cta" disabled={pending}>{pending ? "Conferindo…" : "Confirmar operação"}</button>
  </form>;
}
