"use client";
import { useActionState, useState } from "react";
import { confirmarPublicacaoAction } from "./publicacao-actions";
import styles from "./revisao.module.css";
export function ConfirmarPublicacao({ id, contas, hoje, confirmar = confirmarPublicacaoAction }: {
  id: string; contas: string[]; hoje: string; confirmar?: typeof confirmarPublicacaoAction;
}) {
  const [rascunho, setRascunho] = useState({ conta: "", anuncio: "", dia: "", evidencia: "", confirmo: false });
  function atualizar<K extends keyof typeof rascunho>(campo: K, valor: (typeof rascunho)[K]) {
    setRascunho(atual => ({ ...atual, [campo]: valor }));
  }
  const [estado, acao, pendente] = useActionState<Awaited<ReturnType<typeof confirmarPublicacaoAction>>, FormData>(async (anterior, dados) => {
    try { return await confirmar(anterior, dados); }
    catch { return { erro: "A confirmação não chegou. Seus dados foram preservados. Recarregue para conferir o registro antes de tentar novamente." }; }
  }, {});
  return <details><summary>Confirmar publicação</summary>
    <p>Depois de conferir a peça publicada, registre o anúncio e a data. Aprovar a peça não preenche esta confirmação.</p>
    <form action={acao} className={styles.form} onReset={e => e.preventDefault()}>
      <input type="hidden" name="id" value={id} />
      <fieldset disabled={pendente}><legend>Publicação conferida pelo gestor</legend>
        <label>Conta de anúncios<select name="conta" required value={rascunho.conta} onChange={e => atualizar("conta", e.target.value)}><option value="" disabled>Escolha a conta</option>
          {contas.map(conta => <option key={conta} value={conta}>{conta}</option>)}</select></label>
        <label>ID do anúncio<input name="anuncio" inputMode="numeric" pattern="[0-9]{1,40}" maxLength={40} required value={rascunho.anuncio} onChange={e => atualizar("anuncio", e.target.value)} /></label>
        <label>Data da publicação<input name="dia" type="date" max={hoje} required value={rascunho.dia} onInput={e => atualizar("dia", e.currentTarget.value)} onChange={e => atualizar("dia", e.target.value)} /></label>
        <label>Onde você conferiu esta peça no anúncio?<textarea name="evidencia" minLength={10} maxLength={2000} rows={3} required value={rascunho.evidencia} onChange={e => atualizar("evidencia", e.target.value)} /></label>
        <label className={styles.confirmacao}><input name="confirmo" type="checkbox" required checked={rascunho.confirmo} onChange={e => atualizar("confirmo", e.target.checked)} />Conferi esta versão da imagem no anúncio informado.</label>
        <p>Este registro é manual. Ele não publica, ativa nem verifica a entrega do anúncio.</p>
        <button type="submit">{pendente ? "Registrando confirmação…" : "Confirmar publicação"}</button>
      </fieldset>
      {estado.ok && <p className="form-notice" role="status">{estado.ok}</p>}
      {estado.erro && <p className="form-error" role="alert">{estado.erro}</p>}
    </form>
  </details>;
}
