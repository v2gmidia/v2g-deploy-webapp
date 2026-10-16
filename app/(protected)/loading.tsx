import styles from "@/components/ui/CarregamentoDeTela.module.css";

export default function CarregandoAplicativo() {
  return <section className={styles.aplicativo} role="status" aria-live="polite" aria-label="Carregando página">
    <p className={styles.titulo}>Carregando página…</p>
    <div className={`${styles.linha} ${styles.linhaLonga}`} aria-hidden="true" />
    <div className={`${styles.linha} ${styles.linhaCurta}`} aria-hidden="true" />
    <div className={styles.campo} aria-hidden="true" />
  </section>;
}
