"use client";
import { useRef, useState } from "react";
import styles from "./agencia.module.css";

export function MiniaturaDaPeca({ url, nome, grande = false }: { url: string | null; nome: string; grande?: boolean }) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [falhou, setFalhou] = useState<string | null>(null);
  const disponivel = Boolean(url && falhou !== url);
  return <div className={grande ? styles.imagemGrande : styles.imagemPequena}>
    {disponivel ? <button className={styles.miniatura} type="button" onClick={() => dialogo.current?.showModal()} aria-label={`Ampliar a peça ${nome}`}>
      <img src={url!} alt={`Prévia de ${nome}`} loading="lazy" onError={() => setFalhou(url)} />
    </button> : <p className={styles.semImagem}>Prévia indisponível. Atualize a página para conferir o acesso à imagem.</p>}
    <dialog className={styles.dialogo} ref={dialogo} aria-label={`Imagem de ${nome}`}>
      <div><h2>{nome}</h2><button className={styles.secundario} type="button" onClick={() => dialogo.current?.close()}>Fechar</button></div>
      {disponivel && <img src={url!} alt={nome} onError={() => setFalhou(url)} />}
      {!disponivel && <p role="alert">Não foi possível abrir a imagem. Feche e atualize a página.</p>}
    </dialog>
  </div>;
}
