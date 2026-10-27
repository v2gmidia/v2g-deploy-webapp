"use client";

import { REFERENCIAS_BARBEARIA_PILOTO, URL_BIBLIOTECA } from "@/lib/jev/catalogo-barbearia";
import styles from "./referencias-do-nicho.module.css";

export function ReferenciasDoNicho({ valor, escolher, desabilitado = false }: {
  valor: string; escolher: (id: string) => void; desabilitado?: boolean;
}) {
  return <details className={styles.bloco}>
    <summary>Ver referências de anúncios para barbearia</summary>
    <p>Abra o anúncio original na Biblioteca e escolha uma referência para orientar sua peça. São exemplos observados, sem resultado de vendas comprovado. Não copie a imagem ou marca de terceiros.</p>
    <fieldset disabled={desabilitado}>
      <legend>Referência para este criativo</legend>
      <label className={styles.linha}><input type="radio" checked={!valor} onChange={() => escolher("")} />Sem referência</label>
      {REFERENCIAS_BARBEARIA_PILOTO.map((ref, indice) => <div className={styles.linha} key={ref.id}>
        <label><input type="radio" checked={valor === ref.id} onChange={() => escolher(ref.id)} />Referência {indice + 1}</label>
        <span>Início exibido: {ref.inicioExibido.split("-").reverse().join("/")}</span>
        <a href={`${URL_BIBLIOTECA}${ref.id}`} target="_blank" rel="noopener noreferrer">Abrir na Biblioteca</a>
      </div>)}
    </fieldset>
    <p className={styles.nota}>A data exibida não comprova veiculação contínua nem desempenho. O link pode deixar de abrir na plataforma de origem.</p>
  </details>;
}
