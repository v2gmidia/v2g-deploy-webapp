import styles from "./loading.module.css";

/** Mesma biblioteca e preparo de envio; sem contagens, vereditos ou imagens fictícias. */
export default function CarregandoCriativos() {
  return <div className={`criativos-editorial ${styles.pagina}`}>
    <div className={styles.topo}><div className="page-head"><h1>Criativos</h1><p>Suas imagens e os anúncios associados.</p></div></div>
    <p className="sr-only" role="status">Carregando a biblioteca e os pedidos deste negócio.</p>
    <div aria-busy="true" aria-label="Biblioteca e envio de criativos">
      <div aria-hidden="true">
        <div className={styles.abas}>{[0, 1, 2].map(i => <span key={i} className={styles.barra} />)}</div>
        <div className={styles.grade}>{[0, 1, 2].map(i => <div key={i} className={styles.item}>
          <div className={styles.imagem} /><span className={styles.barra} /><span className={styles.barra} />
        </div>)}</div>
      </div>
    </div>
  </div>;
}
