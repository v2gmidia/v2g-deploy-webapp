"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./revisao.module.css";
export function PreviaDaPeca({ url, nome }: { url: string; nome: string }) {
  const [estado, setEstado] = useState<{ url: string; falhou: boolean } | null>(null);
  const imagem = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (imagem.current?.complete) setEstado({ url, falhou: imagem.current.naturalWidth === 0 });
  }, [url]);
  const falhou = estado?.url === url && estado.falhou;
  const carregando = estado?.url !== url;
  return <figure className={styles.previa} aria-busy={carregando}>
    {!falhou && <img ref={imagem} src={url} alt={`Prévia de ${nome}`} loading="lazy"
      onLoad={() => setEstado({ url, falhou: false })} onError={() => setEstado({ url, falhou: true })} />}
    {carregando && <p role="status">Carregando prévia…</p>}
    {falhou && <p role="alert">Não foi possível abrir a prévia. Recarregue a página para renovar o acesso à imagem.</p>}
    <figcaption><a href={url} target="_blank" rel="noopener noreferrer">Abrir imagem em tamanho original</a></figcaption>
  </figure>;
}
