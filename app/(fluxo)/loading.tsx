import styles from "@/components/ui/CarregamentoDeTela.module.css";

export default function CarregandoFluxo() {
  return <section className={styles.fluxo} role="status" aria-live="polite" aria-label="Carregando etapa">
    <p className={styles.titulo}>Preparando a próxima etapa…</p>
    <div className={styles.progresso} aria-hidden="true"><span /></div>
    <div className={`${styles.linha} ${styles.linhaLonga}`} aria-hidden="true" />
    <div className={`${styles.linha} ${styles.linhaCurta}`} aria-hidden="true" />
    <div className={styles.campo} aria-hidden="true" />
  </section>;
}
