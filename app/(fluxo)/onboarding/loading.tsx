import { Marca } from "@/components/ui/Marca";
import styles from "@/components/ui/CarregamentoDeTela.module.css";
import "./onboarding-editorial.css";

export default function CarregandoOnboarding() {
  return <div className={`onb-v2 onb-v2-conversa ${styles.conversa}`} role="status" aria-live="polite" aria-label="Carregando seu onboarding">
    <header className={styles.topo}><Marca editorial href="/inicio" /><small>Preparando sua conversa…</small></header>
    <div className={styles.conteudo}>
      <div className={styles.progresso} aria-hidden="true"><span /></div>
      <p className={styles.titulo}>Carregando seu onboarding…</p>
      <div className={`${styles.linha} ${styles.linhaLonga}`} aria-hidden="true" />
      <div className={`${styles.linha} ${styles.linhaCurta}`} aria-hidden="true" />
      <div className={styles.resposta} aria-hidden="true" />
      <div className={styles.campo} aria-hidden="true" />
    </div>
  </div>;
}
