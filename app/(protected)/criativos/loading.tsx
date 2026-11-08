import styles from "./loading.module.css";

/** Mesma biblioteca e preparo de envio; sem contagens, vereditos ou imagens fictícias. */
export default function CarregandoCriativos() {
  return <div className={`criativos-editorial ${styles.pagina}`}>
    <div className={styles.topo}><div className="page-head"><h1>Criativos</h1><p>Sua biblioteca de imagens e vídeos.</p></div></div>
    <p className="sr-only" role="status">Carregando a biblioteca e os pedidos deste negócio.</p>
    <div aria-busy="true" aria-label="Biblioteca e envio de criativos">
      <h2>Sua biblioteca</h2>
      <div aria-hidden="true">
        <div className={styles.abas}>{[0, 1, 2, 3].map(i => <span key={i} className={styles.barra} />)}</div>
        <div className={styles.grade}>{[0, 1, 2].map(i => <div key={i} className={styles.item}>
          <div className={styles.imagem} /><span className={styles.barra} /><span className={styles.barra} />
        </div>)}</div>
      </div>
      <h2>Já tenho um criativo</h2>
      <div className={styles.envio} aria-hidden="true"><div className={styles.imagem} /><div className={styles.campos}>
        {[0, 1, 2, 3].map(i => <span key={i} className={styles.barra} />)}
      </div></div>
    </div>
  </div>;
}
