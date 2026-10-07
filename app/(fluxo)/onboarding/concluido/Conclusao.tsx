/** URL publica da agenda piloto. O clique não registra reserva no WebApp. */
export const AGENDA_INICIAL_URL = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0b5yJebHCZ15kBn6J7Q_uoGrxKKKEKvHri0CAAkKeCjNBRJ_KzIIJQwlYOifAH0auJD5u13G0r";

type Estado = { erro: string } | {
  concluido: boolean;
  faltamBasicas: unknown[];
  contasProntas: boolean;
};

export function Conclusao({ estado }: { estado: Estado }) {
  return <div className="auth-grid solo"><section className="auth-card">
    {"erro" in estado ? <>
      <h1 className="auth-h">Não consegui confirmar seu onboarding.</h1>
      <p className="auth-sub">{estado.erro}</p>
      <a className="cta" href="/onboarding/marca">Voltar</a>
    </> : !estado.concluido ? <>
      <h1 className="auth-h">Seu onboarding ainda não terminou.</h1>
      <p className="auth-sub">Suas respostas já dadas continuam guardadas.</p>
      {estado.faltamBasicas.length ? <a className="cta" href="/onboarding">Continuar perguntas do negócio</a> :
        !estado.contasProntas ? <a className="cta" href="/onboarding/contas">Continuar contas</a> :
        <a className="cta" href="/onboarding/marca">Conferir visual da marca</a>}
    </> : <>
      <p className="mission-tag">Sua primeira missão · passo 3 de 3</p>
      <h1 className="auth-h">Suas respostas estão guardadas</h1>
      <p className="auth-sub">O próximo passo é escolher data e horário para uma reunião com o gestor na agenda do Google.</p>
      <a className="cta" href={AGENDA_INICIAL_URL} target="_blank" rel="noopener noreferrer">
        Escolher horário da reunião
      </a>
      <p className="note">O Google mostra os horários livres e envia a confirmação por e-mail quando a reserva é concluída. Abrir a agenda não marca a reunião. O WebApp ainda não recebe automaticamente essa confirmação; guarde o e-mail do convite.</p>
      <section className="pendencia-bloco">
        <b>O que acontece na reunião</b>
        <p>Vocês vão tratar dos acessos e definir o primeiro criativo. O gestor fará a publicação da primeira campanha manualmente depois das conferências necessárias.</p>
      </section>
      <p className="form-warning">O onboarding concluído não confirma reunião marcada, contrato assinado, nota emitida, campanha publicada ou anúncio no ar.</p>
      <a className="cta" href="/meu-negocio">Ver meus dados</a>
    </>}
  </section></div>;
}
