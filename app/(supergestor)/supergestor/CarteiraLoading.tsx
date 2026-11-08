import styles from "../Mesa.module.css";

/** Estrutura da carteira durante a primeira leitura, sem números presumidos. */
export default function CarteiraLoading() {
  return <div className={styles.carteiraLoading} role="status" aria-label="Carregando carteira de negócios">
    <p className={styles.loadingTexto}>Carregando carteira de negócios…</p>
    <div aria-hidden="true" className={styles.loadingEstrutura}>
      <header className={styles.loadingCabecalho}>
        <div className={styles.loadingGrupo}>
          <span className={`${styles.loadingLinha} ${styles.loadingTitulo}`} />
          <span className={`${styles.loadingLinha} ${styles.loadingDescricao}`} />
        </div>
        <span className={`${styles.loadingLinha} ${styles.loadingAtalhos}`} />
      </header>
      <div className={styles.loadingResumo}>
        {Array.from({ length: 4 }, (_, i) => <div key={i}>
          <span className={`${styles.loadingLinha} ${styles.loadingNumero}`} />
          <span className={`${styles.loadingLinha} ${styles.loadingRotulo}`} />
        </div>)}
      </div>
      <div className={styles.loadingGrupo}>
        <span className={`${styles.loadingLinha} ${styles.loadingSecao}`} />
        <span className={`${styles.loadingLinha} ${styles.loadingDescricao}`} />
      </div>
      <div className={styles.loadingFiltros}>
        <span className={`${styles.loadingLinha} ${styles.loadingCampo}`} />
        <span className={`${styles.loadingLinha} ${styles.loadingCampo}`} />
        <span className={`${styles.loadingLinha} ${styles.loadingBotao}`} />
      </div>
      <div className={styles.loadingLista}>
        {Array.from({ length: 3 }, (_, i) => <div key={i} className={styles.loadingRegistro}>
          <span className={`${styles.loadingLinha} ${styles.loadingNome}`} />
          <span className={`${styles.loadingLinha} ${styles.loadingDetalhe}`} />
          <span className={`${styles.loadingLinha} ${styles.loadingDestino}`} />
        </div>)}
      </div>
    </div>
  </div>;
}
