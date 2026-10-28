"use client";

import { useEffect, useState } from "react";
import styles from "./Conclusao.module.css";

export function AgendaExterna({ businessId, url, documento }: {
  businessId: string; url: string; documento: string | null;
}) {
  const chave = `v2g:agenda-externa-aberta:${businessId}`;
  const [agendaAberta, setAgendaAberta] = useState(false);

  useEffect(() => {
    try { setAgendaAberta(Boolean(window.localStorage.getItem(chave))); }
    catch { /* armazenamento indisponível não vira confirmação nem erro */ }
  }, [chave]);

  function registrarAbertura() {
    setAgendaAberta(true);
    try { window.localStorage.setItem(chave, new Date().toISOString()); }
    catch { /* o link continua funcionando; só a proteção local fica indisponível */ }
  }

  return <>
    {agendaAberta ? <section className={styles.reservaPendente} role="status">
      <h2>Aguardando confirmação verificável</h2>
      <p>Você já abriu a agenda do Google neste navegador. Isso não prova que a reserva foi concluída.</p>
      <p><strong>Se recebeu o e-mail de confirmação, não escolha outro horário.</strong> Use esse e-mail para consultar, remarcar ou cancelar e siga para o Início.</p>
      <a className={styles.acaoPrincipal} href="/inicio">Ir para o Início</a>
      <details className={styles.tentarNovamente}>
        <summary>Não concluí a reserva ou não recebi o e-mail</summary>
        <p>Abra novamente somente se o Google não enviou uma confirmação. Uma segunda reserva cria outro compromisso.</p>
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={registrarAbertura}>Abrir agenda novamente</a>
      </details>
    </section> : <>
      <p className={styles.alertaDuplicidade}><strong>Já recebeu a confirmação do Google?</strong> Não abra a agenda de novo. Consulte o e-mail para ver, remarcar ou cancelar sua reserva.</p>
      <section className={styles.agendamento}>
        <a className={styles.acaoPrincipal} href={url} target="_blank" rel="noopener noreferrer" onClick={registrarAbertura}>Abrir agenda do Google</a>
        {documento && <div className={styles.identidade}>
          <span>CPF ou CNPJ do contratante para informar no formulário</span>
          <strong>{documento}</strong>
        </div>}
        <p className={styles.orientacao}>A reserva só existe depois que o Google conclui o formulário e envia o e-mail de confirmação. Abrir este link não reserva um horário.</p>
      </section>
      <section className={styles.reservaFeita}>
        <div>
          <h2>Depois de reservar</h2>
          <p>Volte a esta tela. Enquanto a integração não localizar o evento pelo ID, e-mail e documento, a V2G mostrará a confirmação como pendente.</p>
        </div>
        <a className={styles.acaoSecundaria} href="/inicio">Ir para o Início</a>
      </section>
    </>}
  </>;
}
