"use client";

import styles from "../Mesa.module.css";

export default function Error({ reset }: { reset: () => void }) {
  return <div className={styles.erroCarteira} role="alert">
    <h1>Não foi possível abrir a carteira</h1>
    <p>Os dados desta consulta não foram carregados. Seus filtros continuam no endereço.</p>
    <button type="button" onClick={reset}>Tentar novamente</button>
  </div>;
}
