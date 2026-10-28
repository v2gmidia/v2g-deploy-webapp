import { Marca } from "@/components/ui/Marca";
import { identificarDocumentoContratante } from "@/lib/contratacao/documento-contratante";
import { AgendaPropria } from "./AgendaPropria";
import { AgendaExterna } from "./AgendaExterna";
import type { EstadoAgenda } from "./agenda-actions";
import styles from "./Conclusao.module.css";

/** URL publica da agenda piloto. O clique não registra reserva no WebApp. */
export const AGENDA_INICIAL_URL = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ0b5yJebHCZ15kBn6J7Q_uoGrxKKKEKvHri0CAAkKeCjNBRJ_KzIIJQwlYOifAH0auJD5u13G0r";

type Estado = { erro: string } | {
  businessId: string;
  concluido: boolean;
  faltamBasicas: unknown[];
  contasProntas: boolean;
};

export function Conclusao({ estado, cnpj = null, agenda = { status: "legado" } }: { estado: Estado; cnpj?: string | null; agenda?: EstadoAgenda }) {
  const cnpjExibido = cnpj ? identificarDocumentoContratante(cnpj) : null;
  return <div className="onb-v2 onb-v2-etapa">
    <header className="onb-v2-topo"><Marca editorial href="/inicio" /><a href="/onboarding/marca">Rever minhas respostas</a></header>
    <section className={styles.conteudo}>
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
      <h1 className="auth-h">Respostas guardadas. Vamos conversar?</h1>
      <p className="auth-sub">Escolha um horário de 25 minutos para alinhar seus anúncios com o gestor.</p>
      {agenda.status === "legado"
        ? <AgendaExterna businessId={estado.businessId} url={AGENDA_INICIAL_URL} documento={cnpjExibido} />
        : <AgendaPropria inicial={agenda} businessId={estado.businessId} />}
      <section className={styles.reuniao}>
        <h2>O que acontece na reunião</h2>
        <p>Vamos conferir o WhatsApp que recebe clientes, acessos e materiais do primeiro anúncio.</p>
      </section>
      <p className={styles.ajuda}>Não encontrou horário? <a href="https://wa.me/5521936182176?text=Oi!%20Terminei%20meu%20cadastro%20na%20V2G%2C%20mas%20n%C3%A3o%20encontrei%20um%20hor%C3%A1rio%20na%20agenda." target="_blank" rel="noopener noreferrer">Fale com a equipe</a>.</p>
    </>}
    </section>
  </div>;
}
